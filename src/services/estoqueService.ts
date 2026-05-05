import { db } from '../database/connection.js';
import { obterDadosMembro } from './membroService.js';

export async function depositarItem(usuario: string, item: string, quantidade: number, local: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.");

    await db.run(`INSERT INTO estoque (usuario, item, quantidade, local) VALUES (?, ?, ?, ?)`, [usuario, item, quantidade, local]);
    
    const detalhes = `Depositou ${quantidade}x [${item}] em [${local}]`;

    await db.run(`INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, 'DEPÓSITO', ?)`, 
        [membro.cla_id, usuario, detalhes]);

    return true;
}

export async function retirarItem(usuario: string, item: string, quantidade: number, local: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.");

    const itemGuardado = await db.get(`SELECT * FROM inventory WHERE id = ? AND cla_id = ?`, [idItem, membro.cla_id]);

    if (!itemGuardado) throw new Error(`O item #${idItem} não foi encontrado no armazém do teu clã.`);

    await db.run(`DELETE FROM inventory WHERE id = ? AND cla_id = ?`, [idItem, membro.cla_id]);

    const detalhes = `Retirou ${itemGuardado.quantidade}x [${itemGuardado.item}] de [${itemGuardado.local}]`;

    await db.run(`INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, 'RETIRADA', ?)`, 
        [membro.cla_id, usuario, detalhes]);
    
        return itemGuardado;
    }

export async function listarEstoque(cla_id: number, usuario: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.");
    if (membro.cla_id !== cla_id) throw new Error("🚨 Acesso Negado: Este estoque pertence a outro clã!");

    if (membro.patente === "Soldado" || membro.patente === "Recruta") {
        throw new Error("🚨 Acesso Negado: Apenas membros com patente de Oficial ou superior podem acessar o estoque.");
    }

    return await db.all(`SELECT data, usuario, acao, detalhes FROM auditoria WHERE cla_id = ? ORDER BY data DESC LIMIT ?`, 
        [membro.cla_id, limite]);
}