export interface ProdutoRow {
  id_produto: string;
  nome_produto: string;
  unidade: 'kg' | 'un';
  ativo: boolean;
  adultos_kg: number;
  kids_kg: number;
}

export type ProdutoInput = Omit<ProdutoRow, 'id_produto'>;
