import { Message, EmbedBuilder } from "discord.js";
import { historicoTatico, gerarRespostaAI } from "../services/groqService";

const DIRETIRZ_INTEL = `
    Seja estrategista militar de DayZ focado em combate e sobrevivência.
    Avalie o cenário fornecido. Aponte rotas de fuga, riscos e vantagens de terreno.
    Mantenha uma postura militar. Responda em português. Limite: 150 palavras.
    `;

export async function executeIntel(message: Message, relatoAveriguar: string) {
    if (!relatoAveriguar) {
        message.reply("⚠️ Forneça os dados táticos. Exemplo: `!intel Estamos montando base nos galpões de Severograd, somos 4 pessoas.`");
        return;
    }

    const userId = message.author.id;

    // Gerencia o historico e a persona
    if (!historicoTatico.has(userId) || historicoTatico.get(userId)![0].content !== DIRETIRZ_INTEL) {
        historicoTatico.set(userId, [
            {
                role: "system",
                content: DIRETIRZ_INTEL,
            },
        ]);
    }

    const memoria = historicoTatico.get(userId)!;

    memoria.push({
        role: "user",
        content: relatoAveriguar,
    });

    if (memoria.length > 10) memoria.splice(1,2);

    const msgProcessando = await message.reply("⏳ Direcionando dados para análise tática...");

    try {
        const respostaAI = await gerarRespostaAI(memoria);
        memoria.push({ role: "assistant", content: respostaAI });

        const relatorioEmbed = new EmbedBuilder()
            .setColor(0x8B0000) // Vermelho)
            .setTitle('🧠 Relatório de Inteligência Tática')
            .setDescription(respostaAI)
            .setFooter({ text: `Análise solicitada por ${message.author.username}` });

        await msgProcessando.edit({ content: "✅ Relatório concluído.", embeds: [relatorioEmbed] });

    } catch (error) { 
        console.log("Falha na Groq:", error);
        await msgProcessando.edit("🛑 Falha crítica na comunicação com os servidores de inteligência.");
    }


}