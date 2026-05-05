import { Message } from "discord.js";
import { gerarMapaComMarcacao } from "../services/mapServices.js";

export async function executeMapa(message: Message, args: string[]) {
    if (args.length < 3 || args[0] !== "ping") {
        return message.reply("🚨 Sintaxe incorreta. Use: `!mapa [coord_x] [coord_y] [etiqueta]`");
    }

    const tipo = args[1]!.toLowerCase();
    const x = Number(args[2]);
    const y = Number(args[3]);
    
    if (isNaN(x) || isNaN(y)) {
        return message.reply("🚨 As coordenadas devem ser números válidos. Use: `!mapa [coord_x] [coord_y] [etiqueta]`");
    }

    let cor = '255,0,0'; // Vermelho padrão
    let etiqueta = tipo.toLowerCase();

    if (tipo === "inimigo" || tipo === "hostil") { cor = '255,0,0'; }
    else if (tipo === 'stash' || tipo === "base") { cor = '0,255,0'; etiqueta = "BASE"; }
    else if (tipo === 'heli' || tipo === 'crash') { cor = '255,255,0'; etiqueta = "CRASH"; }

    const mapX = x < 200 ? x * 100 : x;
    const mapY = y < 200 ? y * 100 : y;

    try {
        const mapa = await gerarMapaComMarcacao(mapX, mapY, etiqueta, cor);
        return message.reply({ content: `📍 Marcado no mapa: **${etiqueta.toUpperCase()}** em (${mapX}, ${mapY})`, files: [mapa] });
    } catch (error) {
        console.error("Erro ao gerar o mapa:", error);
        return message.reply("🚨 Ocorreu um erro ao gerar o mapa. Certifique-se de que o arquivo 'chernarus.png' está presente na raiz do projeto.");
    }
}