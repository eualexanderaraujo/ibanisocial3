'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Stepper from '@/components/Stepper';
import FormSection from '@/components/FormSection';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import CheckboxGroup from '@/components/CheckboxGroup';
import { CadastroFormData, FAIXAS_RENDA, PROBLEMAS_SOCIAIS, REDES, TIPOS_RENDA, cadastroSchema } from '@/lib/schema';

const STEPS = [
  'Identificacao',
  'Responsavel',
  'Estrutura',
  'Familia',
  'Composicao',
  'Economica',
  'Social',
  'Observacoes',
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

type Status = 'idle' | 'loading' | 'success' | 'error';

interface SubmissionResult {
  id: string;
  prioridade: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      problemas: [],
      observacao: '',
    },
  });

  const adultos = watch('adultos');
  const criancas = watch('criancas');
  const adolescentes = watch('adolescentes');
  const idosos = watch('idosos');
  const totalPessoasCalculado =
    Number(adultos || 0) +
    Number(criancas || 0) +
    Number(adolescentes || 0) +
    Number(idosos || 0);

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((current) => Math.max(current - 1, 0));

  const startNewCadastro = () => {
    reset();
    setStep(0);
    setStatus('idle');
    setErrorMsg('');
    setSubmissionResult(null);
  };

  const onSubmit = async (data: CadastroFormData) => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao enviar');
      }

      setSubmissionResult({
        id: payload.id ?? '',
        prioridade: payload.prioridade ?? 'Em analise',
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : 'Nao foi possivel enviar o cadastro. Tente novamente.');
    }
  };

  if (status === 'success' && submissionResult) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cadastro enviado</h2>
          <p className="text-gray-500 mb-6">
            Seu pedido foi registrado com sucesso. Guarde o protocolo abaixo para acompanhamento interno.
          </p>
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-left mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700 mb-1">Protocolo</p>
            <p className="text-2xl font-extrabold text-brand-800">{submissionResult.id}</p>
            <p className="text-sm text-brand-700 mt-3">
              Prioridade inicial: <span className="font-semibold">{submissionResult.prioridade}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={startNewCadastro}
              className="w-full py-3 px-6 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors"
            >
              Novo cadastro
            </button>
            <Link
              href="/"
              className="w-full py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Voltar ao inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-600 text-sm font-semibold mb-4 hover:underline">
            Voltar ao inicio
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Cadastro de cesta de alimentacao</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha todas as etapas para solicitar atendimento.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <Stepper steps={STEPS} current={step} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 0 && (
              <FormSection title="Identificacao" icon="1">
                <p className="text-xs text-gray-400 -mt-2 mb-4">
                  A data do cadastro e registrada automaticamente no envio.
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

            {step === 1 && (
              <FormSection title="Responsavel pela celula" icon="2">
                <InputField label="Nome do lider" placeholder="Joao da Silva" required error={errors.lider?.message} {...register('lider')} />
                <Controller
                  name="telefone_lider"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone do lider"
                      placeholder="(21) 99999-9999"
                      required
                      error={errors.telefone_lider?.message}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(formatPhone(event.target.value))}
                    />
                  )}
                />
                <InputField label="Nome do supervisor" placeholder="Maria Souza" required error={errors.supervisor?.message} {...register('supervisor')} />
                <Controller
                  name="telefone_supervisor"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone do supervisor"
                      placeholder="(21) 98888-8888"
                      required
                      error={errors.telefone_supervisor?.message}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(formatPhone(event.target.value))}
                    />
                  )}
                />
              </FormSection>
            )}

            {step === 2 && (
              <FormSection title="Estrutura da rede" icon="3">
                <SelectField label="Rede" options={REDES} required error={errors.rede?.message} {...register('rede')} />
                <InputField label="Nome da celula" placeholder="Emmanuel, Betel..." required error={errors.celula?.message} {...register('celula')} />
              </FormSection>
            )}

            {step === 3 && (
              <FormSection title="Dados da familia" icon="4">
                <InputField label="Nome do responsavel familiar" placeholder="Ana Oliveira" required error={errors.familia?.message} {...register('familia')} />
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Telefone da familia"
                      placeholder="(21) 97777-7777"
                      required
                      error={errors.telefone?.message}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(formatPhone(event.target.value))}
                    />
                  )}
                />
              </FormSection>
            )}

            {step === 4 && (
              <FormSection title="Composicao familiar" icon="5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Adultos"
                    type="number"
                    min={0}
                    placeholder="Informe a quantidade"
                    error={errors.adultos?.message}
                    {...register('adultos', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
                  />
                  <InputField
                    label="Criancas"
                    type="number"
                    min={0}
                    placeholder="Informe a quantidade"
                    error={errors.criancas?.message}
                    {...register('criancas', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
                  />
                  <InputField
                    label="Adolescentes"
                    type="number"
                    min={0}
                    placeholder="Informe a quantidade"
                    error={errors.adolescentes?.message}
                    {...register('adolescentes', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
                  />
                  <InputField
                    label="Idosos"
                    type="number"
                    min={0}
                    placeholder="Informe a quantidade"
                    error={errors.idosos?.message}
                    {...register('idosos', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
                  />
                </div>
                <input type="hidden" value={totalPessoasCalculado} {...register('total_pessoas', { valueAsNumber: true })} />
                <InputField
                  label="Total de pessoas"
                  type="number"
                  value={totalPessoasCalculado}
                  readOnly
                  disabled
                  error={errors.total_pessoas?.message}
                />
                <p className="text-xs text-gray-500">
                  A soma das faixas etarias deve bater com o total de pessoas.
                </p>
              </FormSection>
            )}

            {step === 5 && (
              <FormSection title="Situacao economica" icon="6">
                <InputField label="Quantas pessoas trabalham?" type="number" min={0} error={errors.trabalham?.message} {...register('trabalham')} />
                <SelectField label="Tipo de renda" options={TIPOS_RENDA} required error={errors.tipo_renda?.message} {...register('tipo_renda')} />
                <SelectField label="Faixa de renda" options={FAIXAS_RENDA} required error={errors.faixa_renda?.message} {...register('faixa_renda')} />
              </FormSection>
            )}

            {step === 6 && (
              <FormSection title="Situacao social" icon="7">
                <p className="text-sm text-gray-500 -mt-2">Marque todos os problemas que a familia enfrenta atualmente.</p>
                <Controller
                  name="problemas"
                  control={control}
                  render={({ field }) => (
                    <CheckboxGroup
                      label=""
                      options={PROBLEMAS_SOCIAIS}
                      values={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormSection>
            )}

            {step === 7 && (
              <FormSection title="Observacoes" icon="8">
                <div className="flex flex-col gap-1">
                  <label htmlFor="observacao" className="text-sm font-semibold text-gray-700">
                    Informacoes adicionais <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="observacao"
                    rows={5}
                    placeholder="Descreva a situacao da familia com mais detalhes..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                    {...register('observacao')}
                  />
                  {errors.observacao?.message && <p className="text-xs text-red-600">{errors.observacao.message}</p>}
                </div>

                <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-sm font-semibold text-brand-800 mb-2">Resumo do cadastro</p>
                  <div className="text-xs text-brand-700 space-y-1">
                    <p><span className="font-medium">Familia:</span> {watch('familia') || '-'}</p>
                    <p><span className="font-medium">Rede / celula:</span> {(watch('rede') || '-')} / {(watch('celula') || '-')}</p>
                    <p><span className="font-medium">Total de pessoas:</span> {watch('total_pessoas') ?? '-'}</p>
                    <p><span className="font-medium">Renda:</span> {watch('faixa_renda') || '-'}</p>
                  </div>
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {errorMsg}
                  </div>
                )}
              </FormSection>
            )}

            <div className="flex justify-between mt-8 gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  key="next-step-button"
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                >
                  Proximo
                </button>
              ) : (
                <button
                  key="submit-cadastro-button"
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 py-3 px-6 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-gray-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Enviando...' : 'Enviar cadastro'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
