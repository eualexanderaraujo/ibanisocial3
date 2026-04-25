'use client';

import { useState, useEffect } from 'react';
import { EstoqueRow } from '@/types/estoque';
import { 
  Package, 
  Search, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Database
} from 'lucide-react';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEstoque();
  }, []);

  const fetchEstoque = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/estoque');
      const data = await res.json();
      setEstoque(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEstoque = estoque.filter(item => 
    item.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEstoqueFisico = filteredEstoque.reduce((acc, item) => acc + Number(item.quantidade_estoque_kg), 0);
  const totalReservado = filteredEstoque.reduce((acc, item) => acc + Number(item.quantidade_reservada_kg), 0);
  const totalSaldo = totalEstoqueFisico - totalReservado;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Consultando inventário...</p>
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
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Centro de Inventário</h1>
                <p className="text-slate-400 mt-1 font-medium">Controle de saldo, reservas e disponibilidade física de produtos.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Físico Total</span>
                <span className="text-white text-2xl font-black">{totalEstoqueFisico.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span></span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest block mb-1">Reservado</span>
                <span className="text-orange-500 text-2xl font-black">{totalReservado.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span></span>
              </div>
              <div className="hidden md:block bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-2xl">
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest block mb-1">Saldo Livre</span>
                <span className="text-emerald-500 text-2xl font-black">{totalSaldo.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Filtros e Ações */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar produto no estoque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-900/5 focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-700"
            />
          </div>
          <button 
            onClick={fetchEstoque}
            className="px-6 py-4 bg-white text-orange-600 font-bold rounded-2xl shadow-xl shadow-slate-900/5 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 border border-orange-100"
          >
            <RefreshCw className="w-5 h-5" />
            Sincronizar
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-gray-200 overflow-x-auto">
          {filteredEstoque.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum item encontrado no estoque.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-right">Físico (kg)</th>
                  <th className="px-6 py-4 text-right">Reservado (kg)</th>
                  <th className="px-6 py-4 text-right">Saldo (kg)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEstoque.map((item, idx) => {
                  const saldo = Number(item.saldo_kg);
                  const isLow = saldo < 10;
                  const isNegative = saldo < 0;

                  const statusBadge = isNegative ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      <AlertCircle className="w-3 h-3" /> Crítico
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      <ArrowDownRight className="w-3 h-3" /> Baixo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3" /> Estável
                    </span>
                  );

                  return (
                    <tr
                      key={item.id_estoque}
                      className={`group transition-colors hover:bg-orange-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      {/* Produto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 group-hover:bg-orange-100 rounded-xl flex items-center justify-center transition-colors shrink-0">
                            <Package className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                              {item.nome_produto}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase">{item.id_estoque}</p>
                          </div>
                        </div>
                      </td>

                      {/* Físico */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-700">
                          {Number(item.quantidade_estoque_kg).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">kg</span>
                      </td>

                      {/* Reservado */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-orange-600">
                          {Number(item.quantidade_reservada_kg).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">kg</span>
                      </td>

                      {/* Saldo */}
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black ${isNegative ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {Number(item.saldo_kg).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">kg</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totais */}
              <tfoot>
                <tr className="bg-slate-900/5 border-t-2 border-slate-200 font-bold text-sm">
                  <td className="px-6 py-3 text-gray-500 uppercase text-[11px] tracking-wider">
                    {filteredEstoque.length} produto(s)
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">
                    {filteredEstoque.reduce((a, i) => a + Number(i.quantidade_estoque_kg), 0).toFixed(1)}
                    <span className="text-xs text-gray-400 ml-1">kg</span>
                  </td>
                  <td className="px-6 py-3 text-right text-orange-600">
                    {filteredEstoque.reduce((a, i) => a + Number(i.quantidade_reservada_kg), 0).toFixed(1)}
                    <span className="text-xs text-gray-400 ml-1">kg</span>
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-600">
                    {filteredEstoque.reduce((a, i) => a + Number(i.saldo_kg), 0).toFixed(1)}
                    <span className="text-xs text-gray-400 ml-1">kg</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
