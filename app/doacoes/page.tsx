'use client';
import { useState, useEffect, useRef, KeyboardEvent, useCallback, Fragment } from 'react';
import { DoacaoRow } from '@/types/doacao';
import { ProdutoRow } from '@/types/produto';
import { CelulaRow } from '@/types/celula';

// ── Tipos internos ───────────────────────────────────────────────────────────
interface ItemDoacao {
  nome_produto: string;
  quantidade_kg: string; // string para controle do input; convertemos ao salvar
}

interface FormState {
  celula: string;      // nome_celula
  id_celula: string;   // id para o select
  rede: string;
  itens: ItemDoacao[];
}

const BLANK_ITEM: ItemDoacao = { nome_produto: '', quantidade_kg: '' };
const INITIAL_FORM: FormState = { celula: '', id_celula: '', rede: '', itens: [{ ...BLANK_ITEM }] };

// ── Componente ───────────────────────────────────────────────────────────────
export default function DoacoesPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [doacoes, setDoacoes] = useState<DoacaoRow[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [celulas, setCelulas] = useState<CelulaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedRedes, setExpandedRedes] = useState<Set<string>>(new Set());

  // Refs para cada campo de item: produtoRefs[i] e quantidadeRefs[i]
  const produtoRefs = useRef<Array<HTMLSelectElement | null>>([]);
  const quantidadeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const celulaRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/doacoes').then(r => r.json()),
      fetch('/api/produtos').then(r => r.json()),
      fetch('/api/celulas').then(r => r.json()),
    ]).then(([d, p, c]) => {
      setDoacoes(Array.isArray(d) ? d : []);
      setProdutos(Array.isArray(p) ? p : []);
      setCelulas(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  // ── Adicionar nova linha de item ─────────────────────────────────────────
  const addItem = useCallback((focusIndex?: number) => {
    setForm(prev => ({ ...prev, itens: [...prev.itens, { ...BLANK_ITEM }] }));
    // Foca o select de produto da nova linha após render
    if (focusIndex !== undefined) {
      setTimeout(() => produtoRefs.current[focusIndex]?.focus(), 50);
    }
  }, []);

  // ── Remover linha ────────────────────────────────────────────────────────
  const removeItem = (idx: number) => {
    if (form.itens.length <= 1) return;
    setForm(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== idx),
    }));
  };

  // ── Atualizar campo de item ──────────────────────────────────────────────
  const updateItem = (idx: number, field: keyof ItemDoacao, value: string) => {
    setForm(prev => {
      const itens = [...prev.itens];
      itens[idx] = { ...itens[idx], [field]: value };
      return { ...prev, itens };
    });
  };

  // ── Célula selecionada ───────────────────────────────────────────────────
  const handleCelulaChange = (id_celula: string) => {
    const cel = celulas.find(c => c.id_celula === id_celula);
    setForm(prev => ({
      ...prev,
      id_celula,
      celula: cel?.nome_celula ?? '',
      rede: cel?.rede ?? '',
    }));
  };

  // ── Lógica de Enter ──────────────────────────────────────────────────────
  // Enter na célula → foca no primeiro produto
  const handleCelulaEnter = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    produtoRefs.current[0]?.focus();
  };

  // Enter no produto → foca na quantidade da mesma linha
  const handleProdutoEnter = (e: KeyboardEvent, idx: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    quantidadeRefs.current[idx]?.focus();
  };

  // Enter na quantidade → avança ou cria nova linha (RF3 + RF4)
  const handleQuantidadeEnter = (e: KeyboardEvent, idx: number) => {
    if (e.key !== 'Enter' && !(e.ctrlKey && e.key === 'Enter')) return;
    e.preventDefault();

    // Ctrl+Enter = salva diretamente (melhoria extra do PRD)
    if (e.ctrlKey) { handleSubmit(); return; }

    const isLastItem = idx === form.itens.length - 1;
    const currentItem = form.itens[idx];
    const isCurrentFilled = currentItem.nome_produto && currentItem.quantidade_kg;

    if (isLastItem && isCurrentFilled) {
      // Cria nova linha e foca nela (RF4)
      addItem(idx + 1);
    } else if (!isLastItem) {
      // Avança para o produto da próxima linha
      produtoRefs.current[idx + 1]?.focus();
    } else {
      // Última linha vazia → salva
      handleSubmit();
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.celula || !form.rede) {
      alert('Selecione a Célula antes de salvar.');
      celulaRef.current?.focus();
      return;
    }

    const itensValidos = form.itens.filter(
      i => i.nome_produto && Number(i.quantidade_kg) > 0
    );

    if (itensValidos.length === 0) {
      alert('Adicione ao menos um item com produto e quantidade.');
      produtoRefs.current[0]?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/doacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celula: form.celula,
          rede: form.rede,
          itens: itensValidos.map(i => ({
            nome_produto: i.nome_produto,
            quantidade_kg: Number(i.quantidade_kg),
            observacao: '',
          })),
        }),
      });

      if (res.ok) {
        const created: DoacaoRow[] = await res.json();
        setDoacoes(prev => [...created, ...prev]);
        setSuccessCount(itensValidos.length);
        setForm(INITIAL_FORM);
        setTimeout(() => setSuccessCount(null), 4000);
        setTimeout(() => celulaRef.current?.focus(), 100);
      } else {
        const err = await res.json();
        alert(err.error ?? 'Erro ao registrar doação.');
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Agrupamento 1: Por Célula (Visão por Célula)
  const doacoesPorCelula = Array.from(doacoes.reduce<Map<string, { celula: string, rede: string, totalKg: number, itens: DoacaoRow[] }>>((acc, d) => {
    const key = d.celula;
    if (!acc.has(key)) {
      acc.set(key, { celula: d.celula, rede: d.rede, totalKg: 0, itens: [] });
    }
    const group = acc.get(key)!;
    group.totalKg += d.quantidade_kg;
    group.itens.push(d);
    return acc;
  }, new Map()).values()).sort((a, b) => b.totalKg - a.totalKg);

  // Agrupamento 1.1: Por Rede (para a nova hierarquia)
  const doacoesPorRede = Array.from(doacoesPorCelula.reduce<Map<string, { rede: string, totalKg: number, celulas: typeof doacoesPorCelula }>>((acc, c) => {
    const key = c.rede || 'Sem rede';
    if (!acc.has(key)) {
      acc.set(key, { rede: key, totalKg: 0, celulas: [] });
    }
    const group = acc.get(key)!;
    group.totalKg += c.totalKg;
    group.celulas.push(c);
    return acc;
  }, new Map()).values()).sort((a, b) => b.totalKg - a.totalKg);

  // Agrupamento 2: Por Mês (Visão Mensal)
  const doacoesPorMes = Array.from(doacoes.reduce<Map<string, { mesAno: string, totalKg: number, celulas: Map<string, number>, sortKey: number }>>((acc, d) => {
    const data = d.data_doacao ? new Date(d.data_doacao) : new Date();
    const mesNome = data.toLocaleString('pt-BR', { month: 'long' });
    const mesFormatado = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
    const ano = data.getFullYear();
    const mesAno = `${mesFormatado}/${ano}`;
    const sortKey = ano * 100 + data.getMonth();
    
    if (!acc.has(mesAno)) {
      acc.set(mesAno, { mesAno, totalKg: 0, celulas: new Map(), sortKey });
    }
    const group = acc.get(mesAno)!;
    group.totalKg += d.quantidade_kg;
    
    const atual = group.celulas.get(d.celula) || 0;
    group.celulas.set(d.celula, atual + d.quantidade_kg);
    
    return acc;
  }, new Map()).values()).sort((a, b) => b.sortKey - a.sortKey);

  const toggleCell = (key: string) => {
    const next = new Set(expandedCells);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedCells(next);
  };

  const toggleMonth = (key: string) => {
    const next = new Set(expandedMonths);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedMonths(next);
  };

  const toggleRede = (key: string) => {
    const next = new Set(expandedRedes);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedRedes(next);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 animate-pulse">
        Carregando doações...
      </div>
    );
  }

  const totalItens = form.itens.filter(i => i.nome_produto && i.quantidade_kg).length;

  return (
    <div className="flex-1 bg-slate-100 pb-20">
      {/* Header Premium */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-3xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
               <span aria-hidden="true" className="text-3xl text-white">🫙</span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Centro de Doações</h1>
              <p className="text-slate-400 mt-1 font-medium">Registro de entradas de alimentos na IBANI.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8">

      {/* ── Formulário V2 ──────────────────────────────────────────────── */}
      <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span aria-hidden="true">🫙</span>
            Nova Doação
          </h2>
          <p className="text-orange-100 text-xs mt-1">
            Use <kbd className="bg-orange-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd> para avançar campos.
            &nbsp;Nova linha criada automaticamente ao preencher quantidade.
            &nbsp;<kbd className="bg-orange-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+Enter</kbd> salva direto.
          </p>
        </div>

        <form
          aria-label="Formulário de registro de doação"
          onSubmit={e => { e.preventDefault(); handleSubmit(); }}
          noValidate
          className="p-6 space-y-6"
        >

          {/* ── BLOCO 1: Cabeçalho da Doação ───────────────────────── */}
          <fieldset className="border border-orange-100 rounded-xl overflow-hidden">
            <legend className="ml-4 px-2 text-[11px] font-bold uppercase text-orange-500 tracking-widest">
              Dados da Célula
            </legend>

            <div className="px-4 pt-2 pb-5">
              {/* Desktop: 2 colunas (célula + rede lado a lado — só estes 2 campos curtos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-celula" className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Célula <span className="text-orange-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="input-celula"
                    ref={celulaRef}
                    tabIndex={1}
                    aria-required="true"
                    className="w-full p-3 text-sm border-2 border-orange-200 rounded-xl bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all font-semibold"
                    value={form.id_celula}
                    onChange={e => handleCelulaChange(e.target.value)}
                    onKeyDown={handleCelulaEnter}
                  >
                    <option value="">— Selecione a célula —</option>
                    {celulas.map(c => (
                      <option key={c.id_celula} value={c.id_celula}>{c.nome_celula}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Rede (automática)
                  </label>
                  <input
                    className="w-full p-3 text-sm border-2 border-gray-200 rounded-xl bg-slate-100 font-bold text-gray-400 cursor-not-allowed"
                    value={form.rede}
                    readOnly
                    tabIndex={-1}
                    placeholder="— preenchida ao selecionar célula —"
                    aria-label="Rede — preenchida automaticamente"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── BLOCO 2: Itens da Doação (dinâmico) ────────────────── */}
          <fieldset className="border border-orange-100 rounded-xl overflow-hidden">
            <legend className="ml-4 px-2 text-[11px] font-bold uppercase text-orange-500 tracking-widest">
              Itens da Doação
            </legend>

            <div className="px-4 pt-3 pb-4 space-y-2">
              {/* Cabeçalho da tabela interna */}
              <div className="grid grid-cols-[1fr_6rem_2rem] gap-2 px-1 mb-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Produto</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">Qtd (kg)</span>
                <span />
              </div>

              {/* Linhas de itens */}
              {form.itens.map((item, idx) => {
                const isLast = idx === form.itens.length - 1;
                const isFilled = item.nome_produto && item.quantidade_kg;
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[1fr_6rem_2rem] gap-2 items-center rounded-xl transition-all ${isFilled ? 'bg-orange-50/40' : ''}`}
                  >
                    {/* Produto */}
                    <select
                      ref={el => { produtoRefs.current[idx] = el; }}
                      tabIndex={2 + idx * 2}
                      aria-label={`Produto item ${idx + 1}`}
                      className="w-full p-2.5 text-sm border-2 border-orange-200 rounded-xl bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium"
                      value={item.nome_produto}
                      onChange={e => updateItem(idx, 'nome_produto', e.target.value)}
                      onKeyDown={e => handleProdutoEnter(e, idx)}
                    >
                      <option value="">— produto —</option>
                      {produtos.map(p => (
                        <option key={p.nome_produto} value={p.nome_produto}>{p.nome_produto}</option>
                      ))}
                    </select>

                    {/* Quantidade */}
                    <input
                      ref={el => { quantidadeRefs.current[idx] = el; }}
                      type="number"
                      tabIndex={3 + idx * 2}
                      min="0.1"
                      step="0.1"
                      aria-label={`Quantidade item ${idx + 1}`}
                      className="w-full p-2.5 text-sm border-2 border-orange-200 rounded-xl bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all font-bold text-orange-600 text-center"
                      placeholder="0.0"
                      value={item.quantidade_kg}
                      onChange={e => updateItem(idx, 'quantidade_kg', e.target.value)}
                      onKeyDown={e => handleQuantidadeEnter(e, idx)}
                    />

                    {/* Remover */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => removeItem(idx)}
                      disabled={form.itens.length <= 1}
                      aria-label={`Remover item ${idx + 1}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-0 transition-all text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Adicionar linha manualmente */}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => addItem(form.itens.length)}
                className="mt-2 w-full py-2 text-xs font-bold text-orange-400 hover:text-orange-600 border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span aria-hidden="true" className="text-base leading-none">+</span>
                Adicionar item
              </button>
            </div>
          </fieldset>

          {/* ── BLOCO 3: Ações ─────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4">
            {/* Contador e feedback */}
            <div className="text-xs text-gray-400 space-y-0.5">
              {totalItens > 0 && (
                <p className="text-orange-600 font-semibold">
                  {totalItens} {totalItens === 1 ? 'item' : 'itens'} pronto{totalItens > 1 ? 's' : ''}
                </p>
              )}
              {successCount !== null && (
                <p className="text-green-600 font-bold animate-pulse" aria-live="polite">
                  ✓ {successCount} {successCount === 1 ? 'item registrado' : 'itens registrados'} com sucesso!
                </p>
              )}
            </div>

            <button
              type="submit"
              tabIndex={99}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-10 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-orange-200/60 transition-all active:scale-95 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="text-lg">💾</span>
                  Salvar Doação
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Histórico Agrupado ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" aria-hidden="true" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Histórico de Doações por Célula
          </h3>
          <span className="ml-auto text-xs text-gray-400 font-mono">
            {doacoesPorCelula.length} célula(s) · {doacoes.length} item(ns)
          </span>
        </div>

        {/* overflow-x-auto isolado na tabela — formulário nunca rola horizontalmente */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-slate-100 text-gray-500 uppercase text-[11px] font-bold">
                <th className="px-5 py-3 border-b">Célula</th>
                <th className="px-5 py-3 border-b">Ações</th>
                <th className="px-5 py-3 border-b w-24 text-right">Total (kg)</th>
                <th className="px-5 py-3 border-b text-gray-300">Rede</th>
                <th className="px-5 py-3 border-b text-gray-300">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doacoesPorRede.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhuma doação registrada ainda.
                  </td>
                </tr>
              ) : (
                doacoesPorRede.map((redeGroup) => {
                  const isRedeExpanded = expandedRedes.has(redeGroup.rede);
                  return (
                    <Fragment key={redeGroup.rede}>
                      {/* Linha da Rede */}
                      <tr 
                        onClick={() => toggleRede(redeGroup.rede)}
                        className="cursor-pointer bg-slate-50 hover:bg-orange-100/50 transition-colors border-l-4 border-orange-500"
                      >
                        <td className="px-5 py-3 text-sm font-black text-orange-700">
                          <div className="flex items-center gap-3">
                            <span className={`text-orange-500 transition-transform duration-200 ${isRedeExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                            <span className="uppercase tracking-widest">Rede {redeGroup.rede}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-orange-600/70 font-bold uppercase italic">
                          {redeGroup.celulas.length} células
                        </td>
                        <td className="px-5 py-3 text-sm font-black text-orange-800 text-right">
                          {redeGroup.totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
                        </td>
                        <td className="px-5 py-3" />
                        <td className="px-5 py-3" />
                      </tr>

                      {/* Células dentro da Rede */}
                      {isRedeExpanded && redeGroup.celulas.map((group) => {
                        const isExpanded = expandedCells.has(group.celula);
                        return (
                          <Fragment key={group.celula}>
                            <tr 
                              onClick={() => toggleCell(group.celula)}
                              className="cursor-pointer hover:bg-orange-50/50 transition-colors bg-white group border-l-4 border-orange-300 ml-4"
                            >
                              <td className="px-5 py-4 text-sm font-bold text-slate-800 pl-10">
                                <div className="flex items-center gap-3">
                                  <span className={`text-orange-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                    ▶
                                  </span>
                                  <span>{group.celula}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-400 italic">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                  {group.itens.length} {group.itens.length === 1 ? 'doação' : 'doações'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm font-black text-orange-600 text-right">
                                {group.totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
                              </td>
                              <td className="px-5 py-4 text-xs text-gray-400 uppercase font-bold tracking-wider">{group.rede}</td>
                              <td className="px-5 py-4 text-[10px] text-gray-300 font-mono">-</td>
                            </tr>

                            {/* Itens dentro da Célula */}
                            {isExpanded && group.itens.map((item, idx) => (
                              <tr key={`${item.id_doacao}-${idx}`} className="bg-slate-50/50 border-l-4 border-orange-100 animate-in slide-in-from-top-1 duration-200 ml-8">
                                <td className="px-5 py-2 text-xs text-gray-400 italic pl-20">
                                  {new Date(item.data_doacao || '').toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-5 py-2 text-sm text-gray-600 font-medium">{item.nome_produto}</td>
                                <td className="px-5 py-2 text-sm font-bold text-slate-700 text-right">{item.quantidade_kg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg</td>
                                <td className="px-5 py-2 text-[10px] text-gray-300">-</td>
                                <td className="px-5 py-2 text-[10px] text-gray-300 font-mono uppercase truncate max-w-[80px]">
                                  {item.id_doacao}
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── NOVO: Histórico por Mês ─────────────────────────────────────────── */}
      <div className="mt-12 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" aria-hidden="true" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Histórico por Mês
          </h3>
          <span className="ml-auto text-xs text-gray-400 font-mono">
            {doacoesPorMes.length} mês(es)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-slate-100 text-gray-500 uppercase text-[11px] font-bold">
                <th className="px-5 py-3 border-b">Mês / Ano</th>
                <th className="px-5 py-3 border-b">Contribuição</th>
                <th className="px-5 py-3 border-b w-24 text-right">Total (kg)</th>
                <th className="px-5 py-3 border-b text-gray-300">Status</th>
                <th className="px-5 py-3 border-b text-gray-300">-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doacoesPorMes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhum registro mensal.
                  </td>
                </tr>
              ) : (
                doacoesPorMes.map((group) => {
                  const isExpanded = expandedMonths.has(group.mesAno);
                  return (
                    <Fragment key={group.mesAno}>
                      <tr 
                        onClick={() => toggleMonth(group.mesAno)}
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors bg-white group border-l-4 border-transparent hover:border-blue-500"
                      >
                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <span className={`text-blue-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                            <span className="uppercase tracking-tight text-blue-700">{group.mesAno}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400 italic">
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {group.celulas.size} células participaram
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-blue-600 text-right">
                          {group.totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-300 font-bold uppercase">Consolidado</td>
                        <td className="px-5 py-4 text-[10px] text-gray-300 font-mono">-</td>
                      </tr>

                      {/* Detalhes por Célula no Mês */}
                      {isExpanded && Array.from(group.celulas.entries()).map(([nome, kg], idx) => (
                        <tr key={`${group.mesAno}-${nome}`} className="bg-blue-50/30 border-l-4 border-blue-200 animate-in slide-in-from-top-1 duration-200">
                          <td className="px-5 py-2 text-sm text-slate-600 font-bold pl-12 italic">
                            {nome}
                          </td>
                          <td className="px-5 py-2 text-xs text-gray-400">Célula contribuinte</td>
                          <td className="px-5 py-2 text-sm font-bold text-blue-800 text-right">
                            {kg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
                          </td>
                          <td className="px-5 py-2 text-[10px] text-gray-300 italic">No mês</td>
                          <td className="px-5 py-2 text-[10px] text-gray-300 font-mono">-</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}
