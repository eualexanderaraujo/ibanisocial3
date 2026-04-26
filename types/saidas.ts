export interface SaidaRow {
  id: string;
  cesta_basica: number;
  celula: string;
  lider: string;
  beneficiado: string;
  tipo: 'ADULTO' | 'KIDS';
  entregue_por: string;
  data_entrega: string;
  id_pedido: string;
  status: 'Pendente' | 'Entregue';
}

export type SaidaInput = Pick<SaidaRow, 'id_pedido' | 'beneficiado' | 'celula' | 'lider' | 'tipo' | 'entregue_por' | 'status'>;
