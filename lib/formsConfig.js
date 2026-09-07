// Mind a 10 Dentalove űrlap ugyanannak a sablonnak a klónja, ezért a
// kérdés-azonosítók (qid) mindegyiken azonosak:
//   qid 3 = személyes adatok (vezetéknév / keresztnév / telefonszám / e-mail)
//   qid 4 = 2. kérdés (minden űrlapon van)
//   qid 6 = 3. kérdés (csak néhány űrlapon van, feltételesen jelenik meg)
//
// Nem kell reprodukálni a JotForm feltételes logikáját (hogy melyik 2.
// kérdésre adott válasz jeleníti meg a 3. kérdést) — a webhook egyszerűen
// megnézi, hogy a 3. kérdésre (qid 6) érkezett-e válasz. Ha az adott
// űrlapon nincs is 3. kérdés, vagy nem válaszoltak rá, a Sheet cellája
// üres marad.
//
// A "label" a JotForm "Label" (korábbi nevén "Folder") funkciója, amivel a
// beküldő megkülönbözteti az egyébként azonos című űrlapokat.

const PERSONAL_QID = '3';
const Q2_QID = '4';
const Q3_QID = '6';

module.exports = {
  '262388401355357': { label: 'Korona', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
  '262388248450362': { label: 'Foghúzás', personalQid: PERSONAL_QID, q2Qid: Q2_QID, q3Qid: Q3_QID },
  '262388456883373': { label: 'Ínygyulladás', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
  '262384204448357': { label: 'Pulpasapkázás', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
  '262383328302352': { label: 'BPS', personalQid: PERSONAL_QID, q2Qid: Q2_QID, q3Qid: Q3_QID },
  '262383045280353': { label: 'Alábélelés', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
  '262383653473362': { label: 'Fogpótlás átadása', personalQid: PERSONAL_QID, q2Qid: Q2_QID, q3Qid: Q3_QID },
  '262379233222353': { label: 'Gyökérkezelés', personalQid: PERSONAL_QID, q2Qid: Q2_QID, q3Qid: Q3_QID },
  '262379403807361': { label: 'Gyógytorna', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
  '262141600672044': { label: 'Horkolás', personalQid: PERSONAL_QID, q2Qid: Q2_QID },
};
