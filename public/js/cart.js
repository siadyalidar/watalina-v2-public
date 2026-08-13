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
// ─────────────────────────────────────────────────────
function applyDiscount() {
  const v = parseFloat(document.getElementById('discInput').value)||0;
  discountPct = Math.min(100,Math.max(0,v));
  updateAllPrices(); renderCart();
  const pill = document.getElementById('discPill');
  if (discountPct>0) { pill.classList.remove('hidden'); document.getElementById('discPillTxt').textContent=discountPct; }
  else pill.classList.add('hidden');
  showToast(discountPct>0 ? '✓ %'+discountPct+' iskonto uygulandı' : 'İskonto kaldırıldı');
}
function applyRate() {
  const v = parseFloat(document.getElementById('rateInput').value)||0;
  if (!v) { showToast('Geçerli kur girin'); return; }
  exchangeRate = v;
  document.getElementById('curToggleRow').style.display='flex';
  document.getElementById('rateActiveLbl').textContent='1 USD = '+fmtTL(v);
  updateAllPrices(); renderCart();
  showToast('✓ Kur: 1 $ = '+fmtTL(v));
}
function setCurrency(cur) {
  activeCurrency=cur;
  document.getElementById('btnUSD').classList.toggle('active',cur==='USD');
  document.getElementById('btnTL').classList.toggle('active',cur==='TL');
  updateAllPrices(); renderCart();
}
function applyKdv() {
  const v = parseFloat(document.getElementById('kdvInput').value)||20;
  kdvPct = Math.max(0,Math.min(100,v));
  document.getElementById('kdvPillVal').textContent = kdvPct;
  renderCart(); showToast('✓ KDV: %'+kdvPct);
}
function updateAllPrices() {
  document.querySelectorAll('[data-dealer]').forEach(el => {
    const p=productMap[el.dataset.dealer]; if(!p)return;
    const ep=discountPct>0?p.price*(1-discountPct/100):p.price;
    el.textContent=fmtUSD(ep);
    el.className='pcard-price-main'+(discountPct>0?' discounted':'');
  });
  document.querySelectorAll('[data-orig]').forEach(el => {
    el.className='pcard-price-orig'+(discountPct>0?' show':'');
  });
  document.querySelectorAll('[data-badge]').forEach(el => {
    if(discountPct>0){el.textContent='-'+discountPct+'%';el.className='pcard-price-disc show';}
    else el.className='pcard-price-disc';
  });
  document.querySelectorAll('[data-tl]').forEach(el => {
    const p=productMap[el.dataset.tl]; if(!p)return;
    const ep=discountPct>0?p.price*(1-discountPct/100):p.price;
    if(exchangeRate>0){el.textContent='≈ '+fmtTL(ep*exchangeRate);el.className='pcard-price-tl show';}
    else el.className='pcard-price-tl';
  });
}

// ─────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.stab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.stab[data-tab]').forEach(b=>{ if(b.dataset.tab===id) b.classList.add('active'); });
  const panel = document.getElementById('tab-'+id);
  if(panel) panel.classList.add('active');
  if(id==='recent') renderRecent();
}

// ─────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────
function openLb(code) {
  const src=PRODUCT_IMAGES[code]; if(!src) return;
  const p=productMap[code];
  document.getElementById('lbImg').src=src;
  document.getElementById('lbTitle').textContent=p?p.name:code;
  document.getElementById('lbCode').textContent=code;
  document.getElementById('lbOverlay').classList.add('open');
}
function closeLb(){ document.getElementById('lbOverlay').classList.remove('open'); }

// ─────────────────────────────────────────────────────
// HTML ESCAPE UTILITY
// ─────────────────────────────────────────────────────
function _esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────
// ÖDEME YÖNTEMİ
// ─────────────────────────────────────────────────────
function togglePaymentFields() {
  const val = (document.querySelector('input[name="paymentMethod"]:checked') || {}).value || '';
  const show = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
  };
  show('pmField_kredi_karti', val === 'kredi_karti');
  show('pmField_iban',  val === 'iban');
  show('pmField_iban2', val === 'iban');
  show('pmField_iban3', val === 'iban');
  // Seçili label'ı vurgula
  ['kredi_karti','nakit','iban'].forEach(v => {
    const lbl = document.getElementById('pmLabel_' + v);
    if (!lbl) return;
    if (v === val) {
      lbl.style.borderColor = 'var(--c-accent)';
      lbl.style.background  = 'rgba(232,93,38,.08)';
    } else {
      lbl.style.borderColor = 'var(--c-border)';
      lbl.style.background  = '';
    }
  });
}

