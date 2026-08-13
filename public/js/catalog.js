// ─────────────────────────────────────────────────────
// LEFT RAIL
// ─────────────────────────────────────────────────────
const CAT_ICONS = {
  'acik-kasa':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10H2A10 10 0 0 1 12 2z"/><line x1="12" y1="12" x2="12" y2="20"/></svg>',
  'kapali-kasa': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  'direkt-akis': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>',
  'sebil':       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
  'yuksek-kapasite': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="16" x2="20" y2="16"/></svg>',
  'saf-su':      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  'bina-girisi': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  'membranlar':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/></svg>',
  'tanklar':     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><line x1="4" y1="9" x2="20" y2="9"/></svg>',
  'pompalar':    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  'adaptorler':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>',
  'kablolar':    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  'musluklar':   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-9 4 18 3-9h6"/></svg>',
  'filtre-setleri': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  't33-karbon':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v9"/><path d="M9 18h6"/></svg>',
  'mineraller':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>',
  'acik-kasa-filtreler': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="2"/><rect x="14" y="3" width="7" height="18" rx="2"/></svg>',
  'jumbo-kartus':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>',
  'housingler':  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  'kontrol':     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  'fittings':    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'hortumlar':   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12C5 8.13 8.13 5 12 5s7 3.13 7 7-3.13 7-7 7"/><path d="M12 19c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3"/></svg>'
};
function buildRail() {
  const el = document.getElementById('railCats');
  if (!el) return;
  el.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'cat-item active'; all.dataset.id = 'all';
  const total = categories.reduce((s,c)=>s+c.products.length,0);
  const allIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  all.innerHTML = `<span class="cat-item-icon">${allIcon}</span><span class="cat-item-name">Tüm Ürünler</span><span class="cat-item-count">${total}</span>`;
  all.addEventListener('click', () => setCategory(null, all));
  el.appendChild(all);
  const defaultIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-item'; btn.dataset.id = cat.id;
    btn.innerHTML = `<span class="cat-item-icon">${CAT_ICONS[cat.id]||defaultIcon}</span><span class="cat-item-name">${cat.name}</span><span class="cat-item-count">${cat.products.length}</span>`;
    btn.addEventListener('click', () => setCategory(cat.id, btn));
    el.appendChild(btn);
  });
}
function filterRail() {
  const q = document.getElementById('railSearch').value.toLowerCase();
  document.querySelectorAll('#railCats .cat-item').forEach(btn => {
    const name = btn.querySelector('.cat-item-name').textContent.toLowerCase();
    btn.style.display = (!q || name.includes(q) || btn.dataset.id==='all') ? '' : 'none';
  });
}
function setCategory(id, btn) {
  activeCategory = id; activeBrand = null;
  document.querySelectorAll('#railCats .cat-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  renderGrid();
}

// ─────────────────────────────────────────────────────
// BRAND CHIPS
// ─────────────────────────────────────────────────────
function getBrand(p) {
  const n = p.name.toLowerCase();
  if(n.includes('filmtec')) return 'Filmtec';
  if(n.includes('ortimax')) return 'Ortimax';
  if(n.includes('blue drop')||n.includes('bluedrop')) return 'Blue Drop';
  if(n.includes('nippur')) return 'Nippur';
  if(n.includes('clean pure')||n.includes('cleanpure')) return 'Clean Pure';
  if(n.includes('water chef')||n.includes('waterchef')) return 'Water Chef';
  if(n.includes('spring water')) return 'Spring Water';
  if(n.includes('fluxtek')) return 'Fluxtek';
  if(n.includes('puricom')) return 'Puricom';
  if(n.includes('purefer')) return 'Purefer';
  if(n.includes('omnipure')) return 'Omnipure';
  if(n.includes('atlas')) return 'Atlas';
  if(n.includes('ocean')) return 'Ocean';
  if(n.includes('tank life')) return 'Tank Life';
  if(n.includes('headone')) return 'Headone';
  if(n.includes('waterlife')) return 'Waterlife';
  if(n.includes('swun chyan')) return 'Swun Chyan';
  if(n.includes('tegra')) return 'Tegra';
  if(n.includes('pae')) return 'PAE';
  if(n.includes('ihlas')||n.includes('İhlas')) return 'İhlas';
  return 'Watalina';
}
function buildBrandChips() {
  const brands = new Set();
  categories.forEach(c => c.products.forEach(p => brands.add(getBrand(p))));
  const wrap = document.getElementById('brandChips');
  if (!wrap) return;
  wrap.innerHTML = '';   // clear → idempotent
  [...brands].sort().forEach(b => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip'; chip.textContent = b;
    chip.dataset.brand = b;
    chip.addEventListener('click', () => {
      activeBrand = activeBrand === b ? null : b;
      document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      if (activeBrand) chip.classList.add('active');
      renderGrid();
    });
    wrap.appendChild(chip);
  });
}
function sortProducts(mode) { sortMode = mode; renderGrid(); }

