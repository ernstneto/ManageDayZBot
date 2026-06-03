// ============================================================
// API Types — Request/Response types for the REST API
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Clan ────────────────────────────────────────────────
export interface CreateClaBody {
  nome: string;
  tag?: string;
  descricao?: string;
}

// ── Member ──────────────────────────────────────────────
export interface AlistarMembroBody {
  usuario: string;
  nomeCla: string;
}

export interface PromoverMembroBody {
  autor: string;
  alvo: string;
  patente: string;
}

// ── Stock ───────────────────────────────────────────────
export interface DepositarItemBody {
  usuario: string;
  item: string;
  quantidade: number;
  local: string;
}

export interface RetirarItemBody {
  usuario: string;
  idItem: number;
}

// ── Vehicle ─────────────────────────────────────────────
export interface RegistrarVeiculoBody {
  usuario: string;
  veiculo: string;
  x: number;
  y: number;
  observacao?: string;
}

export interface AtualizarPecaBody {
  usuario: string;
  peca: 'bateria' | 'radiador' | 'vela' | 'combustivel';
  estado: string;
}

// ── Mission ─────────────────────────────────────────────
export interface CriarMissaoBody {
  nome?: string;
  descricao: string;
  recompensaValor: number;
  autor: string;
}

// ── Base ────────────────────────────────────────────────
export interface SalvarBaseBody {
  usuario: string;
  nome: string;
  coordX: string;
  coordY: string;
}
