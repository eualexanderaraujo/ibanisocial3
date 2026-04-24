export type CaseStatus = 'novo' | 'em_analise' | 'aprovado' | 'entregue' | 'indeferido';
export type PriorityLabel = 'Baixa' | 'Media' | 'Alta' | 'Critica';

export interface CadastroInput {
  email: string;
  lider: string;
  telefone_lider: string;
  supervisor: string;
  telefone_supervisor: string;
  rede: string;
  celula: string;
  beneficiado: string;
  telefone: string;
  total_pessoas: number;
  adultos: number;
  criancas: number;
  adolescentes: number;
  idosos: number;
  trabalham: number;
  tipo_renda: string;
  faixa_renda: string;
  problemas: string[];
  observacao: string;
}

export interface PriorityResult {
  score: number;
  label: PriorityLabel;
  reasons: string[];
}

export interface CadastroRow extends CadastroInput {
  id_pedido: string;
  protocolo: string;
  tipo_cesta: 'Kids' | 'Adulto';
  data: string;
  prioridade_score: number;
  prioridade_label: PriorityLabel;
  prioridade_motivos: string[];
  status: CaseStatus;
  observacoes_internas: string;
  atualizado_em: string;
  atualizado_em_iso: string;
}

export interface DashboardFilters {
  rede?: string;
  celula?: string;
  periodo?: string;
  status?: CaseStatus | 'todos';
}
