import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { CadastroRow } from '@/types/cadastro';

export async function GET() {
  try {
    const rows: CadastroRow[] = await getRows();

    const totalFamilias = rows.length;
    const totalPessoas = rows.reduce((s, r) => s + r.total_pessoas, 0);
    const totalCriancas = rows.reduce((s, r) => s + r.criancas, 0);
    const semRenda = rows.filter((r) => r.faixa_renda === 'Sem renda').length;

    const porRede = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.rede] = (acc[r.rede] ?? 0) + 1;
      return acc;
    }, {});

    const porFaixaRenda = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.faixa_renda] = (acc[r.faixa_renda] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalFamilias,
      totalPessoas,
      totalCriancas,
      semRenda,
      porRede: Object.entries(porRede).map(([rede, count]) => ({ rede, count })),
      porFaixaRenda: Object.entries(porFaixaRenda).map(([faixa, count]) => ({ faixa, count })),
      recentes: rows.slice(-10).reverse(),
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
  }
}
