const financeState={filterMonth:new Date().toISOString().slice(0,7)};
function loadCurrencyModule(){
  if(document.getElementById('currency-module'))return;
  if(document.querySelector('script[data-currency-module]'))return;
  const s=document.createElement('script');
  s.src='currency.js?v=20260820-1600';
  s.dataset.currencyModule='1';
  s.async=false;
  s.onload=()=>{if(typeof window.loadCurrency==='function')window.loadCurrency();};
  s.onerror=()=>console.error('Gagal memuat Finance V2.');
  document.body.appendChild(s);
}
function initFinance(){loadCurrencyModule();}
function loadFinance(){loadCurrencyModule();}
function exportFinance(){alert('Export laporan akan dipindahkan ke Finance V2 setelah router transaksi disatukan.');}
