'use client';
import { useState, useEffect } from 'react';
import { ProdutoRow } from '@/types/produto';

const BLANK = { nome_produto: '', unidade: 'kg' as 'kg' | 'un', ativo: true };

export default function ProdutosPage() {
  const [rows, setRows] = useState<ProdutoRow[]>([]);
  const [editMap, setEditMap] = useState<Record<string, ProdutoRow>>({});
  const [newRow, setNewRow] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/produtos').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      const m: Record<string, ProdutoRow> = {};
      arr.forEach((r: ProdutoRow) => { m[r.id_produto] = { ...r }; });
      setEditMap(m);
      setLoading(false);
    });
  }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    const res = await fetch(`/api/produtos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editMap[id]) });
    if (res.ok) {
      const updated = await res.json();
      setRows(rows.map(r => r.id_produto === id ? updated : r));
    }
    setSaving(null);
  };

  const handleCreate = async () => {
    if (!newRow.nome_produto) { alert('Nome é obrigatório'); return; }
    const res = await fetch('/api/produtos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
    if (res.ok) {
      const created = await res.json();
      setRows([...rows, created]);
      setEditMap({ ...editMap, [created.id_produto]: { ...created } });
      setNewRow({ ...BLANK });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Carregando produtos...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl font-bold mb-1">Produtos</h1>
        <p className="text-orange-100 text-sm">Catálogo de itens que compõem as cestas básicas.</p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <th className="p-4 border-b">Nome do Produto</th>
              <th className="p-4 border-b">Unidade</th>
              <th className="p-4 border-b">Ativo</th>
              <th className="p-4 border-b">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => {
              const edit = editMap[row.id_produto] ?? row;
              const changed = JSON.stringify(edit) !== JSON.stringify(row);
              return (
                <tr key={row.id_produto} className={`hover:bg-gray-50 ${!row.ativo ? 'opacity-50' : ''}`}>
                  <td className="p-2"><input className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none" value={edit.nome_produto} onChange={e => setEditMap({ ...editMap, [row.id_produto]: { ...edit, nome_produto: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_produto)} /></td>
                  <td className="p-2">
                    <select className="w-full p-2 text-sm border rounded-lg bg-white" value={edit.unidade} onChange={e => setEditMap({ ...editMap, [row.id_produto]: { ...edit, unidade: e.target.value as 'kg' | 'un' } })}>
                      <option value="kg">kg</option>
                      <option value="un">un</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={edit.ativo} className="w-4 h-4 accent-orange-500" onChange={e => setEditMap({ ...editMap, [row.id_produto]: { ...edit, ativo: e.target.checked } })} />
                  </td>
                  <td className="p-2">
                    {changed && <button onClick={() => handleSave(row.id_produto)} disabled={saving === row.id_produto} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{saving === row.id_produto ? '...' : 'Salvar'}</button>}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-orange-50/60 border-t-4 border-orange-200">
              <td className="p-2"><input className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="Ex: Arroz, Feijão..." value={newRow.nome_produto} onChange={e => setNewRow({ ...newRow, nome_produto: e.target.value })} /></td>
              <td className="p-2"><select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={newRow.unidade} onChange={e => setNewRow({ ...newRow, unidade: e.target.value as 'kg' | 'un' })}><option value="kg">kg</option><option value="un">un</option></select></td>
              <td className="p-2 text-center"><input type="checkbox" checked={newRow.ativo} className="w-4 h-4 accent-orange-500" onChange={e => setNewRow({ ...newRow, ativo: e.target.checked })} /></td>
              <td className="p-2"><button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full">+ Adicionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
