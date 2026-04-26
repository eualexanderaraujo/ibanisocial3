import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { getDoacoes } from '@/lib/doacoesSheets';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIso(dateStr: string): string {
  if (!dateStr) return '';
  const s = dateStr.trim();
  
  // 1. Já é ISO (contém T)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
  
  // 2. Formato YYYY-MM-DD (com ou sem hora separada por espaço)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00.000Z`;
  }

  // 3. Formato BR: DD/MM/YYYY ...
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  // 4. Tenta parse nativo
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

function parseSafeNumber(val: any): number {
  if (typeof val === 'number') return val;
  const s = String(val || '0').trim().replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function isoToWeekKey(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // ISO week: YYYY-Www
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const dayOfWeek = (d.getUTCDay() + 6) % 7; // Mon=0
  const weekStart = new Date(d.getTime() - dayOfWeek * 86400000);
  const diff = weekStart.getTime() - new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 4)).getTime();
  const weekNo = Math.round(diff / 604800000) + 1;
  return `${weekStart.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isoToMonthKey(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function weekLabel(key: string): string {
  const [year, week] = key.split('-W');
  return `S${week}/${year?.slice(2)}`;
}

function monthLabel(key: string): string {
  if (!key || !key.includes('-')) return key;
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d);
}

function parseMonth(dateStr: string): string {
  const iso = getIso(dateStr);
  return isoToMonthKey(iso);
}

function countBy<T>(arr: T[], keyFn: (item: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const key = keyFn(item) || 'Não informado';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
}

function sumBy<T>(arr: T[], keyFn: (item: T) => string, valueFn: (item: T) => any): { label: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const key = keyFn(item) || 'Não informado';
    const val = parseSafeNumber(valueFn(item));
    map.set(key, (map.get(key) ?? 0) + val);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, total]) => ({ label, total: Math.round(total * 10) / 10 }));
}

// ── Time-series builder ───────────────────────────────────────────────────────

function buildTimeSeries(
  doacoes: Awaited<ReturnType<typeof getDoacoes>>,
  scale: 'semana' | 'mes',
  redes: string[]
) {
  const toKey = scale === 'semana' ? isoToWeekKey : isoToMonthKey;
  const toLabel = scale === 'semana' ? weekLabel : monthLabel;

  // Collect all time keys and per-rede totals
  const allKeys = new Set<string>();
  // Map: key -> rede -> total_kg
  const matrix: Map<string, Map<string, number>> = new Map();

  for (const d of doacoes) {
    const iso = getIso(d.data_doacao ?? '');
    if (!iso) continue;
    const key = toKey(iso);
    if (!key) continue;
    allKeys.add(key);
    if (!matrix.has(key)) matrix.set(key, new Map());
    const redeKey = d.rede || 'Sem rede';
    const inner = matrix.get(key)!;
    inner.set(redeKey, (inner.get(redeKey) ?? 0) + parseSafeNumber(d.quantidade_kg));
  }

  const sortedKeys = Array.from(allKeys).sort();

  // Build rows: [{ periodo, label, REDE_A: kg, REDE_B: kg, total: kg }]
  const rows = sortedKeys.map(key => {
    const inner = matrix.get(key) ?? new Map();
    const row: Record<string, string | number> = { key, label: toLabel(key), total: 0 };
    let total = 0;
    for (const rede of redes) {
      const val = Math.round((inner.get(rede) ?? 0) * 10) / 10;
      row[rede] = val;
      total += val;
    }
    row['total'] = Math.round(total * 10) / 10;
    return row;
  });

  return rows;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [pedidos, doacoes] = await Promise.all([getRows(), getDoacoes()]);

    // All unique redes present in doacoes
    const redesSet = new Set(doacoes.map(d => d.rede || 'Sem rede').filter(Boolean));
    const redesList = Array.from(redesSet).sort();

    // ── DOAÇÕES ────────────────────────────────────────────────────────────
    const totalKgDoado = doacoes.reduce((s, d) => s + Number(d.quantidade_kg ?? 0), 0);
    const kgPorRede = sumBy(doacoes, d => d.rede, d => Number(d.quantidade_kg ?? 0));
    const kgPorCelula = sumBy(doacoes, d => d.celula, d => Number(d.quantidade_kg ?? 0)).slice(0, 12);
    const produtosMaisDoados = sumBy(doacoes, d => d.nome_produto, d => Number(d.quantidade_kg ?? 0));
    const top5Doados = produtosMaisDoados.slice(0, 5);
    const bottom5Doados = [...produtosMaisDoados].reverse().slice(0, 5);

    // Time-series (últimas 12 semanas / 12 meses)
    const seriesSemanal = buildTimeSeries(doacoes, 'semana', redesList).slice(-14);
    const seriesMensal = buildTimeSeries(doacoes, 'mes', redesList).slice(-12);

    // ── PEDIDOS ────────────────────────────────────────────────────────────
    const totalFamilias = pedidos.length;
    const totalPessoas = pedidos.reduce((s, p) => s + (p.total_pessoas ?? 0), 0);
    const totalCriancas = pedidos.reduce((s, p) => s + (p.criancas ?? 0), 0);
    const totalIdosos = pedidos.reduce((s, p) => s + (p.idosos ?? 0), 0);
    const semRenda = pedidos.filter(p => p.faixa_renda?.toLowerCase().includes('sem renda')).length;

    const tipoCestaCounts = countBy(pedidos, p => p.tipo_cesta ?? 'Não informado');

    const problemasMap = new Map<string, number>();
    for (const p of pedidos) {
      if (Array.isArray(p.problemas)) {
        for (const prob of p.problemas) {
          if (prob) problemasMap.set(prob, (problemasMap.get(prob) ?? 0) + 1);
        }
      }
    }
    const problemasSociais = Array.from(problemasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    const tipoRenda = countBy(pedidos, p => p.tipo_renda ?? '');
    const faixaRenda = countBy(pedidos, p => p.faixa_renda ?? '');

    const faixaEtaria = [
      { label: 'Crianças', total: totalCriancas },
      { label: 'Adolescentes', total: pedidos.reduce((s, p) => s + (p.adolescentes ?? 0), 0) },
      { label: 'Adultos', total: pedidos.reduce((s, p) => s + (p.adultos ?? 0), 0) },
      { label: 'Idosos', total: totalIdosos },
    ];

    const histMap = new Map<string, number>();
    for (const p of pedidos) {
      const key = parseMonth(p.data ?? '');
      if (key) histMap.set(key, (histMap.get(key) ?? 0) + 1);
    }
    const historicoPedidos = Array.from(histMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, count]) => ({ periodo: monthLabel(key), count }));

    const pedidosPorRede = countBy(pedidos, p => p.rede ?? '');
    const prioridadeCounts = countBy(pedidos, p => p.prioridade_label ?? 'Baixa');
    const statusCounts = countBy(pedidos, p => p.status ?? 'novo');

    return NextResponse.json({
      doacoes: {
        totalKgDoado: Math.round(totalKgDoado * 10) / 10,
        kgPorRede,
        kgPorCelula,
        produtosMaisDoados: top5Doados,
        produtosMenosDoados: bottom5Doados,
        redes: redesList,
        seriesSemanal,
        seriesMensal,
      },
      pedidos: {
        totalFamilias,
        totalPessoas,
        totalCriancas,
        totalIdosos,
        semRenda,
        tipoCesta: tipoCestaCounts,
        problemasSociais,
        tipoRenda,
        faixaRenda,
        faixaEtaria,
        historicoPedidos,
        pedidosPorRede,
        prioridade: prioridadeCounts,
        status: statusCounts,
      },
    });
  } catch (error) {
    console.error('[analises] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar análises' }, { status: 500 });
  }
}
