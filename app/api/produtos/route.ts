import { NextRequest, NextResponse } from 'next/server';
import { getProdutos, appendProduto } from '@/lib/produtosSheets';

export async function GET() {
  try {
    return NextResponse.json(await getProdutos());
  } catch (err) {
    console.error('[GET /api/produtos]', err);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome_produto) return NextResponse.json({ error: 'Nome do produto é obrigatório' }, { status: 400 });
    
    const produto = await appendProduto({ 
      nome_produto: body.nome_produto, 
      adultos: Number(body.adultos ?? 0), 
      kids: Number(body.kids ?? 0),
      unidade: body.unidade ?? 'kg',
      ativo: body.ativo ?? 'Sim'
    });
    
    return NextResponse.json(produto, { status: 201 });
  } catch (err) {
    console.error('[POST /api/produtos]', err);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
