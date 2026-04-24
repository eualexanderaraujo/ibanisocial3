export interface EstoqueRow {
  id_estoque: string;
  nome_produto: string;
  quantidade_kg: number;
  data_atualizacao: string;
  observacao: string;
  quantidade_solicitada_kg: number;
  saldo_kg: number;
}

export type EstoqueInput = Omit<EstoqueRow, 'id_estoque' | 'data_atualizacao'>;
