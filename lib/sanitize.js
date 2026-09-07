// A googleSheets.js modul USER_ENTERED módban ír a Sheetbe (mint egy kézzel
// begépelt érték), hogy a dátum/szám-formázás emberi módon működjön. Ebben a
// módban egy vezető aposztróf kényszeríti szövegként a cellát — ez pontosan
// úgy viselkedik, mint amikor valaki a Sheets felületén kézzel ír be egy
// aposztróffal kezdődő értéket: a Sheets NEM jeleníti meg az aposztrófot,
// csak szövegként kezeli a cellát. Ezért MINDEN értéket ezzel írunk be:
// - véd a "formula injection" ellen (=, +, -, @ kezdetű érték képletként
//   futna le, pl. Excelben megnyitva is)
// - megakadályozza, hogy a Sheets pl. a telefonszámot számként/dátumként
//   próbálja értelmezni és emiatt átformázza
function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str === '') return '';
  return `'${str}`;
}

module.exports = { sanitizeCell };
