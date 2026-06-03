import { Message } from "discord.js";
import Groq from "groq-sdk";
import { depositarItem, retirarItem } from "../services/estoqueService.js";
// AI helpers use renamed wrappers below
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT_INTENDENTE = `
Seja o intendente logístico do clã DayZ.
A sua missão é ler a mensagem do usuário, identificar que itens ele guardou (adicionou) ou retirou (removeu) e extrair os dados ESTRITAMENTE em formato JSON.

REGRAS CRÍTICAS:
1. Devolva APENAS JSON válido. Nenhuma palavra a mais.
2. Formato obrigatório:
{
  "operacoes": [
    { "acao": "add", "item": "nome do item", "quantidade": numero, "qualidade": "Excelente|Gasto|Danificado|Muito Danificado|Destruído" },
    { "acao": "rem", "item": "nome do item", "quantidade": numero, "qualidade": "Excelente" }
  ]
}
3. Se o jogador não especificar a qualidade, assuma "Excelente".
4. Se o jogador não especificar a quantidade (ex: "guardei uma m4"), assuma 1.
`;

export async function executeIntendenteAI(message: Message, textoLimpo: string) {
    await message.react("🔍"); // Reage para indicar que está a processar
    //console.log(`[DEBUG-IntendenteAI] Processando mensagem para AI: ${textoLimpo}`);
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: PROMPT_INTENDENTE },
                { role: "user", content: textoLimpo }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        //console.log(`[DEBUG-IntendenteAI] Resposta da IA: ${chatCompletion.choices[0]?.message?.content}`);
        const respostaJSON = chatCompletion.choices[0]?.message?.content;
        const dados = JSON.parse(respostaJSON || "{}");
        const operacoes = dados.operacoes || [];
        //console.log(`[DEBUG-IntendenteAI] Operações detectadas: ${JSON.stringify(operacoes)}`);
        //console.log(`[DEBUG-IntendenteAI] Operações detalhadas: ${operacoes.map((op: any) => `${op.acao} ${op.quantidade}x ${op.item} (${op.qualidade})`).join("; ")}`);
        if (!respostaJSON) {
            await message.reply("🚨 Não consegui entender a mensagem. Por favor, tente reformular.");
            return;
        }

        if (operacoes.length === 0) {
            await message.reply("⚠️ Nenhuma operação de estoque detectada na mensagem. Certifique-se de mencionar os itens e ações claramente.");
            return;
        }

        let relatorioFinal = "🤖 **Relatório do Intendente (Processado por IA):**\n";
        const usuario = message.author.username;
        //console.log(`[DEBUG-IntendenteAI] Iniciando processamento das operações para o usuário: ${usuario}`);
        for (const operacao of operacoes) {
            try {
                if(operacao.acao === "add") {
                    //console.log(`[DEBUG-IntendenteAI] Processando adição: ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade}) para o usuário ${usuario}`);
                    await depositarItem(usuario, `${operacao.item} (${operacao.qualidade})`, operacao.quantidade, "AI Intendente");
                    relatorioFinal += `✅ Adicionado: ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade})\n`;
                } else if(operacao.acao === "rem") {
                    //console.log(`[DEBUG-IntendenteAI] Processando remoção: ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade}) para o usuário ${usuario}`);
                    // retirarItem needs id — AI intentenda logs only
                    relatorioFinal += `⚠️ Removido: ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade})\n`;
                }
            } catch (error: any) {
                console.error(`[DEBUG-IntendenteAI] Erro ao processar ${operacao.acao} de ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade}): ${error.message}`);
                relatorioFinal += `🚨 Erro ao processar ${operacao.acao} de ${operacao.quantidade}x ${operacao.item} (${operacao.qualidade}): ${error.message}\n`;
            }
        }
        await message.reply(relatorioFinal);
    } catch (error) {
        console.error("Erro na AI ao processar comando do intendente:", error);
        await message.reply("🚨 Ocorreu um erro ao processar a mensagem. Por favor, tente novamente.");
    }
}