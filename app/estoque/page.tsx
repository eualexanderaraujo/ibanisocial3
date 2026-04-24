'use client';

import { useState, useEffect } from 'react';
import { EstoqueRow } from '@/types/estoque';
import { 
  Package, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Database,
  BarChart3
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
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Consultando inventário...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 pb-20">
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

        {/* Grade de Itens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEstoque.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum item encontrado no estoque.</p>
            </div>
          ) : (
            filteredEstoque.map(item => {
              const saldo = Number(item.saldo_kg);
              const isLow = saldo < 10;
              const isNegative = saldo < 0;

              return (
                <div key={item.id_estoque} className="group bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-900/5 overflow-hidden hover:border-orange-200 transition-all hover:shadow-orange-900/10">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                        <Package className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
                      </div>
                      {isLow ? (
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isNegative ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          <AlertCircle className="w-3 h-3" />
                          {isNegative ? 'Crítico' : 'Baixo'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Estável
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate">
                      {item.nome_produto}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mb-6 uppercase tracking-widest">ID: {item.id_estoque}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Físico</p>
                        <p className="text-lg font-bold text-gray-800">{item.quantidade_estoque_kg} kg</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Reservado</p>
                        <p className="text-lg font-bold text-orange-600">{item.quantidade_reservada_kg} kg</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${
                      isNegative 
                        ? 'bg-red-50 border-red-100 text-red-700' 
                        : isLow 
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo Disponível</p>
                        <p className="text-2xl font-black">{item.saldo_kg} kg</p>
                      </div>
                      <BarChart3 className="w-8 h-8 opacity-20" />
                    </div>
                  </div>
                  
                  {item.observacao && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 font-medium truncate italic">
                        {item.observacao}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
