// public/js/finance.js - Finans sekmesi (coklu kasa)
'use strict';

const Finance = (() => {
  let _accounts = [];
  let _activeAccountId = null;
  let _transactions = [];
  let _summary = { total_in: 0, total_out: 0, balance: 0 };

  function fmtMoney(n) {
    return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ba';
  }
  function fmtDate(d) {
    if (!d) return '';
    return d.slice(0, 10).split('-').reverse().join('.');
  }

  async function loadAccounts() {
    try {
      const raw = await Api.get('/api/finance/accounts');
      if (Array.isArray(raw)) _accounts = raw;
      else _accounts = Object.values(raw).filter(v => typeof v === 'object' && v !== null && v.id);
      renderAccountTabs();
      if (_accounts.length && !_activeAccountId) {
        _activeAccountId = _accounts[0].id;
      }
      renderAccountTabs();
      await loadSummary();
      await loadTransactions();
    } catch(e) { console.error('loadAccounts error', e); }
  }

  function renderAccountTabs() {
    const wrap = document.getElementById('finAccountTabs');
    if (!wrap) return;
    wrap.innerHTML = _accounts.map(a => {
      const active = a.id === _activeAccountId ? 'fin-tab-active' : '';
      return '<button class="fin-tab ' + active + '" data-action="finSwitchAccount" data-accid="' + a.id + '">' + a.name + '</button>';
    }).join('');
    // Kasa secici formu icin
    const sel = document.getElementById('finTxAccount');
    if (sel) {
      sel.innerHTML = _accounts.map(a => '<option value="' + a.id + '">' + a.name + '</option>').join('');
      if (_activeAccountId) sel.value = _activeAccountId;
    }
    // Admin kasa listesi
    renderAdminAccounts();
  }

  function renderAdminAccounts() {
    const wrap = document.getElementById('finAdminAccounts');
    if (!wrap) return;
    const role = Auth.role;
    if (role !== 'admin') { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    wrap.innerHTML = '<div style="font-weight:700;font-size:.8rem;color:var(--c-ink2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.6rem">Kasa Yonetimi</div>' +
      _accounts.map(a =>
        '<div class="fin-account-row">' +
        '<span class="fin-account-name">' + a.name + '</span>' +
        '<span class="fin-account-desc">' + (a.description||'') + '</span>' +
        '<button class="fin-acc-edit-btn" data-action="finEditAccount" data-accid="' + a.id + '" data-name="' + a.name + '" data-desc="' + (a.description||'') + '">Duzenle</button>' +
        '<button class="fin-acc-del-btn" data-action="finDeleteAccount" data-accid="' + a.id + '">Sil</button>' +
        '</div>'
      ).join('') +
      '<div style="display:flex;gap:.5rem;margin-top:.8rem;align-items:flex-end">' +
      '<div><label class="fin-label">Yeni Kasa Adi</label><input type="text" id="finNewAccountName" class="fin-input" placeholder="Kasa adi" style="width:180px"></div>' +
      '<div><label class="fin-label">Aciklama</label><input type="text" id="finNewAccountDesc" class="fin-input" placeholder="Istege bagli" style="width:200px"></div>' +
      '<button class="fin-add-btn" data-action="finAddAccount">+ Kasa Ekle</button>' +
      '</div>';
  }

  async function loadSummary() {
    try {
      const url = '/api/finance/summary' + (_activeAccountId ? '?account_id=' + _activeAccountId : '');
      const raw = await Api.get(url);
      _summary = raw;
      renderSummary();
    } catch(e) { console.error('loadSummary error', e); }
  }

  function renderSummary() {
    const bal = _summary.balance || 0;
    const el = document.getElementById('finCashBalance');
    const inEl = document.getElementById('finTotalIn');
    const outEl = document.getElementById('finTotalOut');
    if (el) {
      el.textContent = fmtMoney(bal);
      el.className = 'fin-balance-amount ' + (bal >= 0 ? 'positive' : 'negative');
    }
    if (inEl) inEl.textContent = fmtMoney(_summary.total_in || 0);
    if (outEl) outEl.textContent = fmtMoney(_summary.total_out || 0);
    // Aktif kasa adini goster
    const nameEl = document.getElementById('finActiveAccountName');
    if (nameEl) {
      const acc = _accounts.find(a => a.id === _activeAccountId);
      nameEl.textContent = acc ? acc.name : 'Tum Kasalar';
    }
  }

  async function loadTransactions() {
    try {
      const start = document.getElementById('finDateStart')?.value || '';
      const end   = document.getElementById('finDateEnd')?.value   || '';
      const params = [];
      if (_activeAccountId) params.push('account_id=' + _activeAccountId);
      if (start) params.push('start=' + start);
      if (end)   params.push('end='   + end);
      const url = '/api/finance/transactions' + (params.length ? '?' + params.join('&') : '');
      const raw = await Api.get(url);
      if (Array.isArray(raw)) _transactions = raw;
      else _transactions = Object.values(raw).filter(v => typeof v === 'object' && v !== null && v.id);
      renderTable();
    } catch(e) { console.error('loadTransactions error', e); }
  }

  function renderTable() {
    const tbody = document.getElementById('finTableBody');
    if (!tbody) return;
    if (!_transactions.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--c-ink3)">Kayit bulunamadi</td></tr>';
      return;
    }
    const role = Auth.role;
    tbody.innerHTML = _transactions.map(t => {
      const isIn  = t.type === 'in';
      const sign  = isIn ? '+' : '-';
      const cls   = isIn ? 'fin-in' : 'fin-out';
      const label = isIn ? 'Gelen' : 'Giden';
      const delBtn = (role === 'admin')
        ? '<button class="fin-del-btn" data-action="finDeleteTx" data-txid="' + t.id + '" title="Sil">x</button>'
        : '';
      return '<tr><td>' + fmtDate(t.date) + '</td><td>' + t.person + '</td><td>' + (t.description||'-') + '</td><td><span class="fin-badge ' + cls + '">' + label + '</span></td><td class="fin-amount ' + cls + '">' + sign + fmtMoney(t.amount) + '</td><td>' + delBtn + '</td></tr>';
    }).join('');
  }

  async function addTransaction() {
    const account_id = document.getElementById('finTxAccount')?.value;
    const date    = document.getElementById('finTxDate')?.value;
    const person  = (document.getElementById('finTxPerson')?.value || '').trim();
    const desc    = (document.getElementById('finTxDesc')?.value   || '').trim();
    const amount  = document.getElementById('finTxAmount')?.value;
    const type    = document.getElementById('finTxType')?.value;
    if (!account_id || !date || !person || !amount || !type) { showToast('Tum alanlari doldurun'); return; }
    const btn = document.getElementById('finAddBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }
    try {
      await Api.post('/api/finance/transactions', { account_id, date, person, desc, amount, type });
      document.getElementById('finTxPerson').value = '';
      document.getElementById('finTxDesc').value   = '';
      document.getElementById('finTxAmount').value = '';
      document.getElementById('finTxType').value   = 'in';
      await loadSummary();
      await loadTransactions();
      showToast('Islem kaydedildi');
    } catch(e) {
      showToast(e.message || 'Kaydedilemedi');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '+ Ekle'; }
    }
  }

  async function deleteTransaction(id) {
    if (!confirm('Bu kayit silinsin mi?')) return;
    try {
      await Api.del('/api/finance/transactions/' + id);
      await loadSummary();
      await loadTransactions();
      showToast('Silindi');
    } catch(e) { showToast('Silinemedi'); }
  }

  async function switchAccount(id) {
    _activeAccountId = parseInt(id);
    renderAccountTabs();
    const sel = document.getElementById('finTxAccount');
    if (sel) sel.value = _activeAccountId;
    await loadSummary();
    await loadTransactions();
  }

  async function addAccount() {
    const name = (document.getElementById('finNewAccountName')?.value || '').trim();
    const desc = (document.getElementById('finNewAccountDesc')?.value || '').trim();
    if (!name) { showToast('Kasa adi gerekli'); return; }
    try {
      await Api.post('/api/finance/accounts', { name, description: desc });
      await loadAccounts();
      showToast('Kasa eklendi');
    } catch(e) { showToast(e.message || 'Eklenemedi'); }
  }

  async function editAccount(id, currentName, currentDesc) {
    const name = prompt('Kasa adi:', currentName);
    if (!name) return;
    const desc = prompt('Aciklama:', currentDesc || '');
    try {
      await Api.req('PUT', '/api/finance/accounts/' + id, { name, description: desc || '' });
      await loadAccounts();
      showToast('Kasa guncellendi');
    } catch(e) { showToast(e.message || 'Guncellenemedi'); }
  }

  async function deleteAccount(id) {
    if (!confirm('Bu kasa silinsin mi? (Icinde islem varsa silinemez)')) return;
    try {
      await Api.del('/api/finance/accounts/' + id);
      if (_activeAccountId === parseInt(id)) _activeAccountId = null;
      await loadAccounts();
      showToast('Kasa silindi');
    } catch(e) { showToast(e.message || 'Silinemedi'); }
  }

  function init() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl = document.getElementById('finTxDate');
    if (dateEl && !dateEl.value) dateEl.value = today;
    loadAccounts();
  }

  return { init, loadTransactions, addTransaction, deleteTransaction, switchAccount, addAccount, editAccount, deleteAccount };
})();

document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'finAddTx')         Finance.addTransaction();
  if (a === 'finFilter')        Finance.loadTransactions();
  if (a === 'finDeleteTx')      Finance.deleteTransaction(el.dataset.txid);
  if (a === 'finSwitchAccount') Finance.switchAccount(el.dataset.accid);
  if (a === 'finAddAccount')    Finance.addAccount();
  if (a === 'finEditAccount')   Finance.editAccount(el.dataset.accid, el.dataset.name, el.dataset.desc);
  if (a === 'finDeleteAccount') Finance.deleteAccount(el.dataset.accid);
  if (a === 'finClearFilter') {
    document.getElementById('finDateStart').value = '';
    document.getElementById('finDateEnd').value   = '';
    Finance.loadTransactions();
  }
});
