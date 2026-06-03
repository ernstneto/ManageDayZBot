import { db } from '../database/connection.js';
import type { MembroCla, Patente } from '../types/index.js';
import { PATENTES_VALIDAS } from '../types/index.js';

export async function alistarMembro(usuario: string, nomeCla: string): Promise<{ nome: string; tag: string | null }> {
    const cla = await db.get<{ id: number; nome: string; tag: string | null }>(
        'SELECT id, nome, tag FROM clas WHERE nome = ?',
        [nomeCla],
    );
    if (!cla) {
        throw new Error(`O clã **${nomeCla}** não existe no registro. Use '!cla listar' para ver os clãs ativos.`);
    }

    try {
        await db.run('INSERT INTO membros_clas (usuario, cla_id) VALUES (?, ?)', [usuario, cla.id]);
        return { nome: cla.nome, tag: cla.tag };
    } catch {
        throw new Error(`O soldado ${usuario} já está alistado no clã **${cla.nome}**.`);
    }
}

export async function obterDadosMembro(usuario: string): Promise<MembroCla | undefined> {
    return await db.get<MembroCla>('SELECT * FROM membros_clas WHERE usuario = ?', [usuario]);
}

export async function listarMembros(claId: number): Promise<MembroCla[]> {
    return await db.all<MembroCla[]>('SELECT * FROM membros_clas WHERE cla_id = ?', [claId]);
}

export async function promoverMembro(
    autor: string,
    alvo: string,
    novaPatente: string,
): Promise<{ alvo: string; patente: Patente; cla_id: number }> {
    const dadosAutor = await obterDadosMembro(autor);
    if (!dadosAutor) throw new Error('🚨 Não estás alistado num clã.');

    if (dadosAutor.patente !== 'Oficial' && dadosAutor.patente !== 'General') {
        throw new Error('⛔ Insubordinação: Apenas Oficiais e Generais podem promover soldados.');
    }

    const dadosAlvo = await obterDadosMembro(alvo);
    if (!dadosAlvo) throw new Error(`O soldado **${alvo}** não está alistado no sistema.`);

    if (dadosAutor.cla_id !== dadosAlvo.cla_id) {
        throw new Error('⛔ Não podes dar ordens a soldados de outro clã.');
    }

    const patenteFormatada = novaPatente.charAt(0).toUpperCase() + novaPatente.slice(1).toLowerCase();

    if (!PATENTES_VALIDAS.includes(patenteFormatada as Patente)) {
        throw new Error('⛔ Patente inválida. Use: ' + PATENTES_VALIDAS.join(', ') + '.');
    }

    await db.run('UPDATE membros_clas SET patente = ? WHERE usuario = ?', [patenteFormatada, alvo]);
    return { alvo, patente: patenteFormatada as Patente, cla_id: dadosAutor.cla_id };
}