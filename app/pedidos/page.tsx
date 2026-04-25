'use client';

import { useState, useEffect } from 'react';
import { CelulaRow } from '@/types/celula';
import { CadastroFormData, getTipoCesta } from '@/lib/schema';

const initialFormState = {
  celula: '',
  rede: '',
  lider: '',
  telefone_lider: '',
  supervisor: '',
  telefone_supervisor: '',
  email: '',
  beneficiado: '',
  telefone: '',
  total_pessoas: 0,
  adultos: 0,
  criancas: 0,
  adolescentes: 0,
  idosos: 0,
  trabalham: 'Não',
  tipo_renda: '',
  faixa_renda: '',
  problemas: '',
  observacao: '',
  tipo_cesta: 'Adulto' as 'Adulto' | 'Kids',
};

export default function PedidosPage() {
  const [celulas, setCelulas] = useState<CelulaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string; protocolo: string } | null>(null);

  const [formData, setFormData] = useState({ ...initialFormState });

  useEffect(() => {
    fetch('/api/celulas')
      .then((res) => res.json())
      .then((data) => {
        setCelulas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar celulas:', err);
        setLoading(false);
      });
  }, []);

  const handleCelulaChange = (nome: string) => {
    const selected = celulas.find((c) => c.nome_celula === nome);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        celula: selected.nome_celula,
        rede: selected.rede,
        lider: selected.lider,
        telefone_lider: selected.telefone_lider,
        supervisor: selected.supervisor,
        telefone_supervisor: selected.telefone_supervisor,
        email: selected.email,
      }));
    } else {
      setFormData((prev) => ({ ...prev, celula: nome }));
    }
  };

  const handleNumberChange = (field: string, value: number) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calcula total_pessoas se um dos campos de idade mudar
    if (['adultos', 'criancas', 'adolescentes', 'idosos'].includes(field)) {
      newData.total_pessoas = 
        (field === 'adultos' ? value : formData.adultos) +
        (field === 'criancas' ? value : formData.criancas) +
        (field === 'adolescentes' ? value : formData.adolescentes) +
        (field === 'idosos' ? value : formData.idosos);
        
      // Auto-determina tipo_cesta
      const numCriancas = field === 'criancas' ? value : formData.criancas;
      newData.tipo_cesta = getTipoCesta(numCriancas);
    }
    
    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccess({ id: result.id, protocolo: result.protocolo });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const err = await res.json();
        console.error('[pedidos] Erro da API:', err);
        alert('Erro ao enviar: ' + (err.error || JSON.stringify(err.details ?? 'Erro desconhecido')));
      }
    } catch (err) {
      console.error('[pedidos] Erro de conexão:', err);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 pb-12">
      {/* Header */}
      <div className="bg-orange-600 text-white py-12 px-4 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-2">Novo Pedido de Assistência</h1>
          <p className="text-orange-100 text-lg">Preencha os dados abaixo para registrar uma nova solicitação.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {success ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h2>
            <p className="text-lg">Protocolo: <span className="font-mono font-bold bg-white px-2 py-1 rounded">{success.protocolo}</span></p>
            <button 
              onClick={() => {
                setSuccess(null);
                setFormData({ ...initialFormState });
              }}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Fazer Novo Pedido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção 1: Dados da Célula */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100 backdrop-blur-sm bg-white/80">
              <h3 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <span className="bg-orange-100 p-2 rounded-lg">🏠</span>
                Informações da Célula
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Selecione a Célula</label>
                  <select 
                    required
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-semibold"
                    value={formData.celula}
                    onChange={(e) => handleCelulaChange(e.target.value)}
                  >
                    <option value="">Escolha uma célula...</option>
                    {celulas.map(c => (
                      <option key={c.id_celula} value={c.nome_celula}>{c.nome_celula}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Rede</label>
                  <input 
                    readOnly
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl text-orange-700 font-bold"
                    value={formData.rede}
                    placeholder="Auto-preenchido"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Líder</label>
                  <input readOnly className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl text-gray-600 font-medium" value={formData.lider} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Telefone Líder</label>
                  <input readOnly className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl text-gray-600 font-medium" value={formData.telefone_lider} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Supervisor</label>
                  <input readOnly className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl text-gray-600 font-medium" value={formData.supervisor} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">E-mail de Contato</label>
                  <input readOnly className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl text-gray-600 font-medium" value={formData.email} />
                </div>
              </div>
            </div>

            {/* Seção 2: Dados do Beneficiado */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100">
              <h3 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <span className="bg-orange-100 p-2 rounded-lg">👤</span>
                Dados da Família Beneficiada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nome do Beneficiado (Responsável)</label>
                  <input 
                    required
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                    value={formData.beneficiado}
                    onChange={(e) => setFormData({...formData, beneficiado: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Telefone de Contato</label>
                  <input 
                    required
                    placeholder="(21) 99999-9999"
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 text-orange-600 font-bold">Tipo de Cesta Sugerida</label>
                  <select 
                    className="w-full p-3 bg-orange-600 text-white border-none rounded-xl font-bold"
                    value={formData.tipo_cesta}
                    onChange={(e) => setFormData({...formData, tipo_cesta: e.target.value as 'Adulto' | 'Kids'})}
                  >
                    <option value="Adulto">Adulto</option>
                    <option value="Kids">Kids (Com crianças)</option>
                  </select>
                </div>
              </div>

              {/* Composição Familiar */}
              <div className="mt-8 p-6 bg-slate-100 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4">Composição Familiar</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Adultos', field: 'adultos' },
                    { label: 'Crianças', field: 'criancas' },
                    { label: 'Adolescentes', field: 'adolescentes' },
                    { label: 'Idosos', field: 'idosos' },
                  ].map((item) => (
                    <div key={item.field} className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{item.label}</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-center font-bold bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formData[item.field as keyof typeof formData]}
                        onChange={(e) => handleNumberChange(item.field, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-orange-200 flex justify-between items-center">
                  <span className="font-bold text-gray-600">Total de Pessoas:</span>
                  <span className="text-2xl font-black text-orange-600">{formData.total_pessoas}</span>
                </div>
              </div>
            </div>

            {/* Seção 3: Situação Socioeconômica */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100">
              <h3 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <span className="bg-orange-100 p-2 rounded-lg">📊</span>
                Situação Socioeconômica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Alguém da família trabalha?</label>
                  <select 
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl outline-none font-semibold"
                    value={formData.trabalham}
                    onChange={(e) => setFormData({...formData, trabalham: e.target.value})}
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tipo de Renda</label>
                  <input 
                    placeholder="Ex: CLT, Autônomo, Bico..."
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl outline-none font-semibold"
                    value={formData.tipo_renda}
                    onChange={(e) => setFormData({...formData, tipo_renda: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Faixa de Renda</label>
                  <input 
                    placeholder="Ex: Até R$ 1.000,00"
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl outline-none font-semibold"
                    value={formData.faixa_renda}
                    onChange={(e) => setFormData({...formData, faixa_renda: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Problemas Sociais</label>
                  <input 
                    placeholder="Ex: Desemprego, Doença..."
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl outline-none font-semibold"
                    value={formData.problemas}
                    onChange={(e) => setFormData({...formData, problemas: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Observações Gerais</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 bg-slate-100 border-2 border-gray-200 rounded-xl outline-none font-semibold"
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Botão de Envio */}
            <button 
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-2xl text-white font-bold text-xl shadow-xl transition-all ${
                submitting ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transform hover:-translate-y-1'
              }`}
            >
              {submitting ? 'Gravando Pedido...' : 'Finalizar Pedido'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
