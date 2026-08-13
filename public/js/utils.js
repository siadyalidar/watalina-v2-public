// ─────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────
let _tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { console.warn('Toast element not found:', msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2500);
}


// ─── NUMBER FORMAT (see below) ───────────────────────
function fmtN(n, decimals) {
  return parseFloat(n||0).toLocaleString('tr-TR', {minimumFractionDigits:decimals||2, maximumFractionDigits:decimals||2});
}

// ─────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────

// ══ NUMBER FORMAT ═══════════════════════════════════════
function fmtUSD(n){return'$'+parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtTL(n){return'\u20ba'+parseFloat(n||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});}

// ══ PAGE NAV ════════════════════════════════════════════
const VALID_PAGES = new Set(['dashboard', 'sales', 'service', 'report', 'finance', 'performance']);
function switchPage(page, btn) {
  if (!VALID_PAGES.has(page)) { console.warn('switchPage: unknown page', page); return; }
  // Tüm panelleri gizle
  document.querySelectorAll('.page-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
  // Aktif paneli göster
  const panel = document.getElementById('page-' + page);
  if (panel) {
    panel.classList.add('active');
    panel.style.display = 'flex';
  } else { console.warn('switchPage: panel not found for', page); return; }
  // Nav pill aktif yap
  if (btn) {
    btn.classList.add('active');
  } else {
    document.querySelectorAll('[data-page="' + page + '"]').forEach(b => b.classList.add('active'));
  }
  AppState.currentPage = page;
  if (page === 'service') {
    refreshSvcData(function() {
      renderSvcDashboard();
      renderSvcCustomerList();
    });
  }
  if (page === 'dashboard') { renderDashboard(); }
  if (page === 'report')    { renderReport(); }
  if (page === 'performance') {
    const pp = document.getElementById('page-performance');
    if (pp) { pp.style.flexDirection = 'column'; pp.scrollTop = 0; }
    Performance.init();
  }
  if (page === 'finance')   {
    const fp = document.getElementById('page-finance');
    if (fp) fp.style.flexDirection = 'column';
    Finance.init();
  }
  // Mobil bottom nav sync
  if (typeof syncMbnActive === 'function') syncMbnActive(page);
}

