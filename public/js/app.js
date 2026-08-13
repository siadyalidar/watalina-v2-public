// ─────────────────────────────────────────────────────
// LOGIN / LOGOUT / ROLE UI
// ─────────────────────────────────────────────────────
function showLogin() {
  const ov = document.getElementById('loginOverlay');
  if (ov) ov.classList.remove('hidden');
  const u = document.getElementById('loginUser');
  if (u) { u.value = ''; u.focus(); }
  const p = document.getElementById('loginPass');
  if (p) p.value = '';
  const e = document.getElementById('loginError');
  if (e) e.textContent = '';
}

function hideLogin() {
  const ov = document.getElementById('loginOverlay');
  if (ov) ov.classList.add('hidden');
}

async function doLogin() {
  const username = (document.getElementById('loginUser').value || '').trim();
  const password = document.getElementById('loginPass').value || '';
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  if (!username || !password) { errEl.textContent = 'Kullanıcı adı ve şifre gerekli'; return; }
  btn.disabled = true; btn.textContent = 'Giriş yapılıyor...';
  errEl.textContent = '';
  try {
    const data = await Api.post('/api/login', { username, password });
    Auth.save(data.token, data.user);
    hideLogin();
    applyRole();
    appStart();
    showToast('✓ Hoş geldiniz, ' + data.user.display_name);
  } catch(e) {
    errEl.textContent = e.message || 'Giriş başarısız';
  } finally {
    btn.disabled = false; btn.textContent = 'Giriş Yap';
  }
}

function doLogout() {
  if (!confirm('Çıkış yapmak istediğinizden emin misiniz?')) return;
  Auth.clear();
  showLogin();
  // Reset UI state
  cart = {}; discountPct = 0; exchangeRate = 0; searchQuery = '';
  renderCart();
}

function applyRole() {
  const role = Auth.role;
  const user = Auth.user;
  if (!user) return;

  // User badge
  const av = document.getElementById('tbUserAvatar');
  const nm = document.getElementById('tbUserName');
  const rl = document.getElementById('tbUserRole');
  if (av) av.textContent = user.display_name.charAt(0).toUpperCase();
  if (nm) nm.textContent = user.display_name;
  if (rl) rl.textContent = role === 'admin' ? 'Admin' : role === 'sales' ? 'Satış' : 'Servis';

  // Admin panel button — only admins see it
  const adminBtn = document.getElementById('adminLoginBtn');
  const adminDiv = document.getElementById('adminDivider');
  if (adminBtn) adminBtn.style.display = role === 'admin' ? '' : 'none';
  if (adminDiv) adminDiv.style.display = role === 'admin' ? '' : 'none';

  // Nav pills — show only allowed pages
  document.querySelectorAll('.nav-pill[data-role-require]').forEach(btn => {
    const allowed = btn.dataset.roleRequire.split(',');
    btn.style.display = allowed.includes(role) ? '' : 'none';
  });

  // Navigate to first allowed page
  let firstPage = 'dashboard';
  if (role === 'sales')   firstPage = 'sales';
  if (role === 'service') firstPage = 'service';
  switchPage(firstPage, null);
}

// ─────────────────────────────────────────────────────
// event delegation: login actions
// ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const ov = document.getElementById('loginOverlay');
    if (ov && !ov.classList.contains('hidden')) doLogin();
  }
});

let _initDone = false;
function appStart() {
  if (_initDone) return;
  _initDone = true;
  loadOverrides();
  buildRail();
  buildBrandChips();
  renderGrid();
  renderCart();
  renderRecent();
  renderDashboard();
  buildSavedCustomerSelect();

  // Wire up input/change events (no inline handlers needed)
  const railSearch = document.getElementById('railSearch');
  if (railSearch) railSearch.addEventListener('input', filterRail);

  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) globalSearch.addEventListener('input', handleSearch);

  const sortSel = document.getElementById('sortSel');
  if (sortSel) sortSel.addEventListener('change', () => sortProducts(sortSel.value));

  const excelFile = document.getElementById('excelFile');
  if (excelFile) excelFile.addEventListener('change', () => importExcel(excelFile));

  const svcSearchInput = document.getElementById('svcSearchInput');
  if (svcSearchInput) svcSearchInput.addEventListener('input', () => filterSvcCustomers(svcSearchInput.value));

  const admSearch = document.getElementById('admSearch');
  if (admSearch) admSearch.addEventListener('input', renderAdmTable);

  const admCatSel = document.getElementById('admCatSel');
  if (admCatSel) admCatSel.addEventListener('change', renderAdmTable);
}

window.addEventListener('DOMContentLoaded', () => {
  Auth.load();
  if (Auth.isLoggedIn) {
    hideLogin();
    applyRole();
    appStart();
  } else {
    showLogin();
  }
});
