import { getSheets, getSpreadsheetId, getTimestampParts } from '@/lib/googleSheets';
import { EstoqueInput, EstoqueRow } from '@/types/estoque';
import { getProdutos } from '@/lib/produtosSheets';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'estoque';
const HEADERS = [
  'id_estoque', 
  'nome_produto', 
  'quantidade_kg', 
  'quantidade_solicitada_kg', 
  'saldo_kg', 
  'data_atualizacao', 
  'observacao'
] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ 
    spreadsheetId, 
    range: `${SHEET_NAME}!A:G` 
  });
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
  const quantidade_kg = Number(row[2] ?? 0);
  const quantidade_solicitada_kg = Number(row[3] ?? 0);
  return {
    id_estoque: row[0] ?? '',
    nome_produto: row[1] ?? '',
    quantidade_kg,
    quantidade_solicitada_kg,
    saldo_kg: quantidade_kg - quantidade_solicitada_kg,
    data_atualizacao: row[5] ?? '',
    observacao: row[6] ?? '',
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

  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[1] === data.nome_produto);

  if (idx !== -1) {
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const updatedRow: EstoqueRow = {
      ...existingRow,
      nome_produto: data.nome_produto,
      quantidade_kg: data.quantidade_kg,
      quantidade_solicitada_kg: data.quantidade_solicitada_kg ?? existingRow.quantidade_solicitada_kg,
      saldo_kg: data.quantidade_kg - (data.quantidade_solicitada_kg ?? existingRow.quantidade_solicitada_kg),
      data_atualizacao: timestamp.display,
      observacao: data.observacao,
    };
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:G${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        updatedRow.id_estoque, 
        updatedRow.nome_produto, 
        updatedRow.quantidade_kg, 
        updatedRow.quantidade_solicitada_kg,
        updatedRow.saldo_kg,
        updatedRow.data_atualizacao, 
        updatedRow.observacao
      ]] },
    });
    return updatedRow;
  }

  const id_estoque = uuidv4().slice(0, 8).toUpperCase();
  const q_sol = data.quantidade_solicitada_kg ?? 0;
  const row: EstoqueRow = { 
    id_estoque, 
    data_atualizacao: timestamp.display, 
    ...data,
    quantidade_solicitada_kg: q_sol,
    saldo_kg: data.quantidade_kg - q_sol
  };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:G`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[
      row.id_estoque, 
      row.nome_produto, 
      row.quantidade_kg, 
      row.quantidade_solicitada_kg,
      row.saldo_kg,
      row.data_atualizacao, 
      row.observacao
    ]] },
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
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const novaQuantidade = Number(existingRow.quantidade_kg) + Number(quantidade);
    const saldo = novaQuantidade - existingRow.quantidade_solicitada_kg;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:G${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        existingRow.id_estoque, 
        nome_produto, 
        novaQuantidade, 
        existingRow.quantidade_solicitada_kg,
        saldo,
        timestamp.display, 
        'Atualizado via Doação'
      ]] },
    });
  } else {
    const id_estoque = uuidv4().slice(0, 8).toUpperCase();
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: `${SHEET_NAME}!A:G`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        id_estoque, 
        nome_produto, 
        quantidade, 
        0,
        quantidade,
        timestamp.display, 
        'Iniciado via Doação'
      ]] },
    });
  }
}

export async function reservarEstoquePorPedido(tipoCesta: 'Kids' | 'Adulto'): Promise<void> {
  await ensureHeaders();
  const produtos = await getProdutos();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const timestamp = getTimestampParts();
  const [, ...rows] = values;

  for (const produto of produtos) {
    const qtdReservar = tipoCesta === 'Adulto' ? Number(produto.adultos_kg || 0) : Number(produto.kids_kg || 0);
    if (qtdReservar <= 0) continue;

    const idx = rows.findIndex(r => r[1] === produto.nome_produto);
    if (idx !== -1) {
      const absRow = idx + 2;
      const existingRow = mapRow(rows[idx]);
      const novaQtdSolicitada = Number(existingRow.quantidade_solicitada_kg) + qtdReservar;
      const novoSaldo = Number(existingRow.quantidade_kg) - novaQtdSolicitada;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${absRow}:G${absRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            existingRow.id_estoque,
            produto.nome_produto,
            existingRow.quantidade_kg,
            novaQtdSolicitada,
            novoSaldo,
            timestamp.display,
            `Reserva Automática: ${tipoCesta}`
          ]]
        }
      });
    } else {
      // Se não existe no estoque, cria com quantidade 0 mas com a solicitação
      const id_estoque = uuidv4().slice(0, 8).toUpperCase();
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:G`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            id_estoque,
            produto.nome_produto,
            0,
            qtdReservar,
            -qtdReservar,
            timestamp.display,
            `Reserva Automática (Sem estoque inicial): ${tipoCesta}`
          ]]
        }
      });
    }
  }
}
