import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';

export async function GET() {
  try {
    const rows = await getRows();
    const familias = rows.map((row) => ({
      id: row.id_pedido,
      beneficiado: row.beneficiado,
      celula: row.celula,
      lider: row.lider,
      tipo_cesta: row.tipo_cesta,
    }));
    
    return NextResponse.json(familias);
  } catch (err) {
    console.error('[GET /api/familias]', err);
    return NextResponse.json({ error: 'Erro ao buscar familias' }, { status: 500 });
  }
}
