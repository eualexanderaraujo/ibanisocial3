import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { EstoqueInput, EstoqueRow } from '@/types/estoque';
import { getProdutos } from '@/lib/produtosSheets';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'estoque';
const HEADERS = ['id_estoque', 'nome_produto', 'quantidade_kg', 'data_atualizacao', 'observacao'] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAME}!A:E` });
  return { sheets, spreadsheetId, values: response.data.values ?? [] };
}

async function ensureHeaders() {
  const { sheets, spreadsheetId, values } = await getSheetValues();
  if (values.length === 0 || !values[0].includes('id_estoque')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A1`, valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
}

function mapRow(row: string[]): EstoqueRow {
  return {
    id_estoque: row[0] ?? '',
    nome_produto: row[1] ?? '',
    quantidade_kg: Number(row[2] ?? 0),
    data_atualizacao: row[3] ?? '',
    observacao: row[4] ?? '',
  };
}

export async function getEstoque(): Promise<EstoqueRow[]> {
  await ensureHeaders();
  const { values } = await getSheetValues();
  if (values.length <= 1) return [];
  const [, ...rows] = values;
  return rows.filter(r => r.some(c => String(c ?? '').trim())).map(mapRow);
}

export async function upsertEstoque(data: EstoqueInput): Promise<EstoqueRow> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const timestamp = getTimestampParts();

  // Se já existe uma linha para esse produto (pelo nome), atualiza
  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[1] === data.nome_produto);

  if (idx !== -1) {
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const updatedRow: EstoqueRow = {
      ...existingRow,
      nome_produto: data.nome_produto,
      quantidade_kg: data.quantidade_kg,
      data_atualizacao: timestamp.display,
      observacao: data.observacao,
    };
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:E${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[updatedRow.id_estoque, updatedRow.nome_produto, updatedRow.quantidade_kg, updatedRow.data_atualizacao, updatedRow.observacao]] },
    });
    return updatedRow;
  }

  // Senão, cria nova linha
  const id_estoque = uuidv4().slice(0, 8).toUpperCase();
  const row: EstoqueRow = { id_estoque, data_atualizacao: timestamp.display, ...data };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:E`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[row.id_estoque, row.nome_produto, row.quantidade_kg, row.data_atualizacao, row.observacao]] },
  });
  return row;
}

export async function incrementarEstoquePorNome(nome_produto: string, quantidade: number): Promise<void> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const timestamp = getTimestampParts();

  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[1] === nome_produto);

  if (idx !== -1) {
    // Atualiza linha existente
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const novaQuantidade = Number(existingRow.quantidade_kg) + Number(quantidade);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:E${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[existingRow.id_estoque, nome_produto, novaQuantidade, timestamp.display, 'Atualizado via Doação']] },
    });
  } else {
    // Cria nova linha se não existir
    const id_estoque = uuidv4().slice(0, 8).toUpperCase();
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: `${SHEET_NAME}!A:E`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[id_estoque, nome_produto, quantidade, timestamp.display, 'Iniciado via Doação']] },
    });
  }
}
