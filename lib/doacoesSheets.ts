import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { DoacaoInput, DoacaoRow } from '@/types/doacao';
import { incrementarEstoquePorNome } from '@/lib/estoqueSheets';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'doacoes';
const HEADERS = ['id_doacao', 'Rede', 'Celula', 'Produto', 'Quantidade (kg)', 'Observacoes', 'Data_doacao'] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A:G` });
  return { sheets, spreadsheetId, values: response.data.values ?? [] };
}

async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const firstRow = values[0] ?? [];
  if (firstRow.length === 0 || !firstRow.includes('id_doacao')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

function parseSafeNumber(val: any): number {
  const s = String(val || '0').trim().replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function mapRow(row: string[]): DoacaoRow {
  return {
    id_doacao: String(row[0] ?? '').trim(),
    rede: String(row[1] ?? '').trim(),
    celula: String(row[2] ?? '').trim(),
    nome_produto: String(row[3] ?? '').trim(),
    quantidade_kg: parseSafeNumber(row[4]),
    observacao: String(row[5] ?? '').trim(),
    data_doacao: String(row[6] ?? '').trim(),
  };
}

export async function getDoacoes(): Promise<DoacaoRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];
  const [, ...rows] = values;
  return rows.filter(r => r.some(c => String(c ?? '').trim())).map(mapRow);
}

export async function appendDoacao(data: DoacaoInput, sharedId?: string): Promise<DoacaoRow> {
  await ensureHeaders();
  const { sheets, spreadsheetId } = await getSheetValues();

  const id_doacao = sharedId ?? uuidv4().slice(0, 8).toUpperCase();
  const timestamp = getTimestampParts();

  const row: DoacaoRow = {
    id_doacao,
    data_doacao: timestamp.iso,
    ...data,
  };

  // 1. Salva na planilha de doações
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:G`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_doacao, row.rede, row.celula, row.nome_produto, row.quantidade_kg, row.observacao, row.data_doacao]] },
  });

  // 2. Incrementa o estoque
  await incrementarEstoquePorNome(row.nome_produto, row.quantidade_kg);

  return row;
}
