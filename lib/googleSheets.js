const { google } = require('googleapis');

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Hiányzó Google service account env változó (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).');
  }

  const auth = new google.auth.JWT(email, null, privateKey, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);

  return google.sheets({ version: 'v4', auth });
}

async function appendRow(values) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || 'Munka1';
  if (!sheetId) {
    throw new Error('Hiányzó GOOGLE_SHEET_ID env változó.');
  }

  const sheets = getSheetsClient();

  // valueInputOption: USER_ENTERED -> úgy viselkedik, mintha valaki kézzel
  // gépelte volna be az értékeket. Ez azért kell, mert lib/sanitize.js minden
  // értéket egy vezető aposztróffal ("'") ír be, ami EBBEN a módban működik
  // "kényszerített szöveg" jelölésként (a Sheets elrejti az aposztrófot, és
  // plain textként tárolja a cellát) — RAW módban az aposztróf szó szerint,
  // láthatóan bekerülne a cellába.
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

module.exports = { getSheetsClient, appendRow };
