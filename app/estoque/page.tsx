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
  Database,
  ShoppingBasket
} from 'lucide-react';
import { ProdutoRow } from '@/types/produto';
import { SaidaRow } from '@/types/saidas';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueRow[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [saidas, setSaidas] = useState<SaidaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEstoque();
  }, []);

  const fetchEstoque = async () => {
    setLoading(true);
    try {
      const [resEstoque, resProdutos, resSaidas] = await Promise.all([
        fetch('/api/estoque'),
        fetch('/api/produtos'),
        fetch('/api/saidas')
      ]);
      const dataE = await resEstoque.json();
      const dataP = await resProdutos.json();
      const dataS = await resSaidas.json();
      setEstoque(Array.isArray(dataE) ? dataE : []);
      setProdutos(Array.isArray(dataP) ? dataP : []);
      setSaidas(Array.isArray(dataS) ? dataS : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (item: EstoqueRow) => {
    const val = Number(editValue);
    if (isNaN(val) || val < 0) {
      alert('Quantidade inválida');
      return;
    }
    setSavingId(item.id_estoque);
    try {
      const payload = {
        nome_produto: item.nome_produto,
        quantidade_estoque_kg: val,
        quantidade_reservada_kg: item.quantidade_reservada_kg,
        saldo_kg: val - item.quantidade_reservada_kg,
        observacao: 'Ajuste manual pela UI',
      };
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      
      setEstoque(prev => prev.map(r => r.id_estoque === item.id_estoque ? { 
        ...r, 
        quantidade_estoque_kg: val,
        saldo_kg: val - r.quantidade_reservada_kg,
      } : r));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar atualização.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredEstoque = estoque.filter(item => 
    item.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEstoqueFisico = filteredEstoque.reduce((acc, item) => acc + Number(item.quantidade_estoque_kg), 0);
  const totalReservado = filteredEstoque.reduce((acc, item) => acc + Number(item.quantidade_reservada_kg), 0);
  const totalSaldo = totalEstoqueFisico - totalReservado;

  // Cálculo de Cestas Equivalentes
  const getCestasPossiveis = (tipo: 'Adulto' | 'Kids', fonte: 'fisico' | 'saldo') => {
    const comp = produtos.filter(p => p.tipo_cesta.includes(tipo));
    if (comp.length === 0) return 0;

    let minCestas = Infinity;
    for (const item of comp) {
      const stock = estoque.find(s => s.nome_produto === item.nome_produto);
      let valor = 0;
      if (stock) {
        if (fonte === 'fisico') valor = Number(stock.quantidade_estoque_kg);
        else valor = Number(stock.saldo_kg);
      }
      const possivel = item.quantidade_kg > 0 ? Math.floor(valor / item.quantidade_kg) : Infinity;
      if (possivel < minCestas) minCestas = possivel;
    }
    return (minCestas === Infinity || minCestas < 0) ? 0 : minCestas;
  };

  const countCestasReservadas = (tipo: 'Adulto' | 'Kids') => {
    // Normaliza para comparar com o tipo no SaidaRow ('ADULTO' | 'KIDS')
    const tipoNormalizado = tipo.toUpperCase();
    return saidas.filter(s => s.status === 'Pendente' && s.tipo.toUpperCase() === tipoNormalizado).length;
  };

  const cestasFisico = { adulto: getCestasPossiveis('Adulto', 'fisico'), kids: getCestasPossiveis('Kids', 'fisico') };
  const cestasReservado = { adulto: countCestasReservadas('Adulto'), kids: countCestasReservadas('Kids') };
  const cestasSaldo = { adulto: getCestasPossiveis('Adulto', 'saldo'), kids: getCestasPossiveis('Kids', 'saldo') };

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Package className="w-12 h-12 text-white" />
                </div>
                <span className="text-slate-400 text-xs font-black uppercase tracking-widest block mb-2">Físico Total</span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-white text-4xl font-black">{totalEstoqueFisico.toFixed(1)}</span>
                  <span className="text-slate-500 font-bold">kg</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/5">
                    <ShoppingBasket className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white text-xs font-bold">{cestasFisico.adulto} <span className="text-[10px] text-slate-400">Adulto</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/5">
                    <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-white text-xs font-bold">{cestasFisico.kids} <span className="text-[10px] text-slate-400">Kids</span></span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <RefreshCw className="w-12 h-12 text-orange-500" />
                </div>
                <span className="text-orange-400 text-xs font-black uppercase tracking-widest block mb-2">Reservado</span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-orange-500 text-4xl font-black">{totalReservado.toFixed(1)}</span>
                  <span className="text-slate-500 font-bold">kg</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/5">
                    <ShoppingBasket className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white text-xs font-bold">{cestasReservado.adulto} <span className="text-[10px] text-slate-400">Adulto</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/5">
                    <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-white text-xs font-bold">{cestasReservado.kids} <span className="text-[10px] text-slate-400">Kids</span></span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Database className="w-12 h-12 text-emerald-500" />
                </div>
                <span className="text-emerald-400 text-xs font-black uppercase tracking-widest block mb-2">Saldo Disponível</span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-emerald-500 text-4xl font-black">{totalSaldo.toFixed(1)}</span>
                  <span className="text-slate-500 font-bold">kg</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/10">
                    <ShoppingBasket className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-white text-xs font-bold">{cestasSaldo.adulto} <span className="text-[10px] text-emerald-400/60">Adulto</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/10">
                    <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-white text-xs font-bold">{cestasSaldo.kids} <span className="text-[10px] text-emerald-400/60">Kids</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] sm:text-[11px] font-bold tracking-wider">
                  <th className="px-2 sm:px-4 py-4">Produto</th>
                  <th className="px-2 sm:px-4 py-4 text-right">Físico</th>
                  <th className="px-2 sm:px-4 py-4 text-right">Reserv.</th>
                  <th className="px-2 sm:px-4 py-4 text-right">Saldo</th>
                  <th className="px-2 sm:px-4 py-4 text-center">Status</th>
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
                      <td className="px-2 sm:px-4 py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="hidden sm:flex w-8 h-8 bg-slate-100 group-hover:bg-orange-100 rounded-xl items-center justify-center transition-colors shrink-0">
                            <Package className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <div className="min-w-0 max-w-[120px] sm:max-w-none">
                            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                              {item.nome_produto}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-mono uppercase truncate">{item.id_estoque}</p>
                          </div>
                        </div>
                      </td>

                      {/* Físico */}
                      <td className="px-2 sm:px-4 py-4 text-right">
                        {editingId === item.id_estoque ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              className="w-16 sm:w-20 px-1 py-1 text-xs border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              step="0.1"
                              min="0"
                              autoFocus
                            />
                            {savingId === item.id_estoque ? (
                              <RefreshCw className="w-4 h-4 text-orange-500 animate-spin ml-1" />
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-1 ml-1">
                                <button onClick={() => handleSaveEdit(item)} className="text-emerald-600 hover:bg-emerald-50 rounded px-1 py-0.5 text-xs font-bold transition-colors">✔</button>
                                <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-50 rounded px-1 py-0.5 text-xs font-bold transition-colors">✖</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="group/edit inline-flex items-center justify-end gap-1 cursor-pointer hover:bg-white px-2 py-1 rounded-md transition-colors" 
                            onClick={() => { setEditingId(item.id_estoque); setEditValue(String(item.quantidade_estoque_kg)); }}
                            title="Clique para editar"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover/edit:text-orange-600 transition-colors">
                              {Number(item.quantidade_estoque_kg).toFixed(1)}
                            </span>
                            <span className="hidden sm:inline text-xs text-gray-400">kg</span>
                            <span className="hidden sm:inline opacity-0 group-hover/edit:opacity-100 text-orange-500 text-[9px] uppercase font-bold ml-1 transition-opacity">Editar</span>
                          </div>
                        )}
                      </td>

                      {/* Reservado */}
                      <td className="px-2 sm:px-4 py-4 text-right">
                        <span className="text-xs sm:text-sm font-semibold text-orange-600">
                          {Number(item.quantidade_reservada_kg).toFixed(1)}
                        </span>
                        <span className="hidden sm:inline text-xs text-gray-400 ml-1">kg</span>
                      </td>

                      {/* Saldo */}
                      <td className="px-2 sm:px-4 py-4 text-right">
                        <span className={`text-xs sm:text-sm font-black ${isNegative ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {Number(item.saldo_kg).toFixed(1)}
                        </span>
                        <span className="hidden sm:inline text-xs text-gray-400 ml-1">kg</span>
                      </td>

                      {/* Status */}
                      <td className="px-2 sm:px-4 py-4 text-center">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totais */}
              <tfoot>
                <tr className="bg-slate-900/5 border-t-2 border-slate-200 font-bold text-xs sm:text-sm">
                  <td className="px-2 sm:px-4 py-3 text-gray-500 uppercase text-[10px] sm:text-[11px] tracking-wider">
                    <span className="hidden sm:inline">{filteredEstoque.length} produto(s)</span>
                    <span className="sm:hidden">{filteredEstoque.length} prod.</span>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right text-gray-700">
                    {filteredEstoque.reduce((a, i) => a + Number(i.quantidade_estoque_kg), 0).toFixed(1)}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right text-orange-600">
                    {filteredEstoque.reduce((a, i) => a + Number(i.quantidade_reservada_kg), 0).toFixed(1)}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right text-emerald-600">
                    {filteredEstoque.reduce((a, i) => a + Number(i.saldo_kg), 0).toFixed(1)}
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
