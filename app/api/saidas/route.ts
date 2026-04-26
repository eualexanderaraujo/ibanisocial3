export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createSaidaRow, getSaidasRows } from '@/lib/saidasSheets';
import { processarSaidaEstoquePorPedido } from '@/lib/estoqueSheets';
import { SaidaInput } from '@/types/saidas';

export async function GET() {
  try {
    const rows = await getSaidasRows();
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/saidas]', err);
    return NextResponse.json({ error: 'Erro ao buscar saídas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SaidaInput = await req.json();
    
    if (!body.beneficiado || !body.id_pedido || !body.celula || !body.lider || !body.tipo || !body.entregue_por) {
      return NextResponse.json({ error: 'Dados inválidos ou incompletos' }, { status: 400 });
    }

    const row = await createSaidaRow(body);
    
    // Processa a saída do estoque (baixa do físico e do reservado)
    await processarSaidaEstoquePorPedido(body.tipo);

    return NextResponse.json({ success: true, row }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/saidas]', err);
    return NextResponse.json({ error: 'Erro ao registrar saída' }, { status: 500 });
  }
}
