import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { SaidaInput, SaidaRow } from '@/types/saidas';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'SAIDAS';
const HEADERS = [
  'id',
  'cesta_basica',
  'celula',
  'lider',
  'beneficiado',
  'tipo',
  'entregue_por',
  'data_entrega',
  'id_pedido',
] as const;

export async function ensureSaidasHeaders() {
  const { sheets, spreadsheetId, values } = await getSaidasSheetValues();
  const currentHeaders = values[0] ?? [];
  const missingHeaders = HEADERS.filter((header) => !currentHeaders.includes(header as any));
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

async function getSaidasSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:I`,
    });

    return {
      sheets,
      spreadsheetId,
      values: response.data.values ?? [],
    };
  } catch (error: any) {
    // If the sheet doesn't exist, we might need to create it manually or handle it here,
    // but the get() call doesn't create tabs. Google Sheets throws 400 when range goes to non-existent sheet.
    throw new Error(`Erro ao acessar aba SAIDAS: ${error.message}`);
  }
}

function parseNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapRow(row: string[]): SaidaRow {
  return {
    id: row[0] ?? '',
    cesta_basica: parseNumber(row[1]),
    celula: row[2] ?? '',
    lider: row[3] ?? '',
    beneficiado: row[4] ?? '',
    tipo: (row[5] as 'ADULTO' | 'KIDS') || 'ADULTO',
    entregue_por: row[6] ?? '',
    data_entrega: row[7] ?? '',
    id_pedido: row[8] ?? '',
  };
}

export async function getSaidasRows(): Promise<SaidaRow[]> {
  await ensureSaidasHeaders();
  const { values } = await getSaidasSheetValues();
  if (values.length <= 1) return [];

  const [, ...dataRows] = values;

  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => mapRow(row));
}

export async function createSaidaRow(data: SaidaInput): Promise<SaidaRow> {
  await ensureSaidasHeaders();
  
  const { sheets, spreadsheetId, values } = await getSaidasSheetValues();
  
  // Encontrar o maior número de cesta para auto-incremento
  let maxCesta = 0;
  if (values.length > 1) {
    for (let i = 1; i < values.length; i++) {
      const rowNum = parseNumber(values[i][1]);
      if (rowNum > maxCesta) {
        maxCesta = rowNum;
      }
    }
  }
  const nextCesta = maxCesta + 1;
  const id = uuidv4().slice(0, 8).toUpperCase();
  const timestamp = getTimestampParts();
  
  const row: SaidaRow = {
    id,
    cesta_basica: nextCesta,
    celula: data.celula,
    lider: data.lider,
    beneficiado: data.beneficiado,
    tipo: data.tipo,
    entregue_por: data.entregue_por,
    data_entrega: timestamp.display,
    id_pedido: data.id_pedido,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.id,
        row.cesta_basica,
        row.celula,
        row.lider,
        row.beneficiado,
        row.tipo,
        row.entregue_por,
        row.data_entrega,
        row.id_pedido,
      ]],
    },
  });

  return row;
}
