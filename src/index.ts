import { Client, GatewayIntentBits, SlashCommandBuilder, Routes, ChatInputCommandInteraction, Message } from "discord.js";
import { REST } from "discord.js";
import dotenv from "dotenv";
import { executeIntel } from "./commands/intel.js";
import { executeLoc } from "./commands/loc.js";
import { executeSugestao } from "./commands/sugestao.js";
import { executeBase } from "./commands/base.js";
import { executeArquitetura } from "./commands/arquitetura.js";
import { executeTesteImagem } from "./sandbox/testeimagem.js";
import { executeEstoque } from "./commands/estoque.js";
import { executeFrota } from "./commands/frota.js";
import { executeMapa } from "./commands/mapa.js";
import { executeMissao, executeRanking } from "./commands/missao.js";
import { initDB } from "./database/connection.js";
import { executeCla } from "./commands/cla.js";
import { executeMembro } from "./commands/membro.js";
// @ts-ignore — resolved by tsx at runtime
import { startApiServer } from "./api/integrated-server.js";
import { listarEstoque, depositarItem, retirarItem } from "./services/estoqueService.js";
import { listarRanking } from "./services/missionService.js";

dotenv.config();

// ═══════════════════════════════════════════════════════════
//  DISCORD CLIENT
// ═══════════════════════════════════════════════════════════

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ── Inicialização ──────────────────────────────────────
client.once("ready", async () => {
  await initDB();
  console.log(`🤖 Base estabelecida! ${client.user?.tag} online!`);
  console.log(`🌍 Radar ativado: ${client.guilds.cache.size} servidor(es).`);
  client.guilds.cache.forEach((guild) => console.log(`   👉 ${guild.name}`));
  if (client.guilds.cache.size === 0) {
    console.log("🚨 ALERTA: O bot não está em nenhum servidor! Use o link OAuth2 para convidar.");
  }

  // Registar Slash Commands
  await registerSlashCommands();

  // Iniciar API + Dashboard integrado
  const apiPort = Number(process.env.API_PORT) || 3001;
  await startApiServer(client, apiPort);
});


// ── Notificações: Ações do Discord → Dashboard ─────────
// Sempre que um comando é executado com sucesso, notifica o dashboard
function notifyDashboard(message: string, level = "new") {
  const notify = (global as any).__notifyDashboard;
  if (notify) notify(message, level);
}


// ── Notificações: Qualquer mensagem → Dashboard (não bloqueia) ──
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  // Só notifica comandos prefixados
  if (!content.startsWith("!") && !content.startsWith("/")) return;

  const cmd = content.split(/\s+/)[0]?.replace(/^[!/]/, "").toLowerCase();
  const notifMap: Record<string, string> = {
    cla: `🏰 ${message.author.username} usou /cla`,
    membro: `🪖 ${message.author.username} usou /membro`,
    estoque: `📦 ${message.author.username} usou /estoque`,
    frota: `🚙 ${message.author.username} usou /frota`,
    missao: `🎖️ ${message.author.username} usou /missao`,
    ranking: `🏆 ${message.author.username} consultou o ranking`,
    base: `🗺️ ${message.author.username} usou /base`,
    intel: `🧠 ${message.author.username} pediu análise tática`,
    sugestao: `🏗️ ${message.author.username} pediu conselho`,
    loc: `📍 ${message.author.username} consultou coordenadas`,
    ping: `🏓 ${message.author.username} fez ping`,
    dashboard: `🌐 ${message.author.username} abriu o dashboard`,
  };
  if (notifMap[cmd]) {
    notifyDashboard(notifMap[cmd], cmd === "missao" || cmd === "frota" ? "info" : "new");
  }
});

// ── Chat: Mensagens normais Discord → Web (SSE) ────────
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();
  // Ignorar comandos — só mensagens normais vão para o chat
  if (content.startsWith("!") || content.startsWith("/")) return;

  const chatBroadcast = (global as any).__chatBroadcast;
  if (chatBroadcast) {
    chatBroadcast(message.author.username, content, message.channelId);
  }
});

