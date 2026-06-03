import { Message } from "discord.js";
import Groq from "groq-sdk";
import { registrarVeiculo } from "../services/fleetService.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT_FROTA = `
Seja o Oficial de Transportes do clã de DayZ.
Sua missão é extrair os dados do veículo ESTRITAMENTE em formato JSON.

REGRAS CRÍTICAS:
1. Devolva APENAS JSON válido.
2. Formato obrigatório:
{
  "veiculo": "Nome do carro (ex: Olga, Sarka, Caminhão)",
  "local": "Descrição do local em texto",
  "obs": "Estado das peças (ex: sem bateria)",
  "coord_x": numero_inteiro (Use 0 se não houver),
  "coord_y": numero_inteiro (Use 0 se não houver)
}
DICA DE COORDENADAS: Se o jogador usar padrão curto do iZurvive (ex: "em 065 120"), multiplique por 100 para converter para metros (coord_x: 6500, coord_y: 12000).
Se ele der o número completo (ex: "12000 13000"), use os números exatamente como fornecidos.
Se não houver NENHUMA coordenada na frase, devolva 0 para coord_x e coord_y.
`;

export async function executeFrotaAI(message: Message, textoLimpo: string) {
    await message.react('📡'); 

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: PROMPT_FROTA },
                { role: "user", content: textoLimpo }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const dados = JSON.parse(completion.choices[0]?.message?.content || "{}");
        
        // DEBUG TÁTICO: Vai imprimir no seu terminal o que a IA conseguiu extrair
        console.log("\n[DEBUG-Satélite] Dados extraídos pela IA:", dados);

        if (!dados.veiculo || !dados.local) {
            await message.reply("🤔 Soldado, não consegui identificar qual é o veículo ou o local.");
            return null;
        }

        const [x, y] = (dados.local ?? "0,0").split(",").map(Number);
        await registrarVeiculo(message.author.username, dados.veiculo, x || 0, y || 0, dados.obs || "Nenhuma");
        return dados;

    } catch (error) {
        console.error("Erro na IA da Frota:", error);
        throw new Error("Falha na comunicação com o Cérebro de Transportes.");
    }
}