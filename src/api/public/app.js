// ============================================================
// ManageDayzBot — Dashboard App
// ============================================================
const API = '/api';

// ── State ──────────────────────────────────────────────
let currentPanel = 'dashboard';
let eventSource = null;

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  checkHealth();
  loadClas();
  initChat();
  initNotifications();
  setInterval(checkHealth, 30000);
});

// ── Navigation ─────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-links li').forEach((li) => {
    li.addEventListener('click', () => {
      const panel = li.dataset.panel;
      if (!panel) return;

      document.querySelectorAll('.nav-links li').forEach((l) => l.classList.remove('active'));
      li.classList.add('active');

      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(`panel-${panel}`).classList.add('active');

      currentPanel = panel;
      refreshPanel(panel);
    });
  });
}

function refreshPanel(panel) {
  switch (panel) {
    case 'dashboard': loadDashboard(); break;
    case 'clas': loadClas(); break;
    case 'missoes': loadMissoes(); break;
  }
}

// ── Health Check ───────────────────────────────────────
async function checkHealth() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  try {
    const res = await fetch(`${API}/health`);
    const data = await res.json();
    if (data.success) {
      dot.className = 'status-dot online';
      text.textContent = 'Operacional';
    } else {
      throw new Error();
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Offline';
  }
}

// ── API Helper ─────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

