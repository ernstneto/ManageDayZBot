import { db } from '../database/connection.js';

export async function alistarMembro(usuario: string, nomeCla: string) {
    const cla = await db.get(`SELECT id FROM clas WHERE nome = ?`, [nomeCla]);
    if (!cla) {
        throw new Error(`O clã **${nomeCla}** não existe no registro. Use '!cla listar' para ver os clãs ativos.`);
    }

    try {
        await db.run (`INSERT INTO membros_clas (usuario, clan_id) VALUES (?, ?)`, [usuario, cla.id]);
        return {"nome": nomeCla, "tag": cla.tag };
    } catch (error: any) {
        throw new Error(`O soldado ${usuario} já está alistado no clã **${nomeCla}**.`);
    }
}

export async function obterDadosMembro(usuario: string) {
    return await db.get(`SELECT * FROM membros_clas WHERE usuario = ?`, [usuario]);
}

export async function listarMembros() {
    return await db.all(`SELECT * FROM membros_clas`);
}

export async function promoverMem4bro(autor: string, alvo: string, novaPatente: string) {
    const dadosAutor = await obterDadosMembro(autor);
    if (!dadosAutor) throw new Error("🚨 Não estás alistado num clã.");
    
    if (dadosAutor.patente !== "Oficial" && dadosAutor.patente !== "General") {
        throw new Error("⛔ Insubordinação: Apenas Oficiais e Generais podem promover soldados.");
    }

    const dadosAlvo = await obterDadosMembro(alvo);
    if (!dadosAlvo) throw new Error(`O soldado **${alvo}** não está alistado no sistema.`);

    if (dadosAutor.cla_id !== dadosAlvo.cla_id) throw new Error("⛔ Não podes dar ordens a soldados de outro clã.");

    const patentesValidas = ["Recruta", "Soldado", "Sargento", "Cabo", "Major", "Capitão","Oficial", "General"];
    const patenteFormatada = novaPatente.charAt(0).toUpperCase() + novaPatente.slice(1).toLowerCase();

    if(!patentesValidas.includes(patenteFormatada)) throw new Error("⛔ Patente inválida. Use: Recruta, Soldado, Sargento, Cabo, Major, Capitão, Oficial ou General.");

    await db.run("UPDATE membros SET patente = ? WHERE usuario = ?", [patenteFormatada, alvo]);
    return { alvo, patenteFormatada, cla_id: dadosAutor.cla_id };
}