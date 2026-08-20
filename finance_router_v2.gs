/** KUDAJITU POS - Finance V2 router bridge
 * IMPORTANT: rename the legacy doGet/doPost in code.gs to doGetLegacy/doPostLegacy
 * before deploying this file. This router keeps POS actions intact and routes Finance V2 actions.
 */
function doGet(e){
  const p=e&&e.parameter?e.parameter:{};
  try{
    if(p.action==='login') return jsonResponse({ok:true,data:loginAdmin(p.username,p.password)});
    if(p.action==='getInvoice') return jsonResponse({ok:true,data:getInvoiceData(p.id||'')});
    requireAuth(p.token);
    if(p.action==='getMenu') return jsonResponse({ok:true,data:getMenuData()});
    if(p.action==='getHistory') return jsonResponse({ok:true,data:getHistoryData()});
    if(p.action==='getFinance') return jsonResponse({ok:true,data:getFinanceData(p.month||'')});
    if(p.action==='exportFinance') return jsonResponse({ok:true,data:exportFinanceData(p.month||'')});
    if(p.action==='getCurrencyAccounts'||p.action==='financeV2Accounts') return jsonResponse({ok:true,data:financeV2Accounts()});
    if(p.action==='getCurrencyConversions'||p.action==='financeV2Conversions') return jsonResponse({ok:true,data:financeV2Conversions()});
    if(p.action==='financeV2Transactions') return jsonResponse({ok:true,data:financeV2Transactions(p.month||'')});
    if(p.action==='financeV2Dashboard') return jsonResponse({ok:true,data:financeV2Dashboard(p.month||'')});
    return jsonResponse({ok:true,data:{service:'KUDAJITU POS API',authenticated:true}});
  }catch(err){return jsonResponse({ok:false,error:err.message||String(err)})}
}

function doPost(e){
  let b;
  try{b=JSON.parse((e&&e.postData&&e.postData.contents)||'{}')}catch(err){return jsonResponse({ok:false,error:'JSON tidak valid.'})}
  try{
    if(b.action==='login') return jsonResponse({ok:true,data:loginAdmin(b.username,b.password)});
    if(b.action==='logout') return jsonResponse({ok:true,data:logoutAdmin(b.token)});
    if(b.action==='changePassword') return jsonResponse({ok:true,data:changeAdminPassword(b.token,b.currentPassword,b.newPassword)});
    requireAuth(b.token);
    let d;
    if(b.action==='saveTransaction') d=simpanTransaksi(b.items||[],b.statusBayar);
    else if(b.action==='addMenu') d=tambahMenuBaru(b.namaMenu,b.hargaMenu);
    else if(b.action==='deleteMenu') d=hapusMenuBerdasarkanNama(b.namaMenu);
    else if(b.action==='updateStatus') d=updateStatusTransaksi(b.invoiceId,b.statusBaru);
    else if(b.action==='saveFinance') d=saveFinanceRecord(b);
    else if(b.action==='deleteFinance') d=deleteFinanceRecord(b.id);
    else if(b.action==='saveAccount') d=saveAccount(b);
    else if(b.action==='saveTransfer') d=saveTransfer(b);
    else if(b.action==='saveBudget') d=saveBudget(b);
    else if(b.action==='reconcileAccount') d=reconcileAccount(b);
    else if(b.action==='saveCurrencyAccount'||b.action==='financeV2SaveAccount') d=financeV2SaveAccount(b);
    else if(b.action==='saveCurrencyConversion'||b.action==='financeV2SaveConversion') d=financeV2SaveConversion(b);
    else if(b.action==='saveFinanceV2'||b.action==='financeV2SaveTransaction') d=financeV2SaveTransaction(b);
    else if(b.action==='deleteFinanceV2'||b.action==='financeV2DeleteTransaction') d=financeV2DeleteTransaction(b);
    else return jsonResponse({ok:false,error:'Action tidak dikenali.'});
    return jsonResponse({ok:true,data:d});
  }catch(err){return jsonResponse({ok:false,error:err.message||String(err)})}
}
