'use client';
import { useState, useEffect } from 'react';
import { EstoqueRow } from '@/types/estoque';
import { ProdutoRow } from '@/types/produto';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueRow[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [editMap, setEditMap] = useState<Record<string, { quantidade_kg: number; observacao: string }>>({});
  const [newRow, setNewRow] = useState({ nome_produto: '', quantidade_kg: 0, observacao: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/estoque').then(r => r.json()), fetch('/api/produtos').then(r => r.json())])
      .then(([est, prod]) => {
        const esArr = Array.isArray(est) ? est : [];
        setEstoque(esArr);
        setProdutos(Array.isArray(prod) ? prod.filter((p: ProdutoRow) => p.ativo) : []);
        const m: Record<string, any> = {};
        esArr.forEach((e: EstoqueRow) => { m[e.id_estoque] = { quantidade_kg: e.quantidade_kg, observacao: e.observacao }; });
        setEditMap(m);
        setLoading(false);
      });
  }, []);

  const handleSave = async (row: EstoqueRow) => {
    setSaving(row.id_estoque);
    const data = editMap[row.id_estoque];
    const res = await fetch('/api/estoque', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_produto: row.nome_produto, ...data }) });
    if (res.ok) {
      const updated = await res.json();
      setEstoque(estoque.map(e => e.id_estoque === row.id_estoque ? updated : e));
    }
    setSaving(null);
  };

  const handleCreate = async () => {
    if (!newRow.nome_produto) { alert('Selecione um produto'); return; }
    const res = await fetch('/api/estoque', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
    if (res.ok) {
      const result = await res.json();
      // Upsert local state
      const existing = estoque.find(e => e.nome_produto === newRow.nome_produto);
      if (existing) {
        setEstoque(estoque.map(e => e.nome_produto === newRow.nome_produto ? result : e));
      } else {
        setEstoque([...estoque, result]);
        setEditMap({ ...editMap, [result.id_estoque]: { quantidade_kg: result.quantidade_kg, observacao: result.observacao } });
      }
      setNewRow({ nome_produto: '', quantidade_kg: 0, observacao: '' });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Carregando estoque...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl font-bold mb-1">Estoque</h1>
        <p className="text-orange-100 text-sm">Controle de quantidade disponível por produto. Edição inline.</p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <th className="p-4 border-b">Produto</th>
              <th className="p-4 border-b w-32">Físico (kg)</th>
              <th className="p-4 border-b w-32">Reservado (kg)</th>
              <th className="p-4 border-b w-32">Saldo (kg)</th>
              <th className="p-4 border-b">Observação</th>
              <th className="p-4 border-b w-40">Atualizado em</th>
              <th className="p-4 border-b">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {estoque.map(row => {
              const edit = editMap[row.id_estoque] ?? { quantidade_kg: row.quantidade_kg, observacao: row.observacao };
              const changed = edit.quantidade_kg !== row.quantidade_kg || edit.observacao !== row.observacao;
              const low = row.saldo_kg < 5;
              return (
                <tr key={row.id_estoque} className={`hover:bg-gray-50 ${low ? 'bg-red-50/40' : ''}`}>
                  <td className="p-4 font-semibold text-gray-800 flex items-center gap-2">
                    {low && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" title="Saldo baixo" />}
                    {row.nome_produto}
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" step="0.1" className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none text-right font-bold" value={edit.quantidade_kg} onChange={e => setEditMap({ ...editMap, [row.id_estoque]: { ...edit, quantidade_kg: Number(e.target.value) } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row)} />
                  </td>
                  <td className="p-4 text-sm text-right font-medium text-blue-600 bg-blue-50/30">
                    {(row.quantidade_solicitada_kg || 0).toFixed(1)}
                  </td>
                  <td className={`p-4 text-sm text-right font-bold ${(row.saldo_kg || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(row.saldo_kg || 0).toFixed(1)}
                  </td>
                  <td className="p-2"><input className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none" value={edit.observacao} onChange={e => setEditMap({ ...editMap, [row.id_estoque]: { ...edit, observacao: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row)} /></td>
                  <td className="p-4 text-xs text-gray-500">{row.data_atualizacao}</td>
                  <td className="p-2">
                    {changed && <button onClick={() => handleSave(row)} disabled={saving === row.id_estoque} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{saving === row.id_estoque ? '...' : 'Salvar'}</button>}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-orange-50/60 border-t-4 border-orange-200">
              <td className="p-2">
                <select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={newRow.nome_produto} onChange={e => setNewRow({ ...newRow, nome_produto: e.target.value })}>
                  <option value="">Selecione o produto...</option>
                  {produtos.filter(p => !estoque.find(e => e.nome_produto === p.nome_produto)).map(p => <option key={p.id_produto} value={p.nome_produto}>{p.nome_produto}</option>)}
                </select>
              </td>
              <td className="p-2"><input type="number" min="0" step="0.1" className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white text-right font-bold" placeholder="0" value={newRow.quantidade_kg || ''} onChange={e => setNewRow({ ...newRow, quantidade_kg: Number(e.target.value) })} /></td>
              <td className="p-4 text-center text-gray-400">-</td>
              <td className="p-4 text-center text-gray-400">-</td>
              <td className="p-2"><input className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="Observação..." value={newRow.observacao} onChange={e => setNewRow({ ...newRow, observacao: e.target.value })} /></td>
              <td className="p-4 text-xs text-gray-400 italic">Hoje</td>
              <td className="p-2"><button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full">+ Adicionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
