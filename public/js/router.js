const AppRouter = {
  go(page, afterAction) {
    switchPage(page, null);
    if (page === 'report') renderReport();
    if (afterAction) {
      setTimeout(() => {
        if (afterAction === 'openAddCustomerModal') openAddCustomerModal();
        else if (afterAction === 'openAddServiceModal') openAddServiceModal('');
        else if (afterAction === 'focusSearch') { const s = document.getElementById('globalSearch'); if(s) s.focus(); }
        else if (afterAction === 'openRecentTab') switchTab('recent', null);
      }, 200);
    }
  }
};

// ─────────────────────────────────────────────────────
// CENTRAL EVENT DELEGATION
// ─────────────────────────────────────────────────────
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch(action) {
    case 'switchPage': {
      const page = el.dataset.page;
      const after = el.dataset.after || null;
      if (page) AppRouter.go(page, after);
      break;
    }
    case 'switchTab': {
      const tab = el.dataset.tab;
      if (tab) switchTab(tab, null);
      break;
    }
    case 'openLb': {
      const code = el.dataset.code || el.closest('[data-code]')?.dataset.code;
      if (code) openLb(code);
      break;
    }
    case 'chQty': {
      const code = el.dataset.code;
      const delta = parseInt(el.dataset.delta) || 0;
      if (code) chQty(code, delta);
      break;
    }
    case 'addToCart': {
      const code = el.dataset.code;
      if (code) addToCart(code);
      break;
    }
    case 'chCartQty': {
      const code = el.dataset.code;
      const delta = parseInt(el.dataset.delta) || 0;
      if (code) chCartQty(code, delta);
      break;
    }
    case 'removeFromCart': {
      const code = el.dataset.code;
      if (code) removeFromCart(code);
      break;
    }
    case 'clearCart':       clearCart(); break;
    case 'generatePDF':     generatePDF(); break;
    case 'sendWhatsApp':    sendWhatsApp(); break;
    case 'applyDiscount':   applyDiscount(); break;
    case 'applyRate':       applyRate(); break;
    case 'applyKdv':        applyKdv(); break;
    case 'setCurrency': {
      const cur = el.dataset.currency;
      if (cur) setCurrency(cur);
      break;
    }
    case 'triggerExcelFile': {
      const fi = document.getElementById('excelFile');
      if (fi) fi.click();
      break;
    }
    case 'exportExcel':     exportExcel(); break;
    case 'openAdmin':        openAdmin(); break;
    case 'closeAdmin':      closeAdmin(); break;
    case 'admLogout':       admLogout(); break;
    case 'saveAdmChanges':  saveAdmChanges(); break;
    case 'showNewProductForm': showNewProductForm(); break;
    case 'hideNewProductForm': hideNewProductForm(); break;
    case 'addNewProduct':   addNewProduct(); break;
    case 'resetAllOv':      resetAllOv(); break;
    case 'admPickImg': {
      const code = el.dataset.code;
      if (code) admPickImg(code);
      break;
    }
    case 'admReset': {
      const code = el.dataset.code;
      if (code) admReset(code);
      break;
    }
    case 'openAddCustomerModal':    openAddCustomerModal(); break;
    case 'closeAddCustomerModal':   closeAddCustomerModal(); break;
    case 'openAddServiceModal': {
      const custId = el.dataset.custid || '';
      openAddServiceModal(custId);
      break;
    }
    case 'openAddServiceModalActive': {
      if (activeSvcCustomer) openAddServiceModal(activeSvcCustomer);
      break;
    }
    case 'closeAddServiceModal':    closeAddServiceModal(); break;
    case 'showSvcDashboard':        showSvcDashboard(); break;
    case 'openRecentQuotes':        openRecentQuotes(); break;
    case 'openOrdersModal':         openOrdersModal(); break;
    case 'openOrdersFiltered': {
      const st = el.dataset.status || '';
      openOrdersModalFiltered(st);
      break;
    }
    case 'closeOrdersModal':        closeOrdersModal(); break;
    case 'closeLb':                 closeLb(); break;
    case 'closeLbOverlay': {
      if (e.target === el) closeLb();
      break;
    }
    case 'handleLogoClick':         handleLogoClick(); break;
    case 'doLogin':                  doLogin(); break;
    case 'doLogout':                 doLogout(); break;
    case 'restoreQuote': {
      const no = el.dataset.quoteno;
      Api.getQuotes()
        .then(quotes => {
          const q = quotes.find(x => x.no === no);
          if (q) restoreQuote(q);
          else showToast('Teklif bulunamadı');
        })
        .catch(() => {
          try {
            const rq = JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
            const q = rq.find(x => x.no === no);
            if (q) restoreQuote(q); else showToast('Teklif bulunamadı');
          } catch(e) { showToast('Teklif yüklenemedi'); }
        });
      break;
    }
    case 'openQuoteFromDash': {
      const no = el.dataset.quoteno;
      Api.getQuotes()
        .then(quotes => {
          const q = quotes.find(x => x.no === no);
          if (q) { AppRouter.go('sales', null); setTimeout(() => restoreQuote(q), 400); }
        })
        .catch(() => {
          try {
            const rq = JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
            const q = rq.find(x => x.no === no);
            if (q) { AppRouter.go('sales', null); setTimeout(() => restoreQuote(q), 400); }
          } catch(e) {}
        });
      break;
    }
    case 'openRecentTab': {
      AppRouter.go('sales', 'openRecentTab');
      break;
    }
    case 'openServiceCustomer': {
      const custId = el.dataset.custid;
      AppRouter.go('service', null);
      if (custId) setTimeout(() => showCustomerDetail(custId), 400);
      break;
    }
    case 'deleteActiveSvcCustomer': {
      if (activeSvcCustomer) deleteSvcCustomer(activeSvcCustomer);
      break;
    }
    case 'openSvcCustomer': {
      const custId = el.dataset.custid;
      if (custId) showCustomerDetail(custId);
      break;
    }
    case 'deleteQuote': {
      const qid = el.dataset.quoteid;
      if (!qid) break;
      if (!confirm('Bu teklif silinsin mi?')) break;
      Api.deleteQuote(Number(qid))
        .then(() => { renderRecent(); showToast('Teklif silindi'); })
        .catch(() => showToast('Silinemedi'));
      break;
    }
    case 'deleteLocalQuote': {
      const idx = Number(el.dataset.idx);
      try {
        const rq = JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
        rq.splice(idx, 1);
        localStorage.setItem(RQ_KEY, JSON.stringify(rq));
        renderRecent(); showToast('Teklif silindi');
      } catch(e) {}
      break;
    }
    case 'saveCurrentCustomer': saveCurrentCustomer(); break;
    case 'saveNewCustomer':     saveNewCustomer(); break;
    case 'quoteToOrder': {
      const no = el.dataset.quoteno;
      if (no) quoteToOrder(no);
      break;
    }
    case 'setReportPeriod': setReportPeriod(el.dataset.period); break;
    case 'mbnGo':          mbnGo(el.dataset.page); break;
    case 'mbnToggleCart':  mbnToggleCart(); break;
    case 'saveServiceRecord':  saveServiceRecord(); break;
    case 'saveCustomer':       saveCustomer(); break;
    case 'editSvcCustomer': {
      const custId = el.dataset.custid;
      if (custId) openEditCustomerModal(custId);
      break;
    }
    case 'deleteSvcCustomer': {
      const custId = el.dataset.custid;
      if (custId) deleteSvcCustomer(custId);
      break;
    }
    case 'deleteRecord': {
      const recordId = el.dataset.recordid;
      if (recordId) deleteSvcRecord(recordId);
      break;
    }
    case 'editSvcRecord': {
      const recordId = el.dataset.recordid;
      if (recordId) openEditServiceModal(recordId);
      break;
    }
    case 'svcDashboard': showSvcDashboard(); break;
    case 'openNewOrderModal':  openNewOrderModal(); break;
    case 'closeNewOrderModal': closeNewOrderModal(); break;
    case 'saveNewOrder':        saveNewOrder(); break;
  }
});

