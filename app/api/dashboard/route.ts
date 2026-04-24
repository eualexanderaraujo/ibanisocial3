import { NextResponse } from 'next/server';
import { requireDashboardAuth, isDashboardAuthEnabled } from '@/lib/adminAuth';
import { REDE_COLORS, getStatusLabel } from '@/lib/schema';
import { getRows } from '@/lib/googleSheets';
import { parseBRDate } from '@/lib/dateUtils';
import { CadastroRow } from '@/types/cadastro';

function getMonthKey(value: string) {
  if (!value) return 'Sem data';
  const date = parseBRDate(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function sortByNewest(a: CadastroRow, b: CadastroRow) {
  return parseBRDate(b.data).getTime() - parseBRDate(a.data).getTime();
}

export async function GET() {
  const unauthorized = await requireDashboardAuth();
  if (unauthorized) return unauthorized;

  try {
    const rows = (await getRows()).sort(sortByNewest);

    const totalFamilias = rows.length;
    const totalPessoas = rows.reduce((sum, row) => sum + row.total_pessoas, 0);
    const totalCriancas = rows.reduce((sum, row) => sum + row.criancas, 0);
    const semRenda = rows.filter((row) => row.faixa_renda === 'Sem renda').length;
    const criticos = rows.filter((row) => row.prioridade_label === 'Critica').length;

    const porRedeMap = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.rede] = (acc[row.rede] ?? 0) + 1;
      return acc;
    }, {});

    const porStatusMap = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    const historicoMensalMap = rows.reduce<Record<string, number>>((acc, row) => {
      const monthKey = getMonthKey(row.data);
      acc[monthKey] = (acc[monthKey] ?? 0) + 1;
      return acc;
    }, {});

    const porRede = Object.entries(porRedeMap)
      .map(([rede, count]) => ({ rede, count, color: REDE_COLORS[rede] ?? REDE_COLORS.Outra }))
      .sort((a, b) => b.count - a.count);

    const porStatus = Object.entries(porStatusMap)
      .map(([status, count]) => ({ status, label: getStatusLabel(status as CadastroRow['status']), count }))
      .sort((a, b) => b.count - a.count);

    const historicoMensal = Object.entries(historicoMensalMap).map(([periodo, total]) => ({ periodo, total }));

    const urgentes = [...rows]
      .sort((a, b) => b.prioridade_score - a.prioridade_score || sortByNewest(a, b))
      .slice(0, 10);

    return NextResponse.json({
      authEnabled: isDashboardAuthEnabled(),
      summary: {
        totalFamilias,
        totalPessoas,
        totalCriancas,
        semRenda,
        criticos,
      },
      filters: {
        redes: Array.from(new Set(rows.map((row) => row.rede))).sort(),
        celulas: Array.from(new Set(rows.map((row) => row.celula))).sort(),
        periodos: Array.from(new Set(rows.map((row) => getMonthKey(row.data)))),
      },
      charts: {
        porRede,
        porStatus,
        historicoMensal,
      },
      urgentes,
      rows,
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
  }
}