// ─────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────
function handleSearch() {
  searchQuery = document.getElementById('globalSearch').value.toLowerCase().trim();
  renderGrid();
}

// ─────────────────────────────────────────────────────
// RENDER GRID
// ─────────────────────────────────────────────────────
function getFilteredProducts() {
  let items = [];
  categories.forEach(cat => {
    if (activeCategory && cat.id !== activeCategory) return;
    cat.products.forEach(p => items.push({ p, catId: cat.id, catName: cat.name }));
  });
  if (activeBrand) items = items.filter(({p}) => getBrand(p) === activeBrand);
  if (searchQuery) {
    const q = searchQuery;
    items = items.filter(({p, catName}) => {
      const brand = getBrand(p).toLowerCase();
      const name = p.name.toLowerCase();
      const code = p.code.toLowerCase();
      return name.includes(q) || code.includes(q) || brand.includes(q) || catName.toLowerCase().includes(q);
    });
  }
  // Sort
  if (sortMode === 'price-asc') items.sort((a,b) => a.p.price - b.p.price);
  else if (sortMode === 'price-desc') items.sort((a,b) => b.p.price - a.p.price);
  else if (sortMode === 'name-asc') items.sort((a,b) => a.p.name.localeCompare(b.p.name, 'tr'));
  return items;
}

function renderGrid() {
  const items = getFilteredProducts();
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const info = document.getElementById('resultInfo');
  if (info) info.textContent = items.length + ' ürün';
  if (items.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--c-ink3);font-size:.85rem"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="display:block;margin:0 auto 10px;opacity:.35"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Sonuç bulunamadı</div>';
    return;
  }
  grid.innerHTML = items.map(({p, catId}) => buildCardHTML(p, catId)).join('');
}

