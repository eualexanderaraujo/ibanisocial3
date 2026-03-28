import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { appendRow, getRows, ensureHeaders } from '@/lib/googleSheets';
import { cadastroSchema } from '@/lib/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cadastroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await ensureHeaders();
    const id = uuidv4().slice(0, 8).toUpperCase();
    await appendRow(id, parsed.data);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/cadastro]', err);
    return NextResponse.json({ error: 'Erro ao gravar os dados' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await getRows();
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[GET /api/cadastro]', err);
    return NextResponse.json({ error: 'Erro ao buscar os dados' }, { status: 500 });
  }
}