// also handle select change for saved customers
document.addEventListener('change', function(e) {
  const el = e.target;
  if (el.dataset.action === 'loadSavedCustomer') loadSavedCustomer(el.value);
});
function chCartQty(code, d) {
  if (!cart[code]) return;
  const cur = cart[code].qty;
  cart[code].qty = Math.max(1, (isNaN(cur) ? 1 : cur) + d);
  renderCart();
}
function removeFromCart(code) { delete cart[code]; renderCart(); }
function clearCart() { if(!Object.keys(cart).length) return; if(!confirm('Sepet temizlensin mi?'))return; cart={}; renderCart(); }

function renderCart() {
  const items = Object.values(cart);
  const el = document.getElementById('cartItems');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>Sepet boş. Ürün ekleyin.</div>';
    updateSummary(0,0); return;
  }
  let sub = 0;
  el.innerHTML = items.map(item => {
    const ep = discountPct>0 ? item.price*(1-discountPct/100) : item.price;
    const lt = ep*item.qty; sub += lt;
    const img = PRODUCT_IMAGES[item.code];
    const imgHtml = img ? `<img src="${img}" alt="">` : '<div class="ci-img-ph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>';
    const unitTxt = discountPct>0
      ? `<s style="color:var(--c-ink3)">${fmtUSD(item.price)}</s> <span style="color:var(--c-green);font-weight:700">${fmtUSD(ep)}</span>`
      : `${fmtUSD(item.price)}`;
    return `<div class="cart-item">
      <div class="ci-img">${imgHtml}</div>
      <div class="ci-info">
        <div class="ci-code">${item.code}</div>
        <div class="ci-name">${item.name}</div>
        <div class="ci-unit">${unitTxt}/ad ${exchangeRate>0?'<span class="ci-tl">'+fmtTL(ep*exchangeRate)+'</span>':''}</div>
      </div>
      <div class="ci-right">
        <div class="ci-total">${fmtUSD(lt)}</div>
        ${exchangeRate>0?'<div class="ci-tl">'+fmtTL(lt*exchangeRate)+'</div>':''} 
        <div class="ci-qty-ctrl">
          <button class="ciq-btn" data-action="chCartQty" data-code="${item.code}" data-delta="-1">−</button>
          <span class="ciq-val">${item.qty}</span>
          <button class="ciq-btn" data-action="chCartQty" data-code="${item.code}" data-delta="1">+</button>
        </div>
        <button class="ci-del" data-action="removeFromCart" data-code="${item.code}">✕ Kaldır</button>
      </div>
    </div>`;
  }).join('');
  updateSummary(sub, discountPct);
}

