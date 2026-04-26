'use client';

import { useState, useEffect } from 'react';
import { SaidaRow } from '@/types/saidas';
import { 
  Truck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Phone,
  UserCheck,
  Save,
  Trash2
} from 'lucide-react';

type Pedido = { 
  id: string; 
  data_pedido: string;
  beneficiado: string; 
  celula: string; 
  lider: string; 
  telefone_lider: string;
  tipo_cesta: string; 
};

export default function EntregasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [saidas, setSaidas] = useState<SaidaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendentes' | 'entregues'>('pendentes');

  // Controle de input 'entregue_por' por id do pedido
  const [entregaData, setEntregaData] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [saidasRes, pedidosRes] = await Promise.all([
        fetch('/api/saidas').then(res => res.json()),
        fetch('/api/pedidos').then(res => res.json())
      ]);
      
      setSaidas(Array.isArray(saidasRes) ? saidasRes : []);
      setPedidos(Array.isArray(pedidosRes) ? pedidosRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEntrega = async (pedido: Pedido) => {
    const entregue_por = entregaData[pedido.id] || '';
    if (!entregue_por.trim()) {
      alert('Informe o nome de quem realizou a entrega.');
      return;
    }

    setSavingId(pedido.id);
    const payload = {
      id_pedido: pedido.id,
      beneficiado: pedido.beneficiado,
      celula: pedido.celula,
      lider: pedido.lider,
      tipo: pedido.tipo_cesta === 'Kids' ? 'KIDS' : 'ADULTO',
      entregue_por: entregue_por.trim()
    };

    try {
      const res = await fetch('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Recarregar os dados para atualizar a tabela e o estoque
        await fetchData();
        // Limpar o input
        setEntregaData(prev => {
          const newState = { ...prev };
          delete newState[pedido.id];
          return newState;
        });
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao confirmar entrega.');
      }
    } catch (err) {
      alert('Erro de comunicação com o servidor.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeletePedido = async (id: string) => {
    if (!confirm('Deseja realmente EXCLUIR este pedido?\n\nEsta ação removerá o pedido da lista e devolverá as quantidades reservadas ao saldo do estoque.')) return;

    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir pedido.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir pedido.');
    }
  };

  // Merge das listas e filtros
  const pedidosMapeados = pedidos.map(pedido => {
    const saidaVinculada = saidas.find(s => s.id_pedido === pedido.id);
    return {
      ...pedido,
      isEntregue: !!saidaVinculada,
      data_entrega: saidaVinculada?.data_entrega,
      entregue_por: saidaVinculada?.entregue_por
    };
  });

  const pedidosFiltrados = pedidosMapeados.filter(p => {
    const matchesSearch = 
      p.beneficiado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.celula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lider.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;

    if (activeTab === 'pendentes') return !p.isEntregue;
    if (activeTab === 'entregues') return p.isEntregue;
    return true; // 'todos'
  }).reverse(); // Mais recentes primeiro

  const countPendentes = pedidosMapeados.filter(p => !p.isEntregue).length;
  const countEntregues = pedidosMapeados.filter(p => p.isEntregue).length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Sincronizando pedidos e entregas...</p>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Expedição de Cestas</h1>
                <p className="text-slate-400 mt-1 font-medium">Controle de entregas e baixa de estoque.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Entregues</span>
                <span className="text-white text-2xl font-black">{countEntregues}</span>
              </div>
              <div className="bg-orange-500/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-orange-500/20">
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest block mb-1">Pendentes</span>
                <span className="text-orange-500 text-2xl font-black">{countPendentes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Controles de Filtro e Abas */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-900/10 p-4 mb-8 border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'pendentes' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setActiveTab('entregues')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'entregues' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entregues
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'todos' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todos
            </button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar beneficiário, líder ou célula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        {/* Lista Unificada */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Data Pedido</th>
                  <th className="px-6 py-4">Célula / Líder</th>
                  <th className="px-6 py-4">Beneficiário</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right min-w-[250px]">Ação / Informações de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">Nenhum pedido encontrado.</td>
                  </tr>
                ) : (
                  pedidosFiltrados.map(pedido => (
                    <tr key={pedido.id} className={`group transition-colors ${pedido.isEntregue ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-orange-50/20'}`}>
                      {/* Data Pedido */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {pedido.data_pedido}
                        </div>
                      </td>
                      
                      {/* Célula / Lider */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{pedido.celula}</span>
                          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3" />
                            {pedido.lider}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {pedido.telefone_lider}
                          </span>
                        </div>
                      </td>

                      {/* Beneficiário */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{pedido.beneficiado}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            ID: {pedido.id.substring(0, 8)}
                          </span>
                        </div>
                      </td>

                      {/* Tipo de Cesta */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          pedido.tipo_cesta?.toLowerCase() === 'kids' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {pedido.tipo_cesta || 'ADULTO'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pedido.isEntregue ? (
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Entregue
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium mt-1">
                              {pedido.data_entrega}
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-500 font-bold text-xs uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Ações / Info Entrega */}
                      <td className="px-6 py-4 text-right">
                        {pedido.isEntregue ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 font-medium">Entregue por:</span>
                            <span className="text-sm font-bold text-gray-900">{pedido.entregue_por}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <input 
                              type="text"
                              placeholder="Nome de quem entregou"
                              value={entregaData[pedido.id] || ''}
                              onChange={(e) => setEntregaData({...entregaData, [pedido.id]: e.target.value})}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm w-48 focus:border-orange-500 focus:outline-none"
                            />
                            <button
                              onClick={() => handleConfirmarEntrega(pedido)}
                              disabled={savingId === pedido.id || !(entregaData[pedido.id]?.trim())}
                              className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-lg font-bold transition-all shadow-md shadow-orange-600/20 disabled:bg-gray-300 disabled:shadow-none"
                              title="Confirmar Entrega"
                            >
                              {savingId === pedido.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeletePedido(pedido.id)}
                              className="p-2.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Excluir Pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
