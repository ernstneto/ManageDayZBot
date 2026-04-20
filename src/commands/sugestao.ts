import { Message, EmbedBuilder } from "discord.js";
import { historicoTatico, gerarRespostaAI } from "../services/groqService";

const DIRETRIZ_SUGESTAO = 
    `
    Você é um engenheiro logístico e mestre de obras de DayZ.
    O usuário pedirá conselhos sobre construção de bases ou gestão de recursos.
    Recomende materiais necessários (ex: pregos, alicate, chapas de metal) e ferramentas.
    Foque em segurança estrutural (Airlocks, camuflagem). Responda em português. Limite: 150 palavras.
    `;


export async function executeSugestao(message: Message, relatoAveriguar: string) {
    if(!relatoAveriguar) {
        message.reply("⚠️ Faltam dados. Exemplo: `!sugestao precisamos de dicas para construir uma torre.`");
        return;
    }

    const userId = message.author.id;

    // Gerencia o historico e a persona
    if (!historicoTatico.has(userId) || historicoTatico.get(userId)![0].content !== DIRETRIZ_SUGESTAO) {
        historicoTatico.set(userId, [
            {
                role: "system",
                content: DIRETRIZ_SUGESTAO,
            },
        ]);
    }

    const memoria = historicoTatico.get(userId)!;
    memoria.push({
        role: "user",
        content: relatoAveriguar,
    });

    // Rate limit protection
    if (memoria.length > 5) memoria.splice(1,2);

    const msgProcessando = await message.reply("⏳ Direcionando dados para a divisão de engenharia...");

    try {
        const respostaAI = await gerarRespostaAI(memoria);
        memoria.push({ role: "assistant", content: respostaAI });
        const relatorioEmbed = new EmbedBuilder()
            .setColor(0xF39C12)
            .setTitle("🏗️ Engenharia & Logística")
            .setDescription(respostaAI)
            .setFooter({ text: `Planejamento gerado para ${message.author.username}` });

        await msgProcessando.edit({ content: "✅ Planejamento concluído.", embeds: [relatorioEmbed] });
    } catch (error) {
        console.error("Falha na Groq:", error);
        historicoTatico.delete(userId);
        await msgProcessando.edit("🛑 Falha crítica na comunicação com os servidores de engenharia.");
    }
    
}