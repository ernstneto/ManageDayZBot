import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();
// inicializa a conexao com a Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Mapa de memoria global (ID user -> history)
export const historicoTatico = new Map<string, any[]>();

export async function gerarRespostaAI(memoriaDoUtilizador: any[]) {
    const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: memoriaDoUtilizador,
        temperature: 0.3,
    });
    return chatCompletion.choices[0]?.message?.content || "Erro ao gerar inteligência.";
}