export interface EstoqueRow {
  id_estoque: string;
  id_produto: string;
  nome_produto: string;
  quantidade_kg: number;
  data_atualizacao: string;
  observacao: string;
}

export type EstoqueInput = Omit<EstoqueRow, 'id_estoque' | 'nome_produto' | 'data_atualizacao'>;
