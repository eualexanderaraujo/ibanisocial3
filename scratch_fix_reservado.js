const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.JWT({
  email,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function main() {
  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('--- RECALCULANDO RESERVAS DE ESTOQUE ---');

  // 1. Obter todos os pedidos pendentes da aba SAIDAS
  const resSaidas = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'SAIDAS!A:J' });
  const saidasRows = resSaidas.data.values || [];
  const pendentes = saidasRows.filter(function(r) { return r[9] === 'Pendente'; });
  console.log(`Pedidos pendentes encontrados: ${pendentes.length}`);

  // 2. Obter composicao das cestas da aba produtos
  const resProd = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'produtos!A:F' });
  const prodRows = resProd.data.values || [];
  const produtos = prodRows.slice(1).map(function(r) {
    return {
      nome: r[1],
      adultos: parseFloat(String(r[4] || '0').replace(',', '.')),
      kids: parseFloat(String(r[5] || '0').replace(',', '.'))
    };
  });

  // 3. Calcular total reservado por produto
  const reservas = {};
  for (const s of pendentes) {
    const tipoRaw = String(s[5] || 'ADULTO').toUpperCase();
    const tipo = tipoRaw === 'KIDS' ? 'kids' : 'adultos';
    
    for (const prod of produtos) {
      const qtd = prod[tipo];
      if (qtd > 0) {
        reservas[prod.nome] = (reservas[prod.nome] || 0) + qtd;
      }
    }
  }

  // 4. Atualizar a tabela estoque
  const resEstoque = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'estoque!A:F' });
  const estoqueRows = resEstoque.data.values || [];
  
  if (estoqueRows.length <= 1) {
    console.log('Nenhum item no estoque para atualizar.');
    return;
  }

  for (let i = 1; i < estoqueRows.length; i++) {
    const nome = estoqueRows[i][1];
    const fisico = parseFloat(String(estoqueRows[i][2] || '0').replace(',', '.'));
    const novoReservado = reservas[nome] || 0;
    const novoSaldo = fisico - novoReservado;

    const absRow = i + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `estoque!D${absRow}:E${absRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[novoReservado, novoSaldo]] }
    });
    console.log(`Produto: ${nome} | Novo Reservado: ${novoReservado.toFixed(2)}kg | Novo Saldo: ${novoSaldo.toFixed(2)}kg`);
  }

  console.log('Recalculo e sincronizacao finalizados com sucesso!');
}

main().catch(console.error);
