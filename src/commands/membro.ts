import { Message } from "discord.js";
import { alistarMembro, promoverMembro } from '../services/membroService.js';

export async function executeMembro(message: Message, args: string[]) {
    const acao = args[0]?.toLowerCase();
    const username = message.author.username;

    if (acao === "alistar") {
        const nomeCla = args[1];
        if (!nomeCla) {
            return message.reply("⚠️ Uso: `!membro alistar <nome_clã>`");
        }
        try {
            const cla = await alistarMembro(username, nomeCla);
            return message.reply(`🪖 **ALISTAMENTO CONFIRMADO!** Soldado **${username}** agora veste a farda do clã **${cla.nome}** [${cla.tag ?? '---'}].`);
        } catch (error: unknown) {
            return message.reply(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    if (acao === "promover") {
        const alvo = args[1];
        const patente = args[2];

        if (!alvo || !patente) {
            return message.reply("⚠️ Sintaxe: `!membro promover [NomeDoSoldado] [NovaPatente]`");
        }

        const alvoLimpo = alvo.replace(/[@<>!]/g, '');

        try {
            const resultado = await promoverMembro(username, alvoLimpo, patente);
            return message.reply(`🎖️ **PROMOÇÃO OFICIAL:** O Comando reconhece o valor em campo. O soldado **${resultado.alvo}** foi promovido a **${resultado.patente}**!`);
        } catch (error: unknown) {
            return message.reply(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    return message.reply("⚠️ Base de Dados de Membros:\n`!membro alistar [NomeDoCla]`\n`!membro promover [NomeDoSoldado] [Patente]`");
}