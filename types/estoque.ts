export interface EstoqueRow {
  id_estoque: string;
  nome_produto: string;
  quantidade_kg: number;
  data_atualizacao: string;
  observacao: string;
}

export type EstoqueInput = Omit<EstoqueRow, 'id_estoque' | 'data_atualizacao'>;
