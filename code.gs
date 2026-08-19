const SPREADSHEET_ID = "1ZRmlqBINoh9kNgSq9o47Ogi7TDZPV2ykNFdlLU5BmYg";

function getSheet(namaSheet) {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(namaSheet);
  }
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(namaSheet);
}

/**
 * API endpoint for the GitHub/Netlify frontend.
 * Action is supplied as ?action=getMenu, etc.
 */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || "";
  let payload;

  try {
    if (action === "getMenu") payload = { ok: true, data: getMenuData() };
    else if (action === "getHistory") payload = { ok: true, data: getHistoryData() };
    else if (action === "getInvoice") payload = { ok: true, data: getInvoiceData(params.id || "") };
    else payload = { ok: true, data: { service: "KUDAJITU POS API", message: "Use the action parameter." } };
  } catch (err) {
    payload = { ok: false, error: err.message || String(err) };
  }

  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Accepts POST requests from the frontend. */
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return jsonResponse({ ok: false, error: "JSON tidak valid." });
  }

  try {
    switch (body.action) {
      case "saveTransaction":
        return jsonResponse({
          ok: true,
          data: simpanTransaksi(body.items || [], body.statusBayar)
        });
      case "addMenu":
        return jsonResponse({
          ok: true,
          data: tambahMenuBaru(body.namaMenu, body.hargaMenu)
        });
      case "deleteMenu":
        return jsonResponse({
          ok: true,
          data: hapusMenuBerdasarkanNama(body.namaMenu)
        });
      case "updateStatus":
        return jsonResponse({
          ok: true,
          data: updateStatusTransaksi(body.invoiceId, body.statusBaru)
        });
      default:
        return jsonResponse({ ok: false, error: "Action tidak dikenali." });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMenuData() {
  const sheet = getSheet("Menu");
  if (!sheet) throw new Error('Sheet "Menu" tidak ditemukan!');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  data.shift();
  return data.filter(row => row[0] !== "");
}

function tambahMenuBaru(namaMenu, hargaMenu) {
  if (!namaMenu) throw new Error("Nama menu wajib diisi.");
  if (hargaMenu === "" || hargaMenu === null || isNaN(Number(hargaMenu))) {
    throw new Error("Harga menu tidak valid.");
  }
  const sheet = getSheet("Menu");
  if (!sheet) throw new Error('Sheet "Menu" tidak ditemukan!');
  sheet.appendRow([namaMenu, Number(hargaMenu)]);
  return getMenuData();
}

function hapusMenuBerdasarkanNama(namaMenu) {
  const sheet = getSheet("Menu");
  if (!sheet) throw new Error('Sheet "Menu" tidak ditemukan!');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(namaMenu)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return getMenuData();
}

function simpanTransaksi(dataTransaksi, statusBayar) {
  const sheet = getSheet("Transaksi");
  if (!sheet) throw new Error('Sheet "Transaksi" tidak ditemukan!');
  if (!Array.isArray(dataTransaksi) || dataTransaksi.length === 0) {
    throw new Error("Tidak ada item transaksi.");
  }

  const waktu = new Date();
  const invoiceId = "INV" + waktu.getTime().toString().slice(-6);
  const status = statusBayar || "Sudah Bayar";

  dataTransaksi.forEach(function(tx) {
    sheet.appendRow([
      waktu,
      tx.nama,
      tx.pesanan,
      Number(tx.total) || 0,
      invoiceId,
      status
    ]);
  });

  const url = ScriptApp.getService().getUrl();
  return {
    id: invoiceId,
    link: url ? url + "?id=" + encodeURIComponent(invoiceId) : "",
    invoiceId: invoiceId
  };
}

function updateStatusTransaksi(invoiceId, statusBaru) {
  const sheet = getSheet("Transaksi");
  if (!sheet) throw new Error('Sheet "Transaksi" tidak ditemukan!');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][4]) === String(invoiceId)) {
      sheet.getRange(i + 1, 6).setValue(statusBaru);
    }
  }
  return getHistoryData();
}

function getInvoiceData(invoiceId) {
  const sheet = getSheet("Transaksi");
  if (!sheet) throw new Error('Sheet "Transaksi" tidak ditemukan!');
  const data = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][4]) === String(invoiceId)) {
      const tgl = data[i][0];
      const formattedDate = tgl instanceof Date
        ? Utilities.formatDate(tgl, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
        : String(tgl || "");
      result.push({
        waktu: formattedDate,
        nama: data[i][1],
        pesanan: data[i][2],
        total: Number(data[i][3]) || 0,
        status: data[i][5] || "Sudah Bayar"
      });
    }
  }
  return result;
}

function getHistoryData() {
  const sheet = getSheet("Transaksi");
  if (!sheet) throw new Error('Sheet "Transaksi" tidak ditemukan!');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  data.shift();

  return data.map(function(row) {
    const tgl = row[0];
    const formattedDate = tgl instanceof Date
      ? Utilities.formatDate(tgl, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
      : String(tgl || "");
    return {
      waktu: formattedDate,
      nama: row[1],
      pesanan: row[2],
      total: Number(row[3]) || 0,
      invoiceId: row[4],
      status: row[5] || "Sudah Bayar"
    };
  }).reverse();
}
