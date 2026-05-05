import { Message } from "discord.js";
import { depositarItem, retirarItem, listarEstoque, relatorioAuditoria } from "../services/estoqueService.js";

export async function executeEstoque(message: Message, args: string[]) {
    if (args.length === 0) {
        return message.reply("📦 **Logística do Clã:**\n`!estoque guardar [Qtd] [Item] em [Local]`\n`!estoque retirar [ID]`\n`!estoque listar`\n`!estoque auditoria`");
    }

    const acao = args[0].toLowerCase();
    const username = message.author.username;

    try {
        if (acao === "guardar" || acao === "depositar") {
            // Exemplo esperado: !estoque guardar 2 M4A1 em Base Norte
            const fullText = args.slice(1).join(" ");
            const partes = fullText.split(" em ");
            
            if (partes.length < 2) return message.reply("⚠️ Usa o formato: `!estoque guardar 5 pregos em Tenda 1`");
            
            const qtd = parseInt(args[1]);
            if (isNaN(qtd)) return message.reply("⚠️ Indica uma quantidade válida.");
            
            // Extrai o nome do item ignorando o número da quantidade
            const item = partes[0].replace(args[1], "").trim();
            const local = partes[1].trim();

            await depositarItem(username, item, qtd, local);
            return message.reply(`✅ Recebido no armazém: **${qtd}x ${item}** guardado em **${local}**.`);
        }

        if (acao === "retirar") {
            const id = Number(args[1]);
            if (isNaN(id)) return message.reply("⚠️ Indica o ID do item. Ex: `!estoque retirar 3`");

            const item = await retirarItem(username, id);
            return message.reply(`📤 Levantamento autorizado: **${item.quantidade}x ${item.item}** retirado de **${item.local_armazenamento}** por ${username}.`);
        }

        if (acao === "listar") {
            const itens = await listarEstoque(username);
            if (itens.length === 0) return message.reply("🕷️ O armazém do clã está completamente vazio.");

            let resposta = "📦 **INVENTÁRIO DO CLÃ** 📦\n```text\n";
            itens.forEach(i => {
                resposta += `[ID: ${i.id.toString().padStart(3, '0')}] ${i.quantidade}x ${i.item.padEnd(15)} | 📍 ${i.local_armazenamento}\n`;
            });
            resposta += "```";
            return message.reply(resposta);
        }

        if (acao === "auditoria" || acao === "logs") {
            const logs = await relatorioAuditoria(username);
            if (logs.length === 0) return message.reply("Nenhum movimento registado ainda.");

            let resposta = "🕵️ **REGISTOS DE SEGURANÇA (Últimos 10)** 🕵️\n```text\n";
            logs.forEach(l => {
                // Formata a data para ficar mais limpa
                const dataLimpa = new Date(l.data).toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
                resposta += `[${dataLimpa}] ${l.usuario}: ${l.detalhes}\n`;
            });
            resposta += "```";
            return message.reply(resposta);
        }

    } catch (error: any) {
        return message.reply(`❌ ${error.message}`);
    }
}