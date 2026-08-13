// ─────────────────────────────────────────────────────
// CART SETTINGS (iskonto, kur, kdv)
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
// HTML ESCAPE
// ─────────────────────────────────────────────────────
function _esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─────────────────────────────────────────────────────
// ÖDEME YÖNTEMİ
// ─────────────────────────────────────────────────────
function togglePaymentFields() {
  const val = (document.querySelector('input[name="paymentMethod"]:checked') || {}).value || '';
  const show = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };
  show('pmField_kredi_karti', val === 'kredi_karti');
  show('pmField_iban',  val === 'iban');
  show('pmField_iban2', val === 'iban');
  show('pmField_iban3', val === 'iban');
  ['kredi_karti','nakit','iban'].forEach(v => {
    const lbl = document.getElementById('pmLabel_' + v);
    if (!lbl) return;
    lbl.style.borderColor = v === val ? 'var(--c-accent)' : 'var(--c-border)';
    lbl.style.background  = v === val ? 'rgba(232,93,38,.08)' : '';
  });
}

function getPaymentData() {
  const val = (document.querySelector('input[name="paymentMethod"]:checked') || {}).value || '';
  if (val === 'kredi_karti') return { type: 'kredi_karti', banka: document.getElementById('pmKKBanka').value || '' };
  if (val === 'nakit')       return { type: 'nakit' };
  if (val === 'iban')        return { type: 'iban', iban: document.getElementById('pmIBANNo').value || '', banka: document.getElementById('pmIBANBanka').value || '', hesap: document.getElementById('pmIBANHesap').value || '' };
  return {};
}

function restorePaymentData(pm) {
  if (!pm || !pm.type) return;
  const radio = document.getElementById('pm_' + pm.type);
  if (radio) { radio.checked = true; togglePaymentFields(); }
  if (pm.type === 'kredi_karti' && pm.banka) {
    const el = document.getElementById('pmKKBanka'); if (el) el.value = pm.banka;
  }
  if (pm.type === 'iban') {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    set('pmIBANNo',    pm.iban);
    set('pmIBANBanka', pm.banka);
    set('pmIBANHesap', pm.hesap);
  }
}

// ─────────────────────────────────────────────────────
// SAVED CUSTOMERS (firma kartı)
// ─────────────────────────────────────────────────────
const SC_KEY = 'watalina_saved_customers';

function getSavedCustomers() {
  try { return JSON.parse(localStorage.getItem(SC_KEY) || '[]'); } catch(e) { return []; }
}
function setSavedCustomers(list) {
  localStorage.setItem(SC_KEY, JSON.stringify(list));
}
function buildSavedCustomerSelect() {
  const sel = document.getElementById('savedCustSelect');
  if (!sel) return;
  const list = getSavedCustomers();
  sel.innerHTML = '<option value="">— Kayıtlı müşteri seç —</option>';
  list.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.firma + (c.yetkili ? ` (${c.yetkili})` : '');
    sel.appendChild(opt);
  });
}
function saveCurrentCustomer() {
  const firma   = (document.getElementById('cFirma')?.value || '').trim();
  const yetkili = (document.getElementById('cYetkili')?.value || '').trim();
  const tel     = (document.getElementById('cTel')?.value || '').trim();
  const vd      = (document.getElementById('cVD')?.value || '').trim();
  const vn      = (document.getElementById('cVN')?.value || '').trim();
  const email   = (document.getElementById('cEmail')?.value || '').trim();
  if (!firma) { showToast('Firma adı girilmemiş'); return; }
  const list = getSavedCustomers();
  const existing = list.findIndex(c => c.firma.toLowerCase() === firma.toLowerCase());
  const entry = { firma, yetkili, tel, vd, vn, email };
  if (existing >= 0) {
    if (!confirm(`"${firma}" zaten kayıtlı. Güncellenmesi mi?`)) return;
    list[existing] = entry;
  } else {
    list.push(entry);
  }
  setSavedCustomers(list);
  buildSavedCustomerSelect();
  showToast(`✓ "${firma}" kaydedildi`);
}
function loadSavedCustomer(idx) {
  if (idx === '') return;
  const list = getSavedCustomers();
  const c = list[Number(idx)];
  if (!c) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('cFirma',   c.firma);
  set('cYetkili', c.yetkili);
  set('cTel',     c.tel);
  set('cVD',      c.vd);
  set('cVN',      c.vn);
  set('cEmail',   c.email);
  showToast(`✓ ${c.firma} yüklendi`);
  const sel = document.getElementById('savedCustSelect');
  if (sel) sel.value = '';
}

