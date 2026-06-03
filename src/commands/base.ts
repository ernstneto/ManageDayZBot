import { Message, EmbedBuilder } from "discord.js";
import { db } from "../database/connection.js";
import { obterDadosMembro } from "../services/membroService.js";

export async function executeBase(message: Message, args: string[]) {
    const subComando = args[0]?.toLowerCase();
    const username = message.author.username;

    if (subComando === "salvar") {
        const nome = args[1];
        const coord_x = args[2];
        const coord_y = args[3];

        if (!nome || !coord_x || !coord_y) {
            return message.reply("⚠️ Uso incorreto. Tente: `!base salvar <nome> <x> <y>`");
        }

        const membro = await obterDadosMembro(username);
        if (!membro) {
            return message.reply("🚨 Precisas de estar alistado num clã para registar bases.");
        }

        try {
            await db.run(
                "INSERT INTO bases (cla_id, nome, coord_x, coord_y, criado_por) VALUES (?, ?, ?, ?, ?)",
                [membro.cla_id, nome, coord_x, coord_y, username],
            );
            return message.reply(`✅ Posição estratégica **${nome.toUpperCase()}** guardada nos registos do clã!`);
        } catch {
            return message.reply("🛑 Erro ao guardar a base. Verifica se o nome já existe.");
        }
    }

    if (subComando === "listar") {
        const membro = await obterDadosMembro(username);
        if (!membro) {
            return message.reply("🚨 Precisas de estar alistado num clã para ver as bases.");
        }

        const bases = await db.all("SELECT * FROM bases WHERE cla_id = ?", [membro.cla_id]);

        if (bases.length === 0) {
            return message.reply("Nenhuma base ou FOB registada nos ficheiros no momento.");
        }

        const embed = new EmbedBuilder()
            .setColor(0x2989B9)
            .setTitle("🗺️ Arquivo Cartográfico do Clã")
            .setDescription("Relatório de posições estabelecidas:");

        bases.forEach(base => {
            const urlMapa = `https://izurvive.com/chernarusplussatmap/#location=${base.coord_x};${base.coord_y};8`;
            embed.addFields({
                name: `📍 ${base.nome.toUpperCase()} (Reportado por: ${base.criado_por})`,
                value: `Coordenadas: [X: ${base.coord_x} | Y: ${base.coord_y}](${urlMapa})`,
            });
        });

        return message.reply({ embeds: [embed] });
    }

    return message.reply("⚠️ Diretriz desconhecida. Opções válidas: `salvar` ou `listar`.");
}