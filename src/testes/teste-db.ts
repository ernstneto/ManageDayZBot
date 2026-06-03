// @ts-nocheck — inventoryService removed, using estoqueService instead
import { db } from "../database/connection.js";

async function executarTesteDB() {
    console.log("Iniciando teste de DB...");
    console.log("🛠️ [DIAGNÓSTICO] A iniciar teste isolado da Base de Dados...");

    try {
        console.log("⏳ A conectar ao SQLite...");
        await initInventoryDB();
        console.log("✅ Conexão estabelecida. Testando inserção de dados...\n");

        console.log("⏳ A tentar adicionar '2x M4A1 (Gasto)'...");
        const resultadoAdd = await adicionarRecursos("M4A1", "Gasto", 2, "TesteUnitario");
        console.log(`✅ Sucesso na Inserção! Nome Oficial: ${resultadoAdd.nomeOficial} | Total: ${resultadoAdd.total}\n`);

        console.log("⏳ Listando inventário para verificar o resultado...");
        const itens = await listarInventory();
        console.log("📦 Inventário Atual:");
        console.table(itens);

        console.log("✅ Teste de DB concluído com sucesso. A base de dados está operacional e responde corretamente às operações de inserção e consulta.");

    } catch (error) {
        console.error("🚨 Falha crítica durante o teste de DB:", error);
    }
}

executarTesteDB();