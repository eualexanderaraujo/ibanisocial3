const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
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

if (!privateKey || !email || !spreadsheetId) {
  console.error('Erro: Variáveis de ambiente GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SHEET_ID não encontradas.');
  process.exit(1);
}

const auth = new google.auth.JWT({
  email,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const PRODUTOS_PADRAO = [
  { nome: 'Arroz',           adultos: 5 },
  { nome: 'Feijão',          adultos: 2 },
  { nome: 'Açúcar',          adultos: 2 },
  { nome: 'Macarrão',        adultos: 2 },
  { nome: 'Farinha de Mesa', adultos: 1 },
  { nome: 'Farinha de Trigo',adultos: 1 },
  { nome: 'Fubá',            adultos: 1 },
  { nome: 'Sal',             adultos: 1 },
  { nome: 'Café',            adultos: 0.25 },
  { nome: 'Milho de Pipoca', adultos: 1 },
  { nome: 'Óleo',            adultos: 1 },
  { nome: 'Leite',           adultos: 2 },
  { nome: 'Biscoito Doce',   adultos: 0.4 },
  { nome: 'Biscoito Salgado',adultos: 0.4 },
  { nome: 'Molho de Tomate', adultos: 0.8 },
  { nome: 'Enlatado',        adultos: 0.5 },
];

async function main() {
  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Iniciando carga de doações para 10 cestas Adulto...');
  
  const values = [];
  const timestamp = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
  
  const idDoacaoBase = uuidv4().slice(0, 8).toUpperCase();

  for (const p of PRODUTOS_PADRAO) {
    const qtd = p.adultos * 10;
    values.push([
        `${idDoacaoBase}-${p.nome.slice(0,3).toUpperCase()}`,
        'Semente',
        'Sistema',
        p.nome,
        qtd,
        'Carga automática de teste: 10 cestas',
        timestamp
    ]);
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'doacoes!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  console.log('Tabela doacoes atualizada.');

  // Now update estoque
  console.log('Atualizando estoque...');
  const resEstoque = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'estoque!A:F' });
  const estoqueRows = resEstoque.data.values || [];
  
  for (const p of PRODUTOS_PADRAO) {
    const qtd = p.adultos * 10;
    const idx = estoqueRows.findIndex(r => String(r[1] || '').trim().toLowerCase() === p.nome.toLowerCase());
    if (idx !== -1) {
        const absRow = idx + 1;
        const currentFisico = parseFloat(String(estoqueRows[idx][2] || '0').replace(',', '.'));
        const currentReservado = parseFloat(String(estoqueRows[idx][3] || '0').replace(',', '.'));
        const novoFisico = currentFisico + qtd;
        const novoSaldo = novoFisico - currentReservado;
        
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `estoque!C${absRow}:E${absRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[novoFisico, currentReservado, novoSaldo]] }
        });
        console.log(`Estoque de ${p.nome} atualizado para ${novoFisico}kg.`);
    } else {
        console.warn(`Produto ${p.nome} não encontrado no estoque.`);
    }
  }

  console.log('Carga finalizada com sucesso!');
}

main().catch(console.error);
