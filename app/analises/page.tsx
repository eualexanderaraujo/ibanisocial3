'use client';

import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { RefreshCw, TrendingUp, Users, Package, Heart, AlertTriangle, BarChart2 } from 'lucide-react';

interface AnalisesData {
  doacoes: {
    totalKgDoado: number;
    kgPorRede: { label: string; total: number }[];
    kgPorCelula: { label: string; total: number }[];
    produtosMaisDoados: { label: string; total: number }[];
    produtosMenosDoados: { label: string; total: number }[];
    redes: string[];
    seriesSemanal: any[];
    seriesMensal: any[];
  };
  pedidos: {
    totalFamilias: number;
    totalPessoas: number;
    totalCriancas: number;
    totalIdosos: number;
    semRenda: number;
    tipoCesta: { label: string; count: number }[];
    problemasSociais: { label: string; count: number }[];
    tipoRenda: { label: string; count: number }[];
    faixaRenda: { label: string; count: number }[];
    faixaEtaria: { label: string; total: number }[];
    historicoPedidos: { periodo: string; count: number }[];
    pedidosPorRede: { label: string; count: number }[];
    prioridade: { label: string; count: number }[];
    status: { label: string; count: number }[];
  };
}

const PALETTE = ['#f97316','#3b82f6','#22c55e','#a855f7','#eab308','#ef4444','#14b8a6','#ec4899','#64748b','#f59e0b'];
const PRIORIDADE_COLORS: Record<string, string> = { Critica: '#dc2626', Alta: '#f97316', Media: '#ca8a04', Baixa: '#2563eb' };

