export interface CelulaRow {
  id_celula: string;
  nome_celula: string;
  rede: string;
  lider: string;
  telefone_lider: string;
  supervisor: string;
  telefone_supervisor: string;
  email: string;
}

export type CelulaInput = Omit<CelulaRow, 'id_celula'>;
