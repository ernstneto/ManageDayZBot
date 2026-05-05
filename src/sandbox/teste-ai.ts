import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

// Inicializa o cliente do Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. A Matriz Comportamental (System Prompt)
// É aqui que transformamos a IA num extrator de dados frio e calculista.
const promptSistema = `
És um operador tático de sistemas GIS (Geographic Information System).
A tua única função é analisar mensagens de rádio interceptadas e extrair as coordenadas (X e Y) mencionadas.
Não podes conversar, saudar, ou explicar o teu raciocínio.

REGRAS ESTRITAS:
1. Devolve EXCLUSIVAMENTE um objeto JSON válido e nada mais.
2. O JSON deve seguir exatamente esta estrutura:
{
  "intencao": "demarcar_base",
  "pontos": [
    {"x": numero, "y": numero}
  ]
}
3. Se não encontrares coordenadas claras, devolve um array "pontos" vazio.
`;

async function executarTesteIA() {
    // 2. A Mensagem Caótica (Simulando o input de um jogador em pânico no Discord)
    const mensagemJogador = "Capitão, a base inimiga tá gigante! Os gajos construíram muros perto da floresta. O portão principal tá ali em X: 5691 Y: 15224 e o muro estende-se até ao X 5740 e Y 15168. Alguém manda o satélite focar nisto para a raid de amanhã!";

    console.log("📡 Intercetada mensagem de rádio no Discord:");
    console.log(`"${mensagemJogador}"\n`);
    console.log("🧠 A processar linguagem natural via Groq Llama 3...");

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: promptSistema },
                { role: "user", content: mensagemJogador }
            ],
            // Usando o modelo Mixtral ou Llama 3 (extremamente rápidos no Groq)
            model: "llama-3.3-70b-versatile", 
            temperature: 0.1, // Temperatura baixa para evitar que a IA "invente" dados
            response_format: { type: "json_object" } // Força a API a garantir que o output não quebra o JSON
        });

        // 3. O Resultado
        const respostaJSON = chatCompletion.choices[0]?.message?.content;
        
        console.log("✅ Dados Extraídos com Sucesso (Prontos para o Canvas):");
        console.log(respostaJSON);

        // Teste de parsing para provar que o nosso código pode ler isto nativamente
        const dados = JSON.parse(respostaJSON || "{}");
        if (dados.pontos && dados.pontos.length > 0) {
            console.log(`\n🎯 Alvos bloqueados: ${dados.pontos.length} coordenadas identificadas.`);
            console.log(`Primeiro alvo X: ${dados.pontos[0].x}, Y: ${dados.pontos[0].y}`);
        }

    } catch (erro) {
        console.error("🚨 Falha na comunicação com a IA:", erro);
    }
}

executarTesteIA();