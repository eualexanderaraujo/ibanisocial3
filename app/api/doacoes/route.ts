import { NextRequest, NextResponse } from 'next/server';
import { getDoacoes, appendDoacao } from '@/lib/doacoesSheets';
import { v4 as uuidv4 } from 'uuid';

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

    // ── V2: lote de itens ─────────────────────────────────────────────
    // body = { celula, rede, itens: [{ nome_produto, quantidade_kg, observacao }] }
    if (body.itens && Array.isArray(body.itens)) {
      if (!body.celula || !body.rede) {
        return NextResponse.json({ error: 'Célula e Rede são obrigatórios' }, { status: 400 });
      }
      if (body.itens.length === 0) {
        return NextResponse.json({ error: 'Inclua ao menos um item na doação' }, { status: 400 });
      }

      const sharedId = uuidv4().slice(0, 8).toUpperCase();
      const results = [];
      for (const item of body.itens as { nome_produto: string; quantidade_kg: number; observacao?: string }[]) {
        if (!item.nome_produto || !item.quantidade_kg) continue;
        const created = await appendDoacao({
          celula: body.celula,
          rede: body.rede,
          nome_produto: item.nome_produto,
          quantidade_kg: item.quantidade_kg,
          observacao: item.observacao ?? '',
        }, sharedId);
        results.push(created);
      }

      if (results.length === 0) {
        return NextResponse.json({ error: 'Nenhum item válido enviado' }, { status: 400 });
      }

      return NextResponse.json(results, { status: 201 });
    }

    // ── V1 legado: item único ─────────────────────────────────────────
    if (!body.nome_produto || !body.celula || !body.rede || !body.quantidade_kg) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }
    return NextResponse.json(await appendDoacao(body), { status: 201 });
  } catch (err) {
    console.error('[POST /api/doacoes]', err);
    return NextResponse.json({ error: 'Erro ao registrar doação' }, { status: 500 });
  }
}
