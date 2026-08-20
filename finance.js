const financeState={filterMonth:new Date().toISOString().slice(0,7)};
function loadCurrencyModule(){
  if(document.getElementById('currency-module')){loadFinanceV2Actions();installFinanceExpenseFix();return;}
  if(document.querySelector('script[data-currency-module]'))return;
  const s=document.createElement('script');
  s.src='currency.js?v=20260820-1601';
  s.dataset.currencyModule='1';
  s.async=false;
  s.onload=()=>{if(typeof window.loadCurrency==='function')window.loadCurrency();loadFinanceV2Actions();installFinanceExpenseFix();};
  s.onerror=()=>console.error('Gagal memuat Finance V2.');
  document.body.appendChild(s);
}
function loadFinanceV2Actions(){
  if(document.querySelector('script[data-finance-v2-actions]'))return;
  const s=document.createElement('script');
  s.src='finance_v2_actions.js?v=20260820-1601';
  s.dataset.financeV2Actions='1';
  s.async=false;
  document.body.appendChild(s);
}
function financeExpenseNumber(text){
  const raw=String(text||'').replace(/[^0-9,.-]/g,'').trim();
  if(!raw)return 0;
  const normalized=raw.includes(',')&&raw.includes('.')?raw.replace(/\./g,'').replace(',','.'):raw.replace(/,/g,'');
  const n=Number(normalized);
  return Number.isFinite(n)?n:0;
}
function installFinanceExpenseFix(){
  if(window.__financeExpenseFixInstalled)return;
  window.__financeExpenseFixInstalled=true;
  const update=()=>{
    const target=document.getElementById('v2-month-expense');
    const history=document.getElementById('v2-tx-history');
    if(!target||!history)return false;
    let usd=0,khr=0;
    history.querySelectorAll('tbody tr').forEach(row=>{
      const cells=row.querySelectorAll('td');
      if(cells.length<6)return;
      const type=(cells[1].textContent||'').trim().toLowerCase();
      if(!type.includes('pengeluaran'))return;
      const currency=(cells[4].textContent||'').trim().toUpperCase();
      const amount=financeExpenseNumber(cells[5].textContent);
      if(currency.includes('USD'))usd+=amount;
      else if(currency.includes('KHR'))khr+=amount;
    });
    const parts=[];
    if(usd>0)parts.push('$'+usd.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
    if(khr>0)parts.push('៛ '+Math.round(khr).toLocaleString('id-ID'));
    target.innerHTML=parts.length?parts.join('<br>'):'—';
    target.title='Pengeluaran bulan ini dipisahkan berdasarkan mata uang.';
    return true;
  };
  const wait=setInterval(()=>{if(update()){clearInterval(wait);const history=document.getElementById('v2-tx-history');if(history){new MutationObserver(update).observe(history,{childList:true,subtree:true,characterData:true});}}},300);
  setTimeout(()=>clearInterval(wait),10000);
}
function initFinance(){loadCurrencyModule();installFinanceExpenseFix();}
function loadFinance(){loadCurrencyModule();installFinanceExpenseFix();}
function exportFinance(){alert('Export laporan akan dipindahkan ke Finance V2 setelah router transaksi disatukan.');}
