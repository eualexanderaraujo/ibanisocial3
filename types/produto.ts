export interface ProdutoRow {
  id_produto: string;
  nome_produto: string;
  unidade: string;
  ativo: string;
  adultos: number;
  kids: number;
}

export type ProdutoInput = Omit<ProdutoRow, 'id_produto'>;
