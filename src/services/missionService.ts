import { db } from '../database/connection.js';
import { obterDadosMembro } from './membroService.js';
import type { Missao } from '../types/index.js';

export async function criarMissao(
  nome: string,
  descricao: string,
  recompensaTexto: string,
  recompensaValor: number,
  autor: string,
): Promise<Missao> {
  const membro = await obterDadosMembro(autor);
  if (!membro) {
    throw new Error('🚨 Insubordinação! Tens de estar alistado num clã para criar missões (!membro alistar).');
  }

  const result = await db.run(
    'INSERT INTO missoes (cla_id, nome, descricao, recompensa_texto, recompensa_valor, autor) VALUES (?, ?, ?, ?, ?, ?)',
    [membro.cla_id, nome, descricao, recompensaTexto, recompensaValor, autor],
  );

  return {
    id: result.lastID ?? 0,
    cla_id: membro.cla_id,
    nome,
    descricao,
    recompensa_texto: recompensaTexto,
    recompensa_valor: recompensaValor,
    status: 'ATIVA',
    designado: null,
    autor,
    data: new Date().toISOString(),
  };
}

export async function listarMissoesAtivas(usuario: string): Promise<Missao[]> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) {
    throw new Error('🚨 Insubordinação! Tens de estar alistado num clã para listar missões (!membro alistar).');
  }
  return await db.all<Missao[]>(
    "SELECT * FROM missoes WHERE cla_id = ? AND status IN ('ATIVA','ANDAMENTO') ORDER BY data DESC",
    [membro.cla_id],
  );
}

export async function aceitarMissao(id: number, usuario: string): Promise<{ id: number; usuario: string }> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Tens de estar num clã para aceitar missões.');

  const missao = await db.get<{ cla_id: number; status: string }>(
    'SELECT cla_id, status FROM missoes WHERE id = ?',
    [id],
  );

  if (!missao) throw new Error(`Missão #${id} não encontrada no arquivo.`);
  if (missao.cla_id !== membro.cla_id) throw new Error('Acesso Negado: Esta missão pertence a outro clã!');
  if (missao.status === 'ANDAMENTO') throw new Error(`A Missão #${id} já está em andamento.`);
  if (missao.status === 'CONCLUÍDA') throw new Error(`A Missão #${id} já foi finalizada.`);

  await db.run("UPDATE missoes SET status = 'ANDAMENTO', designado = ? WHERE id = ?", [usuario, id]);
  return { id, usuario };
}

export async function concluirMissao(id: number, usuarioQueConcluiu: string): Promise<{ soldado: string; pontos: number }> {
  const membro = await obterDadosMembro(usuarioQueConcluiu);
  if (!membro) throw new Error('🚨 Tens de estar num clã para concluir missões.');

  const missao = await db.get<Missao>('SELECT * FROM missoes WHERE id = ?', [id]);

  if (!missao) throw new Error(`Missão #${id} não encontrada.`);
  if (missao.cla_id !== membro.cla_id) throw new Error('Acesso Negado: Esta missão pertence a outro clã!');
  if (missao.status === 'ATIVA') throw new Error(`A Missão #${id} precisa de ser aceite antes de ser concluída.`);
  if (missao.status === 'CONCLUÍDA') throw new Error(`A Missão #${id} já teve a sua recompensa resgatada!`);

  const soldadoPremiado = missao.designado ?? usuarioQueConcluiu;
  const recompensa = missao.recompensa_valor;

  await db.run("UPDATE missoes SET status = 'CONCLUÍDA' WHERE id = ?", [id]);
  await db.run('UPDATE membros_clas SET pontos = pontos + ? WHERE usuario = ? AND cla_id = ?',
    [recompensa, soldadoPremiado, membro.cla_id]);

  return { soldado: soldadoPremiado, pontos: recompensa };
}

export async function listarRanking(usuario: string): Promise<{ usuario: string; patente: string; pontos: number }[]> {
  const membro = await obterDadosMembro(usuario);
  if (!membro) throw new Error('🚨 Tens de estar num clã para ver o ranking.');

  return await db.all<{ usuario: string; patente: string; pontos: number }[]>(
    'SELECT usuario, patente, pontos FROM membros_clas WHERE cla_id = ? AND pontos > 0 ORDER BY pontos DESC',
    [membro.cla_id],
  );
}