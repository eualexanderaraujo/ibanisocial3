'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CASE_STATUSES, CASE_STATUS_LABELS, PRIORITY_COLORS, REDE_COLORS } from '@/lib/schema';
import { parseBRDate } from '@/lib/dateUtils';
import { CadastroRow, CaseStatus } from '@/types/cadastro';

interface DashboardResponse {
  authEnabled: boolean;
  summary: {
    totalFamilias: number;
    totalPessoas: number;
    totalCriancas: number;
    semRenda: number;
    criticos: number;
  };
  filters: {
    redes: string[];
    celulas: string[];
    periodos: string[];
  };
  charts: {
    porRede: { rede: string; count: number; color: string }[];
    porStatus: { status: string; label: string; count: number }[];
    historicoMensal: { periodo: string; total: number }[];
  };
  urgentes: CadastroRow[];
  rows: CadastroRow[];
}

const STATUS_COLORS: Record<CaseStatus, string> = {
  novo: '#2563eb',
  em_analise: '#ca8a04',
  aprovado: '#16a34a',
  entregue: '#0f766e',
  indeferido: '#dc2626',
};

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((value) => `${value}${value}`).join('')
    : normalized;
  const numeric = Number.parseInt(safe, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatMonthKey(value: string) {
  if (!value) return 'Sem data';
  const date = parseBRDate(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const date = parseBRDate(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function buildCsv(rows: CadastroRow[]) {
  const headers = [
    'protocolo',
    'id',
    'data',
    'rede',
    'celula',
    'familia',
    'total_pessoas',
    'criancas',
    'idosos',
    'faixa_renda',
    'prioridade_label',
    'prioridade_score',
    'status',
    'observacoes_internas',
  ];

  const escapeValue = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.protocolo,
      row.id_pedido,
      row.data,
      row.rede,
      row.celula,
      row.beneficiado,
      row.total_pessoas,
      row.criancas,
      row.idosos,
      row.faixa_renda,
      row.prioridade_label,
      row.prioridade_score,
      CASE_STATUS_LABELS[row.status],
      row.observacoes_internas,
    ]
      .map(escapeValue)
      .join(';')
  );

  return [headers.join(';'), ...lines].join('\n');
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
      <div
        className="w-12 h-12 rounded-2xl mb-4"
        style={{ backgroundColor: toRgba(color, 0.14) }}
      />
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-extrabold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [selectedRede, setSelectedRede] = useState('todas');
  const [selectedCelula, setSelectedCelula] = useState('todas');
  const [selectedPeriodo, setSelectedPeriodo] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | CaseStatus>('todos');
  const [draftStatus, setDraftStatus] = useState<Record<string, CaseStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard', { credentials: 'include' });
      if (response.status === 401) {
        setNeedsAuth(true);
        setData(null);
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao carregar dados');
      }

      setNeedsAuth(false);
      setData(payload);
      setDraftStatus(
        payload.rows.reduce((acc: Record<string, CaseStatus>, row: CadastroRow) => {
          acc[row.id_pedido] = row.status;
          return acc;
        }, {})
      );
      setDraftNotes(
        payload.rows.reduce((acc: Record<string, string>, row: CadastroRow) => {
          acc[row.id_pedido] = row.observacoes_internas ?? '';
          return acc;
        }, {})
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const authenticate = async () => {
    setAuthSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessKey }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel autenticar');
      }

      setAccessKey('');
      await fetchDashboard();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel autenticar');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch('/api/dashboard/session', {
      method: 'DELETE',
      credentials: 'include',
    });
    setData(null);
    setNeedsAuth(true);
  };

  const rows = data?.rows ?? [];
  const filteredRows = rows
    .filter((row) => selectedRede === 'todas' || row.rede === selectedRede)
    .filter((row) => selectedCelula === 'todas' || row.celula === selectedCelula)
    .filter((row) => selectedPeriodo === 'todos' || formatMonthKey(row.data) === selectedPeriodo)
    .filter((row) => selectedStatus === 'todos' || row.status === selectedStatus);

  const filteredSummary = {
    totalFamilias: filteredRows.length,
    totalPessoas: filteredRows.reduce((sum, row) => sum + row.total_pessoas, 0),
    totalCriancas: filteredRows.reduce((sum, row) => sum + row.criancas, 0),
    semRenda: filteredRows.filter((row) => row.faixa_renda === 'Sem renda').length,
    criticos: filteredRows.filter((row) => row.prioridade_label === 'Critica').length,
  };

  const porRede = Object.entries(
    filteredRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.rede] = (acc[row.rede] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([rede, count]) => ({ rede, count, color: REDE_COLORS[rede] ?? REDE_COLORS.Outra }))
    .sort((a, b) => b.count - a.count);

  const porStatus = Object.entries(
    filteredRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([status, count]) => ({
      status: status as CaseStatus,
      label: CASE_STATUS_LABELS[status as CaseStatus],
      count,
      color: STATUS_COLORS[status as CaseStatus],
    }))
    .sort((a, b) => b.count - a.count);

  const historicoMensal = Object.entries(
    filteredRows.reduce<Record<string, { total: number; reference: number }>>((acc, row) => {
      const key = formatMonthKey(row.data);
      const reference = parseBRDate(row.data).getTime() || 0;
      if (!acc[key]) acc[key] = { total: 0, reference };
      acc[key].total += 1;
      acc[key].reference = Math.min(acc[key].reference, reference || acc[key].reference);
      return acc;
    }, {})
  )
    .map(([periodo, value]) => ({ periodo, total: value.total, reference: value.reference }))
    .sort((a, b) => a.reference - b.reference);

  const urgentes = [...filteredRows]
    .sort((a, b) => b.prioridade_score - a.prioridade_score || (parseBRDate(b.data).getTime() - parseBRDate(a.data).getTime()))
    .slice(0, 5);

  const exportCsv = () => {
    const csv = buildCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ibasocial-dashboard.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveCase = async (row: CadastroRow) => {
    setSavingId(row.id_pedido);
    setError('');

    try {
      const response = await fetch(`/api/cadastro/${row.id_pedido}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: draftStatus[row.id_pedido] ?? row.status,
          observacoes_internas: draftNotes[row.id_pedido] ?? '',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao salvar caso');
      }

      setData((current) => {
        if (!current) return current;
        const nextRows = current.rows.map((currentRow) => (currentRow.id_pedido === row.id_pedido ? payload.row : currentRow));
        return { ...current, rows: nextRows };
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao salvar caso');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-semibold">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 max-w-md w-full">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-600 mb-3">Area interna</p>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Acesso ao dashboard</h1>
          <p className="text-gray-500 text-sm mb-6">
            Informe a chave configurada em <code>DASHBOARD_ACCESS_KEY</code> para visualizar dados sensiveis.
          </p>
          <label htmlFor="accessKey" className="text-sm font-semibold text-gray-700">
            Chave de acesso
          </label>
          <input
            id="accessKey"
            type="password"
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Digite a chave"
          />
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={authenticate}
              disabled={authSubmitting || !accessKey.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60"
            >
              {authSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-center font-semibold text-gray-600 hover:bg-slate-100"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-sm">
          <p className="text-gray-700 font-semibold mb-4">{error}</p>
          <Link href="/" className="text-brand-600 font-semibold hover:underline">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <Link href="/" className="text-brand-600 text-sm font-semibold hover:underline">Voltar ao inicio</Link>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Dashboard social</h1>
            <p className="text-gray-500 text-sm">Triagem automatica, filtros operacionais e acompanhamento de casos.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="px-5 py-3 rounded-xl border-2 border-brand-200 text-brand-700 font-semibold hover:bg-brand-50"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
            >
              Atualizar dados
            </button>
            {data?.authEnabled ? (
              <button
                type="button"
                onClick={logout}
                className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                Sair
              </button>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Rede</label>
              <select
                value={selectedRede}
                onChange={(event) => setSelectedRede(event.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100"
              >
                <option value="todas">Todas as redes</option>
                {data?.filters.redes.map((rede) => (
                  <option key={rede} value={rede}>{rede}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Celula</label>
              <select
                value={selectedCelula}
                onChange={(event) => setSelectedCelula(event.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100"
              >
                <option value="todas">Todas as celulas</option>
                {data?.filters.celulas.map((celula) => (
                  <option key={celula} value={celula}>{celula}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Periodo</label>
              <select
                value={selectedPeriodo}
                onChange={(event) => setSelectedPeriodo(event.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100"
              >
                <option value="todos">Todo o periodo</option>
                {data?.filters.periodos.map((periodo) => (
                  <option key={periodo} value={periodo}>{periodo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as 'todos' | CaseStatus)}
                className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100"
              >
                <option value="todos">Todos os status</option>
                {CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>{CASE_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <KpiCard label="Familias filtradas" value={filteredSummary.totalFamilias} color="#2563eb" />
          <KpiCard label="Total de pessoas" value={filteredSummary.totalPessoas} color="#0f766e" />
          <KpiCard label="Criancas" value={filteredSummary.totalCriancas} color="#ca8a04" />
          <KpiCard label="Sem renda" value={filteredSummary.semRenda} color="#dc2626" />
          <KpiCard label="Prioridade critica" value={filteredSummary.criticos} color="#b91c1c" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 xl:col-span-2">
            <h2 className="font-bold text-gray-800 mb-4">Familias por rede</h2>
            {porRede.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum dado disponivel</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={porRede}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="rede"
                    width={120}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip formatter={(value) => [value, 'Familias']} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                    {porRede.map((entry) => (
                      <Cell key={entry.rede} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4">Distribuicao por status</h2>
            {porStatus.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum dado disponivel</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={porStatus}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {porStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Casos']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 xl:col-span-2">
            <h2 className="font-bold text-gray-800 mb-4">Historico mensal</h2>
            {historicoMensal.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum dado disponivel</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={historicoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip formatter={(value) => [value, 'Cadastros']} />
                  <Bar dataKey="total" fill="#334155" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4">Ranking de maior urgencia</h2>
            <div className="space-y-3">
              {urgentes.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum caso disponivel.</p>
              ) : (
                urgentes.map((row) => (
                  <div key={row.id_pedido} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{row.beneficiado}</p>
                        <p className="text-xs text-gray-500">{row.rede} / {row.celula}</p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          color: PRIORITY_COLORS[row.prioridade_label],
                          backgroundColor: toRgba(PRIORITY_COLORS[row.prioridade_label], 0.14),
                        }}
                      >
                        {row.prioridade_label} ({row.prioridade_score})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{row.prioridade_motivos.slice(0, 2).join(' | ') || 'Sem motivadores registrados.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">Entregas por Pedido</h2>
              <p className="text-sm text-gray-500">{filteredRows.length} pedido(s) encontrado(s)</p>
            </div>
          </div>
          {filteredRows.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Nenhum pedido encontrado para os filtros selecionados.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRows.map((row) => {
                const redeColor = REDE_COLORS[row.rede] ?? REDE_COLORS.Outra;
                const priorityColor = PRIORITY_COLORS[row.prioridade_label];
                const currentStatus = draftStatus[row.id_pedido] ?? row.status;

                return (
                  <div key={row.id_pedido} className="p-6">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <p className="font-mono text-xs font-bold text-brand-700">{row.protocolo}</p>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ color: redeColor, backgroundColor: toRgba(redeColor, 0.14) }}
                          >
                            {row.rede}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ color: priorityColor, backgroundColor: toRgba(priorityColor, 0.14) }}
                          >
                            {row.prioridade_label} ({row.prioridade_score})
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              color: STATUS_COLORS[currentStatus],
                              backgroundColor: toRgba(STATUS_COLORS[currentStatus], 0.14),
                            }}
                          >
                            {CASE_STATUS_LABELS[currentStatus]}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{row.beneficiado || 'Familia nao informada'}</h3>
                        <p className="text-sm font-mono text-brand-700 mt-1">Protocolo: {row.protocolo}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {row.celula} | {row.total_pessoas} pessoa(s) | {row.faixa_renda}
                        </p>
                        <p className="text-sm text-gray-500">Criancas: {row.criancas} | Idosos: {row.idosos} | Trabalhando: {row.trabalham}</p>
                        <p className="text-sm text-gray-500">Criado em: {formatDateTime(row.data)} | Atualizado em: {formatDateTime(row.data)}</p>
                        <p className="text-sm text-gray-700 mt-3">{row.observacao || 'Sem observacoes publicas.'}</p>
                        <p className="text-xs text-gray-500 mt-3">
                          Motivos da triagem: {row.prioridade_motivos.join(' | ') || 'Sem fatores adicionais.'}
                        </p>
                      </div>

                      <div className="xl:w-[340px] shrink-0">
                        <label className="text-sm font-semibold text-gray-700">Status do caso</label>
                        <select
                          value={currentStatus}
                          onChange={(event) => setDraftStatus((current) => ({ ...current, [row.id_pedido]: event.target.value as CaseStatus }))}
                          className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100"
                        >
                          {CASE_STATUSES.map((status) => (
                            <option key={status} value={status}>{CASE_STATUS_LABELS[status]}</option>
                          ))}
                        </select>

                        <label className="block text-sm font-semibold text-gray-700 mt-4">Observacoes internas</label>
                        <textarea
                          rows={5}
                          value={draftNotes[row.id_pedido] ?? ''}
                          onChange={(event) => setDraftNotes((current) => ({ ...current, [row.id_pedido]: event.target.value }))}
                          className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                          placeholder="Registre andamento, aprovacao, entrega ou justificativa."
                        />

                        <button
                          type="button"
                          onClick={() => void saveCase(row)}
                          disabled={savingId === row.id_pedido}
                          className="mt-4 w-full py-3 px-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
                        >
                          {savingId === row.id_pedido ? 'Salvando...' : 'Salvar acompanhamento'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
