import { NextResponse } from 'next/server';
import { deletePedidoRow, getRows } from '@/lib/googleSheets';
import { estornarReservaEstoquePorPedido } from '@/lib/estoqueSheets';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. Buscar o pedido para saber o tipo_cesta antes de deletar
    const rows = await getRows();
    const pedido = rows.find(r => r.id_pedido === id);

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    // 2. Estornar reserva de estoque
    // Nota: O tipo_cesta no CadastroRow pode ser 'Adulto' ou 'Kids'
    await estornarReservaEstoquePorPedido(pedido.tipo_cesta);

    // 3. Deletar a linha do pedido
    const success = await deletePedidoRow(id);

    if (!success) {
      return NextResponse.json({ error: 'Falha ao deletar pedido.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Pedido excluído e estoque estornado com sucesso.' });
  } catch (err) {
    console.error('[DELETE /api/pedidos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno ao processar exclusão.' }, { status: 500 });
  }
}