// ── Tratamento global de erros ─────────────────────────
client.on("error", (error) => console.error("🚨 [Discord API Erro]:", error));
process.on("unhandledRejection", (error) => console.error("🚨 [Unhandled Rejection]:", error));
process.on("uncaughtException", (error) => console.error("🚨 [Uncaught Exception]:", error));

// ═══════════════════════════════════════════════════════════
//  SLASH COMMANDS
// ═══════════════════════════════════════════════════════════

// ── Slash Commands (registo via REST) ──────────────────
async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("Verificar se o bot está operacional"),
    new SlashCommandBuilder().setName("cla").setDescription("Gestão de clãs")
      .addSubcommand((sc) => sc.setName("criar").setDescription("Fundar um novo clã")
        .addStringOption((o) => o.setName("nome").setDescription("Nome do clã").setRequired(true))
        .addStringOption((o) => o.setName("tag").setDescription("Tag do clã")))
      .addSubcommand((sc) => sc.setName("listar").setDescription("Listar clãs registados")),
    new SlashCommandBuilder().setName("membro").setDescription("Gestão de membros")
      .addSubcommand((sc) => sc.setName("alistar").setDescription("Alistar-te num clã")
        .addStringOption((o) => o.setName("cla").setDescription("Nome do clã").setRequired(true)))
      .addSubcommand((sc) => sc.setName("promover").setDescription("Promover um soldado")
        .addStringOption((o) => o.setName("soldado").setDescription("Username do soldado").setRequired(true))
        .addStringOption((o) => o.setName("patente").setDescription("Nova patente").setRequired(true)
          .addChoices(
            { name: "Recruta", value: "Recruta" }, { name: "Soldado", value: "Soldado" },
            { name: "Sargento", value: "Sargento" }, { name: "Cabo", value: "Cabo" },
            { name: "Major", value: "Major" }, { name: "Capitão", value: "Capitão" },
            { name: "Oficial", value: "Oficial" }, { name: "General", value: "General" },
          ))),
    new SlashCommandBuilder().setName("estoque").setDescription("Gestão de estoque")
      .addSubcommand((sc) => sc.setName("listar").setDescription("Listar itens em estoque"))
      .addSubcommand((sc) => sc.setName("depositar").setDescription("Depositar item")
        .addStringOption((o) => o.setName("item").setDescription("Nome do item").setRequired(true))
        .addIntegerOption((o) => o.setName("quantidade").setDescription("Quantidade").setRequired(true))
        .addStringOption((o) => o.setName("local").setDescription("Local de armazenamento").setRequired(true)))
      .addSubcommand((sc) => sc.setName("retirar").setDescription("Retirar item pelo ID")
        .addIntegerOption((o) => o.setName("id").setDescription("ID do item").setRequired(true))),
    new SlashCommandBuilder().setName("frota").setDescription("Gestão de veículos")
      .addSubcommand((sc) => sc.setName("listar").setDescription("Listar veículos"))
      .addSubcommand((sc) => sc.setName("registar").setDescription("Registar veículo")
        .addStringOption((o) => o.setName("veiculo").setDescription("Tipo de veículo").setRequired(true))
        .addNumberOption((o) => o.setName("x").setDescription("Coordenada X").setRequired(true))
        .addNumberOption((o) => o.setName("y").setDescription("Coordenada Y").setRequired(true))
        .addStringOption((o) => o.setName("obs").setDescription("Observações"))),
    new SlashCommandBuilder().setName("missao").setDescription("Gestão de missões")
      .addSubcommand((sc) => sc.setName("criar").setDescription("Criar missão")
        .addStringOption((o) => o.setName("descricao").setDescription("Descrição").setRequired(true))
        .addIntegerOption((o) => o.setName("pontos").setDescription("Pontos de recompensa").setRequired(true))
        .addStringOption((o) => o.setName("nome").setDescription("Nome da operação")))
      .addSubcommand((sc) => sc.setName("listar").setDescription("Listar missões ativas"))
      .addSubcommand((sc) => sc.setName("aceitar").setDescription("Aceitar missão")
        .addIntegerOption((o) => o.setName("id").setDescription("ID da missão").setRequired(true)))
      .addSubcommand((sc) => sc.setName("concluir").setDescription("Concluir missão")
        .addIntegerOption((o) => o.setName("id").setDescription("ID da missão").setRequired(true))),
    new SlashCommandBuilder().setName("ranking").setDescription("Ver ranking do clã"),
    new SlashCommandBuilder().setName("base").setDescription("Gestão de bases")
      .addSubcommand((sc) => sc.setName("listar").setDescription("Listar bases"))
      .addSubcommand((sc) => sc.setName("registar").setDescription("Registar base")
        .addStringOption((o) => o.setName("nome").setDescription("Nome da base").setRequired(true))
        .addStringOption((o) => o.setName("x").setDescription("Coordenada X").setRequired(true))
        .addStringOption((o) => o.setName("y").setDescription("Coordenada Y").setRequired(true))),
    new SlashCommandBuilder().setName("intel").setDescription("Análise tática IA (Groq)")
      .addStringOption((o) => o.setName("relato").setDescription("Descreve a situação tática").setRequired(true)),
    new SlashCommandBuilder().setName("sugestao").setDescription("Conselho de engenharia IA (Groq)")
      .addStringOption((o) => o.setName("pedido").setDescription("O que precisas?").setRequired(true)),
    new SlashCommandBuilder().setName("loc").setDescription("Gerar link izurvive para coordenadas")
      .addStringOption((o) => o.setName("x").setDescription("Coordenada X").setRequired(true))
      .addStringOption((o) => o.setName("y").setDescription("Coordenada Y").setRequired(true)),
    new SlashCommandBuilder().setName("dashboard").setDescription("Link para o painel web de comando"),
  ];

  try {
    await rest.put(Routes.applicationCommands(client.user!.id), { body: commands.map((c) => c.toJSON()) });
    console.log(`✅ [SlashCommands] ${commands.length} comandos registados no Discord.`);
  } catch (error) {
    console.error("🚨 Erro ao registar Slash Commands:", error);
  }
}

