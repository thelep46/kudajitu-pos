/** KUDAJITU POS - Team Billing module.
 * Uses existing Transaksi as the source of orders.
 * Adds only TeamMembers and TeamPayments sheets.
 */
const TEAM_MEMBER_HEADERS=['ID','Nama','Status','Dibuat Pada'];
const TEAM_PAYMENT_HEADERS=['ID','Tanggal','Nama','Nominal KHR','Metode','Catatan','Dibuat Pada'];

function ensureTeamMemberSheet_(){return ensureSheet('TeamMembers',TEAM_MEMBER_HEADERS)}
function ensureTeamPaymentSheet_(){return ensureSheet('TeamPayments',TEAM_PAYMENT_HEADERS)}

/** Safe one-time setup: creates only missing Team sheets. Never deletes or clears data. */
function teamSetup(){
  const members=ensureTeamMemberSheet_();
  const payments=ensureTeamPaymentSheet_();
  return {ok:true,teamMembers:members.getName(),teamPayments:payments.getName(),message:'TeamMembers dan TeamPayments siap digunakan.'};
}

function teamReadMembers_(){
  const s=ensureTeamMemberSheet_(),d=s.getDataRange().getValues();
  return d.slice(1).filter(r=>String(r[1]||'').trim()).map(r=>({id:String(r[0]||''),nama:String(r[1]||''),status:String(r[2]||'Aktif'),createdAt:r[3] instanceof Date?Utilities.formatDate(r[3],Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'):String(r[3]||'')}));
}

function teamReadPayments_(){
  const s=ensureTeamPaymentSheet_(),d=s.getDataRange().getValues();
  return d.slice(1).filter(r=>String(r[2]||'').trim()).map(r=>({id:String(r[0]||''),tanggal:r[1] instanceof Date?Utilities.formatDate(r[1],Session.getScriptTimeZone(),'yyyy-MM-dd'):String(r[1]||''),nama:String(r[2]||''),nominal:Number(r[3])||0,metode:String(r[4]||''),catatan:String(r[5]||''),createdAt:r[6] instanceof Date?Utilities.formatDate(r[6],Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'):String(r[6]||'')}));
}

function teamReadTransactions_(){
  const s=getSheet('Transaksi');
  if(!s)return [];
  const d=s.getDataRange().getValues();
  return d.slice(1).filter(r=>String(r[1]||'').trim()).map(r=>({tanggal:r[0] instanceof Date?Utilities.formatDate(r[0],Session.getScriptTimeZone(),'yyyy-MM-dd'):String(r[0]||''),nama:String(r[1]||'').trim(),pesanan:String(r[2]||''),total:Number(r[3])||0,invoiceId:String(r[4]||''),status:String(r[5]||'Belum Bayar')}));
}

function teamBuildSummary_(){
  const members=teamReadMembers_(),transactions=teamReadTransactions_(),payments=teamReadPayments_();
  const names={};
  members.forEach(m=>{names[m.nama.toLowerCase()]={nama:m.nama,status:m.status,transactions:[],payments:[]};});
  transactions.forEach(t=>{const k=t.nama.toLowerCase();if(!names[k])names[k]={nama:t.nama,status:'Aktif',transactions:[],payments:[]};names[k].transactions.push(t);});
  payments.forEach(p=>{const k=p.nama.toLowerCase();if(!names[k])names[k]={nama:p.nama,status:'Aktif',transactions:[],payments:[]};names[k].payments.push(p);});
  const list=Object.keys(names).map(k=>{
    const x=names[k],ordered=x.transactions.filter(t=>t.status!=='Sudah Bayar').reduce((a,t)=>a+t.total,0),paidFromOrders=x.transactions.filter(t=>t.status==='Sudah Bayar').reduce((a,t)=>a+t.total,0),paymentsTotal=x.payments.reduce((a,p)=>a+p.nominal,0),outstanding=Math.max(0,ordered-paymentsTotal);
    return {nama:x.nama,status:x.status,transactions:x.transactions,payments:x.payments,totalOrders:x.transactions.reduce((a,t)=>a+t.total,0),alreadyPaid:paidFromOrders,paidBack:paymentsTotal,outstanding,orderCount:x.transactions.length};
  }).sort((a,b)=>b.outstanding-a.outstanding||a.nama.localeCompare(b.nama));
  const totalOrders=transactions.reduce((a,t)=>a+t.total,0),directPaid=transactions.filter(t=>t.status==='Sudah Bayar').reduce((a,t)=>a+t.total,0),paymentsTotal=payments.reduce((a,p)=>a+p.nominal,0),outstanding=list.reduce((a,x)=>a+x.outstanding,0);
  return {members,transactions,payments,people:list,summary:{totalOrders,directPaid,paymentsTotal,outstanding,teamCount:list.length}};
}

function teamApiGet_(){return teamBuildSummary_()}

function teamApiSaveMember_(b){
  const nama=String(b&&b.nama||'').trim();if(!nama)throw new Error('Nama team wajib diisi.');
  const s=ensureTeamMemberSheet_(),d=s.getDataRange().getValues();
  for(let i=1;i<d.length;i++)if(String(d[i][1]||'').trim().toLowerCase()===nama.toLowerCase()){s.getRange(i+1,3).setValue(String(b.status||'Aktif'));return teamBuildSummary_();}
  s.appendRow(['TM'+Date.now().toString().slice(-8),nama,String(b.status||'Aktif'),new Date()]);
  return teamBuildSummary_();
}

function teamApiDeleteMember_(b){
  const nama=String(b&&b.nama||'').trim();if(!nama)throw new Error('Nama team wajib diisi.');
  const s=ensureTeamMemberSheet_(),d=s.getDataRange().getValues();
  for(let i=d.length-1;i>=1;i--)if(String(d[i][1]||'').trim().toLowerCase()===nama.toLowerCase()){s.getRange(i+1,3).setValue('Nonaktif');break;}
  return teamBuildSummary_();
}

function teamApiSavePayment_(b){
  const nama=String(b&&b.nama||'').trim(),nominal=Number(b&&b.nominal),metode=String(b&&b.metode||'Cash').trim(),catatan=String(b&&b.catatan||'').trim();
  if(!nama)throw new Error('Nama team wajib diisi.');if(!isFinite(nominal)||nominal<=0)throw new Error('Nominal pembayaran harus lebih dari 0.');
  const tanggal=normalizeFinanceDate(b&&b.tanggal);ensureTeamPaymentSheet_().appendRow(['TP'+Date.now().toString().slice(-8),tanggal,nama,nominal,metode,catatan,new Date()]);
  return teamBuildSummary_();
}
