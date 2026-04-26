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

  console.log('--- PENDING ORDERS ---');

  const resSaidas = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'SAIDAS!A:J' });
  const pendentes = resSaidas.data.values.filter(r => r[9] === 'Pendente');
  console.log(JSON.stringify(pendentes, null, 2));
}

main().catch(console.error);
