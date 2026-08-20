'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbzztA7uR8e0unmEVYE_sL1m3p-HWveusfhV_pjJHDhGWvqGIAhfZB_2IeAHv8MHa_5b/exec';
const state = { menu: [], cart: [], busy: false };

const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money = (value) => Number(value || 0).toLocaleString('en-US');
const configured = () => API_URL && !API_URL.includes('PASTE_GOOGLE');

function setStatus(type, text) {
  const el = $('api-status');
  if (!el) return;
  el.className = `status-pill status-${type}`;
  el.innerHTML = text;
}

async function request(action, payload = {}, method = 'GET') {
  if (!configured()) throw new Error('API Google Apps Script belum dikonfigurasi.');
  const url = new URL(API_URL);
  if (method === 'GET') {
    url.searchParams.set('action', action);
    Object.entries(payload).forEach(([k,v]) => url.searchParams.set(k, v));
  }
  const options = { method, mode: 'cors', cache: 'no-store' };
  if (method === 'POST') {
    options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    options.body = JSON.stringify({ action, ...payload });
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Server HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'API error');
  return result.data;
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  button.dataset.label ||= button.innerHTML;
  button.innerHTML = busy ? '<i class="fas fa-circle-notch fa-spin"></i> Memproses...' : (label || button.dataset.label);
}

function renderMenu() {
  const grid = $('data-menu');
  const table = $('table-kelola-menu-body');
  if (!grid || !table) return;
  if (!state.menu.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>Belum ada menu.</p></div>';
    table.innerHTML = '<tr><td colspan="3" class="empty-cell">Belum ada menu.</td></tr>';
    return;
  }
  grid.innerHTML = state.menu.map(item => {
    const name = String(item?.[0] ?? '');
    const price = Number(item?.[1]) || 0;
    return `<button class="menu-item" type="button" data-menu="${escapeHtml(name)}" data-price="${price}"><span class="menu-item-name">${escapeHtml(name)}</span><span class="menu-item-price">KHR ${money(price)}</span></button>`;
  }).join('');
  table.innerHTML = state.menu.map(item => {
    const name = String(item?.[0] ?? '');
    const price = Number(item?.[1]) || 0;
    return `<tr><td>${escapeHtml(name)}</td><td>KHR ${money(price)}</td><td><button class="btn btn-sm btn-danger delete-menu" type="button" data-menu="${escapeHtml(name)}"><i class="fas fa-trash"></i></button></td></tr>`;
  }).join('');
}

function renderCart() {
  const box = $('cart-items');
  if (!box) return;
  let total = 0;
  box.innerHTML = state.cart.length ? state.cart.map((item, i) => {
    const subtotal = item.qty * item.harga; total += subtotal;
    return `<div class="cart-row"><div><strong>${escapeHtml(item.menu)}</strong><small>${escapeHtml(item.namaPelanggan)} · x${item.qty}</small></div><div class="cart-right"><span>KHR ${money(subtotal)}</span><div><button type="button" data-cart-index="${i}" data-delta="-1">−</button><button type="button" data-cart-index="${i}" data-delta="1">+</button></div></div></div>`;
  }).join('') : '<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Belum ada item ditambahkan</p></div>';
  $('grand-total').textContent = money(total);
}

function addToCart(menu, harga) {
  const customer = ($('nama-pelanggan')?.value || '').trim() || 'Tamu Reguler';
  const existing = state.cart.find(x => x.menu === menu && x.namaPelanggan === customer);
  if (existing) existing.qty += 1;
  else state.cart.push({ namaPelanggan: customer, menu, harga: Number(harga) || 0, qty: 1 });
  $('link-area')?.classList.add('hidden');
  renderCart();
}

function resetCart() {
  state.cart = [];
  if ($('nama-pelanggan')) $('nama-pelanggan').value = '';
  renderCart();
}

function changeQty(index, delta) {
  const item = state.cart[index]; if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart.splice(index, 1);
  renderCart();
}

async function loadMenu() {
  const target = $('data-menu');
  if (target) target.innerHTML = '<div class="empty-state"><i class="fas fa-circle-notch fa-spin"></i><p>Memuat menu...</p></div>';
  try { state.menu = Array.isArray(await request('getMenu')) ? await Promise.resolve(state.menu) : state.menu; } catch (_) {}
  try {
    state.menu = await request('getMenu');
    renderMenu(); setStatus('ok', '<i class="fas fa-check-circle"></i> Terhubung');
  } catch (err) {
    if (target) target.innerHTML = `<div class="error-state"><i class="fas fa-triangle-exclamation"></i><p>${escapeHtml(err.message)}</p><small>Periksa deployment Google Apps Script.</small></div>`;
    setStatus('error', '<i class="fas fa-circle-xmark"></i> Terputus');
  }
}

