'use strict';
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function openSecurity(){
    if(document.getElementById('security-modal')) return;
    const modal=document.createElement('div');
    modal.id='security-modal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999';
    modal.innerHTML=`<div style="background:#fff;width:min(430px,100%);border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h3 style="margin:0">Keamanan Admin</h3><small>Ganti password admin</small></div><button type="button" id="security-close" style="border:0;background:transparent;font-size:20px;cursor:pointer">×</button></div><form id="security-form" style="margin-top:18px"><label class="form-label">Password Lama</label><input id="security-current" class="form-control" type="password" autocomplete="current-password" required><label class="form-label" style="margin-top:12px">Password Baru</label><input id="security-new" class="form-control" type="password" autocomplete="new-password" minlength="8" required><label class="form-label" style="margin-top:12px">Konfirmasi Password Baru</label><input id="security-confirm" class="form-control" type="password" autocomplete="new-password" minlength="8" required><div id="security-message" style="min-height:24px;margin:12px 0;font-size:13px"></div><button id="security-save" class="btn btn-primary btn-block" type="submit"><i class="fas fa-key"></i> Ganti Password</button></form></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    document.getElementById('security-close').onclick=close;
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    document.getElementById('security-form').onsubmit=async e=>{
      e.preventDefault();
      const current=document.getElementById('security-current').value;
      const next=document.getElementById('security-new').value;
      const confirm=document.getElementById('security-confirm').value;
      const msg=document.getElementById('security-message'),btn=document.getElementById('security-save');
      if(next.length<8){msg.textContent='Password baru minimal 8 karakter.';return}
      if(next!==confirm){msg.textContent='Konfirmasi password tidak cocok.';return}
      btn.disabled=true;msg.textContent='Menyimpan...';
      try{
        const r=await fetch(API_URL,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'changePassword',token:getAuthToken(),currentPassword:current,newPassword:next})});
        const text=await r.text();let j;try{j=JSON.parse(text)}catch(_){throw new Error(`Respons server tidak valid (HTTP ${r.status}).`)}
        if(!j.ok)throw new Error(j.error||'Gagal mengganti password.');
        msg.textContent='Password berhasil diubah. Kamu akan diarahkan ke login...';
        setTimeout(()=>{if(typeof clearAuthToken==='function')clearAuthToken();if(typeof showLogin==='function')showLogin('Password berhasil diubah. Silakan login dengan password baru.');close()},900);
      }catch(err){msg.textContent=err.message||'Gagal mengganti password.'}
      finally{btn.disabled=false}
    };
  }
  function initSecurity(){
    const header=document.querySelector('.header-right');
    if(!header||document.getElementById('security-btn'))return;
    const b=document.createElement('button');b.id='security-btn';b.className='btn btn-sm btn-outline';b.type='button';b.innerHTML='<i class="fas fa-key"></i> Keamanan';b.onclick=openSecurity;header.insertBefore(b,header.lastElementChild);
  }
  function loadSettingsModule(){
    if(document.querySelector('script[data-settings-module]'))return;
    const s=document.createElement('script');s.src='settings.js?v=20260820-1800';s.dataset.settingsModule='1';s.defer=true;document.body.appendChild(s);
  }
  window.openSecurity=openSecurity;
  window.addEventListener('DOMContentLoaded',()=>{initSecurity();loadSettingsModule();});
})();