import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireDashboardAuth } from '@/lib/adminAuth';
import { updateCaseRow } from '@/lib/googleSheets';
import { CASE_STATUSES } from '@/lib/schema';

const updateSchema = z.object({
  status: z.enum(CASE_STATUSES),
  observacoes_internas: z.string().max(2000, 'Limite de 2000 caracteres').default(''),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireDashboardAuth();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await updateCaseRow(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Caso nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, row: updated });
  } catch (err) {
    console.error('[PATCH /api/cadastro/[id]]', err);
    return NextResponse.json({ error: 'Erro ao atualizar o caso' }, { status: 500 });
  }
}
