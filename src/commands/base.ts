import { Message, EmbedBuilder } from "discord.js";
import { initDB } from "../services/dbService";

export async function executeBase(message: Message, args: string[]) {
    // Removemos a tag principal (!base ou /base) e verificamos a ação desejada
    const subComando = args[0]?.toLowerCase();

    // Inicia a base de dados
    const db = await initDB();

    // Acao 1: Salvar Base (!base salvar <nome> <x> <y>)
    if (subComando === "salvar") {
        const nome = args[1];
        const coord_x = args[2];
        const coord_y = args[3];

        if (!nome || !coord_x || !coord_y) {
            message.reply("⚠️ Uso incorreto. Tente: `!base salvar <nome> <x> <y>`");
            return;
        }

        try {
            await db.run(`
                INSERT INTO bases (nome, coord_x, coord_y, criado_por)
                VALUES (?, ?, ?, ?)
            `, [nome, coord_x, coord_y, message.author.username]);
            message.reply(`✅ Posição estratégica **${nome.toUpperCase()}** guardada nos registos do clã!`);
        } catch (error) {
            message.reply("🛑 Erro: Já existe uma base registada com esse nome nos nossos ficheiros.");
        }
    }
    // Acao 2: Listar Bases (!base listar)
    else if (subComando === "listar") {
        const bases = await db.all(`SELECT * FROM bases`);
        
        if (bases.length === 0) {
            message.reply("Nenhuma bae ou FOB registrada nos ficheiros no momento.");
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x2989B9) //Azul para cartografia segura
            .setTitle("🗺️ Arquivo Cartográfico do Clã")
            .setDescription("Relatório de psições estabelecidas:");

        bases.forEach(base => {
            const urlMapa = `https://izurvive.com/chernarusplussatmap/#location=${base.coord_x};${base.coord_y};8`;
            embed.addFields({
                name: `📍 ${base.nome.toUpperCase()} (Reportado por: ${base.criado_por})`,
                value: `Coordenadas: [X: ${base.coord_x} | Y: ${base.coord_y}](${urlMapa})` // O link fica clicável
                });
            });
            message.reply({ embeds: [embed] });
        }
        else {
            message.reply("⚠️ Diretriz desconhecida. Opções válidas: `salvar` ou `listar`.");
        }
}