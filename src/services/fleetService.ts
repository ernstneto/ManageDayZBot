import { parse } from "node:path";
import { db } from "../database/connection.js";
import { obterDadosMembro } from "./membroService.js";


export async function registrarVeiculo(usuario: string, veiculo: string, x:number, y:number, observacao: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém  para usar o armazém.");

    const localizacao = `(${x}, ${y})`;

    await db.run(`
        INSERT INTO veiculos (clan_id, veiculo, localizacao, observacoes) 
        VALUES (?, ?, ?, ?)
    `, [membro.clan_id, veiculo, localizacao, observacao]
    );

    await db.run(
        `INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, 'VEÍCULO', ?)`,
        [membro.cla_id, usuario, `Estacionou um [${veiculo}] nas coordenadas X:${x} Y:${y}`]
    );

    return true;
}

export async function listarFrota(usuario: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado");

    return await db.all(`SELECT * FROM veiculos WHERE clan_id = ?`, [membro.cla_id]);
}

export async function atualizarPeca(usuario: string, idVeiculo: number, peca: string, estado: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Acesso Negado.");

    // Verifica se o veículo existe e pertence ao clã
    const veiculo = await db.get(`SELECT * FROM veiculos WHERE id = ? AND cla_id = ?`, [idVeiculo, membro.cla_id]);
    if (!veiculo) throw new Error(`O Veículo #${idVeiculo} não foi encontrado na garagem do teu clã.`);

    // Proteção contra SQL Injection e verificação de peças válidas
    const p = peca.toLowerCase();
    let coluna = "";
    if (p === 'bateria' || p === 'radiador' || p === 'vela' || p === 'combustivel') {
        coluna = p;
    } else {
        throw new Error("Peça inválida. Usa apenas: bateria, radiador, vela ou combustivel.");
    }

    // 1. Atualiza o estado da peça
    await db.run(`UPDATE veiculos SET ${coluna} = ? WHERE id = ?`, [estado, idVeiculo]);

    // 2. Regista a manutenção na Auditoria
    await db.run(
        `INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, 'MANUTENÇÃO', ?)`,
        [membro.cla_id, usuario, `Alterou [${coluna}] do [${veiculo.veiculo}] para: ${estado}`]
    );

    return veiculo.veiculo;
}