// ═══════════════════════════════════════════════════════
// ORDERS SYSTEM
// ═══════════════════════════════════════════════════════
const STATUS_LABELS = { beklemede:'Beklemede', onaylandi:'Onaylandı', kargoda:'Kargoda', teslim:'Teslim', iptal:'İptal' };
const STATUS_COLORS = { beklemede:'var(--c-amber)', onaylandi:'var(--c-green)', kargoda:'var(--c-teal)', teslim:'var(--c-blue)', iptal:'var(--c-red)' };
const STATUS_BG    = { beklemede:'var(--c-amber-lt)', onaylandi:'var(--c-green-lt)', kargoda:'#f0fdfa', teslim:'var(--c-blue-lt)', iptal:'var(--c-red-lt)' };

let _allOrders = [];
let _ordersFilter = { status: '', search: '' };

function statusBadge(s) {
  return `<span style="display:inline-block;font-size:.58rem;font-weight:700;padding:2px 7px;border-radius:10px;background:${STATUS_BG[s]||'#f1f5f9'};color:${STATUS_COLORS[s]||'#64748b'}">${STATUS_LABELS[s]||s}</span>`;
}

function genOrderNo() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `SIP-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.floor(Math.random()*900)+100}`;
}

// Open new order modal — prefill from cart
function openNewOrderModal() {
  const items = Object.values(cart);
  if (!items.length) { showToast('Sepet boş — önce ürün ekleyin'); return; }
  document.getElementById('noInp').value       = genOrderNo();
  document.getElementById('quoteNoInp').value  = '';
  document.getElementById('ordFirmaInp').value = document.getElementById('cFirma')?.value || '';
  document.getElementById('ordContactInp').value = document.getElementById('cYetkili')?.value || '';
  document.getElementById('ordPhoneInp').value = document.getElementById('cTel')?.value || '';
  document.getElementById('ordEmailInp').value = document.getElementById('cEmail')?.value || '';
  document.getElementById('ordStatusInp').value = 'beklemede';
  document.getElementById('ordNotesInp').value = '';
  // Items summary
  const ep = (p) => discountPct > 0 ? p.price*(1-discountPct/100) : p.price;
  const total = items.reduce((s,i) => s + ep(i)*i.qty, 0);
  document.getElementById('ordItemsSummary').innerHTML =
    items.map(i => `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--c-border)"><span>${_esc(i.code)} — ${_esc(i.name)}</span><span style="font-weight:700">${i.qty} × ${fmtUSD(ep(i))}</span></div>`).join('') +
    `<div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:800;color:var(--c-green)"><span>Toplam</span><span>${fmtUSD(total)}</span></div>`;
  const modal = document.getElementById('newOrderModal');
  modal.style.display = 'flex';
}

function closeNewOrderModal() {
  document.getElementById('newOrderModal').style.display = 'none';
}

function saveNewOrder() {
  const no      = document.getElementById('noInp').value.trim();
  const firm    = document.getElementById('ordFirmaInp').value.trim();
  const contact = document.getElementById('ordContactInp').value.trim();
  const phone   = document.getElementById('ordPhoneInp').value.trim();
  const email   = document.getElementById('ordEmailInp').value.trim();
  const status  = document.getElementById('ordStatusInp').value;
  const notes   = document.getElementById('ordNotesInp').value.trim();
  const quoteNo = document.getElementById('quoteNoInp').value.trim();
  if (!no)   { showToast('Sipariş no gerekli'); return; }
  if (!firm) { showToast('Firma adı gerekli'); return; }
  const items = Object.values(cart);
  const ep = (p) => discountPct > 0 ? p.price*(1-discountPct/100) : p.price;
  const total = items.reduce((s,i) => s + ep(i)*i.qty, 0);
  const itemsArr = items.map(i => ({ code:i.code, name:i.name, price:i.price, qty:i.qty }));
  Api.createOrder({ no, quoteNo, firm, contact, phone, email, status, total, disc:discountPct, rate:exchangeRate, items:itemsArr, notes })
    .then(() => {
      closeNewOrderModal();
      showToast(`✓ Sipariş ${no} kaydedildi`);
      renderDashboard();
    })
    .catch(e => showToast('Hata: ' + e.message));
}

