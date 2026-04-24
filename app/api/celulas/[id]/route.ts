import { NextRequest, NextResponse } from 'next/server';
import { updateCelula } from '@/lib/celulaSheets';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const row = await updateCelula(params.id, body);
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[PUT /api/celulas/[id]]', err);
    return NextResponse.json({ error: 'Erro ao atualizar célula' }, { status: 500 });
  }
}
