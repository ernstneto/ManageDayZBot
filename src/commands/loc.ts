import { Message } from "discord.js";

export async function executeLoc(message: Message, relatoAveriguar: string) {
    const args = relatoAveriguar.split(" ");

    if (args.length !== 2 || isNaN(Number(args[0])) || isNaN(Number(args[1]))) {
        message.reply("⚠️ Uso incorreto. Tente: `!loc 11025 3421 ou /loc 11025 3421`");
        return;
    }

    const urlMapa = `https://izurvive.com/chernarusplussatmap/#location=${args[0]};${args[1]};8`;
    message.reply(`🗺️ Coordenadas validadas. Acesse o mapa tático: ${urlMapa}`);
}