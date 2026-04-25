'use client';
import { useState, useEffect } from 'react';
import { CelulaRow } from '@/types/celula';
import { 
  Network, 
  Search, 
  RefreshCw, 
  Plus, 
  Save, 
  Users, 
  Map
} from 'lucide-react';

const REDES = ['Azul', 'Vermelha', 'Verde', 'Amarela', 'Branca', 'Laranja', 'Roxa', 'Outra'];
const BLANK = { nome_celula: '', rede: 'Azul', lider: '', telefone_lider: '', supervisor: '', telefone_supervisor: '', email: '' };

export default function CelulasPage() {
  const [rows, setRows] = useState<CelulaRow[]>([]);
  const [editMap, setEditMap] = useState<Record<string, CelulaRow>>({});
  const [newRow, setNewRow] = useState({ ...BLANK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCelulas();
  }, []);

  const fetchCelulas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/celulas');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      const m: Record<string, CelulaRow> = {};
      arr.forEach((r: CelulaRow) => { m[r.id_celula] = { ...r }; });
      setEditMap(m);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    try {
      const data = editMap[id];
      const res = await fetch(`/api/celulas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) {
        const updated = await res.json();
        setRows(rows.map(r => r.id_celula === id ? updated : r));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newRow.nome_celula || !newRow.lider) { alert('Nome da célula e líder são obrigatórios.'); return; }
    setSaving('new');
    try {
      const res = await fetch('/api/celulas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) });
      if (res.ok) {
        const created = await res.json();
        setRows([...rows, created]);
        setEditMap({ ...editMap, [created.id_celula]: { ...created } });
        setNewRow({ ...BLANK });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const filteredRows = rows.filter(item => 
    item.nome_celula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rede.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCelulas = filteredRows.length;
  const redesAtivas = new Set(filteredRows.map(r => r.rede)).size;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Carregando células...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 pb-20">
      {/* Header Premium */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
                <Network className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Gestão de Células</h1>
                <p className="text-slate-400 mt-1 font-medium">Base de células, líderes e redes para o sistema de doações.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Total de Células</span>
                <span className="text-white text-2xl font-black">{totalCelulas}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest block mb-1">Redes Ativas</span>
                <span className="text-orange-500 text-2xl font-black">{redesAtivas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-2 lg:px-6 -mt-8">
        {/* Filtros e Ações */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por célula, líder ou rede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-900/10 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-700"
            />
          </div>
          <button 
            onClick={fetchCelulas}
            className="px-6 py-4 bg-white text-orange-600 font-bold rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 border border-orange-200"
          >
            <RefreshCw className="w-5 h-5" />
            Sincronizar
          </button>
        </div>

        {/* Lista de Células - Modo Desktop */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="px-4 py-4 w-48">Nome da Célula</th>
                <th className="px-4 py-4 w-32">Rede</th>
                <th className="px-4 py-4 w-48">Líder</th>
                <th className="px-4 py-4 w-32">Tel. Líder</th>
                <th className="px-4 py-4 w-48">Supervisor</th>
                <th className="px-4 py-4 w-32">Tel. Supervisor</th>
                <th className="px-4 py-4 min-w-[200px]">E-mail</th>
                <th className="px-4 py-4 text-center w-24">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Row Nova Célula (Fixo no topo da tabela) */}
              <tr className="bg-orange-50/60 border-b-4 border-orange-100">
                <td className="p-2"><input className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="Nova célula" value={newRow.nome_celula} onChange={e => setNewRow({ ...newRow, nome_celula: e.target.value })} /></td>
                <td className="p-2"><select className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none font-medium" value={newRow.rede} onChange={e => setNewRow({ ...newRow, rede: e.target.value })}>{REDES.map(r => <option key={r}>{r}</option>)}</select></td>
                <td className="p-2"><input className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="Nome do líder" value={newRow.lider} onChange={e => setNewRow({ ...newRow, lider: e.target.value })} /></td>
                <td className="p-2"><input className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="(00) 00000-0000" value={newRow.telefone_lider} onChange={e => setNewRow({ ...newRow, telefone_lider: e.target.value })} /></td>
                <td className="p-2"><input className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="Nome do supervisor" value={newRow.supervisor} onChange={e => setNewRow({ ...newRow, supervisor: e.target.value })} /></td>
                <td className="p-2"><input className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="(00) 00000-0000" value={newRow.telefone_supervisor} onChange={e => setNewRow({ ...newRow, telefone_supervisor: e.target.value })} /></td>
                <td className="p-2"><input type="email" className="w-full px-3 py-2 text-sm border border-orange-200 focus:border-orange-500 rounded-lg bg-white shadow-sm outline-none placeholder-gray-400 font-medium" placeholder="email@exemplo.com" value={newRow.email} onChange={e => setNewRow({ ...newRow, email: e.target.value })} /></td>
                <td className="p-2 text-center">
                  <button onClick={handleCreate} disabled={saving === 'new'} className="bg-orange-600 hover:bg-orange-700 text-white w-full h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50">
                    {saving === 'new' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1"><Plus className="w-4 h-4" /> Add</span>}
                  </button>
                </td>
              </tr>

              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Network className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhuma célula encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const edit = editMap[row.id_celula] ?? row;
                  const changed = JSON.stringify(edit) !== JSON.stringify(row);
                  
                  return (
                    <tr key={row.id_celula} className={`group transition-colors hover:bg-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`}>
                      <td className="p-2"><input className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all font-semibold text-gray-700" value={edit.nome_celula} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, nome_celula: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2"><select className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-600" value={edit.rede} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, rede: e.target.value } })}>{REDES.map(r => <option key={r}>{r}</option>)}</select></td>
                      <td className="p-2"><input className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-600" value={edit.lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2"><input className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-500 font-mono" value={edit.telefone_lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, telefone_lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2"><input className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-600" value={edit.supervisor} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, supervisor: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2"><input className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-500 font-mono" value={edit.telefone_supervisor} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, telefone_supervisor: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2"><input type="email" className="w-full px-3 py-1.5 text-sm bg-transparent border border-transparent focus:border-orange-300 focus:bg-white hover:border-gray-200 rounded outline-none transition-all text-gray-500" value={edit.email} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, email: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} /></td>
                      <td className="p-2 text-center h-full align-middle">
                        {changed && (
                          <button onClick={() => handleSave(row.id_celula)} disabled={saving === row.id_celula} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full h-8 flex items-center justify-center rounded-md text-[10px] uppercase font-black tracking-wider transition-colors shadow-sm disabled:opacity-50">
                            {saving === row.id_celula ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span className="flex items-center gap-1"><Save className="w-3 h-3" /> Salvar</span>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Lista de Células - Modo Mobile/Tablet */}
        <div className="lg:hidden flex flex-col gap-6">
          {/* Card Nova Célula */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/10 border border-orange-200 overflow-hidden">
            <div className="bg-orange-500 p-4">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nova Célula
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Nome da Célula</label>
                <input className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-semibold text-gray-800 transition-all" placeholder="Ex: Célula Esperança" value={newRow.nome_celula} onChange={e => setNewRow({ ...newRow, nome_celula: e.target.value })} />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Rede</label>
                <select className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none font-semibold text-gray-800 transition-all appearance-none" value={newRow.rede} onChange={e => setNewRow({ ...newRow, rede: e.target.value })}>{REDES.map(r => <option key={r}>{r}</option>)}</select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Líder</label>
                  <input className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-medium text-gray-800 transition-all" placeholder="Nome" value={newRow.lider} onChange={e => setNewRow({ ...newRow, lider: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Tel. Líder</label>
                  <input className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-mono text-gray-800 transition-all" placeholder="(00) 00000" value={newRow.telefone_lider} onChange={e => setNewRow({ ...newRow, telefone_lider: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Supervisor</label>
                  <input className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-medium text-gray-800 transition-all" placeholder="Nome" value={newRow.supervisor} onChange={e => setNewRow({ ...newRow, supervisor: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">Tel. Superv.</label>
                  <input className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-mono text-gray-800 transition-all" placeholder="(00) 00000" value={newRow.telefone_supervisor} onChange={e => setNewRow({ ...newRow, telefone_supervisor: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5 block">E-mail</label>
                <input type="email" className="w-full px-4 py-3 text-sm border border-gray-300 focus:border-orange-500 rounded-xl bg-slate-100 focus:bg-white shadow-sm outline-none placeholder-gray-400 font-medium text-gray-800 transition-all" placeholder="email@exemplo.com" value={newRow.email} onChange={e => setNewRow({ ...newRow, email: e.target.value })} />
              </div>

              <button onClick={handleCreate} disabled={saving === 'new'} className="bg-orange-600 hover:bg-orange-700 text-white w-full py-4 flex items-center justify-center rounded-xl text-sm font-black tracking-wide transition-colors shadow-lg shadow-orange-600/20 disabled:opacity-50 mt-4">
                {saving === 'new' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> CADASTRAR CÉLULA</span>}
              </button>
            </div>
          </div>

          {/* Cards das Células */}
          <div className="space-y-4">
            {filteredRows.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-gray-200 shadow-md">
                <Network className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Nenhuma célula encontrada.</p>
              </div>
            ) : (
              filteredRows.map((row) => {
                const edit = editMap[row.id_celula] ?? row;
                const changed = JSON.stringify(edit) !== JSON.stringify(row);
                
                return (
                  <div key={row.id_celula} className="bg-white rounded-3xl shadow-lg shadow-slate-900/10 border border-gray-200 overflow-hidden transition-all hover:border-orange-300">
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Nome da Célula</label>
                        <input className="w-full px-4 py-2.5 text-base bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all font-bold text-gray-800" value={edit.nome_celula} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, nome_celula: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                      </div>
                      
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Rede</label>
                        <select className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all font-semibold text-gray-700 appearance-none" value={edit.rede} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, rede: e.target.value } })}>{REDES.map(r => <option key={r}>{r}</option>)}</select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Líder</label>
                          <input className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all text-gray-700 font-medium" value={edit.lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Tel. Líder</label>
                          <input className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all text-gray-600 font-mono" value={edit.telefone_lider} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, telefone_lider: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Supervisor</label>
                          <input className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all text-gray-700 font-medium" value={edit.supervisor} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, supervisor: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Tel. Superv.</label>
                          <input className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all text-gray-600 font-mono" value={edit.telefone_supervisor} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, telefone_supervisor: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">E-mail</label>
                        <input type="email" className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-gray-200 focus:border-orange-400 focus:bg-white hover:border-gray-300 rounded-xl outline-none transition-all text-gray-700" value={edit.email} onChange={e => setEditMap({ ...editMap, [row.id_celula]: { ...edit, email: e.target.value } })} onKeyDown={e => e.key === 'Enter' && changed && handleSave(row.id_celula)} />
                      </div>
                    </div>
                    
                    {changed && (
                      <div className="p-4 bg-orange-50 border-t border-orange-100">
                        <button onClick={() => handleSave(row.id_celula)} disabled={saving === row.id_celula} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-3 flex items-center justify-center rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50">
                          {saving === row.id_celula ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> SALVAR ALTERAÇÕES</span>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
