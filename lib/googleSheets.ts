import { google } from 'googleapis';
import { calculatePriority } from '@/lib/schema';
import { CadastroInput, CadastroRow, CaseStatus, PriorityResult } from '@/types/cadastro';

const SHEET_NAME = 'cadastro_raw';
const HEADERS = [
  'id',
  'data',
  'data_iso',
  'email',
  'rede',
  'celula',
  'lider',
  'telefone_lider',
  'supervisor',
  'telefone_supervisor',
  'familia',
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

async function getSheets() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

function getSpreadsheetId() {
  return getRequiredEnv('GOOGLE_SHEET_ID');
}

function getTimestampParts(reference = new Date()) {
  return {
    iso: reference.toISOString(),
    display: new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(reference),
  };
}

function buildHeaderIndex(headers: string[]) {
  return headers.reduce<Record<string, number>>((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});
}

function getCell(row: string[], headerIndex: Record<string, number>, key: string) {
  const index = headerIndex[key];
  return index === undefined ? '' : row[index] ?? '';
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

function mapRow(row: string[], headerIndex: Record<string, number>): CadastroRow {
  const input: CadastroInput = {
    email: getCell(row, headerIndex, 'email'),
    lider: getCell(row, headerIndex, 'lider'),
    telefone_lider: getCell(row, headerIndex, 'telefone_lider'),
    supervisor: getCell(row, headerIndex, 'supervisor'),
    telefone_supervisor: getCell(row, headerIndex, 'telefone_supervisor'),
    rede: getCell(row, headerIndex, 'rede'),
    celula: getCell(row, headerIndex, 'celula'),
    familia: getCell(row, headerIndex, 'familia'),
    telefone: getCell(row, headerIndex, 'telefone'),
    total_pessoas: parseNumber(getCell(row, headerIndex, 'total_pessoas')),
    adultos: parseNumber(getCell(row, headerIndex, 'adultos')),
    criancas: parseNumber(getCell(row, headerIndex, 'criancas')),
    adolescentes: parseNumber(getCell(row, headerIndex, 'adolescentes')),
    idosos: parseNumber(getCell(row, headerIndex, 'idosos')),
    trabalham: parseNumber(getCell(row, headerIndex, 'trabalham')),
    tipo_renda: getCell(row, headerIndex, 'tipo_renda'),
    faixa_renda: getCell(row, headerIndex, 'faixa_renda'),
    problemas: parseList(getCell(row, headerIndex, 'problemas')),
    observacao: getCell(row, headerIndex, 'observacao'),
  };

  const priority = normalizePriority(
    getCell(row, headerIndex, 'prioridade_score'),
    getCell(row, headerIndex, 'prioridade_label'),
    getCell(row, headerIndex, 'prioridade_motivos'),
    input
  );

  return {
    id: getCell(row, headerIndex, 'id'),
    data: getCell(row, headerIndex, 'data'),
    data_iso: getCell(row, headerIndex, 'data_iso'),
    ...input,
    prioridade_score: priority.score,
    prioridade_label: priority.label,
    prioridade_motivos: priority.reasons,
    status: (getCell(row, headerIndex, 'status') as CaseStatus) || 'novo',
    observacoes_internas: getCell(row, headerIndex, 'observacoes_internas'),
    atualizado_em: getCell(row, headerIndex, 'atualizado_em'),
    atualizado_em_iso: getCell(row, headerIndex, 'atualizado_em_iso'),
  };
}

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:AC`,
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
  const normalizedHeaders = HEADERS.map((header, index) => currentHeaders[index] ?? header);
  const shouldUpdateHeaders = currentHeaders.length === 0 || missingHeaders.length > 0 || normalizedHeaders.length !== currentHeaders.length;

  if (shouldUpdateHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

export async function appendRow(id: string, data: CadastroInput): Promise<CadastroRow> {
  await ensureHeaders();

  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const timestamp = getTimestampParts();
  const priority = calculatePriority(data);

  const row: CadastroRow = {
    id,
    data: timestamp.display,
    data_iso: timestamp.iso,
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
    range: `${SHEET_NAME}!A:AC`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.id,
        row.data,
        row.data_iso,
        row.email,
        row.rede,
        row.celula,
        row.lider,
        row.telefone_lider,
        row.supervisor,
        row.telefone_supervisor,
        row.familia,
        row.telefone,
        row.total_pessoas,
        row.adultos,
        row.criancas,
        row.adolescentes,
        row.idosos,
        row.trabalham,
        row.tipo_renda,
        row.faixa_renda,
        serializeList(row.problemas),
        row.observacao,
        row.prioridade_score,
        row.prioridade_label,
        serializeList(row.prioridade_motivos),
        row.status,
        row.observacoes_internas,
        row.atualizado_em,
        row.atualizado_em_iso,
      ]],
    },
  });

  return row;
}

export async function getRows(): Promise<CadastroRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];

  const [headers, ...dataRows] = values;
  const headerIndex = buildHeaderIndex(headers);

  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => mapRow(row, headerIndex));
}

export async function updateCaseRow(
  id: string,
  updates: Pick<CadastroRow, 'status' | 'observacoes_internas'>
): Promise<CadastroRow | null> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length <= 1) return null;

  const [headers, ...dataRows] = values;
  const headerIndex = buildHeaderIndex(headers);
  const targetIndex = dataRows.findIndex((row) => getCell(row, headerIndex, 'id') === id);

  if (targetIndex === -1) return null;

  const absoluteRowIndex = targetIndex + 2;
  const currentRow = mapRow(dataRows[targetIndex], headerIndex);
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
    range: `${SHEET_NAME}!A${absoluteRowIndex}:AC${absoluteRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        nextRow.id,
        nextRow.data,
        nextRow.data_iso,
        nextRow.email,
        nextRow.rede,
        nextRow.celula,
        nextRow.lider,
        nextRow.telefone_lider,
        nextRow.supervisor,
        nextRow.telefone_supervisor,
        nextRow.familia,
        nextRow.telefone,
        nextRow.total_pessoas,
        nextRow.adultos,
        nextRow.criancas,
        nextRow.adolescentes,
        nextRow.idosos,
        nextRow.trabalham,
        nextRow.tipo_renda,
        nextRow.faixa_renda,
        serializeList(nextRow.problemas),
        nextRow.observacao,
        nextRow.prioridade_score,
        nextRow.prioridade_label,
        serializeList(nextRow.prioridade_motivos),
        nextRow.status,
        nextRow.observacoes_internas,
        nextRow.atualizado_em,
        nextRow.atualizado_em_iso,
      ]],
    },
  });

  return nextRow;
}
