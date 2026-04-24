export interface ProdutoRow {
  id_produto: string;
  nome_produto: string;
  quantidade_kg: number;
  tipo_cesta: string;
}

export type ProdutoInput = Omit<ProdutoRow, 'id_produto'>;
