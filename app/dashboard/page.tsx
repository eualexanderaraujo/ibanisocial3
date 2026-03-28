'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DashboardData {
  totalFamilias: number;
  totalPessoas: number;
  totalCriancas: number;
  semRenda: number;
  porRede: { rede: string; count: number }[];
  porFaixaRenda: { faixa: string; count: number }[];
  recentes: { id: string; data: string; familia: string; rede: string; total_pessoas: number; faixa_renda: string }[];
}

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#f59e0b', '#fbbf24', '#fcd34d'];

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-extrabold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-700 font-semibold mb-4">{error || 'Dados indisponíveis'}</p>
          <Link href="/" className="text-brand-600 font-semibold hover:underline">← Voltar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-brand-600 text-sm font-semibold hover:underline">← Início</Link>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Dashboard Social</h1>
            <p className="text-gray-500 text-sm">Visão geral dos cadastros de cestas</p>
          </div>
          <Link
            href="/cadastro"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
          >
            + Novo Cadastro
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon="👨‍👩‍👧‍👦" label="Total de Famílias" value={data.totalFamilias} color="bg-brand-50" />
          <KpiCard icon="👥" label="Total de Pessoas" value={data.totalPessoas} color="bg-orange-50" />
          <KpiCard icon="🧒" label="Total de Crianças" value={data.totalCriancas} color="bg-amber-50" />
          <KpiCard icon="⚠️" label="Sem Renda" value={data.semRenda} color="bg-red-50" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Bar chart - Por Rede */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">📡 Famílias por Rede</h2>
            {data.porRede.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.porRede} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="rede" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [v, 'Famílias']}
                  />
                  <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart - Por Faixa de Renda */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">💰 Distribuição por Renda</h2>
            {data.porFaixaRenda.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.porFaixaRenda}
                    dataKey="count"
                    nameKey="faixa"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ faixa, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.porFaixaRenda.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    formatter={(v, name) => [v, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">🕐 Cadastros Recentes</h2>
          </div>
          {data.recentes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Nenhum cadastro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Família</th>
                    <th className="px-6 py-3 text-left">Rede</th>
                    <th className="px-6 py-3 text-center">Pessoas</th>
                    <th className="px-6 py-3 text-left">Renda</th>
                    <th className="px-6 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentes.map((r, i) => (
                    <tr key={r.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-3 font-mono text-xs text-brand-600 font-bold">{r.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{r.familia}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                          {r.rede}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-gray-700">{r.total_pessoas}</td>
                      <td className="px-6 py-3 text-gray-600">{r.faixa_renda}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{r.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
