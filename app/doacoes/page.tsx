'use client';
import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
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

  // Agrupa o histórico: itens com mesmo id_doacao ficam juntos visualmente
  const doacoesAgrupadas = doacoes.reduce<Map<string, DoacaoRow[]>>((acc, d) => {
    const key = d.id_doacao || 'sem-id';
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(d);
    return acc;
  }, new Map());

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 animate-pulse">
        Carregando doações...
      </div>
    );
  }

  const totalItens = form.itens.filter(i => i.nome_produto && i.quantidade_kg).length;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

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
                    className="w-full p-3 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 font-bold text-gray-400 cursor-not-allowed"
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" aria-hidden="true" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Histórico de Doações
          </h3>
          <span className="ml-auto text-xs text-gray-400 font-mono">
            {doacoesAgrupadas.size} doação(ões) · {doacoes.length} item(ns)
          </span>
        </div>

        {/* overflow-x-auto isolado na tabela — formulário nunca rola horizontalmente */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold">
                <th className="px-5 py-3 border-b">Célula</th>
                <th className="px-5 py-3 border-b">Produto</th>
                <th className="px-5 py-3 border-b w-24 text-right">Qtd (kg)</th>
                <th className="px-5 py-3 border-b text-gray-300">Rede</th>
                <th className="px-5 py-3 border-b text-gray-300">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doacoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhuma doação registrada ainda.
                  </td>
                </tr>
              ) : (
                doacoes.map((d, i) => {
                  // Primeira linha do grupo recebe linha divisória superior destacada
                  const isFirstInGroup = i === 0 || doacoes[i - 1].id_doacao !== d.id_doacao;
                  return (
                    <tr
                      key={`${d.id_doacao}-${i}`}
                      className={`hover:bg-orange-50/30 transition-colors ${isFirstInGroup && i > 0 ? 'border-t-2 border-orange-100' : ''}`}
                    >
                      <td className="px-5 py-3 text-sm text-gray-700 font-semibold">
                        {isFirstInGroup ? d.celula : <span className="text-gray-300 text-xs italic">↳</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">{d.nome_produto}</td>
                      <td className="px-5 py-3 text-sm font-bold text-green-700 text-right">{d.quantidade_kg} kg</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{isFirstInGroup ? d.rede : ''}</td>
                      <td className="px-5 py-3 text-[11px] text-gray-300 font-mono uppercase">
                        {isFirstInGroup ? d.id_doacao : ''}
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
  );
}
