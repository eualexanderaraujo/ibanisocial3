import { NextRequest, NextResponse } from 'next/server';
import { getCelulas, appendCelula } from '@/lib/celulaSheets';

export async function GET() {
  try {
    return NextResponse.json(await getCelulas());
  } catch (err) {
    console.error('[GET /api/celulas]', err);
    return NextResponse.json({ error: 'Erro ao buscar células' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome_celula || !body.rede) return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    return NextResponse.json(await appendCelula(body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/celulas]', err);
    return NextResponse.json({ error: 'Erro ao criar célula' }, { status: 500 });
  }
}
