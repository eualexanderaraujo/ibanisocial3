export interface CelulaRow {
  id_celula: string;
  nome_celula: string;
  rede: string;
  lider: string;
  telefone_lider: string;
}

export type CelulaInput = Omit<CelulaRow, 'id_celula'>;
