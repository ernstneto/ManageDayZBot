// @ts-nocheck
// ============================================================
// ManageDayzBot — Integrated API Server
// Serves the REST API + Dashboard alongside the Discord bot
// ============================================================
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import type { Client } from "discord.js";
import type { Request, Response } from "express";

import { db } from "../database/connection.js";
import { criarCla, listarClas } from "../services/claService.js";
import { alistarMembro, obterDadosMembro, listarMembros, promoverMembro } from "../services/membroService.js";
import { depositarItem, retirarItem, listarEstoque, relatorioAuditoria } from "../services/estoqueService.js";
import { registrarVeiculo, listarFrota, atualizarPeca } from "../services/fleetService.js";
import { criarMissao, listarMissoesAtivas, aceitarMissao, concluirMissao, listarRanking } from "../services/missionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startApiServer(client: Client, port: number) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  const ok = <T,>(data: T) => ({ success: true, data });
  const fail = (error: string) => ({ success: false, error });

  // ── Bot Info ─────────────────────────────────────────
  app.get("/api/bot/status", (_req: Request, res: Response) => {
    res.json(ok({
      online: client.isReady(),
      user: client.user?.tag ?? null,
      guilds: client.guilds.cache.size,
      uptime: process.uptime(),
    }));
  });

  // ── Health ───────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json(ok({ status: "operational", timestamp: new Date().toISOString() }));
  });

  // ═══════════════════════════════════════════════════════
  //  CLÃS
  // ═══════════════════════════════════════════════════════
  app.get("/api/clas", async (_req, res) => {
    try { res.json(ok(await listarClas())); }
    catch (e) { res.status(500).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/clas", async (req, res) => {
    try {
      const { nome, tag = "", descricao = "" } = req.body;
      if (!nome) return res.status(400).json(fail("Nome é obrigatório."));
      res.status(201).json(ok(await criarCla(nome, tag)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  MEMBROS
  // ═══════════════════════════════════════════════════════
  app.get("/api/membros/:usuario", async (req, res) => {
    try { res.json(ok(await obterDadosMembro(req.params.usuario) ?? null)); }
    catch (e) { res.status(500).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.get("/api/clas/:claId/membros", async (req, res) => {
    try { res.json(ok(await listarMembros(Number(req.params.claId)))); }
    catch (e) { res.status(500).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/membros/alistar", async (req, res) => {
    try {
      const { usuario, nomeCla } = req.body;
      if (!usuario || !nomeCla) return res.status(400).json(fail("usuario e nomeCla são obrigatórios."));
      res.status(201).json(ok(await alistarMembro(usuario, nomeCla)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/membros/promover", async (req, res) => {
    try {
      const { autor, alvo, patente } = req.body;
      if (!autor || !alvo || !patente) return res.status(400).json(fail("autor, alvo e patente são obrigatórios."));
      res.json(ok(await promoverMembro(autor, alvo, patente)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  ESTOQUE
  // ═══════════════════════════════════════════════════════
  app.get("/api/estoque/:usuario", async (req, res) => {
    try { res.json(ok(await listarEstoque(req.params.usuario))); }
    catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/estoque/depositar", async (req, res) => {
    try {
      const { usuario, item, quantidade, local } = req.body;
      if (!usuario || !item || !quantidade || !local) return res.status(400).json(fail("Campos obrigatórios em falta."));
      await depositarItem(usuario, item, Number(quantidade), local);
      res.status(201).json(ok({ message: "Item depositado." }));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/estoque/retirar", async (req, res) => {
    try {
      const { usuario, idItem } = req.body;
      if (!usuario || !idItem) return res.status(400).json(fail("usuario e idItem são obrigatórios."));
      res.json(ok(await retirarItem(usuario, Number(idItem))));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.get("/api/auditoria/:usuario", async (req, res) => {
    try {
      const limite = Number(req.query.limite) || 20;
      res.json(ok(await relatorioAuditoria(req.params.usuario, limite)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  FROTA
  // ═══════════════════════════════════════════════════════
  app.get("/api/frota/:usuario", async (req, res) => {
    try { res.json(ok(await listarFrota(req.params.usuario))); }
    catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/frota/registrar", async (req, res) => {
    try {
      const { usuario, veiculo, x, y, observacao = "" } = req.body;
      if (!usuario || !veiculo || x === undefined || y === undefined) return res.status(400).json(fail("Campos obrigatórios em falta."));
      await registrarVeiculo(usuario, veiculo, Number(x), Number(y), observacao);
      res.status(201).json(ok({ message: "Veículo registado." }));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/frota/peca", async (req, res) => {
    try {
      const { usuario, idVeiculo, peca, estado } = req.body;
      if (!usuario || !idVeiculo || !peca || !estado) return res.status(400).json(fail("Campos obrigatórios em falta."));
      const nome = await atualizarPeca(usuario, Number(idVeiculo), peca, estado);
      res.json(ok({ message: `Peça atualizada: ${nome}` }));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  MISSÕES
  // ═══════════════════════════════════════════════════════
  app.get("/api/missoes/:usuario", async (req, res) => {
    try { res.json(ok(await listarMissoesAtivas(req.params.usuario))); }
    catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/missoes", async (req, res) => {
    try {
      const { nome = "Operação de Campo", descricao, recompensaValor, autor } = req.body;
      if (!descricao || !recompensaValor || !autor) return res.status(400).json(fail("Campos obrigatórios em falta."));
      const texto = `${recompensaValor} Pontos`;
      res.status(201).json(ok(await criarMissao(nome, descricao, texto, Number(recompensaValor), autor)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/missoes/aceitar", async (req, res) => {
    try {
      const { id, usuario } = req.body;
      if (!id || !usuario) return res.status(400).json(fail("id e usuario são obrigatórios."));
      res.json(ok(await aceitarMissao(Number(id), usuario)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/missoes/concluir", async (req, res) => {
    try {
      const { id, usuario } = req.body;
      if (!id || !usuario) return res.status(400).json(fail("id e usuario são obrigatórios."));
      res.json(ok(await concluirMissao(Number(id), usuario)));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.get("/api/ranking/:usuario", async (req, res) => {
    try { res.json(ok(await listarRanking(req.params.usuario))); }
    catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  BASES
  // ═══════════════════════════════════════════════════════
  app.get("/api/bases/:usuario", async (req, res) => {
    try {
      const membro = await obterDadosMembro(req.params.usuario);
      if (!membro) return res.status(403).json(fail("Precisas de estar num clã."));
      const bases = await db.all("SELECT * FROM bases WHERE cla_id = ?", [membro.cla_id]);
      res.json(ok(bases));
    } catch (e) { res.status(500).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  app.post("/api/bases", async (req, res) => {
    try {
      const { usuario, nome, coordX, coordY } = req.body;
      if (!usuario || !nome || !coordX || !coordY) return res.status(400).json(fail("Campos obrigatórios em falta."));
      const membro = await obterDadosMembro(usuario);
      if (!membro) return res.status(403).json(fail("Precisas de estar num clã."));
      await db.run(
        "INSERT INTO bases (cla_id, nome, coord_x, coord_y, criado_por) VALUES (?, ?, ?, ?, ?)",
        [membro.cla_id, nome, coordX, coordY, usuario],
      );
      res.status(201).json(ok({ message: "Base registada." }));
    } catch (e) { res.status(400).json(fail(e instanceof Error ? e.message : "Erro")); }
  });

  // ═══════════════════════════════════════════════════════
  //  CHAT UNIFICADO (Web ↔ Discord)
  // ═══════════════════════════════════════════════════════

  // Lista de clientes SSE conectados
  const sseClients: Response[] = [];

  // Histórico de chat em memória (últimas 100 mensagens)
  const chatHistory: ChatMessage[] = [];

  interface ChatMessage {
    id: string;
    timestamp: string;
    source: 'web' | 'discord';
    username: string;
    content: string;
    channel?: string;
  }

  // ── SSE: Stream de mensagens em tempo real ──
  app.get("/api/chat/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    // Enviar histórico ao conectar
    res.write(`data: ${JSON.stringify({ type: "history", messages: chatHistory })}\n\n`);

    sseClients.push(res);

    // Heartbeat para manter ligação
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // ── POST: Enviar mensagem do Web → Discord + SSE ──
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { username, content, channelId } = req.body;
      if (!username || !content) return res.status(400).json(fail("username e content são obrigatórios."));

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: "web",
        username,
        content,
        channel: channelId,
      };

      // Guardar no histórico
      chatHistory.push(msg);
      if (chatHistory.length > 100) chatHistory.shift();

      // Enviar para o Discord (se o bot estiver online)
      if (client.isReady() && channelId) {
        try {
          const channel = await client.channels.fetch(channelId);
          if (channel && channel.isTextBased()) {
            await channel.send(`💬 **[Web] ${username}:** ${content}`);
          }
        } catch (e) {
          console.error("[Chat] Erro ao enviar para Discord:", e);
        }
      }

      // Broadcast para todos os clientes SSE
      broadcastSSE({ type: "message", message: msg });

      res.json(ok(msg));
    } catch (e) {
      res.status(500).json(fail(e instanceof Error ? e.message : "Erro"));
    }
  });

  // ── GET: Histórico de chat ──
  app.get("/api/chat/history", (_req, res) => {
    res.json(ok(chatHistory));
  });

  // ── Função auxiliar: Broadcast SSE ──
  function broadcastSSE(data: unknown) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        // Cliente desconectado, ignorar
      }
    }
  }

  // ── Exportar função para o bot enviar mensagens Discord → Web ──
  (global as any).__chatBroadcast = (username: string, content: string, channel?: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: "discord",
      username,
      content,
      channel,
    };
    chatHistory.push(msg);
    if (chatHistory.length > 100) chatHistory.shift();
    broadcastSSE({ type: "message", message: msg });
  };


  // ── SSE: Notificações em tempo real ──
  const notifClients: Response[] = [];

  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    notifClients.push(res);

    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    }, 30000);

    // Enviar estado inicial
    res.write(`data: ${JSON.stringify({ type: "connected", message: "Notificações ativas" })}\n\n`);

    req.on("close", () => {
      clearInterval(heartbeat);
      const idx = notifClients.indexOf(res);
      if (idx !== -1) notifClients.splice(idx, 1);
    });
  });

  // ── Broadcast de notificações ──
  function broadcastNotification(notif: { message: string; level?: string; timestamp?: string }) {
    const payload = `data: ${JSON.stringify({ type: "notification", notification: { ...notif, timestamp: notif.timestamp || new Date().toISOString() } })}\n\n`;
    for (const c of notifClients) {
      try { c.write(payload); } catch { /* ignorar */ }
    }
  }

  // ── Endpoint para disparar notificações (usado pelo bot) ──
  app.post("/api/notifications/trigger", (req, res) => {
    try {
      const { message, level = "new" } = req.body;
      if (!message) return res.status(400).json(fail("message é obrigatório."));
      broadcastNotification({ message, level });
      res.json(ok({ message: "Notificação enviada." }));
    } catch (e) {
      res.status(500).json(fail(e instanceof Error ? e.message : "Erro"));
    }
  });

  // ── GET: Auditoria do sistema (para o dashboard) ──
  app.get("/api/auditoria/sistema", async (_req, res) => {
    try {
      const logs = await db.all("SELECT * FROM auditoria ORDER BY data DESC LIMIT 10");
      res.json(ok(logs));
    } catch (e) {
      res.status(500).json(fail(e instanceof Error ? e.message : "Erro"));
    }
  });

  // ── Exportar função de notificação para o bot ──
  (global as any).__notifyDashboard = (message: string, level = "new") => {
    broadcastNotification({ message, level });
  };

  // ── Start ────────────────────────────────────────────
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`🌐 [API] Dashboard: http://localhost:${port}`);
      console.log(`🌐 [API] REST:      http://localhost:${port}/api`);
      console.log(`💬 [Chat] SSE ativo em /api/chat/stream`);
      console.log(`🔔 [Notificações] SSE ativo em /api/notifications/stream`);
      resolve();
    });
  });
}
