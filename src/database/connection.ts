import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initDB() {
  db = await open({
    filename: './arsenal_v3.db',
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA foreign_keys = ON');

  // ── Clãs ──────────────────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      tag TEXT,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Membros dos clãs ──────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS membros_clas (
      usuario TEXT PRIMARY KEY,
      cla_id INTEGER NOT NULL,
      patente TEXT DEFAULT 'Recruta',
      data_entrada TEXT DEFAULT CURRENT_TIMESTAMP,
      pontos INTEGER DEFAULT 0,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  // ── Categorias de itens ───────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    )
  `);
  await db.run(
    `INSERT OR IGNORE INTO categorias (nome) VALUES ('Armamento'), ('Medicamento'), ('Alimento'), ('Estrutura'), ('Veículo'), ('Outros')`,
  );

  // ── Estoque (inventário unificado) ────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      usuario TEXT NOT NULL,
      item TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      categoria_id INTEGER,
      local TEXT NOT NULL,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cla_id) REFERENCES clas(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )
  `);

  // ── Frota de veículos ─────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      veiculo TEXT NOT NULL,
      localizacao TEXT NOT NULL,
      combustivel INTEGER DEFAULT 0,
      radiador TEXT DEFAULT 'Falta',
      bateria TEXT DEFAULT 'Falta',
      vela TEXT DEFAULT 'Falta',
      observacoes TEXT,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  // ── Localizações táticas ──────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS localizacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('BASE','BUNKER','STASH','POSTO')) NOT NULL,
      localizacao TEXT NOT NULL,
      descricao TEXT,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  // ── Bases (coordenadas no mapa) ───────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      coord_x TEXT NOT NULL,
      coord_y TEXT NOT NULL,
      criado_por TEXT NOT NULL,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  // ── Missões ───────────────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS missoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      nome TEXT NOT NULL DEFAULT 'Operação de Campo',
      descricao TEXT NOT NULL,
      recompensa_texto TEXT NOT NULL,
      recompensa_valor INTEGER NOT NULL,
      status TEXT DEFAULT 'ATIVA',
      designado TEXT,
      autor TEXT NOT NULL,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  // ── Auditoria / Logs ──────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cla_id INTEGER NOT NULL,
      usuario TEXT NOT NULL,
      acao TEXT NOT NULL,
      detalhes TEXT NOT NULL,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cla_id) REFERENCES clas(id)
    )
  `);

  console.log('🛡️ [Database] Arsenal v3 conectado — todas as tabelas verificadas.');
}