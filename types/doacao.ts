export interface DoacaoRow {
  id_doacao: string;
  data: string;
  rede: string;
  celula: string;
  id_produto: string;
  nome_produto: string;
  quantidade_kg: number;
  observacao: string;
}

export type DoacaoInput = Omit<DoacaoRow, 'id_doacao' | 'data' | 'nome_produto'>;
