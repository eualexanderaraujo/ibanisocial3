'use client';

import { useState, useEffect } from 'react';
import { SaidaRow } from '@/types/saidas';

type Familia = { id: string; beneficiado: string; celula: string; lider: string; tipo_cesta: string };

export default function EntregasPage() {
  const [saidas, setSaidas] = useState<SaidaRow[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    Promise.all([
      fetch('/api/saidas').then(res => res.json()),
      fetch('/api/familias').then(res => res.json())
    ]).then(([saidasData, familiasData]) => {
      setSaidas(Array.isArray(saidasData) ? saidasData : []);
      setFamilias(Array.isArray(familiasData) ? familiasData : []);
      
      const initialEditState: any = {};
      if (Array.isArray(saidasData)) {
        saidasData.forEach((s: SaidaRow) => {
          initialEditState[s.id] = { retirado_por: s.retirado_por, entregue_por: s.entregue_por };
        });
      }
      setEditState(initialEditState);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newRow.id_pedido) {
      alert('Selecione um beneficiado listado antes de prosseguir.');
      return;
    }
    const payload = {
      beneficiado: newRow.beneficiado,
      celula: newRow.celula,
      lider: newRow.lider,
      tipo: newRow.tipo,
      link_pedido: newRow.id_pedido,
    };
    const res = await fetch('/api/saidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const { row } = await res.json();
      setSaidas([...saidas, row]);
      setEditState({ ...editState, [row.id]: { retirado_por: '', entregue_por: '' } });
      setNewRow({ beneficiado: '', celula: '', lider: '', tipo: 'KIDS', id_pedido: '' });
    } else {
      alert('Erro ao registrar nova saída.');
    }
  };

  const handleUpdate = async (id: string) => {
    const data = editState[id];
    const res = await fetch(`/api/saidas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const { row } = await res.json();
      setSaidas(saidas.map(s => s.id === id ? row : s));
    } else {
      alert('Erro ao atualizar linha.');
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

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando dados do Google Sheets...</div>;

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto font-sans">
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl font-bold mb-2">Controle de Saídas</h1>
        <p className="text-orange-100">Gerencie a retirada e entrega de cestas básicas diretamente na tabela. As edições são inline e salvas na planilha.</p>
      </div>

      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-bold tracking-wider">
              <th className="p-4 border-b">Cesta</th>
              <th className="p-4 border-b">Célula</th>
              <th className="p-4 border-b">Líder</th>
              <th className="p-4 border-b min-w-[250px]">Família Beneficiada</th>
              <th className="p-4 border-b">Tipo</th>
              <th className="p-4 border-b min-w-[150px]">Retirado por</th>
              <th className="p-4 border-b min-w-[150px]">Entregue por</th>
              <th className="p-4 border-b w-32">Status/Data</th>
              <th className="p-4 border-b">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {saidas.map(saida => {
               const isEntregue = saida.status === 'entregue';
               const edit = editState[saida.id] || { retirado_por: '', entregue_por: '' };
               const hasChanges = edit.retirado_por !== saida.retirado_por || edit.entregue_por !== saida.entregue_por;

               return (
                <tr key={saida.id} className={`transition-colors ${isEntregue ? 'bg-[#f4faeb] opacity-80' : 'hover:bg-gray-50 bg-white'}`}>
                  <td className="p-4 font-semibold text-gray-900">{saida.cesta_basica}</td>
                  <td className="p-4 text-gray-600">{saida.celula}</td>
                  <td className="p-4 text-gray-600">{saida.lider}</td>
                  <td className="p-4 font-semibold text-gray-800">{saida.beneficiado}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${saida.tipo === 'KIDS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {saida.tipo}
                    </span>
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={edit.retirado_por}
                      onChange={e => setEditState({...editState, [saida.id]: {...edit, retirado_por: e.target.value}})}
                      onKeyDown={e => e.key === 'Enter' && hasChanges && handleUpdate(saida.id)}
                      className={`w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow ${isEntregue ? 'bg-transparent border-transparent' : 'bg-gray-50 border-gray-300'}`}
                      placeholder={isEntregue ? '-' : 'Pessoa que retirou'}
                      disabled={isEntregue}
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={edit.entregue_por}
                      onChange={e => setEditState({...editState, [saida.id]: {...edit, entregue_por: e.target.value}})}
                      onKeyDown={e => e.key === 'Enter' && hasChanges && handleUpdate(saida.id)}
                      className={`w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow ${isEntregue ? 'bg-transparent border-transparent' : 'bg-gray-50 border-gray-300'}`}
                      placeholder={isEntregue ? '-' : 'Quem entregou?'}
                      disabled={isEntregue}
                    />
                  </td>
                  <td className="p-4 text-sm whitespace-nowrap">
                    {isEntregue ? (
                       <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                         {saida.data}
                       </span>
                    ) : (
                       <span className="text-rose-500 font-semibold flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                         Pendente
                       </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!isEntregue && hasChanges && (
                      <button 
                        onClick={() => handleUpdate(saida.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        Salvar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {/* NOVO CADASTRO */}
            <tr className="bg-orange-50/50 hover:bg-orange-50 transition-colors border-t-4 border-orange-200">
              <td className="p-4 text-center font-black text-orange-400 text-xl">+</td>
              <td className="p-3">
                 <input type="text" value={newRow.celula} readOnly className="w-full bg-transparent text-gray-500 border-none outline-none font-medium text-sm" placeholder="Autofill" />
              </td>
              <td className="p-3">
                 <input type="text" value={newRow.lider} readOnly className="w-full bg-transparent text-gray-500 border-none outline-none font-medium text-sm" placeholder="Autofill" />
              </td>
              <td className="p-3">
                <input 
                  list="familias-list"
                  value={newRow.beneficiado}
                  onChange={handleBeneficiadoChange}
                  className="w-full p-2.5 text-sm border-2 border-orange-300 rounded-lg focus:ring-2 focus:border-orange-500 focus:ring-orange-200 focus:outline-none bg-white font-medium shadow-sm"
                  placeholder="Digite o nome da família..."
                />
                <datalist id="familias-list">
                  {familias.map(f => <option key={f.id} value={f.beneficiado}>{f.beneficiado} (Cel: {f.celula})</option>)}
                </datalist>
              </td>
              <td className="p-3">
                <select 
                  value={newRow.tipo}
                  onChange={e => setNewRow({...newRow, tipo: e.target.value as 'ADULTO'|'KIDS'})}
                  className="w-full p-2.5 text-sm border-2 border-orange-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 shadow-sm font-bold text-gray-700"
                >
                  <option value="KIDS">KIDS</option>
                  <option value="ADULTO">ADULTO</option>
                </select>
              </td>
              <td className="p-4 text-gray-400 text-xs tracking-wide uppercase font-semibold text-center" colSpan={2}>
                 Preenchido durante a entrega
              </td>
              <td className="p-4 text-gray-400 text-xs tracking-wide uppercase font-semibold">
                 Novo registro
              </td>
              <td className="p-3 text-right">
                <button 
                  onClick={handleCreate}
                  disabled={!newRow.id_pedido}
                  className="bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 w-full uppercase tracking-wider text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                  Adicionar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
