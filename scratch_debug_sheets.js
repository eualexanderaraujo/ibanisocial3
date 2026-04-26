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

  console.log('--- DEBUG DATA ---');

  const resProd = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'produtos!A1:F5' });
  console.log('PRODUTOS raw rows:', JSON.stringify(resProd.data.values, null, 2));
}

main().catch(console.error);
