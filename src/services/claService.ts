import { db } from '../database/connection.js';

export async function criarCla(nome: string, tag: string) {
    try {
        await db.run('INSERT INTO clas (nome, tag) VALUES (?, ?)', [nome, tag]);
        const novoCla =  await db.get('SELECT * FROM clas WHERE nome = ?', [nome]);
        return novoCla;
    } catch (error: any) {
        if (error.message.includes('UNIQUE')) throw new Error("Já existe um clã com este nome no servidor.");
        throw new Error("Falha técnica ao fundar o clã.");
    }
}

export async function listarClas() {
    return await db.all(`SELECT * FROM clas`);
}
