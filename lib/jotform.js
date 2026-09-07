// A JotForm submission API válaszának (answers, qid szerint kulcsolva)
// feldolgozása.
//
// A személyes adat kártya (control_mixed típus) minden Dentalove űrlapon
// ugyanazt a sablont használja, az al-mezők kulcsai konzisztensen:
//   field_1 = E-mail cím, field_2 = Vezetéknév, field_3 = Keresztnév, field_4 = Telefonszám

const PERSONAL_FIELD_MAP = {
  lastName: 'field_2',
  firstName: 'field_3',
  email: 'field_1',
  phone: 'field_4',
};

function extractPersonal(answers, personalQid) {
  const entry = answers[personalQid];
  const answer = (entry && entry.answer) || {};
  const result = {};
  for (const [outKey, fieldKey] of Object.entries(PERSONAL_FIELD_MAP)) {
    result[outKey] = answer[fieldKey] || '';
  }
  return result;
}

function extractSimpleAnswer(answers, qid) {
  if (!qid) return '';
  const entry = answers[qid];
  if (!entry || entry.answer == null) return '';
  const { answer } = entry;
  return typeof answer === 'string' ? answer : JSON.stringify(answer);
}

module.exports = { extractPersonal, extractSimpleAnswer };
