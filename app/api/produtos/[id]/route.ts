import { NextRequest, NextResponse } from 'next/server';
import { updateProduto } from '@/lib/produtosSheets';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const row = await updateProduto(params.id, body);
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[PUT /api/produtos/[id]]', err);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}
