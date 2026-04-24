import { z } from 'zod';
import { CadastroInput, CaseStatus, PriorityLabel, PriorityResult } from '@/types/cadastro';

export const REDES = ['AZUL', 'VERMELHA', 'VERDE', 'AMARELA', 'BRANCA', 'LARANJA', 'ROXA', 'OUTRA'] as const;
export const TIPOS_RENDA = ['CLT', 'Autonomo', 'Bico', 'Beneficio Social', 'Nenhuma'] as const;
export const FAIXAS_RENDA = ['Sem renda', 'Ate R$600', 'Ate R$1000', 'Ate R$2000', 'Acima de R$2000'] as const;
export const PROBLEMAS_SOCIAIS = [
  'Desemprego',
  'Doenca na familia',
  'Violencia domestica',
  'Uso de drogas',
  'Dividas',
  'Falta de moradia',
  'Problemas com dependentes',
  'Crise familiar',
  'Outros',
] as const;
export const CASE_STATUSES = ['novo', 'em_analise', 'aprovado', 'entregue', 'indeferido'] as const;
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em analise',
  aprovado: 'Aprovado',
  entregue: 'Entregue',
  indeferido: 'Indeferido',
};
export const PRIORITY_COLORS: Record<PriorityLabel, string> = {
  Critica: '#b91c1c',
  Alta: '#ea580c',
  Media: '#ca8a04',
  Baixa: '#2563eb',
};
export const REDE_COLORS: Record<string, string> = {
  AZUL: '#2563eb',
  VERMELHA: '#dc2626',
  VERDE: '#16a34a',
  AMARELA: '#ca8a04',
  BRANCA: '#cbd5e1',
  LARANJA: '#ea580c',
  ROXA: '#7c3aed',
  OUTRA: '#64748b',
};

const phoneSchema = z.string().min(8, 'Telefone invalido');

export const cadastroSchema = z
  .object({
    email: z.string().email('E-mail invalido').min(1, 'E-mail e obrigatorio'),
    lider: z.string().min(2, 'Nome do lider e obrigatorio'),
    telefone_lider: phoneSchema,
    supervisor: z.string().min(2, 'Nome do supervisor e obrigatorio'),
    telefone_supervisor: phoneSchema,
    rede: z.enum(REDES, { errorMap: () => ({ message: 'Selecione uma rede' }) }),
    celula: z.string().min(1, 'Nome da celula e obrigatorio'),
    beneficiado: z.string().min(2, 'Nome do beneficiado e obrigatorio'),
    telefone: phoneSchema,
    total_pessoas: z.coerce.number().int().min(1, 'Informe ao menos 1 pessoa'),
    adultos: z.coerce.number().int().min(0),
    criancas: z.coerce.number().int().min(0),
    adolescentes: z.coerce.number().int().min(0),
    idosos: z.coerce.number().int().min(0),
    trabalham: z.string().default('Não'),
    tipo_renda: z.string().min(1, 'Informe o tipo de renda'),
    faixa_renda: z.string().min(1, 'Informe a faixa de renda'),
    problemas: z.string().default(''),
    observacao: z.string().max(1000, 'Limite de 1000 caracteres').default(''),
    tipo_cesta: z.enum(['Adulto', 'Kids']).default('Adulto'),
  })
  .superRefine((data, ctx) => {
    const somaDependentes = data.adultos + data.criancas + data.adolescentes + data.idosos;

    if (somaDependentes !== data.total_pessoas) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A soma de adultos, criancas, adolescentes e idosos deve ser igual ao total de pessoas.',
        path: ['total_pessoas'],
      });
    }

    if (data.rede === 'Outra' && data.celula.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Detalhe a rede/celula quando selecionar Outra.',
        path: ['celula'],
      });
    }
  });

export type CadastroFormData = z.infer<typeof cadastroSchema>;

export function getTipoCesta(criancas: number): 'Kids' | 'Adulto' {
  return criancas >= 1 ? 'Kids' : 'Adulto';
}

export function getStatusLabel(status: CaseStatus): string {
  return CASE_STATUS_LABELS[status];
}

export function getPriorityLabel(score: number): PriorityLabel {
  if (score >= 11) return 'Critica';
  if (score >= 8) return 'Alta';
  if (score >= 5) return 'Media';
  return 'Baixa';
}

export function calculatePriority(data: CadastroInput): PriorityResult {
  let score = 0;
  const reasons: string[] = [];

  const addScore = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  const rendaPoints: Record<string, number> = {
    'Sem renda': 5,
    'Ate R$600': 4,
    'Ate R$1000': 3,
    'Ate R$2000': 1,
    'Acima de R$2000': 0,
  };

  const rendaReason: Record<string, string> = {
    'Sem renda': 'familia sem renda',
    'Ate R$600': 'renda muito baixa',
    'Ate R$1000': 'renda baixa',
    'Ate R$2000': 'renda limitada',
    'Acima de R$2000': 'renda acima da faixa prioritaria',
  };

  const rendaKey = Object.keys(rendaPoints).find(k => data.faixa_renda?.toLowerCase().includes(k.toLowerCase())) || data.faixa_renda;
  const rendaScore = rendaPoints[rendaKey] ?? 0;
  if (rendaScore > 0) addScore(rendaScore, rendaReason[data.faixa_renda]);

  if (data.criancas >= 3) addScore(3, 'tres ou mais criancas');
  else if (data.criancas >= 1) addScore(2, 'ha criancas na familia');

  if (data.idosos >= 2) addScore(3, 'dois ou mais idosos');
  else if (data.idosos >= 1) addScore(2, 'ha idoso na familia');

  if (data.trabalham === 'Não') addScore(2, 'nenhuma pessoa trabalhando');

  if (data.problemas && data.problemas.length > 5) {
    addScore(1, 'problemas sociais relatados');
  }

  const label = getPriorityLabel(score);
  return { score, label, reasons };
}
