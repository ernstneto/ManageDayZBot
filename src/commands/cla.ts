import { Message } from "discord.js";
import { criarCla, listarClas } from "../services/claService.js";

export async function executeCla(message: Message, args: string[]) {
    const subcomando = args[0]?.toLowerCase();

    switch (subcomando) {
        case ("criar"): 
            const nome = args[1];
            const tag = args[2] || "";

            if (!nome) {
                return message.reply("Por favor, forneça um nome para o clã. Uso: `!cla criar <nome> [tag]`");
            }
            try {
                const cla = await criarCla(nome, tag);
                return message.reply(`🏰Clã FUNDADO! **${cla.nome}**[${cla.tag}] criado com sucesso!`);
            } catch (error: any) {
                return message.reply(`❌ ${error.message}`);
            }
        
        
        case "listar": 
            const clas = await listarClas();
            if (clas.length === 0) {
                return message.reply("Nenhum clã encontrado ou registrado. Use `!cla criar <nome> [tag]` para fundar um clã.");
            }

            let resposta = "🏰 **Clãs Registrados:**\n";
            clas.forEach((cla: any) => {
                resposta += `**${cla.nome}**[${cla.tag}]\n`;
            });
            return message.reply(resposta);
        
    }
    return message.reply("⚠️ Comandos de Clã:\n`!cla fundar [Nome] [Tag]`\n`!cla listar`");
}