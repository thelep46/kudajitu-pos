# KUDAJITU POS setup

## 1. Google Apps Script
Open `code.gs` in a Google Apps Script project bound to the KUDAJITU spreadsheet, or create a standalone Apps Script project.

Required sheets:
- `Menu` — first row is the header; column A = menu name, column B = price.
- `Transaksi` — first row is the header; columns A:F = waktu, nama, pesanan, total, invoiceId, status.

Deploy as **Web app** with an access setting that allows the website visitors to call it.

Copy the deployed `/exec` URL into `API_URL` near the bottom of `index.html`.

## 2. Frontend
The GitHub Pages URL is currently configured in the backend as:
`https://thelep46.github.io/kudajitu-pos/`

If the site is hosted at another URL, change `FRONTEND_URL` in `code.gs` before deploying again.

## 3. Data flow
GitHub frontend → Google Apps Script Web App → Google Sheet.

The frontend uses:
- GET `action=getMenu`
- GET `action=getHistory`
- GET `action=getInvoice&id=...`
- POST `action=saveTransaction`
- POST `action=addMenu`
- POST `action=deleteMenu`
- POST `action=updateStatus`