function buildCardHTML(p, catId) {
  // productMap override'larını (isim/fiyat/stok) yansıt
  const pm = productMap[p.code];
  if (pm) {
    if (pm.stock !== undefined) p = { ...p, stock: pm.stock };
    if (pm.name  !== undefined) p = { ...p, name:  pm.name  };
    if (pm.price !== undefined) p = { ...p, price: pm.price };
  }
  const ep = discountPct > 0 ? p.price*(1-discountPct/100) : p.price;
  const img = PRODUCT_IMAGES[p.code];
  const brand = getBrand(p);
  const safeName = p.name.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const imgHtml = img
    ? `<img src="${img}" alt="${safeName}" loading="lazy" data-action="openLb" data-code="${p.code}">`
    : `<div class="pcard-img-ph"><div class="pcard-img-ph-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div><span>${p.code}</span></div>`;
  const discShow = discountPct > 0 ? ' show' : '';
  const tlShow = exchangeRate > 0 ? ' show' : '';
  // Stock logic
  const stock = (p.stock !== undefined && p.stock !== null) ? Number(p.stock) : null;
  const isOut = stock !== null && stock === 0;
  const isLow = stock !== null && stock > 0 && stock <= 5;
  const stockBadge = stock === null
    ? ''
    : isOut
    ? `<span class="stock-badge stock-out">Stok Yok</span>`
    : isLow
    ? `<span class="stock-badge stock-low">Son ${stock} adet</span>`
    : `<span class="stock-badge stock-ok">${stock} adet</span>`;
  const addDisabled = isOut ? ' disabled' : '';
  const addLabel = isOut ? 'Stok Yok' : '+ Ekle';
  return `<div class="pcard" data-code="${p.code}">
  <div class="pcard-img">
    ${imgHtml}
    <div class="pcard-badge">${catId==='acik-kasa'||catId==='yuksek-kapasite'?'<span class="pbadge pbadge-hot">Popüler</span>':catId==='direkt-akis'?'<span class="pbadge pbadge-new">Yeni</span>':''}</div>
  </div>
  <div class="pcard-body">
    <div class="pcard-meta">
      <span class="pcard-code">${p.code}</span>
      <span class="pcard-brand">${brand}</span>
    </div>
    <div class="pcard-name">${p.name}</div>
    ${stockBadge ? `<div style="margin-top:3px">${stockBadge}</div>` : ''}
    <div>
      <div class="pcard-price-row">
        <span class="pcard-price-orig${discShow}" data-orig="${p.code}">${fmtUSD(p.price)}</span>
        <span class="pcard-price-main${discountPct>0?' discounted':''}" data-dealer="${p.code}">${fmtUSD(ep)}</span>
        <span class="pcard-price-disc${discShow}" data-badge="${p.code}">${discountPct>0?'-'+discountPct+'%':''}</span>
      </div>
      <div class="pcard-price-tl${tlShow}" data-tl="${p.code}">${exchangeRate>0?'≈ '+fmtTL(ep*exchangeRate):''}</div>
    </div>
    <div class="pcard-actions">
      <div class="qty-ctrl">
        <button class="qty-btn" data-action="chQty" data-code="${p.code}" data-delta="-1">−</button>
        <input class="qty-inp" type="number" data-qty="${p.code}" value="1" min="1">
        <button class="qty-btn" data-action="chQty" data-code="${p.code}" data-delta="1">+</button>
      </div>
      <button class="add-btn" data-atc="${p.code}" data-action="addToCart" data-code="${p.code}"${addDisabled}>${addLabel}</button>
    </div>
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────
function chQty(code, d) {
  const inp = document.querySelector('[data-qty="' + code + '"]');
  if (!inp) return;
  const cur = parseInt(inp.value, 10);
  inp.value = Math.max(1, (isNaN(cur) ? 1 : cur) + d);
}
function addToCart(code) {
  const inp = document.querySelector(`[data-qty="${code}"]`);
  let qty = inp ? (parseInt(inp.value)||1) : 1;
  const p = productMap[code]; if (!p) return;

  // Stok kontrolü (tracked ürünler için)
  if (p.stock !== null && p.stock !== undefined) {
    if (p.stock <= 0) { showToast('⚠ Bu ürün stokta yok'); return; }
    const already = cart[code] ? cart[code].qty : 0;
    if (already + qty > p.stock) {
      const remaining = Math.max(0, p.stock - already);
      if (remaining <= 0) { showToast('⚠ Stok limiti aşıldı (' + p.stock + ' adet mevcut)'); return; }
      qty = remaining;
      showToast('⚠ Sadece ' + remaining + ' adet eklenebildi (stok limiti)');
    }
  }

  if (cart[code]) {
    cart[code].qty += qty;
  } else {
    // snapshot price at time of add (admin may change it later)
    cart[code] = { code: p.code, name: p.name, price: p.price, qty };
  }
  renderCart(); switchTab('cart', null);
  const btn = document.querySelector(`[data-atc="${code}"]`);
  if (btn) { btn.classList.add('added'); btn.textContent = '✓'; setTimeout(()=>{btn.classList.remove('added');btn.textContent='+ Ekle';},900); }
  const nm = p.name.length>28?p.name.slice(0,28)+'...':p.name;
  showToast('✓ '+nm+' eklendi');
  if (typeof updateMbnCartBadge === 'function') updateMbnCartBadge();
}

// ─────────────────────────────────────────────────────
// APP ROUTER
// ─────────────────────────────────────────────────────