function renderHistory(rows) {
  const body = $('history-table-body');
  if (!body) return;
  if (!Array.isArray(rows) || !rows.length) { body.innerHTML = '<tr><td colspan="7" class="empty-cell">Belum ada transaksi.</td></tr>'; return; }
  body.innerHTML = rows.map(tx => {
    const invoice = String(tx.invoiceId || '');
    const paid = tx.status === 'Sudah Bayar';
    const next = paid ? 'Belum Bayar' : 'Sudah Bayar';
    return `<tr><td><small>${escapeHtml(tx.waktu)}</small></td><td><a class="invoice-link" href="struk.html?id=${encodeURIComponent(invoice)}" target="_blank" rel="noopener"><span class="invoice-badge">${escapeHtml(invoice)}</span></a></td><td><strong>${escapeHtml(tx.nama)}</strong></td><td>${escapeHtml(tx.pesanan)}</td><td><strong>KHR ${money(tx.total)}</strong></td><td><span class="badge ${paid?'badge-paid':'badge-unpaid'}">${escapeHtml(tx.status)}</span></td><td><button class="btn btn-sm ${paid?'btn-warning':'btn-success'} status-btn" data-invoice="${escapeHtml(invoice)}" data-status="${escapeHtml(next)}" type="button">${paid?'Set Belum':'Lunas'}</button></td></tr>`;
  }).join('');
}

async function loadHistory() {
  const body = $('history-table-body');
  if (body) body.innerHTML = '<tr><td colspan="7" class="empty-cell">Memuat laporan...</td></tr>';
  try { renderHistory(await request('getHistory')); } catch (err) { if (body) body.innerHTML = `<tr><td colspan="7" class="empty-cell error-text">${escapeHtml(err.message)}</td></tr>`; }
}

function switchTab(name, button) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  $(`tab-${name}`)?.classList.remove('hidden'); button?.classList.add('active');
  if (name === 'history') loadHistory();
  if (name === 'kelola-menu') renderMenu();
}

async function bayar() {
  if (state.busy || !state.cart.length) { if (!state.cart.length) alert('Keranjang masih kosong.'); return; }
  state.busy = true; const button = $('pay-btn'); setBusy(button, true);
  try {
    const grouped = {};
    state.cart.forEach(item => { grouped[item.namaPelanggan] ||= { pesanan: [], total: 0 }; grouped[item.namaPelanggan].pesanan.push(`${item.menu} (x${item.qty})`); grouped[item.namaPelanggan].total += item.qty * item.harga; });
    const items = Object.entries(grouped).map(([nama, v]) => ({ nama, pesanan: v.pesanan.join(', '), total: v.total }));
    const result = await request('saveTransaction', { items, statusBayar: $('status-pembayaran')?.value || 'Sudah Bayar' }, 'POST');
    const link = result?.link || '';
    $('invoice-link').value = link; $('open-link').href = link || '#';
    $('wa-link').href = `https://wa.me/?text=${encodeURIComponent(`Halo, ini tagihan pesanan Anda di KUDAJITU AMAZON.\n\nCek rincian pesanan di: ${link}`)}`;
    $('link-area').classList.remove('hidden'); state.cart = []; renderCart();
    if (link) window.open(link, '_blank', 'noopener');
  } catch (err) { alert(`Transaksi gagal: ${err.message}`); }
  finally { state.busy = false; setBusy(button, false, '<i class="fas fa-receipt"></i> Proses &amp; Buat Struk'); }
}

async function updateStatus(invoiceId, status) {
  try { renderHistory(await request('updateStatus', { invoiceId, statusBaru: status }, 'POST')); }
  catch (err) { alert(`Gagal mengubah status: ${err.message}`); }
}

async function addMenu() {
  const namaMenu = ($('input-nama-menu')?.value || '').trim(); const hargaMenu = ($('input-harga-menu')?.value || '').trim();
  if (!namaMenu || !hargaMenu || Number(hargaMenu) < 0) { alert('Nama dan harga menu harus valid.'); return; }
  try { state.menu = await request('addMenu', { namaMenu, hargaMenu }, 'POST'); renderMenu(); $('input-nama-menu').value=''; $('input-harga-menu').value=''; }
  catch (err) { alert(`Gagal menambah menu: ${err.message}`); }
}

async function deleteMenu(namaMenu) {
  if (!confirm(`Hapus menu "${namaMenu}"?`)) return;
  try { state.menu = await request('deleteMenu', { namaMenu }, 'POST'); renderMenu(); }
  catch (err) { alert(`Gagal menghapus menu: ${err.message}`); }
}

async function copyLink() {
  const input = $('invoice-link'); if (!input?.value) return;
  try { await navigator.clipboard.writeText(input.value); alert('Link disalin.'); }
  catch (_) { input.select(); document.execCommand('copy'); alert('Link disalin.'); }
}

document.addEventListener('click', event => {
  const menu = event.target.closest('[data-menu]'); if (menu && menu.classList.contains('menu-item')) return addToCart(menu.dataset.menu, Number(menu.dataset.price));
  const qty = event.target.closest('[data-cart-index]'); if (qty) return changeQty(Number(qty.dataset.cartIndex), Number(qty.dataset.delta));
  const del = event.target.closest('.delete-menu'); if (del) return deleteMenu(del.dataset.menu);
  const status = event.target.closest('.status-btn'); if (status) return updateStatus(status.dataset.invoice, status.dataset.status);
});

window.switchTab = switchTab; window.loadMenu = loadMenu; window.loadHistory = loadHistory; window.bayar = bayar; window.resetCart = resetCart; window.tambahMenu = addMenu; window.copyLink = copyLink;
window.addEventListener('error', e => { console.error(e.error || e.message); setStatus('error', '<i class="fas fa-circle-xmark"></i> JS Error'); });
window.addEventListener('DOMContentLoaded', () => { renderCart(); loadMenu(); });
