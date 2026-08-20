/** KUDAJITU POS - Settings V2 data model. Run settingsV2Setup() once from Apps Script. */
const SETTINGS_V2_HEADERS=['Key','Value','Type','Updated At'];
const SETTINGS_V2_DEFAULTS={
  finance_categories:['Makanan','Tempat Tinggal','Transportasi','Belanja','Internet/Pulsa','Hiburan','Kesehatan','Kebutuhan Kerja','Tagihan','Gaji/Pemasukan','Lainnya'],
  finance_accounts:['ABA Bank','Wing','ACLEDA'],
  currencies:['USD','KHR'],
  pos_store_name:'KUDAJITU AMAZON',
  pos_invoice_prefix:'INV',
  pos_default_currency:'KHR',
  receipt_show_unit_price:false,
  receipt_show_qr:true,
  receipt_footer:'Terima kasih telah berbelanja.'
};
function settingsV2Setup(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);let s=ss.getSheetByName('Settings');if(!s)s=ss.insertSheet('Settings');s.clear();s.getRange(1,1,1,4).setValues([SETTINGS_V2_HEADERS]);s.setFrozenRows(1);s.getRange(1,1,1,4).setFontWeight('bold');const now=new Date();const rows=Object.keys(SETTINGS_V2_DEFAULTS).map(k=>[k,JSON.stringify(SETTINGS_V2_DEFAULTS[k]),Array.isArray(SETTINGS_V2_DEFAULTS[k])?'json':typeof SETTINGS_V2_DEFAULTS[k],now]);s.getRange(2,1,rows.length,4).setValues(rows);s.autoResizeColumns(1,4);return {ok:true,message:'Settings berhasil dibuat.',sheet:'Settings'};
}
function settingsV2Get_(){const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Settings');if(!s)return JSON.parse(JSON.stringify(SETTINGS_V2_DEFAULTS));const rows=s.getDataRange().getValues().slice(1),out={};rows.forEach(r=>{if(!r[0])return;try{out[String(r[0])]=JSON.parse(String(r[1]));}catch(_){out[String(r[0])]=String(r[1]);}});return Object.assign({},SETTINGS_V2_DEFAULTS,out);}
function settingsV2Save_(key,value){const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Settings')||SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet('Settings');if(s.getLastRow()===0)s.getRange(1,1,1,4).setValues([SETTINGS_V2_HEADERS]);const d=s.getDataRange().getValues(),row=d.findIndex((r,i)=>i>0&&String(r[0])===String(key));const data=[key,JSON.stringify(value),Array.isArray(value)?'json':typeof value,new Date()];if(row>0)s.getRange(row+1,1,1,4).setValues([data]);else s.appendRow(data);return settingsV2Get_();}
function settingsV2Get(){return settingsV2Get_();}
function settingsV2SaveCategory(name){const n=String(name||'').trim();if(!n)throw new Error('Nama kategori wajib diisi.');const s=settingsV2Get_();if(!s.finance_categories.includes(n))s.finance_categories.push(n);return settingsV2Save_('finance_categories',s.finance_categories);}
function settingsV2DeleteCategory(name){const n=String(name||'').trim(),s=settingsV2Get_();s.finance_categories=s.finance_categories.filter(x=>x!==n);if(!s.finance_categories.length)throw new Error('Minimal satu kategori harus tersedia.');return settingsV2Save_('finance_categories',s.finance_categories);}
function settingsV2SaveConfig(p){const s=settingsV2Get_();['finance_categories','finance_accounts','currencies','pos_store_name','pos_invoice_prefix','pos_default_currency','receipt_show_unit_price','receipt_show_qr','receipt_footer'].forEach(k=>{if(Object.prototype.hasOwnProperty.call(p,k))s[k]=p[k];});Object.keys(s).forEach(k=>settingsV2Save_(k,s[k]));return s;}
