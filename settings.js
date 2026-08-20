(function(){
'use strict';
const KEY='kudajitu_settings_v1';
const defaults={
  categories:['Makanan','Tempat Tinggal','Transportasi','Belanja','Internet/Pulsa','Hiburan','Kesehatan','Kebutuhan Kerja','Tagihan','Gaji/Pemasukan','Lainnya'],
  accounts:['ABA Bank','Wing','ACLEDA'],
  currencies:[{code:'KHR',label:'KHR — ៛ Riel'},{code:'USD',label:'USD — $ Dollar'}],
  pos:{storeName:'KUDAJITU AMAZON',invoicePrefix:'INV',defaultCurrency:'KHR'},
  receipt:{showUnitPrice:false,showQr:true,footer:'Terima kasih telah berbelanja.'},
  appearance:{compact:false}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function get(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){return JSON.parse(JSON.stringify(defaults));}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('kudajitu-settings-changed',{detail:s}));}
function render(){
 const main=document.querySelector('main.container'); if(!main||document.getElementById('tab-settings'))return;
 const nav=document.querySelector('.app-nav'); if(nav&&!document.getElementById('settings-nav')){
   const b=document.createElement('button');b.id='settings-nav';b.className='nav-tab';b.innerHTML='<i class="fas fa-sliders"></i> Pengaturan';b.onclick=()=>switchTab('settings',b);nav.appendChild(b);
 }
 const sec=document.createElement('section');sec.id='tab-settings';sec.className='tab-view hidden';sec.innerHTML=`
 <div class="settings-hero"><div><span class="settings-kicker">CONTROL CENTER</span><h2><i class="fas fa-sliders"></i> Pengaturan</h2><p>Kelola konfigurasi KUDAJITU POS dari satu tempat.</p></div><button class="btn btn-outline" id="settings-reset"><i class="fas fa-rotate-left"></i> Reset Default</button></div>
 <div class="settings-grid">
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-tags"></i></span><div><h3>Kategori Keuangan</h3><p>Dipakai pada form transaksi dan budget.</p></div></div><div id="settings-categories" class="settings-list"></div><div class="settings-add"><input id="new-category" class="form-control" placeholder="Nama kategori baru"><button class="btn btn-primary" id="add-category"><i class="fas fa-plus"></i> Tambah</button></div></div>
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-building-columns"></i></span><div><h3>Rekening</h3><p>Daftar rekening utama yang digunakan Finance V2.</p></div></div><div id="settings-accounts" class="settings-list"></div><div class="settings-note"><i class="fas fa-circle-info"></i> Perubahan rekening aktif di Finance V2 tetap dilakukan melalui data Accounts.</div></div>
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-cash-register"></i></span><div><h3>Pengaturan POS</h3><p>Identitas dan format transaksi.</p></div></div><label class="form-label">Nama toko</label><input id="set-store" class="form-control"><label class="form-label">Prefix invoice</label><input id="set-prefix" class="form-control"><label class="form-label">Mata uang default</label><select id="set-currency" class="form-control"></select><button class="btn btn-primary btn-block" id="save-pos"><i class="fas fa-save"></i> Simpan POS</button></div>
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-receipt"></i></span><div><h3>Pengaturan Struk</h3><p>Atur informasi yang tampil pada struk.</p></div></div><label class="settings-switch"><input id="set-unit" type="checkbox"><span>Harga satuan ditampilkan</span></label><label class="settings-switch"><input id="set-qr" type="checkbox"><span>Tampilkan QR pembayaran</span></label><label class="form-label">Footer struk</label><textarea id="set-footer" class="form-control" rows="3"></textarea><button class="btn btn-primary btn-block" id="save-receipt"><i class="fas fa-save"></i> Simpan Struk</button></div>
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-palette"></i></span><div><h3>Tampilan</h3><p>Preferensi pengalaman penggunaan.</p></div></div><label class="settings-switch"><input id="set-compact" type="checkbox"><span>Mode compact</span></label><div class="settings-note">Mode compact akan digunakan pada komponen yang mendukungnya.</div></div>
  <div class="settings-card"><div class="settings-card-head"><span><i class="fas fa-shield-halved"></i></span><div><h3>Keamanan</h3><p>Kelola akses administrator.</p></div></div><button class="btn btn-outline btn-block" onclick="openSecurity()"><i class="fas fa-key"></i> Ganti Password Admin</button><div class="settings-note">Session login tetap mengikuti sistem keamanan admin yang sudah ada.</div></div>
 </div>`;
 main.appendChild(sec);bind();loadValues();
}
function bind(){
 const s=get();
 document.getElementById('add-category').onclick=()=>{const i=document.getElementById('new-category'),v=i.value.trim();if(!v)return;if(!s.categories.includes(v)){s.categories.push(v);save(s);renderLists();}i.value='';};
 document.getElementById('save-pos').onclick=()=>{s.pos.storeName=document.getElementById('set-store').value.trim()||defaults.pos.storeName;s.pos.invoicePrefix=document.getElementById('set-prefix').value.trim()||'INV';s.pos.defaultCurrency=document.getElementById('set-currency').value;save(s);toast('Pengaturan POS disimpan.');};
 document.getElementById('save-receipt').onclick=()=>{s.receipt.showUnitPrice=document.getElementById('set-unit').checked;s.receipt.showQr=document.getElementById('set-qr').checked;s.receipt.footer=document.getElementById('set-footer').value;save(s);toast('Pengaturan struk disimpan.');};
 document.getElementById('set-compact').onchange=e=>{s.appearance.compact=e.target.checked;save(s);document.body.classList.toggle('settings-compact',e.target.checked);};
 document.getElementById('settings-reset').onclick=()=>{if(confirm('Kembalikan semua pengaturan tampilan ke default?')){save(JSON.parse(JSON.stringify(defaults)));loadValues();toast('Pengaturan dikembalikan ke default.');}};
}
function loadValues(){const s=get();document.getElementById('set-store').value=s.pos.storeName;document.getElementById('set-prefix').value=s.pos.invoicePrefix;document.getElementById('set-unit').checked=!!s.receipt.showUnitPrice;document.getElementById('set-qr').checked=s.receipt.showQr!==false;document.getElementById('set-footer').value=s.receipt.footer;document.getElementById('set-compact').checked=!!s.appearance.compact;document.body.classList.toggle('settings-compact',!!s.appearance.compact);const c=document.getElementById('set-currency');c.innerHTML=s.currencies.map(x=>`<option value="${esc(x.code)}">${esc(x.label)}</option>`).join('');c.value=s.pos.defaultCurrency;renderLists();}
function renderLists(){const s=get();document.getElementById('settings-categories').innerHTML=s.categories.map((x,i)=>`<div class="settings-row"><span><i class="fas fa-tag"></i> ${esc(x)}</span>${s.categories.length>1?`<button class="icon-btn" data-cat="${i}" title="Hapus"><i class="fas fa-trash"></i></button>`:''}</div>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.cat);if(confirm('Hapus kategori ini?')){s.categories.splice(i,1);save(s);renderLists();}});document.getElementById('settings-accounts').innerHTML=s.accounts.map(x=>`<div class="settings-row"><span><i class="fas fa-building-columns"></i> ${esc(x)}</span><span class="settings-badge">Aktif</span></div>`).join('');applyCategories(s.categories);}
function applyCategories(cats){['finance-category','budget-category'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const old=el.value;el.innerHTML=cats.map(x=>`<option>${esc(x)}</option>`).join('');if(cats.includes(old))el.value=old;});}
function toast(msg){let t=document.getElementById('settings-toast');if(!t){t=document.createElement('div');t.id='settings-toast';t.className='settings-toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}
window.getKudajituSettings=get;window.applyKudajituCategories=()=>applyCategories(get().categories);
window.addEventListener('DOMContentLoaded',render);window.addEventListener('kudajitu-settings-changed',e=>{applyCategories(e.detail.categories);});
})();