import { NextRequest, NextResponse } from 'next/server';
import { updateSaidaRow } from '@/lib/saidasSheets';
import { SaidaUpdate } from '@/types/saidas';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body: SaidaUpdate = await req.json();
    const { id } = params;

    const row = await updateSaidaRow(id, body);
    if (!row) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, row });
  } catch (err) {
    console.error('[PUT /api/saidas/[id]]', err);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}
