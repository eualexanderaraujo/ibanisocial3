'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Stepper from '@/components/Stepper';
import FormSection from '@/components/FormSection';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import CheckboxGroup from '@/components/CheckboxGroup';
import { cadastroSchema, CadastroFormData, REDES, TIPOS_RENDA, FAIXAS_RENDA, PROBLEMAS_SOCIAIS } from '@/lib/schema';

const STEPS = [
  'Identificação',
  'Responsável',
  'Estrutura',
  'Família',
  'Composição',
  'Econômica',
  'Social',
  'Observações',
];

const STEP_FIELDS: (keyof CadastroFormData)[][] = [
  ['email'],
  ['lider', 'telefone_lider', 'supervisor', 'telefone_supervisor'],
  ['rede', 'celula'],
  ['familia', 'telefone'],
  ['total_pessoas', 'adultos', 'criancas', 'adolescentes', 'idosos'],
  ['trabalham', 'tipo_renda', 'faixa_renda'],
  ['problemas'],
  ['observacao'],
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { problemas: [] },
  });

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: CadastroFormData) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao enviar');
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Não foi possível enviar o cadastro. Tente novamente.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro enviado!</h2>
          <p className="text-gray-500 mb-8">
            Seu pedido de cesta foi registrado com sucesso. Nossa equipe entrará em contato em breve.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setStatus('idle'); setStep(0); }}
              className="w-full py-3 px-6 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors"
            >
              Novo Cadastro
            </button>
            <Link href="/" className="w-full py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-center">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold mb-4 hover:underline">
            ← Início
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Cadastro de Cesta de Alimentação</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha todas as etapas para solicitar sua cesta</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <Stepper steps={STEPS} current={step} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Etapa 0 — Identificação */}
            {step === 0 && (
              <FormSection title="Identificação" icon="🪪">
                <p className="text-xs text-gray-400 -mt-2 mb-4">
                  Data de hoje: {new Date().toLocaleDateString('pt-BR')} — preenchida automaticamente
                </p>
                <InputField
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
              </FormSection>
            )}

            {/* Etapa 1 — Responsável */}
            {step === 1 && (
              <FormSection title="Responsável pela Célula" icon="👤">
                <InputField label="Nome do Líder" placeholder="João da Silva" required error={errors.lider?.message} {...register('lider')} />
                <Controller
                  name="telefone_lider"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone do Líder"
                      placeholder="(21) 99999-9999"
                      required
                      error={errors.telefone_lider?.message}
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  )}
                />
                <InputField label="Nome do Supervisor" placeholder="Maria Souza" required error={errors.supervisor?.message} {...register('supervisor')} />
                <Controller
                  name="telefone_supervisor"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone do Supervisor"
                      placeholder="(21) 98888-8888"
                      required
                      error={errors.telefone_supervisor?.message}
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  )}
                />
              </FormSection>
            )}

            {/* Etapa 2 — Estrutura */}
            {step === 2 && (
              <FormSection title="Estrutura da Rede" icon="🏛️">
                <SelectField label="Rede" options={REDES} required error={errors.rede?.message} {...register('rede')} />
                <InputField label="Nome da Célula" placeholder="Emmanuel, Betel..." required error={errors.celula?.message} {...register('celula')} />
              </FormSection>
            )}

            {/* Etapa 3 — Família */}
            {step === 3 && (
              <FormSection title="Dados da Família" icon="👨‍👩‍👧‍👦">
                <InputField label="Nome do Responsável Familiar" placeholder="Ana Oliveira" required error={errors.familia?.message} {...register('familia')} />
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone da Família"
                      placeholder="(21) 97777-7777"
                      required
                      error={errors.telefone?.message}
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  )}
                />
              </FormSection>
            )}

            {/* Etapa 4 — Composição */}
            {step === 4 && (
              <FormSection title="Composição Familiar" icon="📊">
                <InputField label="Total de Pessoas" type="number" min={1} required error={errors.total_pessoas?.message} {...register('total_pessoas')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Adultos" type="number" min={0} error={errors.adultos?.message} {...register('adultos')} />
                  <InputField label="Crianças" type="number" min={0} error={errors.criancas?.message} {...register('criancas')} />
                  <InputField label="Adolescentes" type="number" min={0} error={errors.adolescentes?.message} {...register('adolescentes')} />
                  <InputField label="Idosos" type="number" min={0} error={errors.idosos?.message} {...register('idosos')} />
                </div>
              </FormSection>
            )}

            {/* Etapa 5 — Situação Econômica */}
            {step === 5 && (
              <FormSection title="Situação Econômica" icon="💰">
                <InputField label="Quantas pessoas trabalham?" type="number" min={0} error={errors.trabalham?.message} {...register('trabalham')} />
                <SelectField label="Tipo de Renda" options={TIPOS_RENDA} required error={errors.tipo_renda?.message} {...register('tipo_renda')} />
                <SelectField label="Faixa de Renda" options={FAIXAS_RENDA} required error={errors.faixa_renda?.message} {...register('faixa_renda')} />
              </FormSection>
            )}

            {/* Etapa 6 — Situação Social */}
            {step === 6 && (
              <FormSection title="Situação Social" icon="🤝">
                <p className="text-sm text-gray-500 -mt-2">Marque todos os problemas que a família enfrenta atualmente.</p>
                <Controller
                  name="problemas"
                  control={control}
                  render={({ field }) => (
                    <CheckboxGroup
                      label=""
                      options={PROBLEMAS_SOCIAIS}
                      values={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormSection>
            )}

            {/* Etapa 7 — Observações */}
            {step === 7 && (
              <FormSection title="Observações" icon="📝">
                <div className="flex flex-col gap-1">
                  <label htmlFor="observacao" className="text-sm font-semibold text-gray-700">
                    Informações adicionais <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="observacao"
                    rows={5}
                    placeholder="Descreva a situação da família com mais detalhes..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                    {...register('observacao')}
                  />
                </div>

                {/* Resumo */}
                <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-sm font-semibold text-brand-800 mb-2">📋 Resumo do Cadastro</p>
                  <div className="text-xs text-brand-700 space-y-1">
                    <p><span className="font-medium">Família:</span> {watch('familia')}</p>
                    <p><span className="font-medium">Rede / Célula:</span> {watch('rede')} / {watch('celula')}</p>
                    <p><span className="font-medium">Total de pessoas:</span> {watch('total_pessoas')}</p>
                    <p><span className="font-medium">Renda:</span> {watch('faixa_renda')}</p>
                  </div>
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {errorMsg}
                  </div>
                )}
              </FormSection>
            )}

            {/* Navegação */}
            <div className="flex justify-between mt-8 gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
              ) : <div className="flex-1" />}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 py-3 px-6 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-gray-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : '✅ Enviar Cadastro'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
