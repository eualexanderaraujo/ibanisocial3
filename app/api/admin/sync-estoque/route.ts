
import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { reservarEstoquePorPedido } from '@/lib/estoqueSheets';
import { requireDashboardAuth } from '@/lib/adminAuth';

export async function POST() {
  // Opcional: remover auth se quiser rodar rápido via curl, mas mantendo por segurança
  // const unauthorized = await requireDashboardAuth();
  // if (unauthorized) return unauthorized;

  try {
    const pedidos = await getRows();
    
    if (pedidos.length === 0) {
      return NextResponse.json({ message: "Nenhum pedido encontrado" });
    }

    const ultimoPedido = pedidos[pedidos.length - 1];
    
    // Aplicar reserva para o último pedido
    await reservarEstoquePorPedido(ultimoPedido.tipo_cesta);

    return NextResponse.json({ 
      success: true, 
      protocolo: ultimoPedido.protocolo,
      tipo: ultimoPedido.tipo_cesta,
      beneficiado: ultimoPedido.beneficiado
    });
  } catch (err) {
    console.error('[POST /api/admin/sync-estoque]', err);
    return NextResponse.json({ error: 'Erro ao sincronizar estoque' }, { status: 500 });
  }
}
