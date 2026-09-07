// Beírja a fejléc sort a célzott Google Sheet lapra.
// Előtte töltsd ki a .env.local fájlt (GOOGLE_SERVICE_ACCOUNT_EMAIL,
// GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_TAB_NAME),
// és oszd meg a Sheetet a service account e-mail címével (szerkesztői jog).

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

const HEADERS = [
  'Időbélyeg',
  'Űrlap',
  'Vezetéknév',
  'Keresztnév',
  'Telefonszám',
  'E-mail',
  '2. kérdés válasza',
  '3. kérdés válasza',
];

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || 'Munka1';

  if (!email || !privateKey || !sheetId) {
    console.error('Hiányzó env változó(k). Ellenőrizd a .env.local fájlt.');
    process.exit(1);
  }

  const auth = new google.auth.JWT(email, null, privateKey, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tabName}!A1:H1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });

  console.log(`Fejléc sikeresen beírva a(z) "${tabName}" lapra.`);
}

main().catch((err) => {
  console.error('Hiba:', err.message);
  process.exit(1);
});
