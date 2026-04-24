import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { SaidaInput, SaidaRow, SaidaUpdate } from '@/types/saidas';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'SAIDAS';
const HEADERS = [
  'id',
  'cesta_basica',
  'celula',
  'lider',
  'beneficiado',
  'tipo',
  'retirado_por',
  'entregue_por',
  'data',
  'link_pedido',
  'status',
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
      range: `${SHEET_NAME}!A:K`,
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
    retirado_por: row[6] ?? '',
    entregue_por: row[7] ?? '',
    data: row[8] ?? '',
    link_pedido: row[9] ?? '',
    status: (row[10] as 'pendente' | 'entregue') || 'pendente',
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
  
  const row: SaidaRow = {
    id,
    cesta_basica: nextCesta,
    celula: data.celula,
    lider: data.lider,
    beneficiado: data.beneficiado,
    tipo: data.tipo,
    retirado_por: '',
    entregue_por: '',
    data: '', // vazia até ser entregue
    link_pedido: data.link_pedido,
    status: 'pendente',
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:K`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.id,
        row.cesta_basica,
        row.celula,
        row.lider,
        row.beneficiado,
        row.tipo,
        row.retirado_por,
        row.entregue_por,
        row.data,
        row.link_pedido,
        row.status,
      ]],
    },
  });

  return row;
}

export async function updateSaidaRow(
  id: string,
  updates: SaidaUpdate
): Promise<SaidaRow | null> {
  await ensureSaidasHeaders();
  const { sheets, spreadsheetId, values } = await getSaidasSheetValues();
  if (values.length <= 1) return null;

  const [, ...dataRows] = values;
  const targetIndex = dataRows.findIndex((row) => (row[0] ?? '') === id);

  if (targetIndex === -1) return null;

  const absoluteRowIndex = targetIndex + 2;
  const currentRow = mapRow(dataRows[targetIndex]);
  
  // Quando atualiza retirado/entregue, marcamos como entregue se 'entregue_por' for preenchido
  const timestamp = getTimestampParts();
  
  const nextRow: SaidaRow = {
    ...currentRow,
    retirado_por: updates.retirado_por.trim() || currentRow.retirado_por,
    entregue_por: updates.entregue_por.trim(),
    data: updates.entregue_por.trim() ? (currentRow.data || timestamp.display) : currentRow.data,
    status: updates.entregue_por.trim() ? 'entregue' : 'pendente',
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${absoluteRowIndex}:K${absoluteRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        nextRow.id,
        nextRow.cesta_basica,
        nextRow.celula,
        nextRow.lider,
        nextRow.beneficiado,
        nextRow.tipo,
        nextRow.retirado_por,
        nextRow.entregue_por,
        nextRow.data,
        nextRow.link_pedido,
        nextRow.status,
      ]],
    },
  });

  return nextRow;
}
