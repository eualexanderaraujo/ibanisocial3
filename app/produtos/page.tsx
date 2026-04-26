'use client';

import { useState, useEffect } from 'react';
import { ProdutoRow, ProdutoInput } from '@/types/produto';
import { Package, Plus, Save, Trash2, Search, Filter, Info, ShoppingBasket, Layers, Scale, Baby } from 'lucide-react';

export default function ProdutosAdminPage() {
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para novo produto
  const [newProduct, setNewProduct] = useState<ProdutoInput>({
    nome_produto: '',
    adultos: 0,
    kids: 0,
    unidade: 'kg',
    ativo: 'Sim'
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newProduct.nome_produto) return;
    setSaving('new');
    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        await fetchProdutos();
        setNewProduct({ nome_produto: '', adultos: 0, kids: 0, unidade: 'kg', ativo: 'Sim' });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (id: string, updated: Partial<ProdutoInput>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setProdutos(produtos.map(p => p.id_produto === id ? { ...p, ...updated } : p as ProdutoRow));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Isso pode afetar os cálculos de reserva.')) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProdutos(produtos.filter(p => p.id_produto !== id));
      }
    } finally {
      setSaving(null);
    }
  };

  const totalKgAdulto = produtos.reduce((sum, p) => sum + (Number(p.adultos) || 0), 0);
  const totalKgKids = produtos.reduce((sum, p) => sum + (Number(p.kids) || 0), 0);

  const filteredProdutos = produtos.filter(p => 
    p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-8">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Sincronizando com Google Sheets...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 pb-20">
      {/* Header Premium */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
                <ShoppingBasket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Composição de Cestas</h1>
                <p className="text-slate-400 mt-1 font-medium max-w-md">
                  Configure os itens e as quantidades (kg) para as cestas Adulto e Kids.
                </p>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
              <span className="text-slate-400 text-sm block font-bold uppercase tracking-wider">Itens Totais</span>
              <span className="text-white text-3xl font-black">{produtos.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Resumo de Pesos das Cestas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-orange-900/5 border border-orange-100 relative overflow-hidden group hover:shadow-orange-900/10 transition-all">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Cesta Adulto</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900 tracking-tight">{totalKgAdulto.toFixed(2)}</span>
                  <span className="text-gray-400 font-bold">kg / total</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-emerald-900/5 border border-emerald-100 relative overflow-hidden group hover:shadow-emerald-900/10 transition-all">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Cesta Kids</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900 tracking-tight">{totalKgKids.toFixed(2)}</span>
                  <span className="text-gray-400 font-bold">kg / total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-900/10 p-6 mb-8 border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar item da composição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Formulário de Novo Produto */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 overflow-hidden border border-gray-200 sticky top-8">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-orange-600" />
                  Novo Item
                </h2>
                <p className="text-gray-500 text-sm mt-1">Defina os pesos para cada tipo de cesta.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Produto</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Arroz, Feijão..."
                    value={newProduct.nome_produto}
                    onChange={(e) => setNewProduct({...newProduct, nome_produto: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-800"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Peso Adulto (kg)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={newProduct.adultos}
                      onChange={(e) => setNewProduct({...newProduct, adultos: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Peso Kids (kg)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={newProduct.kids}
                      onChange={(e) => setNewProduct({...newProduct, kids: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Unidade</label>
                  <select 
                    value={newProduct.unidade}
                    onChange={(e) => setNewProduct({...newProduct, unidade: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-700 appearance-none"
                  >
                    <option value="kg">kg</option>
                    <option value="un">un</option>
                    <option value="litro">litro</option>
                  </select>
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={!newProduct.nome_produto || saving === 'new'}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  {saving === 'new' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Salvar Produto
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 overflow-hidden border border-gray-200">
              <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Layers className="w-6 h-6 text-orange-600" />
                  Itens Cadastrados
                </h2>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  {filteredProdutos.length} exibidos
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredProdutos.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                      <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
                  </div>
                ) : (
                  filteredProdutos.map(produto => (
                    <div key={produto.id_produto} className="group p-6 hover:bg-orange-50/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            defaultValue={produto.nome_produto}
                            onBlur={(e) => {
                              if (e.target.value !== produto.nome_produto) {
                                handleUpdate(produto.id_produto, { nome_produto: e.target.value });
                              }
                            }}
                            className="text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-text group-hover:text-orange-700 transition-colors"
                          />
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                              <Scale className="w-3.5 h-3.5 text-orange-500" />
                              Adulto: {produto.adultos} {produto.unidade}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                              <Baby className="w-3.5 h-3.5 text-emerald-500" />
                              Kids: {produto.kids} {produto.unidade}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="number" 
                              step="0.001"
                              defaultValue={produto.adultos}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val !== produto.adultos) handleUpdate(produto.id_produto, { adultos: val });
                              }}
                              className="w-20 text-center px-2 py-1 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-xs"
                              title="Peso Adulto"
                            />
                            <input 
                              type="number" 
                              step="0.001"
                              defaultValue={produto.kids}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val !== produto.kids) handleUpdate(produto.id_produto, { kids: val });
                              }}
                              className="w-20 text-center px-2 py-1 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-xs"
                              title="Peso Kids"
                            />
                          </div>

                          <button 
                            onClick={() => handleDelete(produto.id_produto)}
                            disabled={saving === produto.id_produto}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            {saving === produto.id_produto ? (
                              <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
