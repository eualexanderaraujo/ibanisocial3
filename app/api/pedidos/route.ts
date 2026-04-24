import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { appendRow, getTimestampParts } from '@/lib/googleSheets';
import { calculatePriority, getTipoCesta } from '@/lib/schema';

// Schema relaxado para o formulário simplificado de /pedidos
const pedidoSchema = z.object({
  // Dados da célula — todos opcionais pois são auto-preenchidos
  celula: z.string().min(1, 'Selecione uma célula'),
  rede: z.string().default(''),
  lider: z.string().default(''),
  telefone_lider: z.string().default(''),
  supervisor: z.string().default(''),
  telefone_supervisor: z.string().default(''),
  email: z.string().default(''),
  // Dados do beneficiado
  beneficiado: z.string().min(2, 'Nome do beneficiado é obrigatório'),
  telefone: z.string().min(8, 'Telefone inválido'),
  total_pessoas: z.coerce.number().int().min(1, 'Informe ao menos 1 pessoa'),
  adultos: z.coerce.number().int().min(0).default(0),
  criancas: z.coerce.number().int().min(0).default(0),
  adolescentes: z.coerce.number().int().min(0).default(0),
  idosos: z.coerce.number().int().min(0).default(0),
  // Socioeconômico — campos livres
  trabalham: z.string().default('Não'),   // 'Sim' | 'Não'
  tipo_renda: z.string().default(''),
  faixa_renda: z.string().default(''),
  problemas: z.string().default(''),      // texto livre
  observacao: z.string().default(''),
  tipo_cesta: z.enum(['Adulto', 'Kids']).default('Adulto'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = pedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const id = uuidv4().slice(0, 8).toUpperCase();

    // Converte para o formato esperado por appendRow (CadastroInput)
    const input = {
      email: d.email,
      lider: d.lider,
      telefone_lider: d.telefone_lider,
      supervisor: d.supervisor,
      telefone_supervisor: d.telefone_supervisor,
      rede: d.rede.toUpperCase() || 'OUTRA',
      celula: d.celula,
      beneficiado: d.beneficiado,
      telefone: d.telefone,
      total_pessoas: d.total_pessoas,
      adultos: d.adultos,
      criancas: d.criancas,
      adolescentes: d.adolescentes,
      idosos: d.idosos,
      trabalham: d.trabalham === 'Sim' ? 1 : 0,
      tipo_renda: d.tipo_renda || 'Nenhuma',
      faixa_renda: d.faixa_renda || 'Sem renda',
      problemas: d.problemas ? [d.problemas] : [],
      observacao: d.observacao,
      tipo_cesta: d.tipo_cesta,
    };

    const row = await appendRow(id, input);

    return NextResponse.json(
      { success: true, id: row.id_pedido, protocolo: row.protocolo, prioridade: row.prioridade_label },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/pedidos]', err);
    return NextResponse.json({ error: 'Erro ao gravar os dados' }, { status: 500 });
  }
}
