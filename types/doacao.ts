export interface DoacaoRow {
  id_doacao: string;
  rede: string;
  celula: string;
  nome_produto: string;
  quantidade_kg: number;
  observacao: string;
  data_doacao?: string;
}

export type DoacaoInput = Omit<DoacaoRow, 'id_doacao' | 'data_doacao'>;
