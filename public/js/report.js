// ══ RAPORLAMA MODÜLü ════════════════════════════════════
let _reportPeriod = 30; // gün, 0 = tümü

function setReportPeriod(days) {
  _reportPeriod = Number(days);
  document.querySelectorAll('.rp-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.period) === _reportPeriod);
  });
  const lbl = _reportPeriod === 0 ? 'Tüm zamanlar'
             : _reportPeriod === 365 ? 'Bu yıl'
             : `Son ${_reportPeriod} günlük özet`;
  const el = document.getElementById('reportSubTitle');
  if (el) el.textContent = lbl;
  renderReport();
}

function _inPeriod(dateStr) {
  if (!dateStr || _reportPeriod === 0) return true;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - _reportPeriod);
  return d >= cutoff;
}

async function renderReport() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  try {
    // ── Teklifler ──────────────────────────────────────
    const quotes = await Api.getQuotes();
    const filteredQ = quotes.filter(q => _inPeriod(q.date));
    const qTotal = filteredQ.reduce((s, q) => s + (parseFloat(q.total) || 0), 0);
    set('rpKpiQuoteCount', filteredQ.length);
    set('rpKpiQuoteAmt', fmtUSD(qTotal));

    // Aylık chart
    _renderMonthChart(filteredQ);

    // En çok satan ürünler
    _renderTopProducts(filteredQ);

  } catch(e) { console.warn('Teklif rapor hatası:', e); }

  try {
    // ── Siparişler ─────────────────────────────────────
    const orders = await Api.getOrders();
    const filteredO = orders.filter(o => _inPeriod(o.date || o.createdAt));
    const oTotal = filteredO.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    set('rpKpiOrderCount', filteredO.length);
    set('rpKpiOrderAmt', fmtUSD(oTotal));

    // Sipariş durum dağılımı
    _renderOrderStatus(filteredO);

  } catch(e) { console.warn('Sipariş rapor hatası:', e); }

  try {
    // ── Servis ─────────────────────────────────────────
    const svc = await Api.getSvcData();
    const customers = svc.customers || [];
    const records   = svc.records   || [];
    const filteredR = records.filter(r => _inPeriod(r.date));
    const feeTotal  = filteredR.reduce((s, r) => s + (parseFloat(r.fee) || 0), 0);
    set('rpKpiCustomers',    customers.length);
    set('rpKpiServiceFee',   '₺' + feeTotal.toLocaleString('tr-TR', {minimumFractionDigits:0, maximumFractionDigits:0}));
    set('rpKpiServiceCount', filteredR.length + ' servis kaydı');

  } catch(e) { console.warn('Servis rapor hatası:', e); }
}

function _renderTopProducts(quotes) {
  const wrap = document.getElementById('rpTopProducts');
  if (!wrap) return;

  // Tüm item'ları topla
  const counts = {};
  quotes.forEach(q => {
    const items = q.items || {};
    Object.values(items).forEach(item => {
      const key = item.code || item.name || '?';
      if (!counts[key]) counts[key] = { name: item.name || key, qty: 0, total: 0 };
      counts[key].qty   += (item.qty  || 1);
      counts[key].total += (item.price || 0) * (item.qty || 1);
    });
  });

  const sorted = Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 6);
  if (!sorted.length) { wrap.innerHTML = '<div class="rc-empty">Veri yok</div>'; return; }

  const max = sorted[0].qty;
  wrap.innerHTML = sorted.map(p => `
    <div class="rc-row">
      <span style="flex:0 0 120px;font-size:.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${_esc(p.name)}">${_esc(p.name)}</span>
      <div class="rc-bar-wrap"><div class="rc-bar" style="width:${Math.round(p.qty/max*100)}%"></div></div>
      <span class="rc-val">${p.qty} adet</span>
    </div>`).join('');
}

function _renderOrderStatus(orders) {
  const wrap = document.getElementById('rpOrderStatus');
  if (!wrap) return;
  if (!orders.length) { wrap.innerHTML = '<div class="rc-empty">Sipariş yok</div>'; return; }

  const STATUS_LABELS = { beklemede:'Beklemede', onaylandi:'Onaylandı', kargoda:'Kargoda', teslim:'Teslim Edildi', iptal:'İptal' };
  const STATUS_COLORS_MAP = { beklemede:'#d97706', onaylandi:'#059669', kargoda:'#0891b2', teslim:'#005bcc', iptal:'#dc2626' };
  const counts = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  const max = Math.max(...Object.values(counts));

  wrap.innerHTML = Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .map(([s, n]) => `
      <div class="rc-row">
        <span style="flex:0 0 100px;font-size:.72rem;color:${STATUS_COLORS_MAP[s]||'#64748b'};font-weight:700">${STATUS_LABELS[s]||s}</span>
        <div class="rc-bar-wrap"><div class="rc-bar" style="width:${Math.round(n/max*100)}%;background:${STATUS_COLORS_MAP[s]||'#e85d26'}"></div></div>
        <span class="rc-val">${n}</span>
      </div>`).join('');
}

function _renderMonthChart(quotes) {
  const wrap = document.getElementById('rpMonthChart');
  if (!wrap) return;

  // Son 6 ay
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleDateString('tr-TR', { month:'short' }),
      year:  d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    });
  }

  quotes.forEach(q => {
    if (!q.date && !q.createdAt) return;
    const d = new Date(q.date || q.createdAt);
    const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
    if (m) m.total += parseFloat(q.total) || 0;
  });

  const max = Math.max(...months.map(m => m.total), 1);
  wrap.innerHTML = months.map(m => {
    const h = Math.max(Math.round(m.total / max * 72), m.total > 0 ? 4 : 0);
    return `<div class="mc-bar-wrap">
      <div class="mc-val">${m.total > 0 ? '$'+Math.round(m.total/1000)+'k' : ''}</div>
      <div class="mc-bar" style="height:${h}px" title="${fmtUSD(m.total)}"></div>
      <div class="mc-label">${m.label}</div>
    </div>`;
  }).join('');
}