// ─────────────────────────────────────────────────────
// RECENT QUOTES
// ─────────────────────────────────────────────────────
function saveRecentQuote(orderNo, firmName, total) {
  const _cartSnap = (typeof structuredClone === 'function') ? structuredClone(cart) : JSON.parse(JSON.stringify(cart));
  const q = {
    no: orderNo, firm: firmName,
    date: new Date().toLocaleDateString('tr-TR'),
    total, items: _cartSnap,
    disc: discountPct, rate: exchangeRate,
    payment: getPaymentData(),
    customer: {
      firma:   document.getElementById('cFirma')?.value   || '',
      yetkili: document.getElementById('cYetkili')?.value || '',
      tel:     document.getElementById('cTel')?.value     || '',
      vd:      document.getElementById('cVD')?.value      || '',
      vn:      document.getElementById('cVN')?.value      || '',
      email:   document.getElementById('cEmail')?.value   || '',
    }
  };
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
        const pm = q.payment || {};
        const pmLabel = pm.type === 'kredi_karti' ? `💳 ${pm.banka||'Kredi Kartı'}`
                      : pm.type === 'nakit'       ? '💵 Nakit'
                      : pm.type === 'iban'        ? `🏦 IBAN${pm.banka ? ' · '+pm.banka : ''}`
                      : '';
        return `<div class="rq-item">
          <div class="rq-no">${_esc(q.no)}</div>
          <div class="rq-firm">${_esc(q.firm)||'—'}</div>
          <div class="rq-items-count">${itemCount} kalem ürün${pmLabel ? ' · <span style="color:var(--c-accent)">' + pmLabel + '</span>' : ''}</div>
          <div class="rq-meta"><span class="rq-date">${_esc(q.date)}</span><span class="rq-total">${fmtUSD(parseFloat(q.total||0))}</span></div>
          <div class="rq-actions">
            <button class="rq-load-btn" data-action="restoreQuote" data-quoteno="${_esc(q.no)}">📂 Sepete Yükle</button>
            <button class="rq-load-btn" style="background:var(--c-ok);margin-left:4px" data-action="quoteToOrder" data-quoteno="${_esc(q.no)}">✅ Siparişe Dönüştür</button>
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
              <button class="rq-load-btn" data-action="restoreQuote" data-quoteno="${_esc(q.no)}">📂 Sepete Yükle</button>
              <button class="rq-del-btn" data-action="deleteLocalQuote" data-idx="${i}">Sil</button>
            </div>
          </div>`;
        }).join('');
      } catch(e){ wrap.innerHTML='<div class="rq-empty">Yüklenemedi.</div>'; }
    });
}
function openRecentQuotes() { switchTab('recent', null); }

