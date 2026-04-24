'use client';
import { useState, useEffect } from 'react';
import { DoacaoRow } from '@/types/doacao';
import { ProdutoRow } from '@/types/produto';
import { CelulaRow } from '@/types/celula';

const BLANK = { rede: '', celula: '', id_produto: '', quantidade_kg: 0, observacao: '' };

export default function DoacoesPage() {
  const [doacoes, setDoacoes] = useState<DoacaoRow[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [celulas, setCelulas] = useState<CelulaRow[]>([]);
  const [newRow, setNewRow] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/doacoes').then(r => r.json()),
      fetch('/api/produtos').then(r => r.json()),
      fetch('/api/celulas').then(r => r.json()),
    ]).then(([d, p, c]) => {
      setDoacoes(Array.isArray(d) ? d : []);
      setProdutos(Array.isArray(p) ? p.filter((x: ProdutoRow) => x.ativo) : []);
      setCelulas(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const celulasFiltered = newRow.rede ? celulas.filter(c => c.rede === newRow.rede) : celulas;
  const redes = Array.from(new Set(celulas.map(c => c.rede))).sort();

  const handleCelulaChange = (id_celula: string) => {
    const cel = celulas.find(c => c.id_celula === id_celula);
    if (cel) setNewRow({ ...newRow, celula: cel.nome_celula, rede: cel.rede });
  };

  const handleCreate = async () => {
    if (!newRow.celula || !newRow.id_produto || !newRow.quantidade_kg) { alert('Preencha todos os campos obrigatórios.'); return; }
    setSubmitting(true);
    const res = await fetch('/api/doacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
    if (res.ok) {
      const created = await res.json();
      setDoacoes([created, ...doacoes]);
      setNewRow({ ...BLANK });
    } else alert('Erro ao registrar doação.');
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Carregando doações...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl font-bold mb-1">Doações</h1>
        <p className="text-orange-100 text-sm">Registro de entrada de alimentos. Célula e produto via seleção direta.</p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <th className="p-4 border-b">Data</th>
              <th className="p-4 border-b">Rede</th>
              <th className="p-4 border-b">Célula</th>
              <th className="p-4 border-b">Produto</th>
              <th className="p-4 border-b w-36">Qtd (kg)</th>
              <th className="p-4 border-b">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Nova linha sempre no topo (dentro do tbody) */}
            <tr className="bg-orange-50/60 border-b-4 border-orange-200">
              <td className="p-4 text-xs text-gray-400 italic font-semibold">Hoje</td>
              <td className="p-2">
                <select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={newRow.rede}
                  onChange={e => setNewRow({ ...newRow, rede: e.target.value, celula: '' })}>
                  <option value="">Rede...</option>
                  {redes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={celulas.find(c => c.nome_celula === newRow.celula)?.id_celula ?? ''}
                  onChange={e => handleCelulaChange(e.target.value)}>
                  <option value="">Selecione...</option>
                  {celulasFiltered.map(c => <option key={c.id_celula} value={c.id_celula}>{c.nome_celula}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={newRow.id_produto}
                  onChange={e => setNewRow({ ...newRow, id_produto: e.target.value })}>
                  <option value="">Produto...</option>
                  {produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome_produto}</option>)}
                </select>
              </td>
              <td className="p-2">
                <input type="number" min="0" step="0.1" className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white font-bold text-right" placeholder="0.0" value={newRow.quantidade_kg || ''}
                  onChange={e => setNewRow({ ...newRow, quantidade_kg: Number(e.target.value) })} />
              </td>
              <td className="p-2 flex gap-2 items-center">
                <input className="flex-1 p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="Obs. opcional..." value={newRow.observacao}
                  onChange={e => setNewRow({ ...newRow, observacao: e.target.value })} />
                <button onClick={handleCreate} disabled={submitting} className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
                  {submitting ? '...' : '+ Registrar'}
                </button>
              </td>
            </tr>
            {doacoes.map(d => (
              <tr key={d.id_doacao} className="hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{d.data}</td>
                <td className="p-4 text-sm text-gray-700">{d.rede}</td>
                <td className="p-4 text-sm text-gray-700 font-medium">{d.celula}</td>
                <td className="p-4 text-sm text-gray-800 font-semibold">{d.nome_produto}</td>
                <td className="p-4 text-sm font-bold text-green-700">{d.quantidade_kg} kg</td>
                <td className="p-4 text-sm text-gray-500">{d.observacao || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