const KPI = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-md p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
      <span className="text-orange-500">{icon}</span>
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-600">{p.name}: <span className="font-semibold text-orange-600">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function AnalisesPage() {
  const [data, setData] = useState<AnalisesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros do Gráfico de Linhas (Doações no Tempo)
  const [escalaTempo, setEscalaTempo] = useState<'semana' | 'mes'>('mes');
  const [redeFiltro, setRedeFiltro] = useState<string>('Todas');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analises');
      if (!res.ok) throw new Error('Falha ao carregar análises');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 font-medium animate-pulse">Processando análises estatísticas...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex-1 flex items-center justify-center bg-slate-100 p-8">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-xl">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 font-semibold">{error || 'Sem dados'}</p>
        <button onClick={fetchData} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">Tentar novamente</button>
      </div>
    </div>
  );

  const { doacoes, pedidos } = data;
  const pctSemRenda = pedidos.totalFamilias > 0 ? Math.round((pedidos.semRenda / pedidos.totalFamilias) * 100) : 0;

  return (
    <div className="flex-1 bg-slate-100 pb-20">
      {/* Header Premium */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
                <BarChart2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Central de Análises</h1>
                <p className="text-slate-400 mt-1 font-medium">Indicadores estatísticos de impacto social da IBANI.</p>
              </div>
            </div>
            <button onClick={fetchData} className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors">
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* ── KPIs Gerais ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPI icon={<Heart className="w-6 h-6 text-white" />} label="Total doado" value={`${doacoes.totalKgDoado} kg`} color="bg-orange-500" />
          <KPI icon={<Users className="w-6 h-6 text-white" />} label="Famílias" value={pedidos.totalFamilias} sub={`${pedidos.totalPessoas} pessoas`} color="bg-blue-500" />
          <KPI icon={<Package className="w-6 h-6 text-white" />} label="Crianças" value={pedidos.totalCriancas} color="bg-emerald-500" />
          <KPI icon={<TrendingUp className="w-6 h-6 text-white" />} label="Idosos" value={pedidos.totalIdosos} color="bg-purple-500" />
          <KPI icon={<AlertTriangle className="w-6 h-6 text-white" />} label="Sem renda" value={`${pctSemRenda}%`} sub={`${pedidos.semRenda} famílias`} color="bg-red-500" />
        </div>

        {/* ── Linhas do Tempo: Doações (kg) ─────────────────────────── */}
        <Section title="Volume de Doações no Tempo (kg)" icon={<TrendingUp className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setEscalaTempo('semana')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${escalaTempo === 'semana' ? 'bg-white text-orange-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Semanal
              </button>
              <button 
                onClick={() => setEscalaTempo('mes')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${escalaTempo === 'mes' ? 'bg-white text-orange-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mensal
              </button>
            </div>
            
            <select 
              value={redeFiltro}
              onChange={(e) => setRedeFiltro(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Todas">Todas as Redes</option>
              {doacoes.redes.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={escalaTempo === 'semana' ? doacoes.seriesSemanal : doacoes.seriesMensal} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
              
              {redeFiltro === 'Todas' ? (
                // Mostrar a linha total ou todas as redes. Mostraremos o Total em laranja forte.
                <Line type="monotone" dataKey="total" name="Total (kg)" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              ) : (
                // Mostrar apenas a rede filtrada
                <Line type="monotone" dataKey={redeFiltro} name={`${redeFiltro} (kg)`} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* ── Linha 1: Histórico + Prioridade ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Section title="Histórico Mensal de Pedidos" icon={<TrendingUp className="w-5 h-5" />}>
              {pedidos.historicoPedidos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sem dados históricos suficientes</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pedidos.historicoPedidos} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Pedidos" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>
          </div>
          <Section title="Nível de Prioridade" icon={<AlertTriangle className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pedidos.prioridade} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pedidos.prioridade.map((entry) => (
                    <Cell key={entry.label} fill={PRIORIDADE_COLORS[entry.label] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* ── Linha 2: Problemas sociais + Tipo de cesta ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Section title="Problemas Sociais Mais Frequentes" icon={<Users className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pedidos.problemasSociais.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Casos" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                    {pedidos.problemasSociais.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
          <Section title="Tipo de Cesta" icon={<Package className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pedidos.tipoCesta} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                  {pedidos.tipoCesta.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* ── Linha 3: Renda ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section title="Tipo de Renda das Famílias" icon={<TrendingUp className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pedidos.tipoRenda} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Famílias" radius={[6, 6, 0, 0]}>
                  {pedidos.tipoRenda.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Faixa de Renda" icon={<TrendingUp className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pedidos.faixaRenda} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                  {pedidos.faixaRenda.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* ── Linha 4: Faixa Etária Radar + Pedidos por Rede ────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section title="Composição Etária dos Beneficiados" icon={<Users className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={pedidos.faixaEtaria} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
                <Radar name="Pessoas" dataKey="total" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Pedidos por Rede" icon={<BarChart2 className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pedidos.pedidosPorRede} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Pedidos" radius={[6, 6, 0, 0]}>
                  {pedidos.pedidosPorRede.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* ── Linha 5: Doações por Rede + Produtos mais/menos doados ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section title="Kg Doados por Rede" icon={<Heart className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={doacoes.kgPorRede} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {doacoes.kgPorRede.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Section>
          <Section title="Produtos Mais Doados (kg)" icon={<Package className="w-5 h-5" />}>
            <div className="space-y-3">
              {doacoes.produtosMaisDoados.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Sem dados</p>
              ) : doacoes.produtosMaisDoados.map((p, i) => {
                const max = doacoes.produtosMaisDoados[0]?.total ?? 1;
                return (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate max-w-[170px]">{p.label}</span>
                      <span className="font-bold text-orange-600">{p.total} kg</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${(p.total / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
          <Section title="Produtos Menos Doados (kg)" icon={<Package className="w-5 h-5" />}>
            <div className="space-y-3">
              {doacoes.produtosMenosDoados.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Sem dados</p>
              ) : doacoes.produtosMenosDoados.map((p, i) => {
                const max = doacoes.produtosMenosDoados[0]?.total ?? 1;
                return (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate max-w-[170px]">{p.label}</span>
                      <span className="font-bold text-blue-600">{p.total} kg</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${(p.total / max) * 100}%`, background: PALETTE[(i + 5) % PALETTE.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ── Linha 6: Doações por Célula ───────────────────────────── */}
        {doacoes.kgPorCelula.length > 0 && (
          <Section title="Kg Doados por Célula (Top 12)" icon={<Heart className="w-5 h-5" />}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={doacoes.kgPorCelula} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="kg" radius={[6, 6, 0, 0]}>
                  {doacoes.kgPorCelula.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        )}

        {/* ── Rodapé Analítico ──────────────────────────────────────── */}
        <div className="bg-slate-800 rounded-2xl p-6 text-slate-400 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold mb-1">Nota Metodológica</p>
            <p>Os dados são extraídos em tempo real das planilhas Google Sheets. Os indicadores de faixa etária são derivados da composição familiar informada no cadastro. Gênero não é coletado no formulário atual.</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-slate-300 font-semibold">IbaniSocial</p>
            <p className="text-xs">IBANI Ação Social</p>
          </div>
        </div>

      </div>
    </div>
  );
}
