// ============================================================
// ManageDayzBot — Tipos e Interfaces Centralizados
// ============================================================

export interface Cla {
  id: number;
  nome: string;
  descricao: string | null;
  tag: string | null;
  data_criacao: string;
}

export interface MembroCla {
  usuario: string;
  cla_id: number;
  patente: string;
  data_entrada: string;
  pontos: number;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface InventarioItem {
  id: number;
  cla_id: number;
  item: string;
  quantidade: number;
  categoria_id: number;
  local_armazenamento: string | null;
}

export interface Veiculo {
  id: number;
  cla_id: number;
  veiculo: string;
  localizacao: string;
  combustivel: number;
  radiador: string;
  bateria: string;
  vela: string;
  observacoes: string | null;
}

export interface Localizacao {
  id: number;
  cla_id: number;
  nome: string;
  tipo: 'BASE' | 'BUNKER' | 'STASH' | 'POSTO';
  localizacao: string;
  descricao: string | null;
}

export interface Missao {
  id: number;
  cla_id: number;
  nome: string;
  descricao: string;
  recompensa_texto: string;
  recompensa_valor: number;
  status: 'ATIVA' | 'ANDAMENTO' | 'CONCLUÍDA';
  designado: string | null;
  autor: string;
  data: string;
}

export interface AuditoriaEntry {
  id: number;
  cla_id: number;
  usuario: string;
  acao: string;
  detalhes: string;
  data: string;
}

export interface EstoqueItem {
  id: number;
  cla_id: number;
  usuario: string;
  item: string;
  quantidade: number;
  local: string;
  data: string;
}

export interface BaseEntry {
  id: number;
  cla_id: number;
  nome: string;
  coord_x: string;
  coord_y: string;
  criado_por: string;
}

// Tipos auxiliares para patentes
export type Patente =
  | 'Recruta'
  | 'Soldado'
  | 'Sargento'
  | 'Cabo'
  | 'Major'
  | 'Capitão'
  | 'Oficial'
  | 'General';

export const PATENTES_VALIDAS: Patente[] = [
  'Recruta', 'Soldado', 'Sargento', 'Cabo',
  'Major', 'Capitão', 'Oficial', 'General',
];

export const PATENTES_OFICIAL: Patente[] = [
  'Sargento', 'Cabo', 'Major', 'Capitão', 'Oficial', 'General',
];
