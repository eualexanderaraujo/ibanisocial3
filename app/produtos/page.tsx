'use client';

import { useState, useEffect } from 'react';
import { ProdutoRow, ProdutoInput } from '@/types/produto';
import { Package, Plus, Save, Trash2, Search, Filter, Info, ShoppingBasket, Layers } from 'lucide-react';

export default function ProdutosAdminPage() {
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para novo produto
  const [newProduct, setNewProduct] = useState<ProdutoInput>({
    nome_produto: '',
    quantidade_kg: 0,
    tipo_cesta: 'Adulto/Kids'
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
        setNewProduct({ nome_produto: '', quantidade_kg: 0, tipo_cesta: 'Adulto/Kids' });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleUpdate = async (id: string, updated: Partial<ProdutoInput>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setProdutos(produtos.map(p => p.id_produto === id ? { ...p, ...updated } : p));
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

  const filteredProdutos = produtos.filter(p => 
    p.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tipo_cesta.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header Premium com Gradiente e Glassmorphism */}
      <div className="relative bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
                <ShoppingBasket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Composição de Cestas</h1>
                <p className="text-orange-100 mt-1 font-medium max-w-md">
                  Configure os itens e as quantidades (kg) que compõem cada tipo de cesta básica.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
              <span className="text-orange-100 text-sm block font-bold uppercase tracking-wider">Itens Totais</span>
              <span className="text-white text-3xl font-black">{produtos.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Barra de Pesquisa e Filtros */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-900/10 p-6 mb-8 border border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou tipo de cesta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-700"
            />
          </div>
          <button className="px-6 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
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
                <p className="text-gray-500 text-sm mt-1">Adicione um novo produto à lista de composição.</p>
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
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quantidade por Cesta (kg)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={newProduct.quantidade_kg}
                      onChange={(e) => setNewProduct({...newProduct, quantidade_kg: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium text-gray-800"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KG</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Atende ao Tipo de Cesta</label>
                  <select 
                    value={newProduct.tipo_cesta}
                    onChange={(e) => setNewProduct({...newProduct, tipo_cesta: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-700 appearance-none"
                  >
                    <option value="Adulto/Kids">Ambas (Adulto e Kids)</option>
                    <option value="Adulto">Apenas Adulto</option>
                    <option value="Kids">Apenas Kids</option>
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
              
              <div className="px-8 py-6 bg-orange-50 border-t border-orange-100">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-orange-600 shrink-0" />
                  <p className="text-xs text-orange-800 leading-relaxed font-medium">
                    Ao salvar, este item passará a ser reservado automaticamente em cada novo pedido registrado no sistema.
                  </p>
                </div>
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
                    <p className="text-gray-500 font-medium">Nenhum produto encontrado com estes termos.</p>
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
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                              <ShoppingBasket className="w-3.5 h-3.5 text-orange-500" />
                              {produto.quantidade_kg} kg / cesta
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm border ${
                              produto.tipo_cesta.includes('Adulto') && produto.tipo_cesta.includes('Kids')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                : produto.tipo_cesta === 'Adulto'
                                  ? 'bg-orange-50 text-orange-700 border-orange-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {produto.tipo_cesta}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Qtd (KG)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              defaultValue={produto.quantidade_kg}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val !== produto.quantidade_kg) {
                                  handleUpdate(produto.id_produto, { quantidade_kg: val });
                                }
                              }}
                              className="w-24 text-right px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white font-bold text-gray-800 outline-none"
                            />
                          </div>

                          <button 
                            onClick={() => handleDelete(produto.id_produto)}
                            disabled={saving === produto.id_produto}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remover produto"
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
