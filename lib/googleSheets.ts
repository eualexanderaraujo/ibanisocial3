import { google } from 'googleapis';
import { calculatePriority, getTipoCesta } from '@/lib/schema';
import { CadastroInput, CadastroRow, CaseStatus, PriorityResult } from '@/types/cadastro';
import { reservarEstoquePorPedido } from '@/lib/estoqueSheets';

const SHEET_NAME = 'pedidos';
const HEADERS = [
  'id_pedido',
  'data',
  'email',
  'rede',
  'celula',
  'lider',
  'telefone_lider',
  'supervisor',
  'telefone_supervisor',
  'beneficiado',
  'telefone',
  'total_pessoas',
  'adultos',
  'criancas',
  'adolescentes',
  'idosos',
  'trabalham',
  'tipo_renda',
  'faixa_renda',
  'problemas',
  'observacao',
  'prioridade_score',
  'prioridade_label',
  'prioridade_motivos',
  'status',
  'observacoes_internas',
  'atualizado_em',
  'atualizado_em_iso',
  'protocolo',
  'tipo_cesta',
] as const;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function getAuth() {
  const privateKey = getRequiredEnv('GOOGLE_PRIVATE_KEY')
    .replace(/\\n/g, '\n')
    .replace(/^"|"$/g, '');

  return new google.auth.JWT({
    email: getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function getSheets() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

export function getSpreadsheetId() {
  return getRequiredEnv('GOOGLE_SHEET_ID');
}

export function getTimestampParts(reference = new Date()) {
  return {
    iso: reference.toISOString(),
    display: new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(reference),
  };
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseList(value: string) {
  if (!value.trim()) return [];
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeList(values: string[]) {
  return values.join('|');
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value.trim());
}

function isEmail(value: string) {
  return /.+@.+\..+/.test(value.trim());
}

function parseDisplayDateToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) return '';

  const [, day, month, year, hours, minutes, seconds = '00'] = match;
  const utcDate = new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours) + 3,
    Number(minutes),
    Number(seconds)
  ));

  return Number.isNaN(utcDate.getTime()) ? '' : utcDate.toISOString();
}

function normalizePriority(rawScore: string, rawLabel: string, rawReasons: string, input: CadastroInput): PriorityResult {
  const fallback = calculatePriority(input);
  const score = parseNumber(rawScore);

  if (!score && !rawLabel && !rawReasons) {
    return fallback;
  }

  return {
    score: score || fallback.score,
    label: (rawLabel as PriorityResult['label']) || fallback.label,
    reasons: parseList(rawReasons).length > 0 ? parseList(rawReasons) : fallback.reasons,
  };
}

function mapLegacyRow(row: string[]): CadastroRow {
  const input: CadastroInput = {
    email: row[2] ?? '',
    rede: row[3] ?? '',
    celula: row[4] ?? '',
    lider: row[5] ?? '',
    telefone_lider: row[6] ?? '',
    supervisor: row[7] ?? '',
    telefone_supervisor: row[8] ?? '',
    beneficiado: row[9] ?? '',
    telefone: row[10] ?? '',
    total_pessoas: parseNumber(row[12] ?? ''),
    adultos: parseNumber(row[13] ?? ''),
    criancas: parseNumber(row[14] ?? ''),
    adolescentes: parseNumber(row[15] ?? ''),
    idosos: parseNumber(row[16] ?? ''),
    trabalham: row[17] ?? 'Não',
    tipo_renda: row[18] ?? '',
    faixa_renda: row[19] ?? '',
    problemas: row[20] ?? '',
    observacao: '',
  };

  const priority = calculatePriority(input);
  const data = row[1] ?? '';
  const displayDate = row[1] ?? '';

  return {
    id_pedido: row[0] ?? '',
    protocolo: row[0] ?? '',
    tipo_cesta: getTipoCesta(input.criancas),
    data: displayDate,
    ...input,
    prioridade_score: priority.score,
    prioridade_label: priority.label,
    prioridade_motivos: priority.reasons,
    status: 'novo',
    observacoes_internas: '',
    atualizado_em: '',
    atualizado_em_iso: '',
  };
}

function mapCurrentRow(row: string[]): CadastroRow {
  const input: CadastroInput = {
    email: row[3] ?? '',
    rede: row[4] ?? '',
    celula: row[5] ?? '',
    lider: row[6] ?? '',
    telefone_lider: row[7] ?? '',
    supervisor: row[8] ?? '',
    telefone_supervisor: row[9] ?? '',
    beneficiado: row[10] ?? '',
    telefone: row[11] ?? '',
    total_pessoas: parseNumber(row[12] ?? ''),
    adultos: parseNumber(row[13] ?? ''),
    criancas: parseNumber(row[14] ?? ''),
    adolescentes: parseNumber(row[15] ?? ''),
    idosos: parseNumber(row[16] ?? ''),
    trabalham: row[17] ?? 'Não',
    tipo_renda: row[18] ?? '',
    faixa_renda: row[19] ?? '',
    problemas: row[20] ?? '',
    observacao: row[21] ?? '',
  };

  const priority = normalizePriority(row[22] ?? '', row[23] ?? '', row[24] ?? '', input);

  return {
    id_pedido: row[0] ?? '',
    protocolo: row[29] ?? row[0] ?? '',
    tipo_cesta: (row[30] as 'Kids' | 'Adulto') || getTipoCesta(input.criancas),
    data: row[1] ?? '',
    ...input,
    prioridade_score: priority.score,
    prioridade_label: priority.label,
    prioridade_motivos: priority.reasons,
    status: (row[25] as CaseStatus) || 'novo',
    observacoes_internas: row[26] ?? '',
    atualizado_em: row[27] ?? '',
    atualizado_em_iso: row[28] ?? '',
  };
}

