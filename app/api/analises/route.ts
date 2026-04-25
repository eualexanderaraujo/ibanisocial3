import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { getDoacoes } from '@/lib/doacoesSheets';

function parseMonth(dateStr: string): string {
  if (!dateStr) return 'Sem data';
  // Format: DD/MM/YYYY, HH:mm or ISO
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})/);
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}`;
  return 'Sem data';
}

function monthLabel(key: string): string {
  if (key === 'Sem data') return key;
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
}

function countBy<T>(arr: T[], keyFn: (item: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const key = keyFn(item) || 'Não informado';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

function sumBy<T>(arr: T[], keyFn: (item: T) => string, valueFn: (item: T) => number): { label: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const key = keyFn(item) || 'Não informado';
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => ({ label, total: Math.round(total * 10) / 10 }));
}

export async function GET() {
  try {
    const [pedidos, doacoes] = await Promise.all([getRows(), getDoacoes()]);

    // ── DOAÇÕES ────────────────────────────────────────────────────
    const totalKgDoado = doacoes.reduce((s, d) => s + Number(d.quantidade_kg ?? 0), 0);

    // kg por mês
    const kgPorMesMap = new Map<string, number>();
    for (const d of doacoes) {
      // doacoes doesn't have date — we'll group by rede for now; month would need date col
      const key = parseMonth(''); // placeholder – no date on doacoes
      kgPorMesMap.set(key, (kgPorMesMap.get(key) ?? 0) + Number(d.quantidade_kg ?? 0));
    }

    // kg por rede
    const kgPorRede = sumBy(doacoes, d => d.rede, d => Number(d.quantidade_kg ?? 0));

    // kg por celula
    const kgPorCelula = sumBy(doacoes, d => d.celula, d => Number(d.quantidade_kg ?? 0)).slice(0, 12);

    // produtos mais doados
    const produtosMaisDoados = sumBy(doacoes, d => d.nome_produto, d => Number(d.quantidade_kg ?? 0));
    const top5Doados = produtosMaisDoados.slice(0, 5);
    const bottom5Doados = [...produtosMaisDoados].reverse().slice(0, 5);

    // ── PEDIDOS / CADASTROS ────────────────────────────────────────
    const totalFamilias = pedidos.length;
    const totalPessoas = pedidos.reduce((s, p) => s + (p.total_pessoas ?? 0), 0);
    const totalCriancas = pedidos.reduce((s, p) => s + (p.criancas ?? 0), 0);
    const totalIdosos = pedidos.reduce((s, p) => s + (p.idosos ?? 0), 0);
    const semRenda = pedidos.filter(p => p.faixa_renda?.toLowerCase().includes('sem renda')).length;

    // tipo cesta
    const tipoCestaCounts = countBy(pedidos, p => p.tipo_cesta ?? 'Não informado');

    // problemas sociais mais comuns
    const problemasMap = new Map<string, number>();
    for (const p of pedidos) {
      for (const prob of (p.prioridade_motivos ?? [])) {
        // use raw problemas array (stored pipe-separated and parsed)
      }
      if (Array.isArray(p.problemas)) {
        for (const prob of p.problemas) {
          if (prob) problemasMap.set(prob, (problemasMap.get(prob) ?? 0) + 1);
        }
      }
    }
    const problemasSociais = Array.from(problemasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    // tipo de renda
    const tipoRenda = countBy(pedidos, p => p.tipo_renda ?? '');

    // faixa de renda
    const faixaRenda = countBy(pedidos, p => p.faixa_renda ?? '');

    // faixa etária (derivada da composição familiar)
    const faixaEtaria = [
      { label: 'Crianças', total: totalCriancas },
      { label: 'Adolescentes', total: pedidos.reduce((s, p) => s + (p.adolescentes ?? 0), 0) },
      { label: 'Adultos', total: pedidos.reduce((s, p) => s + (p.adultos ?? 0), 0) },
      { label: 'Idosos', total: totalIdosos },
    ];

    // histórico mensal de pedidos
    const histMap = new Map<string, number>();
    for (const p of pedidos) {
      const key = parseMonth(p.data ?? '');
      histMap.set(key, (histMap.get(key) ?? 0) + 1);
    }
    const historicoPedidos = Array.from(histMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, count]) => ({ periodo: monthLabel(key), count }));

    // por rede (pedidos)
    const pedidosPorRede = countBy(pedidos, p => p.rede ?? '');

    // prioridade
    const prioridadeCounts = countBy(pedidos, p => p.prioridade_label ?? 'Baixa');

    // status
    const statusCounts = countBy(pedidos, p => p.status ?? 'novo');

    return NextResponse.json({
      doacoes: {
        totalKgDoado: Math.round(totalKgDoado * 10) / 10,
        kgPorRede,
        kgPorCelula,
        produtosMaisDoados: top5Doados,
        produtosMenosDoados: bottom5Doados,
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