// Orders modal
function openOrdersModal() {
  document.getElementById('ordersModal').style.display = 'flex';
  loadAndRenderOrders();
  document.getElementById('orderSearchInp').oninput = () => {
    _ordersFilter.search = document.getElementById('orderSearchInp').value.toLowerCase();
    renderOrdersList();
  };
  document.getElementById('orderStatusFilter').onchange = () => {
    _ordersFilter.status = document.getElementById('orderStatusFilter').value;
    renderOrdersList();
  };
}

function closeOrdersModal() {
  document.getElementById('ordersModal').style.display = 'none';
}

function openOrdersModalFiltered(status) {
  _ordersFilter.status = status || '';
  openOrdersModal();
  // Filter select'i de güncelle
  setTimeout(function() {
    var sel = document.getElementById('orderStatusFilter');
    if (sel) sel.value = status || '';
  }, 100);
}

function loadAndRenderOrders() {
  const wrap = document.getElementById('ordersListWrap');
  wrap.innerHTML = '<div class="dash-empty">Yükleniyor...</div>';
  Api.getOrders()
    .then(orders => { _allOrders = orders; renderOrdersList(); })
    .catch(() => { wrap.innerHTML = '<div class="dash-empty">Yüklenemedi.</div>'; });
}

function renderOrdersList() {
  const wrap = document.getElementById('ordersListWrap');
  let orders = _allOrders;
  if (_ordersFilter.status) orders = orders.filter(o => o.status === _ordersFilter.status);
  if (_ordersFilter.search) {
    const q = _ordersFilter.search;
    orders = orders.filter(o => o.no.toLowerCase().includes(q) || (o.firm||'').toLowerCase().includes(q));
  }
  const footer = document.getElementById('ordersModalFooter');
  if (footer) footer.textContent = `${orders.length} sipariş gösteriliyor (toplam ${_allOrders.length})`;
  if (!orders.length) { wrap.innerHTML = '<div class="dash-empty">Sipariş bulunamadı.</div>'; return; }
  wrap.innerHTML = orders.map(o => `
    <div style="background:var(--c-surf);border:1px solid var(--c-border);border-radius:8px;padding:10px 14px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div>
          <div style="font-size:.62rem;font-family:monospace;color:var(--c-ink3)">${_esc(o.no)}${o.quoteNo?` · Teklif: ${_esc(o.quoteNo)}`:''}</div>
          <div style="font-size:.82rem;font-weight:700;color:var(--c-ink);margin-top:1px">${_esc(o.firm)||'—'}</div>
          ${o.contact ? `<div style="font-size:.65rem;color:var(--c-ink3)">${_esc(o.contact)}${o.phone?` · ${_esc(o.phone)}`:''}</div>` : ''}
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          ${statusBadge(o.status)}
          <div style="font-size:.82rem;font-weight:800;color:var(--c-green)">${fmtUSD(o.total)}</div>
          <div style="font-size:.6rem;color:var(--c-ink3)">${o.createdAt ? o.createdAt.slice(0,10) : ''}</div>
        </div>
      </div>
      <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">
        ${['beklemede','onaylandi','kargoda','teslim','iptal'].map(s =>
          `<button onclick="changeOrderStatus(${o.id},'${s}')" style="font-size:.6rem;padding:3px 8px;border-radius:4px;border:1px solid ${s===o.status?STATUS_COLORS[s]:'var(--c-border)'};background:${s===o.status?STATUS_BG[s]:'white'};color:${s===o.status?STATUS_COLORS[s]:'var(--c-ink3)'};cursor:pointer;font-weight:${s===o.status?'700':'400'}">${STATUS_LABELS[s]}</button>`
        ).join('')}
        <button onclick="deleteOrder(${o.id})" style="font-size:.6rem;padding:3px 8px;border-radius:4px;border:1px solid #fca5a5;background:var(--c-red-lt);color:var(--c-red);cursor:pointer;margin-left:auto">Sil</button>
      </div>
      ${o.notes ? `<div style="font-size:.65rem;color:var(--c-ink3);margin-top:5px;font-style:italic">${_esc(o.notes)}</div>` : ''}
    </div>`).join('');
}

