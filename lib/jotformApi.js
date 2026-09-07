// A JotForm REST API-ból kérdezi le egy adott beküldés (submission) teljes,
// strukturált válaszát. Ez megbízhatóbb, mint a webhook nyers multipart
// törzsében (rawRequest) lévő, kevésbé dokumentált mező-kódolást visszafejteni.
async function getSubmission(submissionId) {
  const apiKey = process.env.JOTFORM_API_KEY;
  if (!apiKey) {
    throw new Error('Hiányzó JOTFORM_API_KEY env változó.');
  }

  const res = await fetch(
    `https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${apiKey}`
  );
  const json = await res.json();

  if (json.responseCode !== 200) {
    throw new Error(`JotForm API hiba (submission ${submissionId}): ${JSON.stringify(json)}`);
  }

  return json.content.answers || {};
}

module.exports = { getSubmission };
