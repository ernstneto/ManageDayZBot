import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Funcao para iniciar a ligacao a base de dados local
export async function initDB() {
    const db = await open({
        filename: "./dados.db",
        driver: sqlite3.Database
    });

    // Cria a tabela 'bases' caso ela ainda nao exista
    await db.exec(`
            CREATE TABLE IF NOT EXISTS bases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE NOT NULL,
            coord_x TEXT NOT NULL,
            coord_y TEXT NOT NULL,
            criado_por TEXT NOT NULL
            )
        `);
    return db;
}