function updateSummary(discountedSub, discPct) {
  const items = Object.values(cart);
  const origSub = items.reduce((s,i)=>s+i.price*i.qty, 0);
  const ep = discountedSub;
  const tax = exchangeRate>0 ? (ep*exchangeRate*kdvPct/100)/exchangeRate : ep*kdvPct/100;
  const grand = ep + tax;
  document.getElementById('sSubtotal').textContent = fmtUSD(origSub);
  const discRow = document.getElementById('sDiscRow');
  const afterRow = document.getElementById('sAfterRow');
  if (discPct>0) {
    discRow.style.display='flex'; afterRow.style.display='flex';
    document.getElementById('sDiscPct').textContent = discPct;
    document.getElementById('sDiscAmt').textContent = '−'+fmtUSD(origSub-ep);
    document.getElementById('sAfter').textContent = fmtUSD(ep);
  } else { discRow.style.display='none'; afterRow.style.display='none'; }
  document.getElementById('sTax').textContent = fmtUSD(tax);
  document.getElementById('sTotal').textContent = fmtUSD(grand);
  const tlEl = document.getElementById('sTotalTL');
  if (exchangeRate>0) { tlEl.style.display='block'; tlEl.textContent='≈ '+fmtTL(grand*exchangeRate); }
  else tlEl.style.display='none';
}

// ─────────────────────────────────────────────────────
// DISCOUNT / RATE / KDV
