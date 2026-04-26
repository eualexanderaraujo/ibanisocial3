
// Script para corrigir divergências de tipo de cesta entre Pedidos e Saídas
import fs from 'fs';
import path from 'path';

// Carregar .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

import { getRows, getSheets, getSpreadsheetId } from './lib/googleSheets.js';
import { getSaidasRows } from './lib/saidasSheets.js';

async function fixSaidaTypes() {
  console.log('\n🔧 --- INICIANDO CORREÇÃO DE TIPOS DE CESTA ---\n');
  
  try {
    const [pedidos, saidas] = await Promise.all([
      getRows(),
      getSaidasRows()
    ]);

    const sheets = await getSheets();
    const spreadsheetId = getSpreadsheetId();
    const SHEET_NAME = 'SAIDAS';

    let fixedCount = 0;

    for (const s of saidas) {
      const p = pedidos.find(p => p.id_pedido === s.id_pedido);
      if (!p) continue;

      const pType = (p.tipo_cesta || 'Adulto').toUpperCase() === 'KIDS' ? 'KIDS' : 'ADULTO';
      const sType = (s.tipo || 'ADULTO').toUpperCase();

      if (pType !== sType) {
        console.log(`Fixing [${s.id_pedido}] ${s.beneficiado}: ${sType} -> ${pType}`);
        
        // Encontrar o índice da linha no Google Sheets
        // Precisamos re-ler os valores brutos para pegar o índice exato
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${SHEET_NAME}!A:I`,
        });
        const values = response.data.values || [];
        const rowIndex = values.findIndex(row => row[8] === s.id_pedido) + 1; // 1-indexed

        if (rowIndex > 0) {
          // Atualizar apenas a coluna F (index 5 - Tipo)
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!F${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[pType]]
            }
          });
          fixedCount++;
        }
      }
    }

    console.log(`\n✅ Sucesso! ${fixedCount} registros foram corrigidos na tabela SAIDAS.`);

  } catch (error) {
    console.error('❌ ERRO DURANTE A CORREÇÃO:', error);
  }
}

fixSaidaTypes();
