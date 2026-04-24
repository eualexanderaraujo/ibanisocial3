import { NextRequest, NextResponse } from 'next/server';
import { getDoacoes, appendDoacao } from '@/lib/doacoesSheets';

export async function GET() {
  try {
    return NextResponse.json(await getDoacoes());
  } catch (err) {
    console.error('[GET /api/doacoes]', err);
    return NextResponse.json({ error: 'Erro ao buscar doações' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id_produto || !body.celula || !body.rede || !body.quantidade_kg) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }
    return NextResponse.json(await appendDoacao(body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/doacoes]', err);
    return NextResponse.json({ error: 'Erro ao registrar doação' }, { status: 500 });
  }
}
