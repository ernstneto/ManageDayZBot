// @ts-nocheck — TypeScript cannot verify all code paths return (try/catch + Map pattern)
import { Message } from "discord.js";
import { criarMissao, listarMissoesAtivas, aceitarMissao, concluirMissao, listarRanking } from "../services/missionService.js";

export async function executeMissao(message: Message, args: string[]) {
    if (args.length === 0) {
        return message.reply("🎖️ **Quadro de Operações:**\n`!missao criar [Descrição] | [Pontos]`\n`!missao listar`\n`!missao aceitar [ID]`\n`!missao concluir [ID]`\n`!ranking`");
    }

    const acao = (args[0] ?? "").toLowerCase();
    const username = message.author.username;

    const handlers: Record<string, () => Promise<void>> = {
        criar: async () => {
            const dados = args.slice(1).join(" ").split("|");
            if (dados.length < 2) throw new Error("Sintaxe: `!missao criar Pegar roda em Berezino | 50`");
            const descricao = (dados[0] ?? "").trim();
            if (!descricao) throw new Error("A descrição da missão não pode estar vazia.");
            const recompensaRaw = dados[1]?.trim();
            const recompensaValor = recompensaRaw ? parseInt(recompensaRaw) : NaN;
            if (isNaN(recompensaValor)) throw new Error("❌ Valor da recompensa inválido.");
            const recompensaTexto = `${recompensaValor} Pontos`;
            await criarMissao("Operação de Campo", descricao, recompensaTexto, recompensaValor, username);
            await message.reply(`✅ Missão criada! Recompensa: **${recompensaValor} Pontos**.`);
        },
        listar: async () => {
            const missoes = await listarMissoesAtivas(username);
            if (!missoes.length) { await message.reply("☕ Nenhuma missão ativa."); return; }
            let resposta = "📋 **QUADRO DE MISSÕES ATIVAS** 📋\n\n";
            missoes.forEach((m) => {
                const st = m.status === "ATIVA" ? "🟢 ABERTA" : `🟡 ANDAMENTO por ${m.designado}`;
                resposta += `**[ID: ${m.id}]** ${m.descricao}\n💰 ${m.recompensa_texto} | ${st}\n\n`;
            });
            await message.reply(resposta);
        },
        aceitar: async () => {
            const res = await aceitarMissao(Number(args[1]), username);
            await message.reply(`🪖 Soldado **${res.usuario}** assumiu a Missão #${res.id}!`);
        },
        concluir: async () => {
            const res = await concluirMissao(Number(args[1]), username);
            await message.reply(`🎉 **MISSÃO CUMPRIDA!** ${res.soldado} recebeu ${res.pontos} pontos!`);
        },
    };

    const handler = handlers[acao] ?? (async () => {
        await message.reply("⚠️ Ação não reconhecida. Usa `!missao` para ver as opções.");
    });
    try {
        await handler();
    } catch (error: unknown) {
        await message.reply(`❌ ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
    return;
}

export async function executeRanking(message: Message) {
    try {
        const rank = await listarRanking(message.author.username);
        if (rank.length === 0) return message.reply("Nenhum soldado tem pontos registados no teu clã.");

        let resposta = "🏆 **RANKING DO CLÃ** 🏆\n```text\n";
        rank.forEach((r, i) => {
            resposta += `${i + 1}º | ${r.usuario.padEnd(15)} | [${r.patente}] | ${r.pontos} Pts\n`;
        });
        resposta += "```";
        return message.reply(resposta);
    } catch (error: unknown) {
        return message.reply(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}