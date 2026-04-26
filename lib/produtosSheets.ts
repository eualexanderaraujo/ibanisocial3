import { getSheets, getSpreadsheetId } from '@/lib/googleSheets';
import { ProdutoInput, ProdutoRow } from '@/types/produto';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'produtos';
const HEADERS = ['id_produto', 'nome_produto', 'unidade', 'ativo', 'Adultos', 'Kids'] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A:F` });
  return { sheets, spreadsheetId, values: response.data.values ?? [] };
}

async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length === 0 || !values[0].includes('id_produto')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

function mapRow(row: string[]): ProdutoRow {
  return {
    id_produto: row[0] ?? '',
    nome_produto: row[1] ?? '',
    unidade: row[2] ?? 'kg',
    ativo: row[3] ?? 'true',
    adultos: Number(String(row[4] || '0').replace(',', '.')),
    kids: Number(String(row[5] || '0').replace(',', '.')),
  };
}

export async function getProdutos(): Promise<ProdutoRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];
  const [, ...rows] = values;
  return rows.filter(r => r.some(c => String(c ?? '').trim())).map(mapRow);
}

export async function appendProduto(data: ProdutoInput): Promise<ProdutoRow> {
  await ensureHeaders();
  const { sheets, spreadsheetId } = await getSheetValues();
  const id_produto = uuidv4().slice(0, 8).toUpperCase();
  const row: ProdutoRow = { id_produto, ...data };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:F`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_produto, row.nome_produto, row.unidade, row.ativo, row.adultos, row.kids]] },
  });
  return row;
}

export async function updateProduto(id: string, data: ProdutoInput): Promise<ProdutoRow | null> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[0] === id);
  if (idx === -1) return null;
  const absRow = idx + 2;
  const row: ProdutoRow = { id_produto: id, ...data };
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `${SHEET_NAME}!A${absRow}:F${absRow}`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_produto, row.nome_produto, row.unidade, row.ativo, row.adultos, row.kids]] },
  });
  return row;
}
