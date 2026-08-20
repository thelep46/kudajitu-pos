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
  const v=s.getDataRange().getValues();return v.slice(1).filter(r=>r[0]&&r[4]!==false).map(r=>({id:String(r[0]),nama:String(r[1]),usd:Number(r[2]||0),khr:Number(r[3]||0)}));
}
function financeV2Accounts(){return {accounts:financeV2Accounts_()};}
function financeV2SaveAccount_(p){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Accounts');if(!s)throw new Error('Database belum disiapkan. Jalankan financeV2Setup.');
  const rows=s.getDataRange().getValues();const idx=rows.findIndex((r,i)=>i>0&&String(r[1])===String(p.nama));
  if(idx<1)throw new Error('Akun tidak ditemukan');
  s.getRange(idx+1,3,1,2).setValues([[Number(p.usdAwal)||0,Number(p.khrAwal)||0]]);return {ok:true};
}
function financeV2SaveAccount(p){financeV2SaveAccount_(p);return {account:p.nama};}
function financeV2SaveConversion_(p){
  if(p.dari===p.ke)throw new Error('Mata uang asal dan tujuan harus berbeda');
  const amount=Number(p.nominalDari),rate=Number(p.kurs);if(!(amount>0&&rate>0))throw new Error('Nominal dan kurs harus lebih dari 0');
  const accounts=financeV2Accounts_(),a=accounts.find(x=>x.nama===p.akun);if(!a)throw new Error('Akun tidak ditemukan');
  const available=p.dari==='USD'?a.usd:a.khr;if(amount>available)throw new Error('Saldo '+p.dari+' tidak mencukupi');
  const result=p.dari==='USD'?amount*rate:amount/rate;
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),s=ss.getSheetByName('Conversions'),id='CV-'+Date.now();
  s.appendRow([id,p.tanggal||new Date(),p.akun,p.dari,amount,rate,p.ke,result,p.catatan||'',new Date()]);
  const as=ss.getSheetByName('Accounts'),rows=as.getDataRange().getValues(),idx=rows.findIndex((r,i)=>i>0&&String(r[1])===String(p.akun));
  if(idx<1)throw new Error('Akun tidak ditemukan');
  const usd=Number(rows[idx][2]||0),khr=Number(rows[idx][3]||0);
  as.getRange(idx+1,3,1,2).setValues([[p.dari==='USD'?usd-amount:usd+(p.ke==='USD'?result:0),p.dari==='KHR'?khr-amount:khr+(p.ke==='KHR'?result:0)]]);
  PropertiesService.getScriptProperties().setProperty('LAST_FX_RATE',String(rate));
  return {id,nominalDari:amount,nominalKe:result,kurs:rate};
}
function financeV2SaveConversion(p){return financeV2SaveConversion_(p);}
function financeV2Conversions(){
  const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Conversions');if(!s)return {rows:[],lastRate:null};
  const v=s.getDataRange().getValues().slice(1).filter(r=>r[0]);
  return {rows:v.reverse().slice(0,100).map(r=>({tanggal:String(r[1]),akun:String(r[2]),dari:String(r[3]),nominalDari:Number(r[4]),kurs:Number(r[5]),ke:String(r[6]),nominalKe:Number(r[7]),catatan:String(r[8]||'')})),lastRate:Number(PropertiesService.getScriptProperties().getProperty('LAST_FX_RATE'))||null};
}
function financeV2Api(action,p){
  if(action==='setup')return financeV2Setup();
  if(action==='accounts')return financeV2Accounts();
  if(action==='saveAccount')return financeV2SaveAccount(p);
  if(action==='saveConversion')return financeV2SaveConversion(p);
  if(action==='conversions')return financeV2Conversions();
  throw new Error('Finance V2 action tidak dikenal: '+action);
}
