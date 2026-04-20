import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();
// inicializa a conexao com a Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testarGork() {
    console.log("📡 A enviar sinal para os servidores da Groq...");

    try {
        const resposta = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Responde apenas com: 'API OPERACIONAL'."}],
            temperature: 0.1,
        });
        console.log(`🟢 SINAL RECEBIDO: ${resposta.choices[0]?.message?.content}`);
    } catch (error) { 
        console.error(`🔴 ERRO CRÍTICO NA GROQ: ${error}`);
    }
}

testarGork();