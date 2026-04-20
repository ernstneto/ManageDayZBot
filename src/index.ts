import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { executeIntel } from "./commands/intel.js";
import { executeLoc } from "./commands/loc.js";
import { executeSugestao } from "./commands/sugestao.js";
import { executeBase } from "./commands/base.js";
import { executeArquitetura } from "./commands/arquitetura.js";
import { executeTesteImagem } from "./commands/testeimagem.js";



dotenv.config();

// Inicializa os clientes
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

/*
// Inicializa a Groq com a sua chave de segurança
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🧠 NOVO: Mapa de Memória de Curto Prazo (Guarda o histórico por ID do utilizador) 
const historicoTatico = new Map<string, any[]>();

const DIRETRIZ_SISTEMA = {
  role: "system",
  content: `Você é uma IA de inteligência militar, estrategista logístico e especialista no mapa de CHERNARUS do jogo DayZ. 
  DIRETRIZES CRÍTICAS:
  1. Mantenha o contexto das mensagens anteriores para ajustar táticas em tempo real.
  2. Seja geográficamente preciso e use referências do mapa.
  3. Mantenha uma postura militar linha-dura. Responda em português de Portugal. Limite-se a 180 palavras.`
}
*/
/*
client.once("clientReady", () => {
  console.log(`🤖 Base estabelecida! ${client.user?.tag} online e aguardando comandos.`);
});
*/
client.once("clientReady", () => {
    console.log(`🤖 Base estabelecida! ${client.user?.tag} online!`);
    
    // O RADAR: Conta em quantos servidores o bot está
    console.log(`🌍 Radar ativado: O bot está atualmente em ${client.guilds.cache.size} servidor(es).`);
    
    // Lista o nome dos servidores
    client.guilds.cache.forEach(guild => {
        console.log(`   👉 Servidor detetado: ${guild.name}`);
    });

    if (client.guilds.cache.size === 0) {
        console.log("🚨 ALERTA CRÍTICO: O bot não está em nenhum servidor! Você precisa usar o link OAuth2 para o convidar.");
    }
});
client.on("messageCreate", async (message) => {
  // console.log(message.content);
  console.log(`DEBUG: ${message.author.bot}, ${message.content}`);
  if (message.author.bot || !message.content.startsWith('/') && !message.content.startsWith('!'))  return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const comandoTag = args.shift()?.toLowerCase();
  const relatoAveriguar = args.join(" ");
    console.log(`DEBUG: ${args}, ${comandoTag}, ${relatoAveriguar}`);


  console.log(`[DEBUG] O Discord enviou a mensagem. A tag identificada foi: "${comandoTag}"`);

  // console.log(`[DEBUG] ${args}`)
  if (message.content === "!ping") {
      message.reply("🏓 Pong! A minha audição está 100% operacional, comandante!");
    }

  // ROTEAMENTO
  if (comandoTag === "intel") {
    await executeIntel(message, relatoAveriguar);
  } else if (comandoTag === "sugestao") {
    await executeSugestao(message, relatoAveriguar);
  } else if (comandoTag === "loc") {
    await executeLoc(message, relatoAveriguar);
  } else if (comandoTag === "base") {
    await executeBase(message, args);
  } else if (comandoTag === "arquitetura") {
    await executeArquitetura(message, args);
  } else if (comandoTag === "testeimagem") {
    await executeTesteImagem(message);
  } 
});

client.login(process.env.DISCORD_TOKEN);
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
      console.log("✅ Pedido de login aceite pelos servidores do Discord!");
  })
  .catch((erro) => {
      console.error("🚨 Falha crítica ao tentar logar:", erro);
  });
/*
try {
  // Chamada para a Groq usando o modelo ultrarrápido LLaMA 3
  const chatCompletion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // Modelo com alto poder de raciocínio lógico
    messages: [
      {
        // O System Prompt: A Alma do seu Bot
        role: "system",
        content: `Você é uma IA de inteligência militar, estrategista logístico e especialista no mapa de CHERNARUS do jogo DayZ. 
        
        DIRETRIZES CRÍTICAS DE OPERAÇÃO:
        1. PRECISÃO GEOGRÁFICA (OBRIGATÓRIO): Quando solicitado sobre localizações, NUNCA dê conselhos genéricos (como "procure florestas"). Você DEVE citar nomes reais do mapa, coordenadas aproximadas ou referências exatas (ex: "As docas de Chernogorsk", "A floresta a noroeste de Krasnostav", "O Castelo de Zub").
        2. ANÁLISE TÁTICA: Avalie o local sugerido apontando Vantagens de Defesa e Riscos de Flanqueamento.
        3. PERSONA: Mantenha uma postura militar, linha-dura e use jargões táticos (QAP, perímetro, ponto de extração).
        4. Responda em português, de forma direta e limite-se a 180 palavras.`,
      },
      {
        role: "user",
        content: relatoAveriguar,
      },
    ],
    temperature: 0.3, // Temperatura baixa deixa a IA mais analítica e menos "inventiva"
  });

    
*/
