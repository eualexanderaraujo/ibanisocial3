'use client';
import { useState, useEffect } from 'react';
import { CelulaRow } from '@/types/celula';

const REDES = ['Azul', 'Vermelha', 'Verde', 'Amarela', 'Branca', 'Laranja', 'Roxa', 'Outra'];
const BLANK = { nome_celula: '', rede: 'Azul', lider: '', telefone_lider: '' };

export default function CelulasPage() {
  const [rows, setRows] = useState<CelulaRow[]>([]);
  const [editMap, setEditMap] = useState<Record<string, CelulaRow>>({});
  const [newRow, setNewRow] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/celulas').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      const m: Record<string, CelulaRow> = {};
      arr.forEach((r: CelulaRow) => { m[r.id_celula] = { ...r }; });
      setEditMap(m);
      setLoading(false);
    });
  }, []);

  const handleSave = async (id: string) => {
    setSaving(id);
    const data = editMap[id];
    const res = await fetch(`/api/celulas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      const updated = await res.json();
      setRows(rows.map(r => r.id_celula === id ? updated : r));
    }
    setSaving(null);
  };

  const handleCreate = async () => {
    if (!newRow.nome_celula || !newRow.lider) { alert('Nome e líder são obrigatórios.'); return; }
    const res = await fetch('/api/celulas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
    if (res.ok) {
      const created = await res.json();
      setRows([...rows, created]);
      setEditMap({ ...editMap, [created.id_celula]: { ...created } });
      setNewRow({ ...BLANK });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Carregando células...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl font-bold mb-1">Células</h1>
        <p className="text-orange-100 text-sm">Base de células para doações e pedidos. Edição inline.</p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <th className="p-4 border-b">Nome da Célula</th>
              <th className="p-4 border-b">Rede</th>
              <th className="p-4 border-b">Líder</th>
              <th className="p-4 border-b">Tel. Líder</th>
              <th className="p-4 border-b">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(row => {
              const edit = editMap[row.id_celula] ?? row;
              const changed = JSON.stringify(edit) !== JSON.stringify(row);
              return (
                <tr key={row.id_celula} className="hover:bg-gray-50">
                  {(['nome_celula', 'lider', 'telefone_lider'] as const).map(f => (
                    f === 'nome_celula' ? (
                      <td key={f} className="p-2">
                        <input className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none" value={edit[f]} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, [f]: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                      </td>
                    ) : null
                  ))}
                  <td className="p-2">
                    <select className="w-full p-2 text-sm border rounded-lg bg-white" value={edit.rede} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, rede: e.target.value } })}>
                      {REDES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none" value={edit.lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                  <td className="p-2"><input className="w-full p-2 text-sm border rounded-lg focus:ring-orange-400 focus:outline-none" value={edit.telefone_lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, telefone_lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                  <td className="p-2">
                    {changed && <button onClick={() => handleSave(row.id_celula)} disabled={saving === row.id_celula} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{saving === row.id_celula ? '...' : 'Salvar'}</button>}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-orange-50/60 border-t-4 border-orange-200">
              <td className="p-2"><input className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="Nome da célula" value={newRow.nome_celula} onChange={e => setNewRow({ ...newRow, nome_celula: e.target.value })} /></td>
              <td className="p-2"><select className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" value={newRow.rede} onChange={e => setNewRow({ ...newRow, rede: e.target.value })}>{REDES.map(r => <option key={r}>{r}</option>)}</select></td>
              <td className="p-2"><input className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="Nome do líder" value={newRow.lider} onChange={e => setNewRow({ ...newRow, lider: e.target.value })} /></td>
              <td className="p-2"><input className="w-full p-2 text-sm border-2 border-orange-300 rounded-lg bg-white" placeholder="(99) 99999-9999" value={newRow.telefone_lider} onChange={e => setNewRow({ ...newRow, telefone_lider: e.target.value })} /></td>
              <td className="p-2"><button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full">+ Adicionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