// ─────────────────────────────────────────────────────
// RESTORE QUOTE → sepete yükle + ödeme + müşteri
// ─────────────────────────────────────────────────────
function restoreQuote(q) {
  if (!q || typeof q !== 'object') { showToast('Teklif yüklenemedi'); return; }
  cart        = q.items ? JSON.parse(JSON.stringify(q.items)) : {};
  discountPct = typeof q.disc === 'number' ? q.disc : 0;
  exchangeRate= typeof q.rate === 'number' ? q.rate : 0;

  const discInp  = document.getElementById('discInput');
  const discPill = document.getElementById('discPill');
  const discTxt  = document.getElementById('discPillTxt');
  if (discountPct > 0) {
    if (discInp)  discInp.value = discountPct;
    if (discPill) discPill.classList.remove('hidden');
    if (discTxt)  discTxt.textContent = discountPct;
  } else {
    if (discInp)  discInp.value = '';
    if (discPill) discPill.classList.add('hidden');
  }

  const rateInp = document.getElementById('rateInput');
  const curRow  = document.getElementById('curToggleRow');
  const rateLbl = document.getElementById('rateActiveLbl');
  if (exchangeRate > 0) {
    if (rateInp) rateInp.value = exchangeRate;
    if (curRow)  curRow.style.display = 'flex';
    if (rateLbl) rateLbl.textContent  = '1 USD = ' + fmtTL(exchangeRate);
  } else {
    if (rateInp) rateInp.value = '';
    if (curRow)  curRow.style.display = 'none';
  }

  // Ödeme yöntemini geri yükle
  if (q.payment) restorePaymentData(q.payment);

  // Müşteri bilgilerini geri yükle
  if (q.customer) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('cFirma',   q.customer.firma   || q.firm || '');
    set('cYetkili', q.customer.yetkili || '');
    set('cTel',     q.customer.tel     || '');
    set('cVD',      q.customer.vd      || '');
    set('cVN',      q.customer.vn      || '');
    set('cEmail',   q.customer.email   || '');
  } else if (q.firm) {
    const el = document.getElementById('cFirma'); if (el) el.value = q.firm;
  }

  renderCart(); updateAllPrices();
  switchTab('cart', null);
  showToast('✓ Teklif ' + q.no + ' yüklendi');
}

// ─────────────────────────────────────────────────────
// TEKLİF → SİPARİŞE DÖNÜŞTÜR
// ─────────────────────────────────────────────────────
async function quoteToOrder(quoteNo) {
  let quote = null;
  try {
    const quotes = await Api.getQuotes();
    quote = quotes.find(q => q.no === quoteNo);
  } catch(e) {}
  if (!quote) { showToast('Teklif bulunamadı'); return; }

  const firm    = quote.firm || quote.customer?.firma || '';
  const orderNo = 'SIP-' + Date.now().toString(36).toUpperCase();

  // Kendi modal'ımızla sor
  _qtoState = { quote, firm, orderNo };
  const modal = document.getElementById('qtoModal');
  if (!modal) {
    // Modal yoksa fallback — direkt kaydet
    _qtoSubmit('');
    return;
  }
  document.getElementById('qtoFirmLabel').textContent = firm || '(Belirtilmedi)';
  document.getElementById('qtoOrderNo').textContent   = orderNo;
  document.getElementById('qtoNotesInp').value        = '';
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('qtoNotesInp').focus(), 100);
}

let _qtoState = null;

function _qtoCancel() {
  document.getElementById('qtoModal').style.display = 'none';
  _qtoState = null;
}

async function _qtoSubmit(notes) {
  if (!_qtoState) return;
  const { quote, firm, orderNo } = _qtoState;
  _qtoState = null;
  document.getElementById('qtoModal').style.display = 'none';
  try {
    await Api.post('/api/orders', {
      no:     orderNo,
      firm:   firm,
      status: 'beklemede',
      total:  quote.total,
      disc:   quote.disc,
      rate:   quote.rate,
      items:  quote.items,
      notes:  notes || `Teklif ${quote.no} üzerinden oluşturuldu`,
    });
    showToast(`✅ Sipariş oluşturuldu: ${orderNo}`);
    renderDashboard();
    openOrdersModal();
  } catch(e) {
    showToast('Hata: ' + (e.message || 'Sipariş oluşturulamadı'));
  }
}
