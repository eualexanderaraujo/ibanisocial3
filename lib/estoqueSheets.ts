import { getSheets, getSpreadsheetId } from '@/lib/googleSheets';
import { EstoqueInput, EstoqueRow } from '@/types/estoque';
import { getProdutos } from '@/lib/produtosSheets';
import { v4 as uuidv4 } from 'uuid';

const SHEET_NAME = 'estoque';
const HEADERS = [
  'id_estoque', 
  'nome_produto', 
  'quantidade_estoque_kg', 
  'quantidade_reservada_kg', 
  'saldo_kg', 
  'observacao'
] as const;

async function getSheetValues() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ 
    spreadsheetId, 
    range: `${SHEET_NAME}!A:F` 
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
  const q_fisico = Number(String(row[2] || '0').replace(',', '.'));
  const q_reservada = Number(String(row[3] || '0').replace(',', '.'));
  const quantidade_estoque_kg = isNaN(q_fisico) ? 0 : q_fisico;
  const quantidade_reservada_kg = isNaN(q_reservada) ? 0 : q_reservada;
  
  return {
    id_estoque: row[0] ?? '',
    nome_produto: row[1] ?? '',
    quantidade_estoque_kg,
    quantidade_reservada_kg,
    saldo_kg: quantidade_estoque_kg - quantidade_reservada_kg,
    observacao: row[5] ?? '',
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

  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[1] === data.nome_produto);

  if (idx !== -1) {
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const updatedRow: EstoqueRow = {
      ...existingRow,
      nome_produto: data.nome_produto,
      quantidade_estoque_kg: data.quantidade_estoque_kg,
      quantidade_reservada_kg: data.quantidade_reservada_kg ?? existingRow.quantidade_reservada_kg,
      saldo_kg: data.quantidade_estoque_kg - (data.quantidade_reservada_kg ?? existingRow.quantidade_reservada_kg),
      observacao: data.observacao,
    };
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:F${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        updatedRow.id_estoque, 
        updatedRow.nome_produto, 
        updatedRow.quantidade_estoque_kg, 
        updatedRow.quantidade_reservada_kg,
        updatedRow.saldo_kg,
        updatedRow.observacao
      ]] },
    });
    return updatedRow;
  }

  const id_estoque = uuidv4().slice(0, 8).toUpperCase();
  const q_res = data.quantidade_reservada_kg ?? 0;
  const row: EstoqueRow = { 
    id_estoque, 
    ...data,
    quantidade_reservada_kg: q_res,
    saldo_kg: data.quantidade_estoque_kg - q_res
  };
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: `${SHEET_NAME}!A:F`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[
      row.id_estoque, 
      row.nome_produto, 
      row.quantidade_estoque_kg, 
      row.quantidade_reservada_kg,
      row.saldo_kg,
      row.observacao
    ]] },
  });
  return row;
}

