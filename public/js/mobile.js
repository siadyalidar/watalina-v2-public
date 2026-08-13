// ══ MOBİL NAVİGASYON ════════════════════════════════════

function closeMobileDrawers() {
  document.querySelector('.right-sidebar')?.classList.remove('mobile-open');
  document.querySelector('.left-rail')?.classList.remove('mobile-open');
  document.getElementById('mobileDrawerOverlay')?.classList.remove('visible');
}

function mbnGo(page) {
  closeMobileDrawers();
  // bottom nav active state
  document.querySelectorAll('.mbn-item[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  // rapor sayfası özel
  if (page === 'report') {
    document.querySelectorAll('.page-panel').forEach(p => p.style.display = 'none');
    const rp = document.getElementById('page-report');
    if (rp) { rp.style.display = 'flex'; renderReport(); }
    return;
  }
  // diğer sayfalar AppRouter ile
  if (typeof AppRouter !== 'undefined') {
    AppRouter.go(page, null);
  }
}

function mbnToggleCart() {
  const sidebar = document.querySelector('.right-sidebar');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('mobile-open');
  closeMobileDrawers();
  if (!isOpen) {
    sidebar.classList.add('mobile-open');
    document.getElementById('mobileDrawerOverlay')?.classList.add('visible');
  }
}

function updateMbnCartBadge() {
  const badge = document.getElementById('mbnCartBadge');
  if (!badge) return;
  const count = typeof cart !== 'undefined' ? Object.keys(cart).length : 0;
  badge.textContent  = count;
  badge.style.display = count > 0 ? '' : 'none';
}

// Router'dan sayfa değişince bottom nav'ı güncelle
function syncMbnActive(page) {
  document.querySelectorAll('.mbn-item[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
}

// Sepet render'landıkça badge güncelle
const _origRenderCart = typeof renderCart === 'function' ? renderCart : null;
window.addEventListener('DOMContentLoaded', () => {
  // AppRouter.go'yu wrap ederek sayfa değişimini yakala
  if (typeof AppRouter !== 'undefined' && AppRouter.go) {
    const _origGo = AppRouter.go.bind(AppRouter);
    AppRouter.go = function(page, after) {
      _origGo(page, after);
      syncMbnActive(page);
      closeMobileDrawers();
    };
  }
});
