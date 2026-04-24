'use client';
import { useState, useEffect } from 'react';
import { ProdutoRow } from '@/types/produto';

const BLANK = { nome_produto: '', unidade: 'kg' as 'kg' | 'un', ativo: true, adultos_kg: 0, kids_kg: 0 };

export default function ProdutosPage() {
  const [rows, setRows] = useState<ProdutoRow[]>([]);
  const [editMap, setEditMap] = useState<Record<string, ProdutoRow>>({});
  const [newRow, setNewRow] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProdutos = () => {
    setLoading(true);
    fetch('/api/produtos').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      const m: Record<string, ProdutoRow> = {};
      arr.forEach((r: ProdutoRow) => { m[r.id_produto] = { ...r }; });
      setEditMap(m);
      setLoading(false);
    });
  };

  useEffect(() => { fetchProdutos(); }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editMap[id]),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows(rows.map(r => r.id_produto === id ? updated : r));
      setEditMap(prev => ({ ...prev, [id]: updated }));
    }
    setSaving(null);
  };

  const handleCreate = async () => {
    if (!newRow.nome_produto) { alert('Nome é obrigatório'); return; }
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow),
    });
    if (res.ok) {
      const created = await res.json();
      setRows([...rows, created]);
      setEditMap({ ...editMap, [created.id_produto]: { ...created } });
      setNewRow({ ...BLANK });
    }
  };

  const handleSeed = async () => {
    if (!confirm('Isso vai popular/atualizar todos os produtos com as quantidades padrão (Kids e Adulto). Deseja continuar?')) return;
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await fetch('/api/produtos/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMsg({ type: 'success', text: `✅ Produtos atualizados: ${data.updated} | Criados: ${data.created}` });
        fetchProdutos();
      } else {
        setSeedMsg({ type: 'error', text: `❌ Erro: ${data.error}` });
      }
    } catch {
      setSeedMsg({ type: 'error', text: '❌ Falha na requisição' });
    } finally {
      setSeeding(false);
    }
  };

  const updateEdit = (id: string, field: keyof ProdutoRow, value: string | boolean | number) => {
    setEditMap(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const isChanged = (id: string) => {
    const orig = rows.find(r => r.id_produto === id);
    return orig ? JSON.stringify(editMap[id]) !== JSON.stringify(orig) : false;
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Carregando produtos...</div>;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Produtos</h1>
          <p className="text-orange-100 text-sm">Catálogo de itens e quantidades padrão por tipo de cesta.</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="bg-white text-orange-600 font-bold px-4 py-2 rounded-xl text-sm shadow hover:bg-orange-50 transition disabled:opacity-60 whitespace-nowrap"
        >
          {seeding ? '⏳ Populando...' : '📦 Popular Quantidades Padrão'}
        </button>
      </div>

      {/* Seed feedback */}
      {seedMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${seedMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {seedMsg.text}
        </div>
      )}

      {/* Legenda */}
      <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
        <strong>ℹ️ Como funciona:</strong> As colunas <em>Adulto (kg)</em> e <em>Kids (kg)</em> definem a quantidade reservada em estoque por produto quando um novo pedido é registrado. Use o botão <strong>"Popular Quantidades Padrão"</strong> para configurar os valores canônicos de uma vez.
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <th className="p-4 border-b">Produto</th>
              <th className="p-4 border-b text-center">Unidade</th>
              <th className="p-4 border-b text-center">Ativo</th>
              <th className="p-4 border-b text-right text-orange-600">Adulto (kg)</th>
              <th className="p-4 border-b text-right text-blue-600">Kids (kg)</th>
              <th className="p-4 border-b text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => {
              const edit = editMap[row.id_produto] ?? row;
              const changed = isChanged(row.id_produto);
              return (
                <tr key={row.id_produto} className={`hover:bg-gray-50 ${!row.ativo ? 'opacity-50' : ''}`}>
                  {/* Nome */}
                  <td className="p-2">
                    <input
                      className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none"
                      value={edit.nome_produto}
                      onChange={e => updateEdit(row.id_produto, 'nome_produto', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_produto)}
                    />
                  </td>
                  {/* Unidade */}
                  <td className="p-2 text-center">
                    <select
                      className="p-2 text-sm border rounded-lg bg-white"
                      value={edit.unidade}
                      onChange={e => updateEdit(row.id_produto, 'unidade', e.target.value)}
                    >
                      <option value="kg">kg</option>
                      <option value="un">un</option>
                    </select>
                  </td>
                  {/* Ativo */}
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={edit.ativo}
                      className="w-4 h-4 accent-orange-500"
                      onChange={e => updateEdit(row.id_produto, 'ativo', e.target.checked)}
                    />
                  </td>
                  {/* Adulto */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border rounded-lg text-right focus:ring-orange-400 focus:outline-none"
                      value={edit.adultos_kg ?? 0}
                      onChange={e => updateEdit(row.id_produto, 'adultos_kg', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {/* Kids */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border rounded-lg text-right focus:ring-blue-400 focus:outline-none"
                      value={edit.kids_kg ?? 0}
                      onChange={e => updateEdit(row.id_produto, 'kids_kg', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {/* Ação */}
                  <td className="p-2 text-center">
                    {changed && (
                      <button
                        onClick={() => handleSave(row.id_produto)}
                        disabled={saving === row.id_produto}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        {saving === row.id_produto ? '...' : 'Salvar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Linha de adição */}
            <tr className="bg-orange-50/60 border-t-4 border-orange-200">
              <td className="p-2">
                <input
                  className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white"
                  placeholder="Ex: Arroz, Feijão..."
                  value={newRow.nome_produto}
                  onChange={e => setNewRow({ ...newRow, nome_produto: e.target.value })}
                />
              </td>
              <td className="p-2">
                <select
                  className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white"
                  value={newRow.unidade}
                  onChange={e => setNewRow({ ...newRow, unidade: e.target.value as 'kg' | 'un' })}
                >
                  <option value="kg">kg</option>
                  <option value="un">un</option>
                </select>
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={newRow.ativo}
                  className="w-4 h-4 accent-orange-500"
                  onChange={e => setNewRow({ ...newRow, ativo: e.target.checked })}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg text-right"
                  placeholder="0"
                  value={newRow.adultos_kg}
                  onChange={e => setNewRow({ ...newRow, adultos_kg: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg text-right"
                  placeholder="0"
                  value={newRow.kids_kg}
                  onChange={e => setNewRow({ ...newRow, kids_kg: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td className="p-2">
                <button
                  onClick={handleCreate}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full"
                >
                  + Adicionar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
