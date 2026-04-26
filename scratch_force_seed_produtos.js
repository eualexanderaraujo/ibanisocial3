const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load .env.local
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

const PRODUTOS_PADRAO = [
  { nome: 'Arroz',           adultos: 5,    kids: 5    },
  { nome: 'Feijão',          adultos: 2,    kids: 2    },
  { nome: 'Açúcar',          adultos: 2,    kids: 2    },
  { nome: 'Macarrão',        adultos: 2,    kids: 2    },
  { nome: 'Farinha de Mesa', adultos: 1,    kids: 1    },
  { nome: 'Farinha de Trigo',adultos: 1,    kids: 1    },
  { nome: 'Fubá',            adultos: 1,    kids: 1    },
  { nome: 'Sal',             adultos: 1,    kids: 1    },
  { nome: 'Café',            adultos: 0.25, kids: 0.25 },
  { nome: 'Milho de Pipoca', adultos: 1,    kids: 1    },
  { nome: 'Óleo',            adultos: 1,    kids: 1    },
  { nome: 'Leite',           adultos: 2,    kids: 2    },
  { nome: 'Leite em Pó',     adultos: 0,    kids: 0    },
  { nome: 'Biscoito Doce',   adultos: 0.4,  kids: 0.4  },
  { nome: 'Biscoito Salgado',adultos: 0.4,  kids: 0.4  },
  { nome: 'Gelatinas',       adultos: 0,    kids: 0    },
  { nome: 'Molho de Tomate', adultos: 0.8,  kids: 0.8  },
  { nome: 'Enlatado',        adultos: 0.5,  kids: 0.5  },
  { nome: 'Achocolatado',    adultos: 0,    kids: 0.5  },
  { nome: 'Mucilon',         adultos: 0,    kids: 0.5  },
];

const HEADERS = ['id_produto', 'nome_produto', 'unidade', 'ativo', 'Adultos', 'Kids'];

async function main() {
  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('--- FORCING SEED PRODUTOS ---');

  // Sobrescrever cabeçalhos e dados
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'produtos!A1:F1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] }
  });

  const rows = PRODUTOS_PADRAO.map(p => [
    uuidv4().slice(0, 8).toUpperCase(),
    p.nome,
    'kg',
    'true',
    p.adultos,
    p.kids
  ]);

  // Limpar dados antigos (estimado 100 linhas)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'produtos!A2:F100'
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'produtos!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });

  console.log('Seed de produtos finalizado com sucesso!');
}

main().catch(console.error);
