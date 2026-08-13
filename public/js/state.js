const RQ_KEY = 'watalina_recent_quotes';
const OV_KEY = 'watalina_admin_overrides';

// ─────────────────────────────────────────────────────
// PRODUCT MAP (built once, mutated by overrides/admin)
// ─────────────────────────────────────────────────────
const productMap = {};
categories.forEach(cat => cat.products.forEach(p => { productMap[p.code] = { ...p }; }));

// ─────────────────────────────────────────────────────
// APP STATE  (single source of truth)
// ─────────────────────────────────────────────────────
const AppState = {
  // Sales
  discountPct:    0,
  kdvPct:         20,
  exchangeRate:   0,
  activeCurrency: 'USD',
  cart:           {},       // { [code]: { code, name, price, qty } }
  activeCategory: null,
  activeBrand:    null,
  sortMode:       'default',
  searchQuery:    '',
  // Admin
  adminAuth:      false,
  adminChanges:   {},
  logoClickCount: 0,
  logoTimer:      null,
  // Service
  activeSvcCustomer: null,
};

// Convenience proxies — keep call-sites working without mass rename
Object.defineProperties(window, {
  discountPct:    { get(){ return AppState.discountPct;    }, set(v){ AppState.discountPct    = v; } },
  kdvPct:         { get(){ return AppState.kdvPct;         }, set(v){ AppState.kdvPct         = v; } },
  exchangeRate:   { get(){ return AppState.exchangeRate;   }, set(v){ AppState.exchangeRate   = v; } },
  activeCurrency: { get(){ return AppState.activeCurrency; }, set(v){ AppState.activeCurrency = v; } },
  cart:           { get(){ return AppState.cart;           }, set(v){ AppState.cart           = v; } },
  activeCategory: { get(){ return AppState.activeCategory; }, set(v){ AppState.activeCategory = v; } },
  activeBrand:    { get(){ return AppState.activeBrand;    }, set(v){ AppState.activeBrand    = v; } },
  sortMode:       { get(){ return AppState.sortMode;       }, set(v){ AppState.sortMode       = v; } },
  searchQuery:    { get(){ return AppState.searchQuery;    }, set(v){ AppState.searchQuery    = v; } },
  adminAuth:      { get(){ return AppState.adminAuth;      }, set(v){ AppState.adminAuth      = v; } },
  adminChanges:   { get(){ return AppState.adminChanges;   }, set(v){ AppState.adminChanges   = v; } },
  logoClickCount: { get(){ return AppState.logoClickCount; }, set(v){ AppState.logoClickCount = v; } },
  logoTimer:      { get(){ return AppState.logoTimer;      }, set(v){ AppState.logoTimer      = v; } },
  activeSvcCustomer: { get(){ return AppState.activeSvcCustomer; }, set(v){ AppState.activeSvcCustomer = v; } },
});

// ─────────────────────────────────────────────────────
// OVERRIDES (localStorage)
// ─────────────────────────────────────────────────────
function _applyOverrides(s) {
  if (s.images)  Object.entries(s.images).forEach(([c,v])  => { PRODUCT_IMAGES[c] = v; });
  if (s.names)   Object.entries(s.names).forEach(([c,v])   => { if(productMap[c]) productMap[c].name = v; });
  if (s.prices)  Object.entries(s.prices).forEach(([c,v])  => { if(productMap[c]) productMap[c].price = v; });
  // Stok bilgisini ürün haritasına işle (number ya da null = takip edilmiyor)
  Object.keys(productMap).forEach(c => { if (productMap[c]) productMap[c].stock = null; });
  if (s.stock) Object.entries(s.stock).forEach(([c,v]) => {
    if (productMap[c] && v && v.tracked) productMap[c].stock = Number(v.qty) || 0;
  });
}
function loadOverrides() {
  // Async: fetch from API, fall back to localStorage
  Api.getOverrides()
    .then(ov => {
      _applyOverrides(ov);
      // Override'lar geldikten sonra grid'i yenile (race condition fix)
      if (typeof renderGrid === 'function') renderGrid();
      if (typeof renderAdmTable === 'function') renderAdmTable();
    })
    .catch(() => {
      try {
        const raw = localStorage.getItem(OV_KEY);
        if (raw) {
          _applyOverrides(JSON.parse(raw));
          if (typeof renderGrid === 'function') renderGrid();
        }
      } catch(e) {}
    });
}
function getOv() {
  try {
    var d = JSON.parse(localStorage.getItem(OV_KEY));
    if (!d || typeof d !== 'object') return { images: {}, names: {}, prices: {} };
    if (!d.images  || typeof d.images  !== 'object') d.images  = {};
    if (!d.names   || typeof d.names   !== 'object') d.names   = {};
    if (!d.prices  || typeof d.prices  !== 'object') d.prices  = {};
    return d;
  } catch(e) { return { images: {}, names: {}, prices: {} }; }
}

// ─────────────────────────────────────────────────────
// CANLI STOK GÜNCELLEMESİ (SSE)
// ─────────────────────────────────────────────────────
function initStockLiveUpdates() {
  if (!Auth.token) return;
  try {
    const es = new EventSource(API_BASE + '/events?token=' + encodeURIComponent(Auth.token));
    es.addEventListener('stock-changed', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (!productMap[data.code]) return;
        productMap[data.code].stock = data.tracked ? Number(data.qty) || 0 : null;
        if (typeof renderGrid === 'function' && AppState.currentPage === 'sales') renderGrid();
        if (typeof renderAdmTable === 'function') {
          const overlay = document.getElementById('adminOverlay');
          if (overlay && overlay.classList.contains('open')) { renderAdmTable(); updateAdmStats(); }
        }
      } catch(e) {}
    });
    es.onerror = () => { /* sessizce yeniden bağlanır */ };
  } catch(e) {}
}

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
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

