export interface CadastroInput {
  email: string;
  lider: string;
  telefone_lider: string;
  supervisor: string;
  telefone_supervisor: string;
  rede: string;
  celula: string;
  familia: string;
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

export interface CadastroRow extends CadastroInput {
  id: string;
  data: string;
}
