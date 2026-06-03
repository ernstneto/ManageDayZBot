import { Message } from "discord.js";
import { registrarVeiculo, listarFrota, atualizarPeca } from "../services/fleetService.js";
import { gerarMapaComMarcacao } from "../services/mapServices.js";

export async function executeFrota(message: Message, args: string[]) {
    if (args.length === 0) {
        return message.reply("🚙 **Motor Pool Tático:**\n`!frota guardar [Veiculo] [X] [Y] [Obs]`\n`!frota listar`\n`!frota peca [ID] [bateria/radiador/vela/combustivel] [Estado]`");
    }

    const acao = (args[0] ?? "").toLowerCase();
    const username = message.author.username;

    try {
        if (acao === "guardar" || acao === "estacionar") {
            const veiculo = args[1];
            const x = Number(args[2]);
            const y = Number(args[3]);
            const obs = args.slice(4).join(" ") || "Sem observações";

            if (!veiculo || isNaN(x) || isNaN(y)) return message.reply("⚠️ Sintaxe Correta: `!frota guardar Lada 12000 13000 Escondido nas árvores`");

            await registrarVeiculo(username, veiculo, x, y, obs);
            
            try {
                // Dispara o satélite para mostrar a localização (Cor azul para veículos)
                const mapa = await gerarMapaComMarcacao(x, y, veiculo, '0, 150, 255');
                return message.reply({ content: `✅ **${veiculo}** registado e mapeado com sucesso em X:${x} Y:${y}!`, files: [mapa] });
            } catch (e) {
                 return message.reply(`✅ **${veiculo}** registado com sucesso em X:${x} Y:${y}! (Satélite indisponível no momento).`);
            }
        }

        if (acao === "listar") {
            const frota = await listarFrota(username);
            if (frota.length === 0) return message.reply("🚶 O clã está a pé. Nenhum veículo na garagem.");

            let resposta = "🚙 **FROTA ATIVA DO CLÃ** 🚙\n```text\n";
            frota.forEach(v => {
                resposta += `[ID: ${v.id}] ${v.veiculo.toUpperCase()} | 📍 X:${v.coord_x} Y:${v.coord_y}\n`;
                resposta += `   ⛽ Combustível: ${v.combustivel}% \n`;
                resposta += `   🔋 Bateria: ${v.bateria} | 🌡️ Radiador: ${v.radiador} | ⚡ Vela: ${v.vela}\n`;
                if (v.obs) resposta += `   📝 Obs: ${v.obs}\n`;
                resposta += `-----------------------------------\n`;
            });
            resposta += "```";
            return message.reply(resposta);
        }

        if (acao === "peca" || acao === "atualizar") {
            const id = Number(args[1]);
            const peca = args[2];
            const estado = args.slice(3).join(" ");

            if (isNaN(id) || !peca || !estado) return message.reply("⚠️ Sintaxe: `!frota peca 1 bateria Boa` ou `!frota peca 2 combustivel 80`");

            const nomeVeiculo = await atualizarPeca(username, id, peca, estado);
            return message.reply(`🔧 Manutenção registada! A peça **${peca}** do **${nomeVeiculo}** agora consta como: **${estado}**.`);
        }

        return message.reply("⚠️ Ação não reconhecida. Usa `!frota` para ver as opções.");
    } catch (error: unknown) {
        return message.reply(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}