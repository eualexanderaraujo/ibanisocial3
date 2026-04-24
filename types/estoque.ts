export interface EstoqueRow {
  id_estoque: string;
  nome_produto: string;
  quantidade_estoque_kg: number;
  quantidade_reservada_kg: number;
  saldo_kg: number;
  observacao: string;
}

export type EstoqueInput = Omit<EstoqueRow, 'id_estoque'>;