// ── Slash Command Handler ──────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;
  const username = interaction.user.username;

  try {
    // ── ping ──
    if (cmd === "ping") {
      await interaction.reply("🏓 Pong! Operacional, comandante!");
      return;
    }

    // ── dashboard ──
    if (cmd === "dashboard") {
      const port = process.env.API_PORT || 3001;
      await interaction.reply(`🌐 **Painel de Comando:** http://localhost:${port}\nAcede via browser para gerir o clã!`);
      return;
    }

    // ── cla ──
    if (cmd === "cla") {
      const sub = interaction.options.getSubcommand();
      if (sub === "criar") {
        const nome = interaction.options.getString("nome", true);
        const tag = interaction.options.getString("tag") || "";
        const { criarCla } = await import("./services/claService.js");
        const cla = await criarCla(nome, tag);
        await interaction.reply(`🏰 Clã fundado! **${cla.nome}** [${cla.tag ?? "---"}]`);
      } else if (sub === "listar") {
        const { listarClas } = await import("./services/claService.js");
        const clas = await listarClas();
        if (!clas.length) return interaction.reply("Nenhum clã registado.");
        const list = clas.map((c) => `**${c.nome}** [${c.tag ?? "---"}]`).join("\n");
        await interaction.reply(`🏰 **Clãs Registados:**\n${list}`);
      }
      return;
    }

    // ── membro ──
    if (cmd === "membro") {
      const sub = interaction.options.getSubcommand();
      if (sub === "alistar") {
        const nomeCla = interaction.options.getString("cla", true);
        const { alistarMembro } = await import("./services/membroService.js");
        const cla = await alistarMembro(username, nomeCla);
        await interaction.reply(`🪖 **ALISTAMENTO!** ${username} agora veste a farda do clã **${cla.nome}** [${cla.tag ?? "---"}].`);
      } else if (sub === "promover") {
        const alvo = interaction.options.getString("soldado", true);
        const patente = interaction.options.getString("patente", true);
        const { promoverMembro } = await import("./services/membroService.js");
        const r = await promoverMembro(username, alvo, patente);
        await interaction.reply(`🎖️ **PROMOÇÃO:** ${r.alvo} promovido a **${r.patente}**!`);
      }
      return;
    }

    // ── estoque ──
    if (cmd === "estoque") {
      const sub = interaction.options.getSubcommand();
      if (sub === "listar") {
        const itens = await listarEstoque(username);
        if (!itens.length) return interaction.reply("🕷️ O armazém está vazio.");
        let resposta = "📦 **INVENTÁRIO DO CLÃ** 📦\n```text\n";
        itens.forEach((i) => { resposta += `[ID: ${String(i.id).padStart(3, "0")}] ${i.quantidade}x ${i.item.padEnd(15)} | 📍 ${i.local}\n`; });
        resposta += "```";
        await interaction.reply(resposta);
      } else if (sub === "depositar") {
        const item = interaction.options.getString("item", true);
        const quantidade = interaction.options.getInteger("quantity", true);
        const local = interaction.options.getString("local", true);
        await depositarItem(username, item, quantidade, local);
        await interaction.reply(`✅ Recebido: **${quantidade}x ${item}** guardado em **${local}**.`);
      } else if (sub === "retirar") {
        const id = interaction.options.getInteger("id", true);
        const item = await retirarItem(username, id);
        await interaction.reply(`📤 Levantamento: **${item.quantidade}x ${item.item}** retirado de **${item.local}**.`);
      }
      return;
    }

    // ── ranking ──
    if (cmd === "ranking") {
      const rank = await listarRanking(username);
      if (!rank.length) return interaction.reply("Nenhum soldado tem pontos.");
      let resposta = "🏆 **RANKING DO CLÃ** 🏆\n```text\n";
      rank.forEach((r, i) => { resposta += `${i + 1}º | ${r.usuario.padEnd(15)} | [${r.patente}] | ${r.pontos} Pts\n`; });
      resposta += "```";
      await interaction.reply(resposta);
      return;
    }

    // Comando não reconhecido
    await interaction.reply("⚠️ Comando não reconhecido.").catch(() => {});
  } catch (error) {
    console.error(`🚨 Erro no slash command '${cmd}':`, error);
    const msg = `❌ Falha: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// ═══════════════════════════════════════════════════════════
//  PREFIX COMMANDS (! e /) — Compatibilidade
// ═══════════════════════════════════════════════════════════

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("/") && !message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const comando = args.shift()?.toLowerCase();
  const texto = args.join(" ");

  if (!comando) return;

  try {
    switch (comando) {
      case "ping":
        await message.reply("🏓 Pong! Operacional, comandante!");
        break;
      case "intel": await executeIntel(message, texto); break;
      case "sugestao": await executeSugestao(message, texto); break;
      case "loc": await executeLoc(message, texto); break;
      case "base": await executeBase(message, args); break;
      case "arquitetura": await executeArquitetura(message, args); break;
      case "testeimagem": await executeTesteImagem(message); break;
      case "estoque": await executeEstoque(message, args); break;
      case "frota": await executeFrota(message, args); break;
      case "mapa": await executeMapa(message, args); break;
      case "missao": await executeMissao(message, args); break;
      case "ranking": await executeRanking(message); break;
      case "cla": await executeCla(message, args); break;
      case "membro": await executeMembro(message, args); break;
      case "dashboard": {
        const port = process.env.API_PORT || 3001;
        await message.reply(`🌐 **Painel de Comando:** http://localhost:${port}`);
        break;
      }
    }
  } catch (error) {
    console.error(`🚨 Erro no comando '${comando}':`, error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    await message.reply(`❌ Falha na execução: ${errorMsg}`).catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("🚨 Falha crítica ao logar:", error);
  process.exit(1);
});
