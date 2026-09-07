// Segédszkript a lib/formsConfig.js kitöltéséhez.
//
// Használat:
//   npm run inspect-forms                -> kilistázza az összes elérhető űrlapot (ID + cím)
//   npm run inspect-forms -- <formID>     -> kiírja az adott űrlap kérdéseit (qid, típus, name)
//
// Előtte hozz létre egy .env.local fájlt (a .env.example alapján) és töltsd ki
// legalább a JOTFORM_API_KEY értéket.

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.JOTFORM_API_KEY;

if (!API_KEY) {
  console.error('Hiányzik a JOTFORM_API_KEY. Add hozzá a .env.local fájlhoz.');
  process.exit(1);
}

async function jotformGet(path) {
  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.jotform.com${path}${separator}apiKey=${API_KEY}`);
  const json = await res.json();
  if (json.responseCode !== 200) {
    throw new Error(`JotForm API hiba (${path}): ${JSON.stringify(json)}`);
  }
  return json.content;
}

async function main() {
  const targetId = process.argv[2];

  if (!targetId) {
    const forms = await jotformGet('/user/forms?limit=100');
    console.log(`\nElérhető űrlapok (${forms.length}):\n`);
    for (const f of forms) {
      console.log(`  ${f.id}  |  cím: "${f.title}"  |  státusz: ${f.status}`);
    }
    console.log('\nRészletekhez: npm run inspect-forms -- <formID>\n');
    return;
  }

  const questions = await jotformGet(`/form/${targetId}/questions`);
  console.log(`\n"${targetId}" űrlap kérdései:\n`);
  for (const qid of Object.keys(questions)) {
    const q = questions[qid];
    console.log(`qid=${qid} | type=${q.type} | name="${q.name}" | text="${(q.text || '').slice(0, 90)}"`);
    if (q.subLabels) {
      console.log('   subLabels:', JSON.stringify(q.subLabels));
    }
    if (q.type === 'control_head') continue;
  }
  console.log('');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
