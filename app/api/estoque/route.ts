import { NextRequest, NextResponse } from 'next/server';
import { getEstoque, upsertEstoque } from '@/lib/estoqueSheets';

export async function GET() {
  try {
    return NextResponse.json(await getEstoque());
  } catch (err) {
    console.error('[GET /api/estoque]', err);
    return NextResponse.json({ error: 'Erro ao buscar estoque' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome_produto) return NextResponse.json({ error: 'Produto obrigatório' }, { status: 400 });
    return NextResponse.json(await upsertEstoque(body), { status: 200 });
  } catch (err) {
    console.error('[POST /api/estoque]', err);
    return NextResponse.json({ error: 'Erro ao atualizar estoque' }, { status: 500 });
  }
}
