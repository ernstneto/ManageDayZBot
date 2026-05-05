import { Message } from "discord.js";
import { db } from '../database/connection.js';
import { alistarMembro, promoverMembro } from '../services/membroService.js';

export async function executeMembro(message: Message, args: string[]) {
    const acao = args[0]?.toLowerCase();

    if (acao === "alistar") {
        const nomeCla = args[1];
        if (!nomeCla) {
            return message.reply("⚠️ Uso: `!membro alistar <nome_clã>`");
        }
        try {
            const cla = await alistarMembro(message.author.username, nomeCla);
            return message.reply(`🪖 **ALISTAMENTO CONFIRMADO!** Soldado **${message.author.username}** agora veste a farda do clã **${cla.nome}** [${cla.tag}].`);
        } catch (error: any) {
            return message.reply(`❌ ${error.message}`);
        }
    } 
    
    const username = message.author.username;

    if (acao === "promover") {
        // Exemplo: !membro promover ernstneto Sargento
        const alvo = args[1];
        const patente = args[2];

        if (!alvo || !patente) return message.reply("⚠️ Sintaxe: `!membro promover [NomeDoSoldado] [NovaPatente]`");

        // Limpa o @ se o oficial tiver "mencionado" o usuário no Discord
        const alvoLimpo = alvo.replace(/[@<>!]/g, '');

        try {
            const resultado = await promoverMembro(username, alvoLimpo, patente);
            return message.reply(`🎖️ **PROMOÇÃO OFICIAL:** O Comando reconhece o valor em campo. O soldado **${resultado.alvo}** foi promovido a **${resultado.patenteFormatada}**!`);
        } catch (e: any) {
            return message.reply(`❌ ${e.message}`);
        }
    }
    
    return message.reply("⚠️ Base de Dados de Membros:\n`!membro alistar [NomeDoCla]`\n`!membro promover [NomeDoSoldado] [Patente]`");
}