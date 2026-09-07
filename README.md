# Dentalove – JotForm → Google Sheets konnektor

Fogadja a JotForm űrlap-beküldéseket (webhook), és soronként beírja a
személyes adatokat + válaszokat egy Google Sheet táblázatba.

## Hogyan működik

```
JotForm (10 űrlap, egyenkénti webhook)
        │  POST (multipart/form-data) — csak formID + submissionID kell belőle
        ▼
Vercel serverless function: /api/webhook/<titkos_token>
        │  1. ellenőrzi a titkos tokent (403, ha rossz)
        │  2. formID alapján kikeresi az űrlap konfigját (lib/formsConfig.js)
        │  3. a submissionID-vel lekéri a JotForm API-tól a strukturált
        │     választ (megbízhatóbb, mint a nyers webhook törzs visszafejtése)
        │  4. kiolvassa: label, vezetéknév, keresztnév, telefon, e-mail,
        │     2. kérdés válasza, 3. kérdés válasza (ha van/volt kitöltve)
        ▼
Google Sheets API (service account) → új sor a táblázatban
```

Mind a 10 űrlap ugyanannak a sablonnak a klónja, ezért a kérdés-azonosítók
(qid) mindegyiken azonosak: `3` = személyes adatok, `4` = 2. kérdés,
`6` = 3. (opcionális) kérdés. Ez a `lib/formsConfig.js`-ben van rögzítve,
minden űrlaphoz a JotForm "Label" mezője alapján (lásd lentebb a táblázatot).

Nem kell reprodukálni a JotForm feltételes logikáját (hogy melyik válasz
jeleníti meg a 3. kérdést) — a konnektor egyszerűen megnézi, érkezett-e
kitöltött válasz a 3. kérdésre. Ha nem, a cella üresen marad.

Google Sheet oszlopok:

| Időbélyeg | Űrlap | Vezetéknév | Keresztnév | Telefonszám | E-mail | 2. kérdés válasza | 3. kérdés válasza |

## Biztonság

- **Titkos webhook token**: a webhook URL végén egy hosszú, véletlen token van
  (`/api/webhook/<token>`), amit a függvény ellenőriz. Rossz/hiányzó token →
  403, semmi nem történik.
- **Titkok csak env változóban**: a Google service account kulcsa és a
  webhook token soha nem kerül a repóba (`.gitignore` kizárja a `.env*`
  fájlokat), kizárólag Vercel Environment Variables-ként léteznek.
- **Minimál jogosultságú Google service account**: a service account csak a
  konkrét, megosztott Sheethez fér hozzá, nem az egész Drive-hoz.
- **JotForm API kulcs**: a webhook ezzel kéri le a beküldés részleteit — a
  kulcs a teljes dentaloveit JotForm fiókhoz hozzáfér, ezért kizárólag Vercel
  env változóként tárolandó, soha nem kerülhet a repóba vagy kliensoldali
  kódba. Ha valaha kompromittálódna, a JotForm fiókban azonnal törölhető/
  cserélhető, a Vercel env változó frissítésével a webhook zökkenőmentesen
  folytatja az új kulccsal.
- **`valueInputOption: RAW`**: a Sheets API nem értelmezi/futtatja a beírt
  értékeket képletként.
- **Formula injection védelem** (`lib/sanitize.js`): ha egy beküldött mező
  `=`, `+`, `-` vagy `@` karakterrel kezdődik, elé kerül egy aposztróf, hogy
  Excelben/Sheetsben se tudjon képletként lefutni.
- **Privát GitHub repo**, csak a dentaloveit fiók/csapat hozzáférésével.
- A függvény nem logol teljes személyes adatot, csak esemény-szintű üzeneteket.

## Előfeltételek (amit neked kell elvégezned a dentaloveit fiókokban)

### 1. JotForm

Minden érintett űrlapnál (mind a 10-nél):

1. Build → Settings → Integrations → keresd meg a **Webhooks** integrációt.
2. Webhook URL: `https://<a-te-vercel-domained>.vercel.app/api/webhook/<TITKOS_TOKEN>`
   (a `<TITKOS_TOKEN>`-t te generálod, lásd lentebb — minden űrlapon ugyanaz
   a token, a formID alapján különbözteti meg őket a rendszer).

A titkos tokent így generálhatod (a te gépeden, ezt nekem nem kell elküldened):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Google Sheets service account

1. Google Cloud Console (dentaloveit Google fiókkal) → hozz létre egy új
   projektet (vagy használj meglévőt).
2. **APIs & Services → Enable APIs** → engedélyezd a **Google Sheets API**-t.
3. **IAM & Admin → Service Accounts → Create Service Account** (a névnek
   nem kell semmi különlegesnek lennie, pl. `sheets-writer`).
4. A létrehozott service accountnál **Keys → Add Key → Create new key → JSON**
   → töltsd le a JSON fájlt (ez tartalmazza a `client_email` és
   `private_key` mezőket, ezek kellenek a `.env`-hez / Vercel env-hez).
5. Nyisd meg a célzott Google Sheetet, és **Megosztás**-nál add hozzá a
   service account e-mail címét (`...@...iam.gserviceaccount.com`)
   **Szerkesztő** jogosultsággal.
6. A Sheet URL-jéből másold ki a Sheet ID-t (a `/d/` és a következő `/`
   közötti rész).

### 3. GitHub + Vercel (dentaloveit fiókok)

1. Hozz létre egy privát repót a dentaloveit GitHub fiók/szervezet alatt
   (pl. `dentalove-jotform-sheets-connector`).
2. Told fel ezt a projektet (lásd lentebb a git parancsokat).
3. Vercel-en (dentaloveit fiókkal) → **Add New Project** → importáld a most
   létrehozott GitHub repót.
4. Vercel projekt → **Settings → Environment Variables** → add meg:
   - `JOTFORM_API_KEY`
   - `JOTFORM_WEBHOOK_SECRET`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (a JSON fájlból, a sortöréseket
     `\n`-ként hagyva egy sorban, vagy simán bemásolva — a kód mindkettőt
     kezeli)
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_TAB_NAME` (a Sheet lap neve, alapértelmezett: `Munka1`)
5. Deploy.

## Az űrlapok konfigurációja (`lib/formsConfig.js`)

| Form ID | Label | Van 3. kérdés? |
|---|---|---|
| 262388401355357 | Korona | Nem |
| 262388248450362 | Foghúzás | Igen |
| 262388456883373 | Ínygyulladás | Nem |
| 262384204448357 | Pulpasapkázás | Nem |
| 262383328302352 | BPS | Igen |
| 262383045280353 | Alábélelés | Nem |
| 262383653473362 | Fogpótlás átadása | Igen |
| 262379233222353 | Gyökérkezelés | Igen |
| 262379403807361 | Gyógytorna | Nem |
| 262141600672044 | Horkolás | Nem |

Ha új űrlap kerül be később, a struktúráját így lehet lekérdezni:

```bash
npm install
cp .env.example .env.local
# töltsd ki a .env.local-t (legalább JOTFORM_API_KEY-t az inspect-forms-hoz)

npm run inspect-forms                  # összes űrlap listázása
npm run inspect-forms -- <formID>      # egy adott űrlap kérdéseinek részletei
```

Fejléc beírása a Sheetbe:

```bash
npm run init-sheet-headers
```

## Erőforrásigény / költség

10 űrlap, feltehetően napi/heti néhány-tucat kitöltéssel: a Vercel
serverless function hívások és a Google Sheets API kérések messze a
szolgáltatások ingyenes kvótája alatt maradnak — várható havi költség: **0 Ft**.
