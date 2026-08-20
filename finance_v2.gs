/** KUDAJITU POS - Final Personal Finance V2 */
const FIN2_SHEETS = {
  Accounts:['Account ID','Account Name','USD Opening','KHR Opening','Active','Created At'],
  Transactions:['ID','Date','Type','Category','Account','Currency','Amount','Note','Created At'],
  Conversions:['ID','Date','Account','From Currency','From Amount','Rate KHR/USD','To Currency','To Amount','Note','Created At'],
  Transfers:['ID','Date','From Account','To Account','Currency','Amount','Note','Created At'],
  Budgets:['ID','Month','Category','Currency','Amount','Created At'],
  Reconciliation:['ID','Date','Account','Currency','System Balance','Actual Balance','Difference','Note','Created At']
};

function financeV2Setup(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const old=['Keuangan','Akun','Transfer','Budget','Akun Multi Mata Uang','Konversi Mata Uang'];
  old.forEach(n=>{const s=ss.getSheetByName(n);if(s)ss.deleteSheet(s);});
  Object.keys(FIN2_SHEETS).forEach(n=>{
    let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);else s.clear();
    const h=FIN2_SHEETS[n];s.getRange(1,1,1,h.length).setValues([h]);s.setFrozenRows(1);s.getRange(1,1,1,h.length).setFontWeight('bold');
  });
  const s=ss.getSheetByName('Accounts'),now=new Date();
  s.getRange(2,1,3,6).setValues([['ABA','ABA Bank',0,0,true,now],['WING','Wing',0,0,true,now],['ACLEDA','ACLEDA',0,0,true,now]]);
  PropertiesService.getScriptProperties().deleteProperty('LAST_FX_RATE');
  return {ok:true,message:'Database keuangan final berhasil dibuat.',accounts:['ABA Bank','Wing','ACLEDA'],sheets:Object.keys(FIN2_SHEETS)};
}
function financeV2Accounts_(){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Accounts');
  if(!s)return [];
  const v=s.getDataRange().getValues();
  return v.slice(1).filter(r=>r[0]&&r[4]!==false).map(r=>({id:String(r[0]),nama:String(r[1]),usd:Number(r[2]||0),khr:Number(r[3]||0)}));
}
function financeV2Accounts(){return {accounts:financeV2Accounts_()};}
function financeV2FindAccount_(name){return financeV2Accounts_().find(a=>a.nama===String(name));}
function financeV2AccountRow_(name){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Accounts');
  const rows=s.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0&&String(r[1])===String(name));
  if(idx<1)throw new Error('Akun tidak ditemukan');
  return {sheet:s,row:idx+1,usd:Number(rows[idx][2]||0),khr:Number(rows[idx][3]||0)};
}
function financeV2SaveAccount_(p){
  const a=financeV2AccountRow_(p.nama);
  a.sheet.getRange(a.row,3,1,2).setValues([[Number(p.usdAwal)||0,Number(p.khrAwal)||0]]);
  return {ok:true};
}
function financeV2SaveAccount(p){financeV2SaveAccount_(p);return {account:p.nama};}
function financeV2SaveConversion_(p){
  if(p.dari===p.ke)throw new Error('Mata uang asal dan tujuan harus berbeda');
  const amount=Number(p.nominalDari),rate=Number(p.kurs);
  if(!(amount>0&&rate>0))throw new Error('Nominal dan kurs harus lebih dari 0');
  const a=financeV2FindAccount_(p.akun);if(!a)throw new Error('Akun tidak ditemukan');
  const available=p.dari==='USD'?a.usd:a.khr;if(amount>available)throw new Error('Saldo '+p.dari+' tidak mencukupi');
  const result=p.dari==='USD'?amount*rate:amount/rate;
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=ss.getSheetByName('Conversions'),id='CV-'+Date.now();
  s.appendRow([id,p.tanggal||new Date(),p.akun,p.dari,amount,rate,p.ke,result,p.catatan||'',new Date()]);
  const ar=financeV2AccountRow_(p.akun),usd=ar.usd,khr=ar.khr;
  ar.sheet.getRange(ar.row,3,1,2).setValues([[p.dari==='USD'?usd-amount:usd+(p.ke==='USD'?result:0),p.dari==='KHR'?khr-amount:khr+(p.ke==='KHR'?result:0)]]);
  PropertiesService.getScriptProperties().setProperty('LAST_FX_RATE',String(rate));
  return {id,nominalDari:amount,nominalKe:result,kurs:rate};
}
function financeV2SaveConversion(p){return {conversion:financeV2SaveConversion_(p)};}
function financeV2Conversions(){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Conversions');if(!s)return {rows:[],lastRate:null};
  const v=s.getDataRange().getValues().slice(1).filter(r=>r[0]);
  return {rows:v.reverse().slice(0,100).map(r=>({tanggal:String(r[1]),akun:String(r[2]),dari:String(r[3]),nominalDari:Number(r[4]),kurs:Number(r[5]),ke:String(r[6]),nominalKe:Number(r[7]),catatan:String(r[8]||'')})),lastRate:Number(PropertiesService.getScriptProperties().getProperty('LAST_FX_RATE'))||null};
}
function financeV2SaveTransaction(p){
  const type=String(p.jenis||'Pengeluaran'),currency=String(p.currency||'KHR'),amount=Number(p.nominal);
  if(!['Pemasukan','Pengeluaran'].includes(type))throw new Error('Jenis transaksi tidak valid');
  if(!['USD','KHR'].includes(currency))throw new Error('Mata uang tidak valid');
  if(!(amount>0))throw new Error('Nominal harus lebih dari 0');
  const ar=financeV2AccountRow_(p.akun),balance=currency==='USD'?ar.usd:ar.khr;
  if(type==='Pengeluaran'&&amount>balance)throw new Error('Saldo '+currency+' di '+p.akun+' tidak mencukupi');
  const next=type==='Pengeluaran'?balance-amount:balance+amount;
  if(currency==='USD')ar.sheet.getRange(ar.row,3).setValue(next);else ar.sheet.getRange(ar.row,4).setValue(next);
  const id='TX-'+Date.now(),s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Transactions');
  s.appendRow([id,p.tanggal||new Date(),type,p.kategori||'Lainnya',p.akun,currency,amount,p.keterangan||'',new Date()]);
  return {id};
}
function financeV2SaveTransaction(p){return financeV2SaveTransaction(p);}
function financeV2Transactions(month){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Transactions');if(!s)return {rows:[],summary:{}};
  const ym=String(month||Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM'));
  const v=s.getDataRange().getValues().slice(1).filter(r=>r[0]&&String(r[1]).slice(0,7)===ym).reverse();
  const summary={incomeUSD:0,incomeKHR:0,expenseUSD:0,expenseKHR:0,count:v.length};
  const rows=v.map(r=>{const o={id:String(r[0]),tanggal:Utilities.formatDate(new Date(r[1]),Session.getScriptTimeZone(),'yyyy-MM-dd'),jenis:String(r[2]),kategori:String(r[3]),akun:String(r[4]),currency:String(r[5]),nominal:Number(r[6]||0),keterangan:String(r[7]||'')};if(o.jenis==='Pemasukan')summary['income'+o.currency]+=o.nominal;else summary['expense'+o.currency]+=o.nominal;return o;});
  return {rows,summary};
}
function financeV2DeleteTransaction(p){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Transactions'),rows=s.getDataRange().getValues(),idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(p.id));
  if(idx<1)throw new Error('Transaksi tidak ditemukan');
  const type=String(rows[idx][2]),currency=String(rows[idx][5]),amount=Number(rows[idx][6]||0),account=String(rows[idx][4]);
  const ar=financeV2AccountRow_(account),balance=currency==='USD'?ar.usd:ar.khr;
  const next=type==='Pengeluaran'?balance+amount:balance-amount;
  if(next<0)throw new Error('Transaksi tidak dapat dihapus karena saldo saat ini tidak memungkinkan pembalikan.');
  if(currency==='USD')ar.sheet.getRange(ar.row,3).setValue(next);else ar.sheet.getRange(ar.row,4).setValue(next);
  s.deleteRow(idx+1);return {ok:true};
}
function financeV2Dashboard(month){
  return {accounts:financeV2Accounts_(),transactions:financeV2Transactions(month),conversions:financeV2Conversions()};
}
function financeV2Api(action,p){
  if(action==='setup')return financeV2Setup();
  if(action==='accounts')return financeV2Accounts();
  if(action==='saveAccount')return financeV2SaveAccount(p);
  if(action==='saveConversion')return financeV2SaveConversion(p);
  if(action==='conversions')return financeV2Conversions();
  if(action==='saveTransaction')return financeV2SaveTransaction(p);
  if(action==='transactions')return financeV2Transactions(p&&p.month);
  if(action==='deleteTransaction')return financeV2DeleteTransaction(p);
  if(action==='dashboard')return financeV2Dashboard(p&&p.month);
  throw new Error('Finance V2 action tidak dikenal: '+action);
}

// Compatibility aliases used by the existing Apps Script router.
function getCurrencyAccounts(){return financeV2Accounts();}
function getCurrencyConversions(limit){const data=financeV2Conversions();if(limit)data.rows=data.rows.slice(0,Math.max(1,Number(limit)||50));return data;}
function saveCurrencyAccount(p){return financeV2SaveAccount(p);}
function saveCurrencyConversion(p){return financeV2SaveConversion(p);}
function saveFinanceV2(p){return financeV2SaveTransaction(p);}
function getFinanceV2(month){return financeV2Transactions(month);}
function deleteFinanceV2(p){return financeV2DeleteTransaction(p);}
