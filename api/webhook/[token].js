const formidable = require('formidable');
const FORMS_CONFIG = require('../../lib/formsConfig');
const { getSubmission } = require('../../lib/jotformApi');
const { extractPersonal, extractSimpleAnswer } = require('../../lib/jotform');
const { sanitizeCell } = require('../../lib/sanitize');
const { appendRow } = require('../../lib/googleSheets');

// A JotForm multipart/form-data-ként POST-ol, ezért kikapcsoljuk a Vercel
// beépített JSON body parserét, és magunk dolgozzuk fel a kérést.
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function parseMultipartBody(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields) => {
      if (err) reject(err);
      else resolve(fields);
    });
  });
}

// formidable v3-nál minden mező érték egy tömb (pl. fields.formID -> ['123']).
function firstValue(fields, key) {
  const value = fields[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { token } = req.query;
  const expectedToken = process.env.JOTFORM_WEBHOOK_SECRET;
  if (!expectedToken || token !== expectedToken) {
    // Szándékosan nem árulunk el részletet a hibáról.
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  let fields;
  try {
    fields = await parseMultipartBody(req);
  } catch (err) {
    console.error('Nem sikerült feldolgozni a beérkező kérést.', err);
    res.status(400).json({ error: 'bad request' });
    return;
  }

  const formID = firstValue(fields, 'formID');
  const submissionID = firstValue(fields, 'submissionID');
  const config = FORMS_CONFIG[formID];

  if (!config) {
    // Ismeretlen/nem konfigurált űrlap: nyugtázzuk (hogy a JotForm ne
    // próbálja újraküldeni), de nem írunk semmit a Sheetbe, és logoljuk.
    console.warn(`Ismeretlen formID érkezett, nincs konfigurálva: ${formID}`);
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  if (!submissionID) {
    console.error(`Hiányzó submissionID a(z) ${formID} űrlap webhookjában.`);
    res.status(400).json({ error: 'missing submissionID' });
    return;
  }

  let answers;
  try {
    answers = await getSubmission(submissionID);
  } catch (err) {
    console.error('Nem sikerült lekérni a beküldés adatait a JotForm API-ból.', err);
    res.status(502).json({ error: 'jotform fetch failed' });
    return;
  }

  const personal = extractPersonal(answers, config.personalQid);
  const q2Answer = extractSimpleAnswer(answers, config.q2Qid);
  const q3Answer = config.q3Qid ? extractSimpleAnswer(answers, config.q3Qid) : '';

  const row = [
    new Date().toISOString(),
    config.label,
    personal.lastName,
    personal.firstName,
    personal.phone,
    personal.email,
    q2Answer,
    q3Answer,
  ].map(sanitizeCell);

  try {
    await appendRow(row);
  } catch (err) {
    console.error('Nem sikerült a Google Sheetbe írni.', err);
    res.status(502).json({ error: 'sheet write failed' });
    return;
  }

  res.status(200).json({ ok: true });
};
