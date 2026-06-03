import { db } from '../database/connection.js';
import { obterDadosMembro } from './membroService.js';
import type { EstoqueItem, AuditoriaEntry } from '../types/index.js';

export async function depositarItem(
  usuario: string,
  item: string,
  quantidade: number,
  local: string,
): Promise<void> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.');

  await db.run(
    'INSERT INTO estoque (cla_id, usuario, item, quantidade, local) VALUES (?, ?, ?, ?, ?)',
    [membro.cla_id, usuario, item, quantidade, local],
  );

  const detalhes = `Depositou ${quantidade}x [${item}] em [${local}]`;
  await db.run(
    'INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, ?, ?)',
    [membro.cla_id, usuario, 'DEPÓSITO', detalhes],
  );
}

export async function retirarItem(usuario: string, idItem: number): Promise<EstoqueItem> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.');

  const itemGuardado = await db.get<EstoqueItem>(
    'SELECT * FROM estoque WHERE id = ? AND cla_id = ?',
    [idItem, membro.cla_id],
  );

  if (!itemGuardado) throw new Error(`O item #${idItem} não foi encontrado no armazém do teu clã.`);

  await db.run('DELETE FROM estoque WHERE id = ? AND cla_id = ?', [idItem, membro.cla_id]);

  const detalhes = `Retirou ${itemGuardado.quantidade}x [${itemGuardado.item}] de [${itemGuardado.local}]`;
  await db.run(
    'INSERT INTO auditoria (cla_id, usuario, acao, detalhes) VALUES (?, ?, ?, ?)',
    [membro.cla_id, usuario, 'RETIRADA', detalhes],
  );

  return itemGuardado;
}

export async function listarEstoque(usuario: string): Promise<EstoqueItem[]> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Acesso Negado: Precisas de estar alistado num clã para usar o armazém.');

  return await db.all<EstoqueItem[]>(
    'SELECT * FROM estoque WHERE cla_id = ? ORDER BY data DESC',
    [membro.cla_id],
  );
}

export async function relatorioAuditoria(usuario: string, limite = 10): Promise<AuditoriaEntry[]> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Acesso Negado: Precisas de estar alistado num clã para ver os logs.');

  return await db.all<AuditoriaEntry[]>(
    'SELECT * FROM auditoria WHERE cla_id = ? ORDER BY data DESC LIMIT ?',
    [membro.cla_id, limite],
  );
}