// ── Toast ──────────────────────────────────────────────
function toast(message, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Modals ─────────────────────────────────────────────
function showModal(id) {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
}

function closeModals() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach((m) => m.classList.remove('open'));
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
async function loadDashboard() {
  // Carregar estatísticas gerais
  try {
    const [clas, botStatus] = await Promise.all([
      api('/clas'),
      api('/bot/status'),
    ]);
    document.getElementById('stat-clas').textContent = clas.data?.length ?? 0;
    document.getElementById('stat-missoes').textContent = '—';
    document.getElementById('stat-frota').textContent = '—';
    document.getElementById('stat-estoque').textContent = '—';
  } catch {
    ['stat-clas','stat-missoes','stat-frota','stat-estoque'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
  }

  // Carregar atividade recente (últimas 5 auditorias)
  loadRecentActivity();
}

async function loadRecentActivity() {
  const container = document.getElementById('recent-activity');
  if (!container) return;
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    // Tenta carregar auditoria de um utilizador padrão
    const res = await api('/auditoria/sistema?limite=5');
    if (!res.success || !res.data?.length) {
      container.innerHTML = '<div class="empty">Sem atividade recente.</div>';
      return;
    }
    container.innerHTML = res.data.map((l) => {
      const badge = l.acao === 'DEPÓSITO' ? 'badge-green' : l.acao === 'RETIRADA' ? 'badge-red' : 'badge-blue';
      return `
        <div class="data-item">
          <div>
            <div class="title"><span class="badge ${badge}">${esc(l.acao)}</span> ${esc(l.detalhes)}</div>
            <div class="subtitle">Por ${esc(l.usuario)} · ${fmtDate(l.data)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar atividade.</div>'; }
}

// ═══════════════════════════════════════════════════════════
//  CLÃS
// ═══════════════════════════════════════════════════════════
async function loadClas() {
  const container = document.getElementById('clas-list');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api('/clas');
    if (!res.success || !res.data?.length) {
      container.innerHTML = '<div class="empty">Nenhum clã registado. Funda o teu clã!</div>';
      return;
    }
    container.innerHTML = res.data.map((c) => `
      <div class="data-item">
        <div>
          <div class="title">${esc(c.nome)} <span class="badge badge-blue">[${esc(c.tag) ?? '---'}]</span></div>
          <div class="subtitle">${esc(c.descricao) ?? 'Sem descrição'} · Criado em ${fmtDate(c.data_criacao)}</div>
        </div>
      </div>
    `).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar clãs.</div>'; }
}

async function submitCla() {
  const nome = document.getElementById('cla-nome').value.trim();
  const tag = document.getElementById('cla-tag').value.trim();
  const desc = document.getElementById('cla-desc').value.trim();
  if (!nome) return toast('Nome é obrigatório.', 'error');
  try {
    const res = await api('/clas', { method: 'POST', body: JSON.stringify({ nome, tag, descricao: desc }) });
    if (res.success) {
      toast(`Clã "${nome}" fundado com sucesso!`);
      closeModals();
      loadClas();
      ['cla-nome','cla-tag','cla-desc'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  MEMBROS
// ═══════════════════════════════════════════════════════════
async function loadMembros() {
  const container = document.getElementById('membros-list');
  container.innerHTML = '<div class="empty">Usa o bot Discord para alistar membros.<br>Consulta por clã em breve.</div>';
}

async function submitAlistar() {
  const usuario = document.getElementById('alistar-usuario').value.trim();
  const nomeCla = document.getElementById('alistar-cla').value.trim();
  if (!usuario || !nomeCla) return toast('Preenche todos os campos.', 'error');
  try {
    const res = await api('/membros/alistar', { method: 'POST', body: JSON.stringify({ usuario, nomeCla }) });
    if (res.success) {
      toast(`${usuario} alistado no clã ${nomeCla}!`);
      closeModals();
      ['alistar-usuario','alistar-cla'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

async function submitPromover() {
  const autor = document.getElementById('promover-autor').value.trim();
  const alvo = document.getElementById('promover-alvo').value.trim();
  const patente = document.getElementById('promover-patente').value;
  if (!autor || !alvo || !patente) return toast('Preenche todos os campos.', 'error');
  try {
    const res = await api('/membros/promover', { method: 'POST', body: JSON.stringify({ autor, alvo, patente }) });
    if (res.success) {
      toast(`${alvo} promovido a ${patente}!`);
      closeModals();
      ['promover-autor','promover-alvo'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('promover-patente').value = '';
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  ESTOQUE
// ═══════════════════════════════════════════════════════════
async function loadEstoque() {
  const user = document.getElementById('estoque-user').value.trim();
  const container = document.getElementById('estoque-list');
  if (!user) return toast('Indica o teu username.', 'error');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api(`/estoque/${encodeURIComponent(user)}`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Estoque vazio.</div>';
    container.innerHTML = res.data.map((i) => `
      <div class="data-item">
        <div>
          <div class="title"><span class="badge badge-blue">ID:${i.id}</span> ${i.quantidade}x ${esc(i.item)}</div>
          <div class="subtitle">📍 ${esc(i.local)} · Por ${esc(i.usuario)} · ${fmtDate(i.data)}</div>
        </div>
        <button class="btn-sm btn-danger" onclick="quickRetirar('${user}', ${i.id})">Retirar</button>
      </div>
    `).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

async function submitDepositar() {
  const usuario = document.getElementById('depositar-usuario').value.trim();
  const item = document.getElementById('depositar-item').value.trim();
  const quantidade = document.getElementById('depositar-qtd').value;
  const local = document.getElementById('depositar-local').value.trim();
  if (!usuario || !item || !quantidade || !local) return toast('Preenche todos os campos.', 'error');
  try {
    const res = await api('/estoque/depositar', {
      method: 'POST',
      body: JSON.stringify({ usuario, item, quantidade: Number(quantidade), local }),
    });
    if (res.success) {
      toast(`${quantidade}x ${item} depositado em ${local}!`);
      closeModals();
      loadEstoque();
      ['depositar-item','depositar-qtd','depositar-local'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

async function submitRetirar() {
  const usuario = document.getElementById('retirar-usuario').value.trim();
  const idItem = document.getElementById('retirar-id').value;
  if (!usuario || !idItem) return toast('Preenche todos os campos.', 'error');
  await quickRetirar(usuario, Number(idItem));
  closeModals();
}

async function quickRetirar(usuario, idItem) {
  try {
    const res = await api('/estoque/retirar', {
      method: 'POST',
      body: JSON.stringify({ usuario, idItem }),
    });
    if (res.success) {
      toast(`Item #${idItem} retirado!`);
      loadEstoque();
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  FROTA
// ═══════════════════════════════════════════════════════════
async function loadFrota() {
  const user = document.getElementById('frota-user').value.trim();
  const container = document.getElementById('frota-list');
  if (!user) return toast('Indica o teu username.', 'error');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api(`/frota/${encodeURIComponent(user)}`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Nenhum veículo registado.</div>';
    container.innerHTML = res.data.map((v) => `
      <div class="data-item">
        <div>
          <div class="title"><span class="badge badge-blue">ID:${v.id}</span> ${esc(v.veiculo.toUpperCase())}</div>
          <div class="subtitle">📍 ${esc(v.localizacao)} · ⛽ ${v.combustivel}% · 🔋 ${esc(v.bateria)} · 🌡️ ${esc(v.radiador)} · ⚡ ${esc(v.vela)}${v.observacoes ? ' · 📝 ' + esc(v.observacoes) : ''}</div>
        </div>
      </div>
    `).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

async function submitVeiculo() {
  const usuario = document.getElementById('veiculo-usuario').value.trim();
  const veiculo = document.getElementById('veiculo-nome').value.trim();
  const x = document.getElementById('veiculo-x').value;
  const y = document.getElementById('veiculo-y').value;
  const obs = document.getElementById('veiculo-obs').value.trim();
  if (!usuario || !veiculo || !x || !y) return toast('Preenche todos os campos obrigatórios.', 'error');
  try {
    const res = await api('/frota/registrar', {
      method: 'POST',
      body: JSON.stringify({ usuario, veiculo, x: Number(x), y: Number(y), observacao: obs }),
    });
    if (res.success) {
      toast(`${veiculo} registado em (${x}, ${y})!`);
      closeModals();
      loadFrota();
      ['veiculo-nome','veiculo-x','veiculo-y','veiculo-obs'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

async function submitPeca() {
  const usuario = document.getElementById('peca-usuario').value.trim();
  const idVeiculo = document.getElementById('peca-id').value;
  const peca = document.getElementById('peca-tipo').value;
  const estado = document.getElementById('peca-estado').value.trim();
  if (!usuario || !idVeiculo || !peca || !estado) return toast('Preenche todos os campos.', 'error');
  try {
    const res = await api('/frota/peca', {
      method: 'POST',
      body: JSON.stringify({ usuario, idVeiculo: Number(idVeiculo), peca, estado }),
    });
    if (res.success) {
      toast(`Peça ${peca} atualizada para "${estado}"!`);
      closeModals();
      loadFrota();
      ['peca-id','peca-estado'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('peca-tipo').value = '';
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  MISSÕES
// ═══════════════════════════════════════════════════════════
async function loadMissoes() {
  const user = document.getElementById('missoes-user').value.trim();
  const container = document.getElementById('missoes-list');
  if (!user) return toast('Indica o teu username.', 'error');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api(`/missoes/${encodeURIComponent(user)}`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Nenhuma missão ativa.</div>';
    container.innerHTML = res.data.map((m) => {
      const badge = m.status === 'ATIVA' ? 'badge-green' : m.status === 'ANDAMENTO' ? 'badge-yellow' : 'badge-red';
      return `
        <div class="data-item">
          <div>
            <div class="title"><span class="badge ${badge}">${m.status}</span> <span class="badge badge-blue">ID:${m.id}</span> ${esc(m.descricao)}</div>
            <div class="subtitle">💰 ${m.recompensa_texto} · Autor: ${esc(m.autor)}${m.designado ? ' · Designado: ' + esc(m.designado) : ''} · ${fmtDate(m.data)}</div>
          </div>
          <div class="actions">
            ${m.status === 'ATIVA' ? `<button class="btn-sm btn-success" onclick="quickAceitarMissao('${user}', ${m.id})">Aceitar</button>` : ''}
            ${m.status === 'ANDAMENTO' ? `<button class="btn-sm btn-primary" onclick="quickConcluirMissao('${user}', ${m.id})">Concluir</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

async function submitMissao() {
  const autor = document.getElementById('missao-autor').value.trim();
  const nome = document.getElementById('missao-nome').value.trim() || 'Operação de Campo';
  const descricao = document.getElementById('missao-desc').value.trim();
  const recompensaValor = document.getElementById('missao-recompensa').value;
  if (!autor || !descricao || !recompensaValor) return toast('Preenche todos os campos obrigatórios.', 'error');
  try {
    const res = await api('/missoes', {
      method: 'POST',
      body: JSON.stringify({ nome, descricao, recompensaValor: Number(recompensaValor), autor }),
    });
    if (res.success) {
      toast('Missão criada!');
      closeModals();
      loadMissoes();
      ['missao-nome','missao-desc','missao-recompensa'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

async function quickAceitarMissao(usuario, id) {
  try {
    const res = await api('/missoes/aceitar', { method: 'POST', body: JSON.stringify({ id, usuario }) });
    if (res.success) { toast(`Missão #${id} aceite!`); loadMissoes(); }
    else toast(res.error, 'error');
  } catch { toast('Erro de ligação.', 'error'); }
}

async function quickConcluirMissao(usuario, id) {
  try {
    const res = await api('/missoes/concluir', { method: 'POST', body: JSON.stringify({ id, usuario }) });
    if (res.success) { toast(`Missão #${id} concluída!`); loadMissoes(); }
    else toast(res.error, 'error');
  } catch { toast('Erro de ligação.', 'error'); }
}

async function loadRanking() {
  const user = document.getElementById('missoes-user').value.trim();
  const container = document.getElementById('ranking-list');
  if (!user) return toast('Indica o teu username primeiro.', 'error');
  container.innerHTML = '<div class="empty">A carregar ranking...</div>';
  try {
    const res = await api(`/ranking/${encodeURIComponent(user)}`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Sem pontos registados.</div>';
    container.innerHTML = '<h3 style="margin-bottom:0.75rem">🏆 Ranking do Clã</h3>' +
      res.data.map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
        return `
          <div class="data-item">
            <div>
              <div class="title">${medal} ${esc(r.usuario)} <span class="badge badge-purple">${esc(r.patente)}</span></div>
              <div class="subtitle">${r.pontos} pontos</div>
            </div>
          </div>
        `;
      }).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

// ═══════════════════════════════════════════════════════════
//  BASES
// ═══════════════════════════════════════════════════════════
async function loadBases() {
  const user = document.getElementById('bases-user').value.trim();
  const container = document.getElementById('bases-list');
  if (!user) return toast('Indica o teu username.', 'error');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api(`/bases/${encodeURIComponent(user)}`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Nenhuma base registada.</div>';
    container.innerHTML = res.data.map((b) => {
      const url = `https://izurvive.com/chernarusplussatmap/#location=${b.coord_x};${b.coord_y};8`;
      return `
        <div class="data-item">
          <div>
            <div class="title">📍 ${esc(b.nome.toUpperCase())}</div>
            <div class="subtitle">X: ${esc(b.coord_x)} · Y: ${esc(b.coord_y)} · Por ${esc(b.criado_por)}</div>
          </div>
          <a href="${url}" target="_blank" class="btn-sm" style="text-decoration:none">🗺️ Mapa</a>
        </div>
      `;
    }).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

async function submitBase() {
  const usuario = document.getElementById('base-usuario').value.trim();
  const nome = document.getElementById('base-nome').value.trim();
  const coordX = document.getElementById('base-x').value.trim();
  const coordY = document.getElementById('base-y').value.trim();
  if (!usuario || !nome || !coordX || !coordY) return toast('Preenche todos os campos.', 'error');
  try {
    const res = await api('/bases', {
      method: 'POST',
      body: JSON.stringify({ usuario, nome, coordX, coordY }),
    });
    if (res.success) {
      toast(`Base "${nome}" registada!`);
      closeModals();
      loadBases();
      ['base-nome','base-x','base-y'].forEach(id => document.getElementById(id).value = '');
    } else {
      toast(res.error, 'error');
    }
  } catch { toast('Erro de ligação.', 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  AUDITORIA
// ═══════════════════════════════════════════════════════════
async function loadAuditoria() {
  const user = document.getElementById('auditoria-user').value.trim();
  const container = document.getElementById('auditoria-list');
  if (!user) return toast('Indica o teu username.', 'error');
  container.innerHTML = '<div class="empty">A carregar...</div>';
  try {
    const res = await api(`/auditoria/${encodeURIComponent(user)}?limite=20`);
    if (!res.success) return container.innerHTML = `<div class="empty">${res.error}</div>`;
    if (!res.data?.length) return container.innerHTML = '<div class="empty">Nenhum registo encontrado.</div>';
    container.innerHTML = res.data.map((l) => {
      const badge = l.acao === 'DEPÓSITO' ? 'badge-green' : l.acao === 'RETIRADA' ? 'badge-red' : 'badge-blue';
      return `
        <div class="data-item">
          <div>
            <div class="title"><span class="badge ${badge}">${esc(l.acao)}</span> ${esc(l.detalhes)}</div>
            <div class="subtitle">Por ${esc(l.usuario)} · ${fmtDate(l.data)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch { container.innerHTML = '<div class="empty">Erro ao carregar.</div>'; }
}

// ═══════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════
function esc(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(dateStr); }
}

// ═══════════════════════════════════════════════════════════
//  CHAT UNIFICADO (SSE — Server-Sent Events)
// ═══════════════════════════════════════════════════════════

function initChat() {
  const statusDot = document.getElementById('chatStatusDot');
  const statusText = document.getElementById('chatStatusText');

  // Conectar ao stream SSE
  eventSource = new EventSource(`${API}/chat/stream`);

  eventSource.onopen = () => {
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Conectado — mensagens em tempo real';
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') return; // heartbeat
      if (data.type === 'history') {
        // Carregar histórico
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        data.messages.forEach((msg) => appendChatMessage(msg));
        scrollChatToBottom();
      }
      if (data.type === 'message') {
        appendChatMessage(data.message);
        scrollChatToBottom();
      }
    } catch { /* ignorar parse errors */ }
  };

  eventSource.onerror = () => {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Desconectado — a tentar reconectar...';
    // O EventSource tenta reconectar automaticamente
  };
}

function appendChatMessage(msg) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${msg.source}`;
  const time = fmtDate(msg.timestamp);
  const sourceLabel = msg.source === 'web' ? '🌐 Web' : '🎮 Discord';
  div.innerHTML = `
    <div class="meta">${sourceLabel} · ${esc(msg.username)} · ${time}</div>
    <div class="content">${esc(msg.content)}</div>
  `;
  container.appendChild(div);
}

function scrollChatToBottom() {
  const container = document.getElementById('chatMessages');
  if (container) container.scrollTop = container.scrollHeight;
}

async function sendChat() {
  const usernameInput = document.getElementById('chatUsername');
  const input = document.getElementById('chatInput');
  const username = usernameInput.value.trim();
  const content = input.value.trim();

  if (!username) {
    toast('Indica o teu username.', 'error');
    return;
  }
  if (!content) return;

  try {
    await api('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ username, content }),
    });
    input.value = '';
  } catch {
    toast('Erro ao enviar mensagem.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICAÇÕES EM TEMPO REAL (SSE)
// ═══════════════════════════════════════════════════════════

let notifEventSource = null;
let notifCount = 0;

function initNotifications() {
  const statusDot = document.getElementById('chatStatusDot');
  const notifList = document.getElementById('notifications-list');

  // Conectar ao stream de notificações (reutiliza o mesmo SSE do chat)
  // Usamos um EventSource separado para notificações
  notifEventSource = new EventSource(`${API}/notifications/stream`);

  notifEventSource.onopen = () => {
    console.log('[Notificações] Conectado');
  };

  notifEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') return;
      if (data.type === 'notification') {
        addNotification(data.notification);
      }
      if (data.type === 'activity') {
        // Atualizar painel de atividade recente
        loadRecentActivity();
      }
    } catch { /* ignorar */ }
  };

  notifEventSource.onerror = () => {
    console.log('[Notificações] Erro — a reconectar...');
  };
}

function addNotification(notif) {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  // Remover mensagem "sem notificações" se existir
  const empty = container.querySelector('.empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = `notif-item ${notif.level || 'new'}`;
  const icon = notif.level === 'warning' ? '⚠️' : notif.level === 'info' ? 'ℹ️' : '🔔';
  div.innerHTML = `${icon} <span>${esc(notif.message)}</span> <span style="margin-left:auto;color:var(--text-dim);font-size:0.7rem;">${fmtDate(notif.timestamp)}</span>`;
  container.insertBefore(div, container.firstChild);

  // Limitar a 20 notificações
  while (container.children.length > 20) {
    container.removeChild(container.lastChild);
  }

  // Atualizar contador
  notifCount++;
  const badge = document.getElementById('notif-count');
  if (badge) {
    badge.textContent = notifCount;
    badge.style.display = 'inline';
  }
}