function getPaymentData() {
  const val = (document.querySelector('input[name="paymentMethod"]:checked') || {}).value || '';
  if (val === 'kredi_karti') return { type: 'kredi_karti', banka: document.getElementById('pmKKBanka').value || '' };
  if (val === 'nakit')       return { type: 'nakit' };
  if (val === 'iban')        return { type: 'iban', iban: document.getElementById('pmIBANNo').value || '', banka: document.getElementById('pmIBANBanka').value || '', hesap: document.getElementById('pmIBANHesap').value || '' };
  return {};
}

// ─────────────────────────────────────────────────────
// RECENT QUOTES
// ─────────────────────────────────────────────────────
function saveRecentQuote(orderNo, firmName, total) {
  const _cartSnap = (typeof structuredClone === 'function') ? structuredClone(cart) : JSON.parse(JSON.stringify(cart));
  const q = { no: orderNo, firm: firmName, date: new Date().toLocaleDateString('tr-TR'), total, items: _cartSnap, disc: discountPct, rate: exchangeRate, payment: getPaymentData() };
  Api.saveQuote(q)
    .then(() => renderRecent())
    .catch(() => {
      try {
        const rq = JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
        rq.unshift(q);
        localStorage.setItem(RQ_KEY, JSON.stringify(rq.slice(0,20)));
        renderRecent();
      } catch(e){}
      showToast('⚠ Teklif yerel kaydedildi (bağlantı sorunu)');
    });
}
function renderRecent() {
  const wrap = document.getElementById('recentWrap');
  if (!wrap) return;
  wrap.innerHTML = '<div class="rq-empty" style="opacity:.5">Yükleniyor...</div>';
  Api.getQuotes()
    .then(quotes => {
      if (!quotes.length) { wrap.innerHTML='<div class="rq-empty">Henüz teklif oluşturulmadı.</div>'; return; }
      wrap.innerHTML = quotes.map(q => {
        const itemCount = q.items ? Object.keys(q.items).length : 0;
        return `<div class="rq-item">
          <div class="rq-no">${_esc(q.no)}</div>
          <div class="rq-firm">${_esc(q.firm)||'—'}</div>
          <div class="rq-items-count">${itemCount} kalem ürün</div>
          <div class="rq-meta"><span class="rq-date">${_esc(q.date)}</span><span class="rq-total">${fmtUSD(parseFloat(q.total||0))}</span></div>
          <div class="rq-actions">
            <button class="rq-load-btn" data-action="restoreQuote" data-quoteno="${_esc(q.no)}">Sepete Yükle</button>
            <button class="rq-del-btn" data-action="deleteQuote" data-quoteid="${q.id}">Sil</button>
          </div>
        </div>`;
      }).join('');
    })
    .catch(() => {
      try {
        const rq = JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
        if (!rq.length) { wrap.innerHTML='<div class="rq-empty">Henüz teklif oluşturulmadı.</div>'; return; }
        wrap.innerHTML = rq.map((q,i) => {
          const itemCount = q.items ? Object.keys(q.items).length : 0;
          return `<div class="rq-item">
            <div class="rq-no">${_esc(q.no)}</div>
            <div class="rq-firm">${_esc(q.firm)||'—'}</div>
            <div class="rq-items-count">${itemCount} kalem ürün</div>
            <div class="rq-meta"><span class="rq-date">${_esc(q.date)}</span><span class="rq-total">${fmtUSD(parseFloat(q.total||0))}</span></div>
            <div class="rq-actions">
              <button class="rq-load-btn" data-action="restoreQuote" data-quoteno="${_esc(q.no)}">Sepete Yükle</button>
              <button class="rq-del-btn" data-action="deleteLocalQuote" data-idx="${i}">Sil</button>
            </div>
          </div>`;
        }).join('');
      } catch(e){ wrap.innerHTML='<div class="rq-empty">Yüklenemedi.</div>'; }
    });
}
