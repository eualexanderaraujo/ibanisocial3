import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireDashboardAuth } from '@/lib/adminAuth';
import { appendRow, getRows } from '@/lib/googleSheets';
import { cadastroSchema } from '@/lib/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cadastroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const id = uuidv4().slice(0, 8).toUpperCase();
    const row = await appendRow(id, parsed.data);

    return NextResponse.json({ success: true, id: row.id, prioridade: row.prioridade_label }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/cadastro]', err);
    return NextResponse.json({ error: 'Erro ao gravar os dados' }, { status: 500 });
  }
}

export async function GET() {
  const unauthorized = await requireDashboardAuth();
  if (unauthorized) return unauthorized;

  try {
    const rows = await getRows();
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/cadastro]', err);
    return NextResponse.json({ error: 'Erro ao buscar os dados' }, { status: 500 });
  }
}
