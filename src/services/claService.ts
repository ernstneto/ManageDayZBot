import { db } from '../database/connection.js';
import type { Cla } from '../types/index.js';

export async function criarCla(nome: string, tag: string): Promise<Cla> {
  try {
    await db.run('INSERT INTO clas (nome, tag) VALUES (?, ?)', [nome, tag]);
    const novoCla = await db.get<Cla>('SELECT * FROM clas WHERE nome = ?', [nome]);
    if (!novoCla) throw new Error('Falha ao recuperar o clã criado.');
    return novoCla;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      throw new Error('Já existe um clã com este nome no servidor.');
    }
    throw new Error('Falha técnica ao fundar o clã.');
  }
}

export async function listarClas(): Promise<Cla[]> {
  return await db.all<Cla[]>('SELECT * FROM clas');
}
