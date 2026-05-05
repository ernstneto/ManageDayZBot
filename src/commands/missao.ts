import { Message } from "discord.js";
import { criarMissao, listarMissoesAtivas, aceitarMissao, concluirMissao, listarRanking } from "../services/missionService.js";

export async function executeMissao(message: Message, args: string[]) {
    if (args.length === 0) {
        return message.reply("🎖️ **Quadro de Operações:**\n`!missao criar [Descrição] | [Pontos]`\n`!missao listar`\n`!missao aceitar [ID]`\n`!missao concluir [ID]`\n`!ranking`");
    }

    const acao = args[0]?.toLowerCase();
    const username = message.author.username; // Identificação central do soldado

    if (!acao) return message.reply("❌ Ação inválida. Use `!missao` para ver as opções disponíveis.");

    try {
        if (acao === "criar") {
            const dados = args.slice(1).join(" ").split("|");
            if (dados.length < 2) return message.reply("Sintaxe: `!missao criar Pegar roda em Berezino | 50`");
            
            const nomeMissao = "Operação de Campo"; // Nome padrão ou extraído
            const descricao = dados[0]!.trim();
            if (descricao.length === 0) return message.reply("A descrição da missão não pode estar vazia.");
            const recompensaRaw = dados[1]?.trim();
            const recompensaValor = recompensaRaw ? parseInt(recompensaRaw) : NaN;
            if (isNaN(recompensaValor)) return message.reply("❌ Valor da recompensa inválido. Use um número inteiro.");
            const recompensaTexto = `${recompensaValor} Pontos`;

            await criarMissao(nomeMissao, descricao, recompensaTexto, recompensaValor, username);
            return message.reply(`✅ Missão criada com sucesso! Recompensa: **${recompensaValor} Pontos**.`);
        }

        if (acao === "listar") {
            const missoes = await listarMissoesAtivas(username);
            if (missoes.length === 0) return message.reply("☕ Nenhuma missão ativa no teu clã. A base está em paz.");

            let resposta = "📋 **QUADRO DE MISSÕES ATIVAS** 📋\n\n";
            missoes.forEach(m => {
                const status = m.status === 'ATIVA' ? '🟢 ABERTA' : `🟡 ANDAMENTO por ${m.designado}`;
                resposta += `**[ID: ${m.id}]** ${m.descricao}\n💰 Recompensa: ${m.recompensa} pts | Status: ${status}\n\n`;
            });
            return message.reply(resposta);
        }

        if (acao === "aceitar") {
            const res = await aceitarMissao(Number(args[1]), username);
            return message.reply(`🪖 Soldado **${res.usuario}** assumiu a Missão #${res.id}! Boa sorte lá fora.`);
        }

        if (acao === "concluir") {
            const res = await concluirMissao(Number(args[1]), username);
            return message.reply(`🎉 **MISSÃO CUMPRIDA!** O soldado **${res.soldado}** recebeu ${res.pontos} pontos de glória!`);
        }
    } catch (error: any) {
        // Captura todos os erros de insubordinação, clã errado ou falhas técnicas
        return message.reply(`❌ ${error.message}`);
    }
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
    } catch (error: any) {
        return message.reply(`❌ ${error.message}`);
    }
}