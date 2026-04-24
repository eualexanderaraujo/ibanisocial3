import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { DoacaoInput, DoacaoRow } from '@/types/doacao';
import { getProdutos } from '@/lib/produtosSheets';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'doacoes';
const HEADERS = ['id_doacao', 'data', 'rede', 'celula', 'id_produto', 'nome_produto', 'quantidade_kg', 'observacao'] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A:H` });
  return { sheets, spreadsheetId, values: response.data.values ?? [] };
}

async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length === 0 || !values[0].includes('id_doacao')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

function mapRow(row: string[]): DoacaoRow {
  return {
    id_doacao: row[0] ?? '',
    data: row[1] ?? '',
    rede: row[2] ?? '',
    celula: row[3] ?? '',
    id_produto: row[4] ?? '',
    nome_produto: row[5] ?? '',
    quantidade_kg: Number(row[6] ?? 0),
    observacao: row[7] ?? '',
  };
}

export async function getDoacoes(): Promise<DoacaoRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];
  const [, ...rows] = values;
  return rows.filter(r => r.some(c => String(c ?? '').trim())).map(mapRow);
}

export async function appendDoacao(data: DoacaoInput): Promise<DoacaoRow> {
  await ensureHeaders();
  const { sheets, spreadsheetId } = await getSheetValues();
  const timestamp = getTimestampParts();
  const produtos = await getProdutos();
  const produto = produtos.find(p => p.id_produto === data.id_produto);
  const nome_produto = produto?.nome_produto ?? '';

  const id_doacao = uuidv4().slice(0, 8).toUpperCase();
  const row: DoacaoRow = {
    id_doacao,
    data: timestamp.display,
    nome_produto,
    ...data,
  };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:H`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_doacao, row.data, row.rede, row.celula, row.id_produto, row.nome_produto, row.quantidade_kg, row.observacao]] },
  });
  return row;
}