function changeOrderStatus(id, status) {
  Api.updateOrderStatus(id, status)
    .then(() => {
      const o = _allOrders.find(x => x.id === id);
      if (o) o.status = status;
      renderOrdersList();
      renderDashboard();
      showToast('✓ Durum: ' + STATUS_LABELS[status]);
    })
    .catch(e => showToast('Hata: ' + e.message));
}

function deleteOrder(id) {
  if (!confirm('Bu sipariş silinsin mi?')) return;
  Api.deleteOrder(id)
    .then(() => { _allOrders = _allOrders.filter(o => o.id !== id); renderOrdersList(); renderDashboard(); showToast('Sipariş silindi'); })
    .catch(e => showToast('Hata: ' + e.message));
}

// ══ DASHBOARD RENDER ═════════════════════════════════════
function _setEl(id, prop, val) {
  var el = document.getElementById(id);
  if (el) el[prop] = val;
}
window.renderDashboard = function renderDashboard(){
  // Siparişler widget'ı
  Api.getOrders().then(function(orders){
    var all  = orders.length;
    var pend = orders.filter(function(o){return o.status==='beklemede';}).length;
    var appr = orders.filter(function(o){return o.status==='onaylandi';}).length;
    var ship = orders.filter(function(o){return o.status==='kargoda';}).length;
    var delv = orders.filter(function(o){return o.status==='teslim';}).length;
    var _s = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    _s('osCntAll',     all  || '0');
    _s('osCntPending', pend || '0');
    _s('osCntApproved',appr || '0');
    _s('osCntShipped', ship || '0');
    _s('osCntDelivered',delv|| '0');
    var wrap = document.getElementById('dashOrdersList');
    if (!wrap) return;
    if (!orders.length) { wrap.innerHTML='<div class="dash-empty">Henüz sipariş yok.</div>'; return; }
    var recent = orders.slice(0,6);
    wrap.innerHTML = recent.map(function(o){
      return '<div class="dash-rq-item" style="cursor:pointer" onclick="openOrdersModalFiltered(\'' + o.status + '\')">'
        +'<div class="drq-info">'
          +'<div class="drq-no">'+_esc(o.no)+'</div>'
          +'<div class="drq-firm">'+(o.firm||'—')+'</div>'
          +'<div class="drq-date">'+(o.date||'')+'</div>'
        +'</div>'
        +'<div style="text-align:right">'
          +statusBadge(o.status)
          +'<div class="drq-total" style="margin-top:3px">'+fmtUSD(o.total||0)+'</div>'
        +'</div>'
        +'</div>';
    }).join('');
  }).catch(function(){});

  // KPI: Recent quotes — async from API
  Api.getQuotes().then(function(rq){
    var qtotal=rq.reduce(function(s,q){return s+(q.total||0);},0);
    _setEl('kpiTotalQuotes',    'textContent', rq.length ? fmtUSD(qtotal) : '$0.00');
    _setEl('kpiTotalQuotesSub', 'textContent', 'Son '+rq.length+' teklif');
    _setEl('kpiOrders',         'textContent', rq.length);
    var drq=document.getElementById('dashRecentQuotes');
    if(!drq) return;
    if(!rq.length){drq.innerHTML='<div class="dash-empty">Henüz teklif oluşturulmadı.</div>';}
    else{var _dashRq=rq.slice(0,5);drq.innerHTML=_dashRq.map(function(q){
      return'<div class="dash-rq-item" data-action="openQuoteFromDash" data-quoteno="'+_esc(q.no)+'">'
        +'<div class="drq-info"><div class="drq-no">'+q.no+'</div><div class="drq-firm">'+(q.firm||'—')+'</div><div class="drq-date">'+q.date+'</div></div>'
        +'<div class="drq-total">'+fmtUSD(parseFloat(q.total||0))+'</div>'
        +'</div>';
    }).join('')+'<div class="dash-view-all" data-action="openRecentTab">Tüm teklifleri gör</div>';}
  }).catch(function(){
    // fallback localStorage
    try{
      var rq=JSON.parse(localStorage.getItem(RQ_KEY)||'[]');
      var qtotal=rq.reduce(function(s,q){return s+(q.total||0);},0);
      _setEl('kpiTotalQuotes','textContent',rq.length?fmtUSD(qtotal):'$0.00');
      _setEl('kpiTotalQuotesSub','textContent','Son '+rq.length+' teklif');
      _setEl('kpiOrders','textContent',rq.length);
    }catch(e){}
  });
  // KPI + upcoming: Service data — always refresh from API
  refreshSvcData(function(svc){
    try{
    var custs=svc.customers||[];
    var recs=svc.records||[];
    document.getElementById('kpiCustomers').textContent=custs.length;
    // Finans KPI
    fetch('/api/finance/summary', { headers: { 'Authorization': 'Bearer ' + (Auth.token||'') } })
      .then(function(r){ return r.json(); })
      .then(function(finSum){
        var bal = Number(finSum.balance || 0);
        var mIn  = Number(finSum.month_in  || 0);
        var mOut = Number(finSum.month_out || 0);
        var fmt = function(n){ return n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₺'; };
        var balEl = document.getElementById('kpiCashBalance');
        if (balEl) { balEl.textContent = fmt(bal); balEl.style.color = bal >= 0 ? '#0d9488' : '#dc2626'; }
        var subEl = document.getElementById('kpiCashSub');
        if (subEl) subEl.textContent = 'Bu ay: +'+fmt(mIn)+' / -'+fmt(mOut);
      }).catch(function(){});
    // Upcoming in 30 days
    var upcoming=[];
    custs.forEach(function(c){
      var cr=recs.filter(function(r){return r.custId===c.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
      var last=cr[0];if(!last||!last.nextDate)return;
      var d=daysUntil(last.nextDate);
      if(d!==null&&d<=30)upcoming.push({cust:c,record:last,days:d});
    });
    upcoming.sort(function(a,b){return a.days-b.days;});
    document.getElementById('kpiUpcoming').textContent=upcoming.length;
    var dsvc=document.getElementById('dashUpcomingService');
    if(!upcoming.length){dsvc.innerHTML='<div class="dash-empty">Yaklaşan bakım bulunmuyor.</div>';}
    else{dsvc.innerHTML=upcoming.slice(0,5).map(function(u){
      var urg=u.days<=0?'urgent':u.days<=14?'urgent':'soon';
      var dateLabel=u.days<0?Math.abs(u.days)+' gün geçti':u.days===0?'Bugün!':u.days+' gün kaldı';
      return'<div class="dash-rq-item" data-action="openServiceCustomer" data-custid="'+u.cust.id+'">'
        +'<div class="drq-info"><div class="drq-firm">'+u.cust.name+'</div><div class="drq-date">'+(u.cust.device||'Cihaz belirtilmemis')+' · '+(u.cust.city||'')+'</div></div>'
        +'<div class="drq-total" style="color:'+(urg==='urgent'?'var(--c-red)':'var(--c-amber)')+'">'+dateLabel+'</div>'
        +'</div>';
    }).join('')+'<div class="dash-view-all" data-action="switchPage" data-page="service">Tüm bakımları gör</div>';}
    }catch(e){console.error(e);}
  });
}

