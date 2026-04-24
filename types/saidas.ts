export interface SaidaRow {
  id: string;
  cesta_basica: number;
  celula: string;
  lider: string;
  beneficiado: string;
  tipo: 'ADULTO' | 'KIDS';
  retirado_por: string;
  entregue_por: string;
  data: string;
  link_pedido: string;
  status: 'pendente' | 'entregue';
}

export type SaidaInput = Pick<SaidaRow, 'link_pedido' | 'beneficiado' | 'celula' | 'lider' | 'tipo'>;
export type SaidaUpdate = Pick<SaidaRow, 'retirado_por' | 'entregue_por'>;
