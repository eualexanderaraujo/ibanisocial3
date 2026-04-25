'use client';

import { useState, useEffect } from 'react';
import { SaidaRow } from '@/types/saidas';
import { 
  Truck, 
  User, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Save, 
  Search, 
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';

type Familia = { id: string; beneficiado: string; celula: string; lider: string; tipo_cesta: string };

export default function EntregasPage() {
  const [saidas, setSaidas] = useState<SaidaRow[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para a nova linha
  const [newRow, setNewRow] = useState({
    beneficiado: '',
    celula: '',
    lider: '',
    tipo: 'KIDS' as 'ADULTO' | 'KIDS',
    id_pedido: '',
  });

  // Estado de edição para cada linha
  const [editState, setEditState] = useState<Record<string, { retirado_por: string, entregue_por: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [saidasData, familiasData] = await Promise.all([
        fetch('/api/saidas').then(res => res.json()),
        fetch('/api/familias').then(res => res.json())
      ]);

      setSaidas(Array.isArray(saidasData) ? saidasData : []);
      setFamilias(Array.isArray(familiasData) ? familiasData : []);
      
      const initialEditState: any = {};
      if (Array.isArray(saidasData)) {
        saidasData.forEach((s: SaidaRow) => {
          initialEditState[s.id] = { retirado_por: s.retirado_por || '', entregue_por: s.entregue_por || '' };
        });
      }
      setEditState(initialEditState);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newRow.id_pedido) return;
    setSavingId('new');
    const payload = {
      beneficiado: newRow.beneficiado,
      celula: newRow.celula,
      lider: newRow.lider,
      tipo: newRow.tipo,
      link_pedido: newRow.id_pedido,
    };
    try {
      const res = await fetch('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        setNewRow({ beneficiado: '', celula: '', lider: '', tipo: 'KIDS', id_pedido: '' });
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id: string) => {
    setSavingId(id);
    const data = editState[id];
    try {
      const res = await fetch(`/api/saidas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const { row } = await res.json();
        setSaidas(saidas.map(s => s.id === id ? row : s));
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleBeneficiadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const familia = familias.find(f => f.beneficiado === value);
    if (familia) {
      setNewRow({
        ...newRow,
        beneficiado: familia.beneficiado,
        celula: familia.celula,
        lider: familia.lider,
        tipo: (familia.tipo_cesta === 'Kids' ? 'KIDS' : 'ADULTO'),
        id_pedido: familia.id
      });
    } else {
      setNewRow({ ...newRow, beneficiado: value, id_pedido: '' });
    }
  };

  const filteredSaidas = saidas.filter(s => 
    s.beneficiado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.celula.toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse(); // Mais recentes primeiro

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Sincronizando entregas...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 pb-20">
      {/* Header Premium */}
      <div className="relative bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-900 opacity-95"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Expedição de Cestas</h1>
                <p className="text-orange-100 mt-1 font-medium">Controle de saída e confirmação de entrega aos beneficiários.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <span className="text-orange-100 text-[10px] font-black uppercase tracking-widest block mb-1">Entregues</span>
                <span className="text-white text-2xl font-black">{saidas.filter(s => s.status === 'entregue').length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                <span className="text-orange-100 text-[10px] font-black uppercase tracking-widest block mb-1">Pendentes</span>
                <span className="text-white text-2xl font-black">{saidas.filter(s => s.status !== 'entregue').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Barra de Busca e Filtros */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-900/10 p-4 mb-8 border border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por beneficiário ou célula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Novo Registro */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 overflow-hidden border border-gray-200 sticky top-8">
              <div className="bg-orange-50 px-6 py-5 border-b border-orange-200">
                <h2 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Registrar Saída
                </h2>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Família Beneficiada</label>
                  <input 
                    list="familias-list"
                    value={newRow.beneficiado}
                    onChange={handleBeneficiadoChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                    placeholder="Nome da família..."
                  />
                  <datalist id="familias-list">
                    {familias.map(f => <option key={f.id} value={f.beneficiado}>{f.beneficiado} ({f.celula})</option>)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Célula</label>
                    <input type="text" value={newRow.celula} readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-gray-500 font-bold text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Líder</label>
                    <input type="text" value={newRow.lider} readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-gray-500 font-bold text-sm outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Cesta</label>
                  <select 
                    value={newRow.tipo}
                    onChange={e => setNewRow({...newRow, tipo: e.target.value as 'ADULTO'|'KIDS'})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white outline-none font-bold text-gray-700"
                  >
                    <option value="KIDS">KIDS</option>
                    <option value="ADULTO">ADULTO</option>
                  </select>
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={!newRow.id_pedido || savingId === 'new'}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {savingId === 'new' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  Confirmar Saída
                </button>
              </div>

              <div className="p-6 bg-slate-900 text-white">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider opacity-80">
                    Atenção: Ao registrar a saída, o estoque físico e reservado será deduzido automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Saídas */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                      <th className="px-6 py-4">Beneficiário</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Retirado por</th>
                      <th className="px-6 py-4">Entregue por</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSaidas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">Nenhum registro encontrado.</td>
                      </tr>
                    ) : (
                      filteredSaidas.map(saida => {
                        const isEntregue = saida.status === 'entregue';
                        const edit = editState[saida.id] || { retirado_por: '', entregue_por: '' };
                        const hasChanges = edit.retirado_por !== (saida.retirado_por || '') || edit.entregue_por !== (saida.entregue_por || '');

                        return (
                          <tr key={saida.id} className={`group transition-colors ${isEntregue ? 'bg-emerald-50/30' : 'hover:bg-orange-50/20'}`}>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{saida.beneficiado}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{saida.celula}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                saida.tipo === 'KIDS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}>
                                {saida.tipo}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                placeholder="Ninguém"
                                value={edit.retirado_por}
                                onChange={e => setEditState({...editState, [saida.id]: {...edit, retirado_por: e.target.value}})}
                                disabled={isEntregue}
                                className={`w-full bg-transparent border-none focus:ring-0 text-sm font-medium ${isEntregue ? 'text-gray-400' : 'text-gray-700 underline decoration-gray-200 underline-offset-4'}`}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                placeholder="Aguardando..."
                                value={edit.entregue_por}
                                onChange={e => setEditState({...editState, [saida.id]: {...edit, entregue_por: e.target.value}})}
                                disabled={isEntregue}
                                className={`w-full bg-transparent border-none focus:ring-0 text-sm font-medium ${isEntregue ? 'text-gray-400' : 'text-gray-700 underline decoration-gray-200 underline-offset-4'}`}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEntregue ? (
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Entregue
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {saida.data}
                                  </span>
                                </div>
                              ) : (
                                <span className="flex items-center gap-1 text-orange-500 font-bold text-xs uppercase tracking-wider animate-pulse">
                                  <Clock className="w-3.5 h-3.5" />
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {!isEntregue && (
                                <button 
                                  onClick={() => handleUpdate(saida.id)}
                                  disabled={!hasChanges || savingId === saida.id}
                                  className={`p-2 rounded-xl transition-all ${
                                    hasChanges 
                                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:scale-110 active:scale-95' 
                                      : 'bg-gray-100 text-gray-300'
                                  }`}
                                >
                                  {savingId === saida.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
