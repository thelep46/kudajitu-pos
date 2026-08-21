(function(){
'use strict';

let teamData = null;
let loaded = false;

const te = v => String(v ?? '').replace(/[&<>\"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '\"': '&quot;',
  "'": '&#039;'
}[c]));

const tm = v => Number(v || 0).toLocaleString('en-US');
const rq = (action, payload = {}, method = 'POST') => request(action, payload, method);

function loadTeamCss() {
  if (document.getElementById('team-css')) return;
  const l = document.createElement('link');
  l.id = 'team-css';
  l.rel = 'stylesheet';
  l.href = 'team.css?v=20260821-1100';
  document.head.appendChild(l);
}

function render() {
  if (document.getElementById('tab-team')) return;

  const nav = document.querySelector('.app-nav');
  const main = document.querySelector('main.container');
  if (!nav || !main) return;

  const finance = Array.from(nav.querySelectorAll('.nav-tab'))
    .find(b => /Keuangan Pribadi/.test(b.textContent));

  const b = document.createElement('button');
  b.id = 'team-nav';
  b.className = 'nav-tab';
  b.innerHTML = '<i class="fas fa-users"></i> Tagihan Team';
  b.onclick = () => switchTab('team', b);
  finance ? nav.insertBefore(b, finance) : nav.appendChild(b);

  const sec = document.createElement('section');
  sec.id = 'tab-team';
  sec.className = 'tab-view hidden';
  sec.innerHTML = `
    <div class="team-hero">
      <div>
        <span class="team-kicker">TEAM BILLING</span>
        <h2><i class="fas fa-users"></i> Tagihan Team</h2>
        <p>Catat uang kopi yang kamu talangi dan lihat siapa yang masih belum bayar.</p>
      </div>
      <button class="btn btn-outline" id="team-refresh"><i class="fas fa-sync-alt"></i> Refresh</button>
    </div>
    <div class="team-summary">
      <div class="team-card danger"><span>Belum Dibayar</span><strong id="team-outstanding">KHR 0</strong></div>
      <div class="team-card"><span>Sudah Dikembalikan</span><strong id="team-paidback">KHR 0</strong></div>
      <div class="team-card"><span>Total Pesanan</span><strong id="team-orders">KHR 0</strong></div>
      <div class="team-card"><span>Anggota</span><strong id="team-count">0</strong></div>
    </div>
    <div class="team-layout">
      <div class="panel">
        <div class="panel-header">
          <span><i class="fas fa-user-plus"></i> Team</span>
          <button class="btn btn-sm btn-primary" id="team-add-btn"><i class="fas fa-plus"></i> Tambah</button>
        </div>
        <div id="team-people" class="team-people"></div>
      </div>
      <div class="panel">
        <div class="panel-header"><span><i class="fas fa-file-invoice-dollar"></i> Perlu Ditagih</span></div>
        <div id="team-detail" class="team-detail"><div class="team-empty">Pilih nama untuk melihat detail.</div></div>
      </div>
    </div>
    <div class="panel team-payment-panel">
      <div class="panel-header"><span><i class="fas fa-hand-holding-dollar"></i> Catat Pembayaran</span></div>
      <div class="team-payment-form">
        <select id="team-pay-name" class="form-control"></select>
        <input id="team-pay-date" class="form-control" type="date">
        <input id="team-pay-amount" class="form-control" type="number" min="1" placeholder="Nominal KHR">
        <select id="team-pay-method" class="form-control">
          <option>Cash</option><option>ABA</option><option>Wing</option><option>AC Bank</option><option>Pi Pay</option>
        </select>
        <input id="team-pay-note" class="form-control" placeholder="Catatan">
        <button class="btn btn-success" id="team-pay-save"><i class="fas fa-check"></i> Simpan Pembayaran</button>
      </div>
    </div>
    <div class="team-modal hidden" id="team-member-modal">
      <div class="team-modal-card">
        <div class="panel-header">
          <span>Tambah Team</span>
          <button class="icon-btn" id="team-member-close"><i class="fas fa-times"></i></button>
        </div>
        <input id="team-member-name" class="form-control" placeholder="Nama anggota">
        <div class="team-modal-actions">
          <button class="btn btn-outline" id="team-member-cancel">Batal</button>
          <button class="btn btn-primary" id="team-member-save">Simpan</button>
        </div>
      </div>
    </div>`;

  main.appendChild(sec);
  loadTeamCss();
  bind();
}

function bind() {
  document.getElementById('team-refresh').onclick = load;
  document.getElementById('team-add-btn').onclick = () => {
    document.getElementById('team-member-modal').classList.remove('hidden');
  };

  ['team-member-close', 'team-member-cancel'].forEach(id => {
    document.getElementById(id).onclick = () => {
      document.getElementById('team-member-modal').classList.add('hidden');
    };
  });

  document.getElementById('team-member-save').onclick = addMember;
  document.getElementById('team-pay-save').onclick = savePayment;
  document.getElementById('team-pay-date').value = new Date().toISOString().slice(0, 10);
}

async function load() {
  try {
    const data = await rq('getSettings', {}, 'GET');
    teamData = data && data.team ? data.team : data;
    renderAll();
  } catch (e) {
    const box = document.getElementById('team-detail');
    if (box) box.innerHTML = '<div class="team-empty error-text">' + te(e.message || e) + '</div>';
  }
}

function renderAll() {
  if (!teamData) return;

  const s = teamData.summary || {};
  const people = Array.isArray(teamData.people) ? teamData.people : [];

  document.getElementById('team-outstanding').textContent = 'KHR ' + tm(s.outstanding);
  document.getElementById('team-paidback').textContent = 'KHR ' + tm(s.paymentsTotal);
  document.getElementById('team-orders').textContent = 'KHR ' + tm(s.totalOrders);
  document.getElementById('team-count').textContent = people.length;

  const box = document.getElementById('team-people');
  if (!box) return;

  if (!people.length) {
    box.innerHTML = '<div class="team-empty">Belum ada anggota team.</div>';
  } else {
    box.innerHTML = people.map((p, i) => {
      const selected = i === 0 ? ' selected' : '';
      const statusClass = Number(p.outstanding) > 0 ? 'unpaid' : 'paid';
      const statusText = Number(p.outstanding) > 0 ? 'BELUM' : 'LUNAS';
      return `<button class="team-person${selected}" data-person="${te(p.nama)}">
        <span class="team-avatar">${te(String(p.nama || '').slice(0, 1).toUpperCase())}</span>
        <span><strong>${te(p.nama)}</strong><small>${Number(p.orderCount || 0)} pesanan · <b>KHR ${tm(p.outstanding)}</b></small></span>
        <em class="${statusClass}">${statusText}</em>
      </button>`;
    }).join('');
  }

  document.querySelectorAll('.team-person').forEach(x => {
    x.onclick = () => {
      document.querySelectorAll('.team-person').forEach(y => y.classList.remove('selected'));
      x.classList.add('selected');
      showPerson(x.dataset.person);
    };
  });

  const sel = document.getElementById('team-pay-name');
  if (sel) sel.innerHTML = people.map(p => `<option value="${te(p.nama)}">${te(p.nama)}</option>`).join('');
  if (people.length) showPerson(people[0].nama);
}

function showPerson(name) {
  const people = Array.isArray(teamData && teamData.people) ? teamData.people : [];
  const p = people.find(x => String(x.nama || '').toLowerCase() === String(name || '').toLowerCase());
  const box = document.getElementById('team-detail');
  if (!box) return;

  if (!p) {
    box.innerHTML = '<div class="team-empty">Data team tidak ditemukan.</div>';
    return;
  }

  const unpaid = Array.isArray(p.transactions) ? p.transactions.filter(t => t.status !== 'Sudah Bayar') : [];
  const payments = Array.isArray(p.payments) ? p.payments : [];

  const unpaidHtml = unpaid.length
    ? unpaid.map(t => `<div class="team-line"><div><strong>${te(t.pesanan)}</strong><small>${te(t.tanggal)} · ${te(t.invoiceId)}</small></div><b>KHR ${tm(t.total)}</b></div>`).join('')
    : '<div class="team-empty success-text">Tidak ada pesanan yang masih berstatus belum bayar.</div>';

  const paymentsHtml = payments.length
    ? payments.slice().reverse().map(pay => `<div class="team-line payment"><div><strong>${te(pay.metode)}</strong><small>${te(pay.tanggal)} · ${te(pay.catatan || 'Pembayaran')}</small></div><b>- KHR ${tm(pay.nominal)}</b></div>`).join('')
    : '<div class="team-empty">Belum ada pembayaran yang dicatat.</div>';

  box.innerHTML = `
    <div class="team-person-head">
      <div><h3>${te(p.nama)}</h3><p>${Number(p.orderCount || 0)} transaksi · total pesanan KHR ${tm(p.totalOrders)}</p></div>
      <div class="team-balance"><span>Sisa</span><strong>KHR ${tm(p.outstanding)}</strong></div>
    </div>
    <div class="team-subtitle">Pesanan belum lunas</div>
    ${unpaidHtml}
    <div class="team-subtitle">Riwayat pengembalian uang</div>
    ${paymentsHtml}`;
}

async function addMember() {
  const input = document.getElementById('team-member-name');
  const nama = String(input && input.value || '').trim();
  if (!nama) return;

  try {
    await rq('addTeamMember', { nama }, 'POST');
    input.value = '';
    document.getElementById('team-member-modal').classList.add('hidden');
    await load();
  } catch (e) {
    alert('Gagal menambah team: ' + (e.message || e));
  }
}

async function savePayment() {
  const nama = document.getElementById('team-pay-name').value;
  const nominal = Number(document.getElementById('team-pay-amount').value);
  const tanggal = document.getElementById('team-pay-date').value;
  const metode = document.getElementById('team-pay-method').value;
  const catatan = document.getElementById('team-pay-note').value.trim();

  if (!nama || !nominal || nominal <= 0) {
    alert('Nama dan nominal pembayaran wajib diisi.');
    return;
  }

  try {
    await rq('saveTeamPayment', { nama, nominal, tanggal, metode, catatan }, 'POST');
    document.getElementById('team-pay-amount').value = '';
    document.getElementById('team-pay-note').value = '';
    await load();
    alert('Pembayaran berhasil dicatat.');
  } catch (e) {
    alert('Gagal mencatat pembayaran: ' + (e.message || e));
  }
}

function initTeam() {
  if (loaded) return true;
  if (typeof getAuthToken !== 'function' || !getAuthToken()) return false;
  loaded = true;
  render();
  return true;
}

window.initKudajituTeam = initTeam;
window.loadKudajituTeam = load;
})();
