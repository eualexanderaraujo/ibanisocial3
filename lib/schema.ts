import { z } from 'zod';

const REDES = ['Azul', 'Vermelha', 'Verde', 'Amarela', 'Branca', 'Laranja', 'Roxa', 'Outra'] as const;
const TIPOS_RENDA = ['CLT', 'Autônomo', 'Bico', 'Benefício Social', 'Nenhuma'] as const;
const FAIXAS_RENDA = ['Sem renda', 'Até R$600', 'Até R$1000', 'Até R$2000', 'Acima de R$2000'] as const;
const PROBLEMAS_SOCIAIS = [
  'Desemprego',
  'Doença na família',
  'Violência doméstica',
  'Uso de drogas',
  'Dívidas',
  'Falta de moradia',
  'Problemas com dependentes',
  'Crise familiar',
  'Outros',
] as const;

export const cadastroSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  lider: z.string().min(2, 'Nome do líder é obrigatório'),
  telefone_lider: z.string().min(10, 'Telefone do líder inválido'),
  supervisor: z.string().min(2, 'Nome do supervisor é obrigatório'),
  telefone_supervisor: z.string().min(10, 'Telefone do supervisor inválido'),
  rede: z.enum(REDES, { errorMap: () => ({ message: 'Selecione uma rede' }) }),
  celula: z.string().min(1, 'Nome da célula é obrigatório'),
  familia: z.string().min(2, 'Nome do responsável familiar é obrigatório'),
  telefone: z.string().min(10, 'Telefone da família inválido'),
  total_pessoas: z.coerce.number().min(1, 'Informe ao menos 1 pessoa'),
  adultos: z.coerce.number().min(0),
  criancas: z.coerce.number().min(0),
  adolescentes: z.coerce.number().min(0),
  idosos: z.coerce.number().min(0),
  trabalham: z.coerce.number().min(0),
  tipo_renda: z.enum(TIPOS_RENDA, { errorMap: () => ({ message: 'Selecione o tipo de renda' }) }),
  faixa_renda: z.enum(FAIXAS_RENDA, { errorMap: () => ({ message: 'Selecione a faixa de renda' }) }),
  problemas: z.array(z.string()).default([]),
  observacao: z.string().default(''),
});

export type CadastroFormData = z.infer<typeof cadastroSchema>;
export { REDES, TIPOS_RENDA, FAIXAS_RENDA, PROBLEMAS_SOCIAIS };