export async function incrementarEstoquePorNome(nome_produto: string, quantidade: number): Promise<void> {
  await ensureHeaders();
  const { sheets, spreadsheetId, values } = await getSheetValues();

  const [, ...rows] = values;
  const idx = rows.findIndex(r => r[1] === nome_produto);

  if (idx !== -1) {
    const absRow = idx + 2;
    const existingRow = mapRow(rows[idx]);
    const novaQuantidade = Number(existingRow.quantidade_estoque_kg) + Number(quantidade);
    const saldo = novaQuantidade - existingRow.quantidade_reservada_kg;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${SHEET_NAME}!A${absRow}:F${absRow}`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        existingRow.id_estoque, 
        nome_produto, 
        novaQuantidade, 
        existingRow.quantidade_reservada_kg,
        saldo,
        'Atualizado via Doação'
      ]] },
    });
  } else {
    const id_estoque = uuidv4().slice(0, 8).toUpperCase();
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: `${SHEET_NAME}!A:F`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        id_estoque, 
        nome_produto, 
        quantidade, 
        0,
        quantidade,
        'Iniciado via Doação'
      ]] },
    });
  }
}

export async function processarSaidaEstoquePorPedido(tipoCesta: string): Promise<void> {
  await ensureHeaders();
  const produtos = await getProdutos();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const [, ...rows] = values;

  for (const produto of produtos) {
    const isKids = tipoCesta.toLowerCase() === 'kids';
    const qtdSaida = isKids ? produto.kids : produto.adultos;
    
    if (qtdSaida <= 0) continue;

    const idx = rows.findIndex(r => 
      String(r[1] || '').trim().toLowerCase() === produto.nome_produto.trim().toLowerCase()
    );

    if (idx !== -1) {
      const absRow = idx + 2;
      const existingRow = mapRow(rows[idx]);
      
      const novaQtdFisico = Math.max(0, Number(existingRow.quantidade_estoque_kg) - qtdSaida);
      const novaQtdReservada = Math.max(0, Number(existingRow.quantidade_reservada_kg) - qtdSaida);
      const novoSaldo = novaQtdFisico - novaQtdReservada;

      console.log(`[ESTOQUE] Saída Definitiva ${produto.nome_produto}: Fisico=${novaQtdFisico}, Reservada=${novaQtdReservada}`);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${absRow}:F${absRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            existingRow.id_estoque,
            produto.nome_produto,
            novaQtdFisico.toFixed(3).replace('.', ','),
            novaQtdReservada.toFixed(3).replace('.', ','),
            novoSaldo.toFixed(3).replace('.', ','),
            `Saída Confirmada: ${tipoCesta}`
          ]]
        }
      });
    }
  }
}

export async function reservarEstoquePorPedido(tipoCesta: string): Promise<void> {
  await ensureHeaders();
  const produtos = await getProdutos();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const [, ...rows] = values;

  console.log(`[ESTOQUE] Reservando para: ${tipoCesta}`);

  for (const produto of produtos) {
    const isKids = tipoCesta.toLowerCase() === 'kids';
    const qtdReservar = isKids ? produto.kids : produto.adultos;
    
    if (qtdReservar <= 0) continue;

    const idx = rows.findIndex(r => 
      String(r[1] || '').trim().toLowerCase() === produto.nome_produto.trim().toLowerCase()
    );

    if (idx !== -1) {
      const absRow = idx + 2;
      const existingRow = mapRow(rows[idx]);
      const novaQtdReservada = Number(existingRow.quantidade_reservada_kg) + qtdReservar;
      const novoSaldo = Number(existingRow.quantidade_estoque_kg) - novaQtdReservada;

      console.log(`[ESTOQUE] Reserva ${produto.nome_produto}: Nova Reservada=${novaQtdReservada}`);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${absRow}:F${absRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            existingRow.id_estoque,
            produto.nome_produto,
            existingRow.quantidade_estoque_kg.toString().replace('.', ','),
            novaQtdReservada.toFixed(3).replace('.', ','),
            novoSaldo.toFixed(3).replace('.', ','),
            `Reserva Automática: Pedido ${tipoCesta}`
          ]]
        }
      });
    } else {
      const id_estoque = uuidv4().slice(0, 8).toUpperCase();
      console.log(`[ESTOQUE] Novo item no estoque (reserva): ${produto.nome_produto}`);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            id_estoque,
            produto.nome_produto,
            "0",
            qtdReservar.toFixed(3).replace('.', ','),
            (-qtdReservar).toFixed(3).replace('.', ','),
            `Reserva Automática (Sem estoque inicial): ${tipoCesta}`
          ]]
        }
      });
    }
  }
}

export async function estornarReservaEstoquePorPedido(tipoCesta: string): Promise<void> {
  await ensureHeaders();
  const produtos = await getProdutos();
  const { sheets, spreadsheetId, values } = await getSheetValues();
  const [, ...rows] = values;

  for (const produto of produtos) {
    const isKids = tipoCesta.toLowerCase() === 'kids';
    const qtdEstorno = isKids ? produto.kids : produto.adultos;
    
    if (qtdEstorno <= 0) continue;

    const idx = rows.findIndex(r => 
      String(r[1] || '').trim().toLowerCase() === produto.nome_produto.trim().toLowerCase()
    );

    if (idx !== -1) {
      const absRow = idx + 2;
      const existingRow = mapRow(rows[idx]);
      
      const novaQtdReservada = Math.max(0, Number(existingRow.quantidade_reservada_kg) - qtdEstorno);
      const novoSaldo = Number(existingRow.quantidade_estoque_kg) - novaQtdReservada;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${absRow}:F${absRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            existingRow.id_estoque,
            produto.nome_produto,
            existingRow.quantidade_estoque_kg.toString().replace('.', ','),
            novaQtdReservada.toFixed(3).replace('.', ','),
            novoSaldo.toFixed(3).replace('.', ','),
            `Reserva Estornada (Pedido Excluído): ${tipoCesta}`
          ]]
        }
      });
    }
  }
}
