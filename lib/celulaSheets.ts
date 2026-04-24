import { getSheets, getSpreadsheetId } from '@/lib/googleSheets';
import { CelulaInput, CelulaRow } from '@/types/celula';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'celula';
const HEADERS = ['id_celula', 'Rede', 'NomeDaCelula', 'Lider', 'Telefone', 'Supervisor', 'TelefoneSupervisor', 'email'] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A:H` });
  return { sheets, spreadsheetId, values: response.data.values ?? [] };
}

async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length === 0 || !values[0].includes('id_celula')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

function mapRow(row: string[]): CelulaRow {
  return {
    id_celula: String(row[0] ?? '').trim(),
    rede: String(row[1] ?? '').trim(),
    nome_celula: String(row[2] ?? '').trim(),
    lider: String(row[3] ?? '').trim(),
    telefone_lider: String(row[4] ?? '').trim(),
    supervisor: String(row[5] ?? '').trim(),
    telefone_supervisor: String(row[6] ?? '').trim(),
    email: String(row[7] ?? '').trim(),
  };
}

export async function getCelulas(): Promise<CelulaRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];
  const [, ...rows] = values;
  return rows.filter(r => r.some(c => String(c ?? '').trim())).map(mapRow);
}

export async function appendCelula(data: CelulaInput): Promise<CelulaRow> {
  await ensureHeaders();
  const { sheets, spreadsheetId } = await getSheetValues();
  const id_celula = uuidv4().slice(0, 8).toUpperCase();
  const row: CelulaRow = { id_celula, ...data };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:H`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_celula, row.rede, row.nome_celula, row.lider, row.telefone_lider, row.supervisor, row.telefone_supervisor, row.email]] },
  });
  return row;
}

export async function updateCelula(id: string, data: CelulaInput): Promise<CelulaRow | null> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[0] === id);
  if (idx === -1) return null;
  const absRow = idx + 2;
  const row: CelulaRow = { id_celula: id, ...data };
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `${SHEET_NAME}!A${absRow}:H${absRow}`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_celula, row.rede, row.nome_celula, row.lider, row.telefone_lider, row.supervisor, row.telefone_supervisor, row.email]] },
  });
  return row;
}
