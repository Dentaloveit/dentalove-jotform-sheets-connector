// Egyszerű health-check endpoint, hogy deploy után gyorsan ellenőrizhető legyen,
// hogy a Vercel projekt fut. Nem árul el semmilyen érzékeny adatot.
module.exports = (req, res) => {
  res.status(200).json({ ok: true, service: 'dentalove-jotform-sheets-connector' });
};
