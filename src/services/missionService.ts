import { db } from '../database/connection.js';
import { obterDadosMembro } from './membroService.js';

export async function criarMissao(nome: string, descricao: string, recompensa_texto: string, recompensa_valor: number, autor: string) {
    const membro = await obterDadosMembro(autor);
    if (!membro) {
        throw new Error(`🚨 Insubordinação! Tens de estar alistado num clã para criar missões (!membro alistar).`);
    }

    await db.run(`INSERT INTO missoes (nome, descricao, recompensa_texto, recompensa_valor, autor) VALUES (?, ?, ?, ?, ?)`,        [nome, descricao, recompensa_texto, recompensa_valor, autor]
    );
    return { descricao, recompensa_texto, recompensa_valor, autor };

}

export async function listarMissoesAtivas(usuario: string) {
    const membro = await obterDadosMembro(usuario);
    if(!membro) {
        throw new Error(`🚨 Insubordinação! Tens de estar alistado num clã para listar missões (!membro alistar).`);
    }
    return await db.all(`SELECT * FROM missoes WHERE cla_id = ? AND status IN ('ATIVA', 'ANDAMENTO') ORDER BY data DESC`, [membro.cla_id]);
}

export async function aceitarMissao(id: number, usuario: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Tens de estar num clã para aceitar missões.");

    const missao = await db.get(`SELECT status, cla_id FROM missoes WHERE id = ?`, [id]);
    
    if (!missao) throw new Error(`Missão #${id} não encontrada no arquivo.`);
    if (missao.cla_id !== membro.cla_id) throw new Error(`Acesso Negado: Esta missão pertence a outro clã!`);
    if (missao.status === 'ANDAMENTO') throw new Error(`A Missão #${id} já está em andamento.`);
    if (missao.status === 'CONCLUÍDA') throw new Error(`A Missão #${id} já foi finalizada.`);
    
    await db.run(`UPDATE missoes SET status = 'ANDAMENTO', designado = ? WHERE id = ?`, [usuario, id]);
    return { id, usuario };
}

export async function concluirMissao(id: number, usuarioQueConcluiu: string) {
    const membro = await obterDadosMembro(usuarioQueConcluiu);
    if (!membro) throw new Error("🚨 Tens de estar num clã para concluir missões.");

    const missao = await db.get(`SELECT * FROM missoes WHERE id = ?`, [id]);
    
    if (!missao) throw new Error(`Missão #${id} não encontrada.`);
    if (missao.cla_id !== membro.cla_id) throw new Error(`Acesso Negado: Esta missão pertence a outro clã!`);
    if (missao.status === 'ATIVA') throw new Error(`A Missão #${id} precisa de ser aceite antes de ser concluída.`);
    if (missao.status === 'CONCLUÍDA') throw new Error(`A Missão #${id} já teve a sua recompensa resgatada!`);

    const soldadoPremiado = String(missao.designado || usuarioQueConcluiu);
    const recompensa = parseInt(String(missao.recompensa), 10) || 0;

    // 1. Marca como Concluída
    await db.run(`UPDATE missoes SET status = 'CONCLUÍDA' WHERE id = ?`, [id]);

    // 2. Deposita os Pontos (No V3, os pontos estão diretamente na tabela membros!)
    await db.run(`UPDATE membros SET pontos = pontos + ? WHERE usuario = ? AND cla_id = ?`, 
        [recompensa, soldadoPremiado, membro.cla_id]);
        
    return { soldado: soldadoPremiado, pontos: recompensa };
}

export async function listarRanking(usuario: string) {
    const membro = await obterDadosMembro(usuario);
    if (!membro) throw new Error("🚨 Tens de estar num clã para ver o ranking.");

    // O Ranking agora puxa a patente e os pontos da tabela membros
    return await db.all(`SELECT usuario, patente, pontos FROM membros WHERE cla_id = ? AND pontos > 0 ORDER BY pontos DESC`, [membro.cla_id]);
}