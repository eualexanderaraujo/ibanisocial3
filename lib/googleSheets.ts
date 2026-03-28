import { google } from 'googleapis';
import { CadastroInput, CadastroRow } from '@/types/cadastro';

const SHEET_NAME = 'cadastro_raw';
const HEADERS = [
  'id', 'data', 'email', 'rede', 'celula', 'lider', 'telefone_lider',
  'supervisor', 'telefone_supervisor', 'familia', 'telefone', 'total_pessoas',
  'adultos', 'criancas', 'adolescentes', 'idosos', 'trabalham',
  'tipo_renda', 'faixa_renda', 'problemas', 'observacao',
];

function getAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '')
    .replace(/\\n/g, '\n')
    .replace(/^"|"$/g, ''); // strip surrounding quotes if any

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheets() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

export async function ensureHeaders() {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:U1`,
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendRow(id: string, data: CadastroInput): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const problemasStr = Array.isArray(data.problemas) ? data.problemas.join(', ') : '';

  const row = [
    id, now,
    data.email, data.rede, data.celula,
    data.lider, data.telefone_lider,
    data.supervisor, data.telefone_supervisor,
    data.familia, data.telefone,
    data.total_pessoas, data.adultos, data.criancas,
    data.adolescentes, data.idosos, data.trabalham,
    data.tipo_renda, data.faixa_renda,
    problemasStr, data.observacao,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:U`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function getRows(): Promise<CadastroRow[]> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:U`,
  });

  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];

  const [, ...dataRows] = rows;

  return dataRows.map((r) => ({
    id: r[0] ?? '',
    data: r[1] ?? '',
    email: r[2] ?? '',
    rede: r[3] ?? '',
    celula: r[4] ?? '',
    lider: r[5] ?? '',
    telefone_lider: r[6] ?? '',
    supervisor: r[7] ?? '',
    telefone_supervisor: r[8] ?? '',
    familia: r[9] ?? '',
    telefone: r[10] ?? '',
    total_pessoas: Number(r[11]) || 0,
    adultos: Number(r[12]) || 0,
    criancas: Number(r[13]) || 0,
    adolescentes: Number(r[14]) || 0,
    idosos: Number(r[15]) || 0,
    trabalham: Number(r[16]) || 0,
    tipo_renda: r[17] ?? '',
    faixa_renda: r[18] ?? '',
    problemas: r[19] ? r[19].split(', ') : [],
    observacao: r[20] ?? '',
  }));
}
