export interface ProdutoRow {
  id_produto: string;
  nome: string;
  unidade: 'kg' | 'un';
  ativo: boolean;
}

export type ProdutoInput = Omit<ProdutoRow, 'id_produto'>;
