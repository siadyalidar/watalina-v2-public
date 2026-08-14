// ══ SERVİS HARİTASI — Coğrafi Servis Operasyon Merkezi ═══════════════
// Bu dosya service.js'in üzerine inşa edilir; kendi müşteri/servis verisi
// tutmaz, mevcut _svcCache (gerçek backend verisi) üzerinde çalışır.
// Liste, harita, KPI ve alt paneller aynı merkezi filtre state'ini (SvcFilter)
// ve aynı türetilmiş veri kümesini (getFilteredCustomers) kullanır.

// ── MERKEZİ FİLTRE STATE ──────────────────────────────────────────────
var SvcFilter = { search: '', il: '', ilce: '', status: '' };

// Müşterinin son kaydına göre 4 durumdan biri: normal | upcoming | overdue | completed
function svcCustomerStatus(cust, allRecords) {
  var recs = (allRecords || []).filter(function (r) { return r.custId === cust.id; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  var last = recs[0];
  if (!last) return 'normal';
  if (!last.nextDate) return 'completed';
  var u = urgencyOf(last.nextDate); // service.js: 'urgent' | 'soon' | 'ok'
  if (u === 'urgent') return 'overdue';
  if (u === 'soon') return 'upcoming';
  return 'normal';
}

// Tek gerçek veri kaynağı (_svcCache) üzerinden filtrelenmiş müşteri listesi.
// Liste, harita, KPI, öneriler, rota ve yaklaşan bakımlar hep bunu kullanır.
function getFilteredCustomers(data) {
  data = data || (typeof _svcCache !== 'undefined' ? _svcCache : { customers: [], records: [] });
  var custs = data.customers || [];
  var recs = data.records || [];
  var f = SvcFilter;
  return custs.filter(function (c) {
    if (f.il && c.il !== f.il) return false;
    if (f.ilce && c.ilce !== f.ilce) return false;
    if (f.status && svcCustomerStatus(c, recs) !== f.status) return false;
    if (f.search) {
      var hay = (c.name + ' ' + (c.il || '') + ' ' + (c.ilce || '') + ' ' + (c.device || '')).toLowerCase();
      if (hay.indexOf(f.search) === -1) return false;
    }
    return true;
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── HARİTA ──────────────────────────────────────────────────────────
var svcMap = null;
var svcMarkersLayer = null;
var svcMarkerById = {};
var svcMapSelectedId = null;

function ensureSvcMap() {
  if (svcMap) return svcMap;
  if (typeof L === 'undefined') return null; // Leaflet CDN yüklenemedi — harita sessizce devre dışı kalır
  var el = document.getElementById('svcMapEl');
  if (!el) return null;

  svcMap = L.map(el, { zoomControl: true, scrollWheelZoom: true }).setView([39.0, 35.2], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar'
  }).addTo(svcMap);

  if (typeof L.markerClusterGroup === 'function') {
    svcMarkersLayer = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: '<div>' + cluster.getChildCount() + '</div>',
          className: 'marker-cluster-watalina',
          iconSize: L.point(40, 40)
        });
      }
    });
  } else {
    svcMarkersLayer = L.layerGroup(); // markercluster CDN yüklenemezse düz katmana geri düş
  }
  svcMap.addLayer(svcMarkersLayer);
  return svcMap;
}

function svcStatusColor(status) {
  return { overdue: '#dc2626', upcoming: '#d97706', completed: '#059669', normal: '#005bcc' }[status] || '#005bcc';
}

