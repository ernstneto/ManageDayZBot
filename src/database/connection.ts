import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initDB() {
    try {
        db = await open({
            filename: "./arsenal_v3.db",
            driver: sqlite3.Database
        });
        // tabela Clãs
        await db.exec(`
            CREATE TABLE IF NOT EXISTS clas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                descricao TEXT,
                tag TEXT,
                data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Membros e patentes
        await db.exec(`
            CREATE TABLE IF NOT EXISTS membros_clas (
                usuario TEXT PRIMARY KEY,
                clan_id INTEGER,
                patente TEXT DEFAULT 'Recruta',
                data_entrada TEXT DEFAULT CURRENT_TIMESTAMP,
                pontos INTEGER DEFAULT 0,
                FOREIGN KEY (clan_id) REFERENCES clas(id)
            )
        `);
        
        // Categorias
        await db.exec(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE
            )
        `);
        
        await db.run(`INSERT OR IGNORE INTO categorias (nome) VALUES ('Armamento'), ('Medicamento'), ('Alimento'), ('Estrutura'), ('Veículo'), ('Outros')`);

        // Inventário base
        await db.exec(`
            CREATE TABLE IF NOT EXISTS inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clan_id INTEGER,
                item TEXT NOT NULL,
                quantidade INTEGER NOT NULL,
                categoria_id INTEGER NOT NULL,
                local_armazenamento TEXT,
                FOREIGN KEY (clan_id) REFERENCES clas(id),
                FOREIGN KEY (categoria_id) REFERENCES categorias(id)
            )    
        `);
        
        // Frota mecanica
        await db.exec(`
            CREATE TABLE IF NOT EXISTS veiculos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clan_id INTEGER,
                veiculo TEXT NOT NULL,
                localizacao TEXT NOT NULL,
                combustivel INTEGER DEFAULT 0, -- Porcentagem 0 a 100
                radiador TEXT DEFAULT 'Falta', -- Cheio, Vazio, Quebrado, Falta
                bateria TEXT DEFAULT 'Falta', -- Cheia, Descarregada, Falta
                vela TEXT DEFAULT 'Falta', -- Boa, Gasta, Falta
                observacoes TEXT,
                FOREIGN KEY (clan_id) REFERENCES clas(id)
            )    
        `);
        
        // Localizacoes Taticas
        await db.exec(`
            CREATE TABLE IF NOT EXISTS localizacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clan_id INTEGER,
                nome TEXT NOT NULL,
                tipo TEXT CHECK(tipo IN ('BASE', 'BUNKER', 'STASH', 'POSTO')) NOT NULL,
                localizacao TEXT NOT NULL,
                descricao TEXT,
                FOREIGN KEY (clan_id) REFERENCES clas(id)
            )        
        `);
        
        // Missoes e logistica
        await db.exec(`
            CREATE TABLE IF NOT EXISTS missoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cla_id INTEGER,
                descricao TEXT NOT NULL,
                recompensa INTEGER NOT NULL,
                status TEXT DEFAULT 'ATIVA',
                designado TEXT,
                autor TEXT NOT NULL,
                data DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cla_id) REFERENCES clas (id),
                FOREIGN KEY (designado) REFERENCES membros (usuario)
            )    
        `);
        
        // Auditoria / Logs
        await db.exec(`
            CREATE TABLE IF NOT EXISTS auditoria (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cla_id INTEGER,
                usuario TEXT NOT NULL,
                acao TEXT NOT NULL, -- Ex: 'RETIRADA', 'DEPÓSITO', 'MISSÃO', 'VEÍCULO'
                detalhes TEXT NOT NULL, -- Ex: 'Retirou 2x M4A1 da Base Alpha'
                data DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cla_id) REFERENCES clas (id)
            )    
        `);
        console.log('🛡️ [Database] Cofre Supremo (arsenal_v3) conectado e arquitetura militar implementada.');
    } catch (error) {
        console.error('🚨 [Database] Falha Crítica ao forjar o banco de dados:', error);
    }
}