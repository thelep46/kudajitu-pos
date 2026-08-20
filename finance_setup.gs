/**
 * KUDAJITU POS - Personal Finance Database Setup
 *
 * Run setupFinanceDatabase() once from Apps Script after deploying.
 * It resets only the personal-finance sheets. POS sheets Menu and Transaksi
 * are never touched.
 */
const FINAL_FINANCE_SHEETS = {
  Accounts: ['Account ID','Account Name','USD Opening','KHR Opening','Active','Created At'],
  Transactions: ['ID','Date','Type','Category','Account','Currency','Amount','Note','Created At'],
  Conversions: ['ID','Date','Account','From Currency','From Amount','Rate KHR/USD','To Currency','To Amount','Note','Created At'],
  Transfers: ['ID','Date','From Account','To Account','Currency','Amount','Note','Created At'],
  Budgets: ['ID','Month','Category','Currency','Amount','Created At'],
  Reconciliation: ['ID','Date','Account','Currency','System Balance','Actual Balance','Difference','Note','Created At']
};

const FINANCE_LEGACY_SHEETS = [
  'Keuangan',
  'Akun',
  'Transfer',
  'Budget',
  'Akun Multi Mata Uang',
  'Konversi Mata Uang'
];

function setupFinanceDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Remove only old personal-finance sheets. POS data is untouched.
  FINANCE_LEGACY_SHEETS.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) ss.deleteSheet(sheet);
  });

  Object.keys(FINAL_FINANCE_SHEETS).forEach(name => {
    const headers = FINAL_FINANCE_SHEETS[name];
    const sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  });

  const accounts = ss.getSheetByName('Accounts');
  const now = new Date();
  accounts.getRange(2, 1, 3, 6).setValues([
    ['ABA', 'ABA Bank', 0, 0, true, now],
    ['WING', 'Wing', 0, 0, true, now],
    ['ACLEDA', 'ACLEDA', 0, 0, true, now]
  ]);

  PropertiesService.getScriptProperties().deleteProperty('LAST_FX_RATE');

  return {
    ok: true,
    message: 'Database keuangan pribadi berhasil dibuat ulang.',
    sheets: Object.keys(FINAL_FINANCE_SHEETS),
    accounts: ['ABA Bank', 'Wing', 'ACLEDA']
  };
}

function getFinanceDatabaseStatus() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return Object.keys(FINAL_FINANCE_SHEETS).map(name => ({
    name,
    exists: !!ss.getSheetByName(name)
  }));
}
