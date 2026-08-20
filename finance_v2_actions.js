(function(){
  'use strict';
  const wait=(fn,tries=80)=>{if(fn())return; if(tries>0)setTimeout(()=>wait(fn,tries-1),150);};
  const token=()=>typeof getAuthToken==='function'?getAuthToken():'';
  async function api(action,payload){
    const url=new URL(API_URL);
    const body={action,...payload,token:token()};
    const r=await fetch(url,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok||!j.ok)throw new Error(j.error||('Server HTTP '+r.status));
    return j.data;
  }
  function openModal(id){const m=document.getElementById(id);if(!m)return false;m.classList.add('open');m.setAttribute('aria-hidden','false');return true;}
  function closeModal(id){const m=document.getElementById(id);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');}
  function bind(){
    const openTx=document.getElementById('v2-open-tx');
    const openConv=document.getElementById('v2-open-conv');
    const txModal=document.getElementById('v2-tx-modal');
    const convModal=document.getElementById('v2-conv-modal');
    if(!openTx||!txModal)return false;
    if(!openTx.dataset.v2Bound){openTx.dataset.v2Bound='1';openTx.addEventListener('click',()=>openModal('v2-tx-modal'));}
    if(openConv&&!openConv.dataset.v2Bound){openConv.dataset.v2Bound='1';openConv.addEventListener('click',()=>openModal('v2-conv-modal'));}
    document.querySelectorAll('[data-close="v2-tx-modal"],[data-close="v2-conv-modal"]').forEach(b=>{if(!b.dataset.v2Bound){b.dataset.v2Bound='1';b.addEventListener('click',()=>closeModal(b.dataset.close));}});
    [txModal,convModal].filter(Boolean).forEach(m=>{if(!m.dataset.v2Backdrop){m.dataset.v2Backdrop='1';m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id);});}});
    const old=document.getElementById('v2-save-tx');
    if(old&&!old.dataset.v2Rebound){
      const btn=old.cloneNode(true);old.replaceWith(btn);btn.dataset.v2Rebound='1';
      btn.addEventListener('click',async()=>{
        const msg=document.getElementById('v2-tx-msg');
        const p={tanggal:document.getElementById('v2-tx-date')?.value,jenis:document.getElementById('v2-tx-type')?.value,akun:document.getElementById('v2-tx-account')?.value,currency:document.getElementById('v2-tx-currency')?.value,kategori:document.getElementById('v2-tx-category')?.value,nominal:document.getElementById('v2-tx-amount')?.value,keterangan:document.getElementById('v2-tx-note')?.value};
        if(msg){msg.className='v2-msg';msg.textContent='Menyimpan transaksi...';}
        btn.disabled=true;
        try{
          await api('financeV2SaveTransaction',p);
          if(msg){msg.className='v2-msg v2-ok';msg.textContent='✓ Transaksi berhasil disimpan.';}
          setTimeout(()=>closeModal('v2-tx-modal'),500);
          if(typeof window.loadCurrency==='function')window.loadCurrency();
        }catch(err){if(msg){msg.className='v2-msg v2-error';msg.textContent='✕ '+err.message;}else alert(err.message);}
        finally{btn.disabled=false;}
      });
    }
    return true;
  }
  wait(bind);
})();