function svcMarkerIcon(status, active) {
  var color = svcStatusColor(status);
  var size = active ? 32 : 24;
  return L.divIcon({
    className: 'svc-map-pin-wrap',
    html: '<div class="svc-map-pin' + (active ? ' active' : '') + '" style="--pin-color:' + color + '"></div>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
}

var SVC_STATUS_LABELS = { overdue: 'Gecikmiş', upcoming: 'Yaklaşan Bakım', completed: 'Tamamlandı', normal: 'Normal' };

function buildSvcPopup(c, last, status) {
  var loc = c.il ? (c.il + (c.ilce ? ' / ' + c.ilce : '')) : (c.ilce || '');
  var html = '<div class="svc-map-popup">'
    + '<div class="smp-name">' + escapeHtml(c.name) + '</div>'
    + '<div class="smp-loc">' + escapeHtml(loc || 'Adres girilmemiş') + '</div>';
  if (c.device) html += '<div class="smp-row"><span>Cihaz</span><span>' + escapeHtml(c.device) + '</span></div>';
  if (last) html += '<div class="smp-row"><span>Son bakım</span><span>' + new Date(last.date).toLocaleDateString('tr-TR') + '</span></div>';
  if (last && last.nextDate) html += '<div class="smp-row"><span>Sonraki bakım</span><span>' + new Date(last.nextDate).toLocaleDateString('tr-TR') + '</span></div>';
  html += '<div class="smp-row"><span>Durum</span><span>' + (SVC_STATUS_LABELS[status] || '-') + '</span></div>';
  html += '<button type="button" class="smp-btn" onclick="svcOpenFromMap(\'' + c.id + '\')">Müşteriyi Aç</button>';
  html += '</div>';
  return html;
}

window.svcOpenFromMap = function (custId) {
  if (typeof showCustomerDetail === 'function') showCustomerDetail(custId);
};

function updateSvcMapMeta(data, filteredCusts, withCoords) {
  var countEl = document.getElementById('svcMapCount');
  if (countEl) countEl.textContent = filteredCusts.length ? (withCoords.length + ' / ' + filteredCusts.length + ' müşteri haritada') : '';

  var missingTotal = (data.customers || []).filter(function (c) {
    return !(typeof c.lat === 'number' && typeof c.lng === 'number') && (c.il || c.ilce || c.address);
  }).length;
  var banner = document.getElementById('svcGeocodeBanner');
  var bannerText = document.getElementById('svcGeocodeBannerText');
  if (banner && bannerText) {
    if (missingTotal > 0 && !_svcGeocoding) {
      banner.style.display = 'flex';
      bannerText.textContent = missingTotal + ' müşterinin konumu henüz belirlenmedi.';
    } else if (!_svcGeocoding) {
      banner.style.display = 'none';
    }
  }
}

function renderSvcMap(data) {
  data = data || (typeof _svcCache !== 'undefined' ? _svcCache : { customers: [], records: [] });
  var allCusts = data.customers || [];
  var filtered = getFilteredCustomers(data);
  var withCoords = filtered.filter(function (c) { return typeof c.lat === 'number' && typeof c.lng === 'number'; });

  updateSvcMapMeta(data, filtered, withCoords);

  var mapWrap = document.getElementById('svcMapWrap');
  var emptyEl = document.getElementById('svcMapEmpty');

  // Gerçek "hiç müşteri yok" durumu — filtre sonucu boş olmasından ayrı ele alınır
  if (!allCusts.length) {
    if (mapWrap) mapWrap.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if (mapWrap) mapWrap.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  var map = ensureSvcMap();
  if (!map || !svcMarkersLayer) return;

  setTimeout(function () { map.invalidateSize(); }, 60);

  svcMarkersLayer.clearLayers();
  svcMarkerById = {};

  var bounds = [];
  withCoords.forEach(function (c) {
    var recs = (data.records || []).filter(function (r) { return r.custId === c.id; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var last = recs[0];
    var status = svcCustomerStatus(c, data.records || []);
    var marker = L.marker([c.lat, c.lng], { icon: svcMarkerIcon(status, c.id === svcMapSelectedId) });
    marker.bindPopup(buildSvcPopup(c, last, status));
    marker.on('click', function () { selectSvcMapCustomer(c.id, false); });
    svcMarkerById[c.id] = marker;
    svcMarkersLayer.addLayer(marker);
    bounds.push([c.lat, c.lng]);
  });

  if (bounds.length === 1) map.setView(bounds[0], 13);
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
}

// Liste ↔ Harita iki yönlü senkron seçim
function selectSvcMapCustomer(custId, doPan) {
  svcMapSelectedId = custId;
  var cache = typeof _svcCache !== 'undefined' ? _svcCache : { customers: [], records: [] };

  Object.keys(svcMarkerById).forEach(function (id) {
    var cust = (cache.customers || []).find(function (c) { return c.id === id; });
    var status = cust ? svcCustomerStatus(cust, cache.records || []) : 'normal';
    svcMarkerById[id].setIcon(svcMarkerIcon(status, id === custId));
  });

  var marker = svcMarkerById[custId];
  if (marker && svcMap) {
    if (doPan !== false) svcMap.setView(marker.getLatLng(), Math.max(svcMap.getZoom(), 13));
    if (svcMarkersLayer && typeof svcMarkersLayer.zoomToShowLayer === 'function') {
      svcMarkersLayer.zoomToShowLayer(marker, function () { marker.openPopup(); });
    } else {
      marker.openPopup();
    }
  }

  document.querySelectorAll('.svc-cust-item').forEach(function (el) { el.classList.remove('map-active'); });
  var item = document.querySelector('.svc-cust-item[data-custid="' + custId + '"]');
  if (item) { item.classList.add('map-active'); item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
window.selectSvcMapCustomer = selectSvcMapCustomer;

// ── PERFORMANS PANELİ (yalnızca gerçek service_records verisinden) ────
function renderSvcPerformancePanel(data) {
  data = data || { customers: [], records: [] };
  var recs = data.records || [];
  var now = new Date();

  var completed = recs.filter(function (r) {
    var d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  var planned = recs.filter(function (r) {
    if (!r.nextDate) return false;
    var d = new Date(r.nextDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  var rate = planned > 0 ? Math.round((completed / planned) * 100) : (completed > 0 ? 100 : 0);
  var barWidth = Math.max(0, Math.min(100, rate));

  var el = document.getElementById('svcPerfPanel');
  if (!el) return;
  el.innerHTML =
    '<div class="svc-perf-body">'
    + '<div class="svc-perf-row"><span class="svc-perf-label">Tamamlanan İş</span><span class="svc-perf-val">' + completed + '</span></div>'
    + '<div class="svc-perf-row"><span class="svc-perf-label">Planlanan İş</span><span class="svc-perf-val">' + planned + '</span></div>'
    + '<div class="svc-perf-row"><span class="svc-perf-label">Gerçekleşme</span><span class="svc-perf-val rate">%' + rate + '</span></div>'
    + '<div class="svc-perf-bar-wrap"><div class="svc-perf-bar" style="width:' + barWidth + '%"></div></div>'
    + '</div>'
    + '<div class="svc-perf-note">Bu ay tamamlanan servis kayıtları / bu ay içinde planlanmış sonraki bakım tarihleri esas alınır.</div>';
}

// ── FİLTRE BARI ─────────────────────────────────────────────────────
function populateSvcFilterIl() {
  var sel = document.getElementById('svcFilterIl');
  if (!sel || typeof IL_ILCE_DATA === 'undefined') return;
  var izmir = IL_ILCE_DATA.find(function (r) { return r.il === 'İzmir'; });
  var others = IL_ILCE_DATA.filter(function (r) { return r.il !== 'İzmir'; });
  var sorted = izmir ? [izmir].concat(others) : IL_ILCE_DATA;
  sel.innerHTML = '<option value="">Tüm İller</option>' + sorted.map(function (r) {
    return '<option value="' + r.il + '">' + r.il + '</option>';
  }).join('');
}

function populateSvcFilterIlce(ilName) {
  var sel = document.getElementById('svcFilterIlce');
  if (!sel) return;
  var ilData = (typeof IL_ILCE_DATA !== 'undefined') ? IL_ILCE_DATA.find(function (r) { return r.il === ilName; }) : null;
  if (!ilData) {
    sel.innerHTML = '<option value="">Tüm İlçeler</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  sel.innerHTML = '<option value="">Tüm İlçeler</option>' + ilData.ilceler.map(function (x) {
    return '<option value="' + x + '">' + x + '</option>';
  }).join('');
}

function updateSvcFilterClearVisibility() {
  var btn = document.getElementById('svcFilterClearBtn');
  if (!btn) return;
  var active = !!(SvcFilter.il || SvcFilter.ilce || SvcFilter.status || SvcFilter.search);
  btn.style.display = active ? '' : 'none';
}

function refreshSvcFilteredViews() {
  var cache = typeof _svcCache !== 'undefined' ? _svcCache : { customers: [], records: [] };
  if (typeof renderSvcDashboard === 'function') renderSvcDashboard(cache);
  if (typeof renderSvcCustomerList === 'function') renderSvcCustomerList(null, cache);
  updateSvcFilterClearVisibility();
}

// ── KONUMLARI BELİRLE (mevcut müşteriler için toplu geocode) ──────────
var _svcGeocoding = false;
function startSvcGeocodeBatch() {
  if (_svcGeocoding) return;
  _svcGeocoding = true;
  var btn = document.getElementById('svcGeocodeBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Belirleniyor...'; }
  step();

  function step() {
    Api.post('/api/service/customers/geocode-missing', {})
      .then(function (res) {
        return Api.getSvcData().then(function (d) {
          _svcCache = d;
          if (typeof renderSvcDashboard === 'function') renderSvcDashboard(_svcCache);
          if (typeof renderSvcCustomerList === 'function') renderSvcCustomerList(null, _svcCache);
          if (typeof activeSvcCustomer !== 'undefined' && activeSvcCustomer && typeof showCustomerDetail === 'function') {
            showCustomerDetail(activeSvcCustomer);
          }
          if (btn && !res.done) btn.textContent = 'Belirleniyor... (' + res.remaining + ' kaldı)';
          if (!res.done && res.processed > 0) setTimeout(step, 400);
          else finish(res);
        });
      })
      .catch(function (e) {
        if (typeof showToast === 'function') showToast('Konum belirleme hatası: ' + (e.message || 'bilinmeyen hata'));
        finish(null);
      });
  }
  function finish(res) {
    _svcGeocoding = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Konumları Belirle'; }
    if (res && typeof showToast === 'function') {
      showToast(res.geocoded + ' müşterinin konumu belirlendi' + (res.failed ? ', ' + res.failed + ' tanesi bulunamadı' : ''));
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  populateSvcFilterIl();
  populateSvcFilterIlce('');

  var ilSel = document.getElementById('svcFilterIl');
  if (ilSel) ilSel.addEventListener('change', function () {
    SvcFilter.il = ilSel.value;
    SvcFilter.ilce = '';
    populateSvcFilterIlce(ilSel.value);
    refreshSvcFilteredViews();
  });

  var ilceSel = document.getElementById('svcFilterIlce');
  if (ilceSel) ilceSel.addEventListener('change', function () {
    SvcFilter.ilce = ilceSel.value;
    refreshSvcFilteredViews();
  });

  document.querySelectorAll('#svcStatusLegend .svc-status-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('#svcStatusLegend .svc-status-chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      SvcFilter.status = chip.dataset.status || '';
      refreshSvcFilteredViews();
    });
  });

  var clearBtn = document.getElementById('svcFilterClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    SvcFilter.il = ''; SvcFilter.ilce = ''; SvcFilter.status = ''; SvcFilter.search = '';
    if (ilSel) ilSel.value = '';
    populateSvcFilterIlce('');
    document.querySelectorAll('#svcStatusLegend .svc-status-chip').forEach(function (c) { c.classList.remove('active'); });
    var allChip = document.querySelector('#svcStatusLegend .svc-status-chip[data-status=""]');
    if (allChip) allChip.classList.add('active');
    var searchInp = document.getElementById('svcSearchInput');
    if (searchInp) searchInp.value = '';
    refreshSvcFilteredViews();
  });

  var geoBtn = document.getElementById('svcGeocodeBtn');
  if (geoBtn) geoBtn.addEventListener('click', startSvcGeocodeBatch);
});
