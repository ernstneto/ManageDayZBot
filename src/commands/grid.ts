import { Message } from "discord.js";

export async function executeGrid(message: Message, args: string[]) {
    if(args.length < 4) {
        return message.reply("🚨 Erro: Informe os 4 quadrantes. Exemplo de uso: `!grid 040 042 020 022`");
    }
    try {
        const xA = parseInt(args[0]!,10);
        const xB = parseInt(args[1]!,10);
        const yA = parseInt(args[2]!,10);
        const yB = parseInt(args[3]!,10);
        
        if(isNaN(xA) || isNaN(xB) || isNaN(yA) || isNaN(yB)) {
            return message.reply("🚨 Erro de Sintaxe: Os quadrantes devem ser números.");
        }

        const metrosMinX = xA * 100;
        const metrosMinY = yA * 100;
        const metrosMaxX = (xB * 100) + 100;
        const metrosMaxY = (yB * 100) + 100;

        const centroX = (metrosMinX + metrosMaxX) / 2;
        const centroY = (metrosMinY + metrosMaxY) / 2;

        const linkIzurvive = `https://www.izurvive.com/chernarusplussatmap/#loc=${centroX};${centroY}`;
        const formataGrid = (num: number) => num.toString().padStart(3, '0');

        const mensagem = `📍 **ÁREA DE OPERAÇÕES DETETADA**\n\n` +
                        `🟩 **Eixo X:** [${formataGrid(xA)} a ${formataGrid(xB)}]\n` +
                        `🟩 **Eixo Y:** [${formataGrid(yA)} a ${formataGrid(yB)}]\n\n` +
                        `🎯 **Ponto Central:** ${centroX} / ${centroY}\n` +
                        `🛰️ **Link Mobile:** ${linkIzurvive}\n\n` +
                        `_Transmissão C3 Integrada_`;
        
        await message.reply(mensagem);
    } catch (error) {
        console.error(error);
        message.reply("🚨 Falha crítica nas coordenadas apresentadas.");
    }
}