function mapRow(row: string[]): CadastroRow {
  const dataIsoValue = row[2] ?? '';
  const emailValue = row[3] ?? '';

  if (!isIsoDate(dataIsoValue) && isEmail(dataIsoValue) && !isEmail(emailValue)) {
    return mapLegacyRow(row);
  }
  return mapCurrentRow(row);
}

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:AD`,
  });

  return {
    sheets,
    spreadsheetId,
    values: response.data.values ?? [],
  };
}

export async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const currentHeaders = values[0] ?? [];
  const missingHeaders = HEADERS.filter((header) => !currentHeaders.includes(header));
  const normalizedHeaders = HEADERS.map((header) => header);
  const isOrderCorrect = HEADERS.every((h, i) => currentHeaders[i] === h);
  const shouldUpdateHeaders = currentHeaders.length === 0 || missingHeaders.length > 0 || !isOrderCorrect;

  if (shouldUpdateHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [normalizedHeaders],
      },
    });
  }
}

export async function appendRow(id: string, data: CadastroInput): Promise<CadastroRow> {
  await ensureHeaders();

  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const timestamp = getTimestampParts();
  const priority = calculatePriority(data);
  const tipo_cesta = getTipoCesta(data.criancas);

  const row: CadastroRow = {
    id_pedido: id,
    protocolo: id,
    tipo_cesta,
    data: timestamp.display,
    ...data,
    prioridade_score: priority.score,
    prioridade_label: priority.label,
    prioridade_motivos: priority.reasons,
    status: 'novo',
    observacoes_internas: '',
    atualizado_em: timestamp.display,
    atualizado_em_iso: timestamp.iso,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:AD`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        row.id_pedido,
        row.data,
        row.email,
        row.rede,
        row.celula,
        row.lider,
        row.telefone_lider,
        row.supervisor,
        row.telefone_supervisor,
        row.beneficiado,
        row.telefone,
        row.total_pessoas,
        row.adultos,
        row.criancas,
        row.adolescentes,
        row.idosos,
        row.trabalham,
        row.tipo_renda,
        row.faixa_renda,
        row.problemas,
        row.observacao,
        row.prioridade_score,
        row.prioridade_label,
        serializeList(row.prioridade_motivos),
        row.status,
        row.observacoes_internas,
        row.atualizado_em,
        row.atualizado_em_iso,
        row.protocolo,
        row.tipo_cesta,
      ]],
    },
  });

  // Reserva o estoque automaticamente
  await reservarEstoquePorPedido(row.tipo_cesta);

  return row;
}

export async function getRows(): Promise<CadastroRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];

  const [, ...dataRows] = values;

  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => mapRow(row));
}

export async function updateCaseRow(
  id: string,
  updates: Pick<CadastroRow, 'status' | 'observacoes_internas'>
): Promise<CadastroRow | null> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length <= 1) return null;

  const [, ...dataRows] = values;
  const targetIndex = dataRows.findIndex((row) => (row[0] ?? '') === id);

  if (targetIndex === -1) return null;

  const absoluteRowIndex = targetIndex + 2;
  const currentRow = mapRow(dataRows[targetIndex]);
  const timestamp = getTimestampParts();
  const priority = calculatePriority(currentRow);
  const nextRow: CadastroRow = {
    ...currentRow,
    prioridade_score: priority.score,
    prioridade_label: priority.label,
    prioridade_motivos: priority.reasons,
    status: updates.status,
    observacoes_internas: updates.observacoes_internas.trim(),
    atualizado_em: timestamp.display,
    atualizado_em_iso: timestamp.iso,
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${absoluteRowIndex}:AE${absoluteRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        nextRow.id_pedido,
        nextRow.data,
        nextRow.email,
        nextRow.rede,
        nextRow.celula,
        nextRow.lider,
        nextRow.telefone_lider,
        nextRow.supervisor,
        nextRow.telefone_supervisor,
        nextRow.beneficiado,
        nextRow.telefone,
        nextRow.total_pessoas,
        nextRow.adultos,
        nextRow.criancas,
        nextRow.adolescentes,
        nextRow.idosos,
        nextRow.trabalham,
        nextRow.tipo_renda,
        nextRow.faixa_renda,
        nextRow.problemas,
        nextRow.observacao,
        nextRow.prioridade_score,
        nextRow.prioridade_label,
        serializeList(nextRow.prioridade_motivos),
        nextRow.status,
        nextRow.observacoes_internas,
        nextRow.atualizado_em,
        nextRow.atualizado_em_iso,
        nextRow.protocolo,
        nextRow.tipo_cesta,
      ]],
    },
  });

  return nextRow;
}
