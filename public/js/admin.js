// ─────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────
function handleLogoClick(){
  AppState.logoClickCount++;
  clearTimeout(AppState.logoTimer);
  if(AppState.logoClickCount >= 5){
    AppState.logoClickCount = 0;
    openAdmin();
    return;
  }
  AppState.logoTimer = setTimeout(() => { AppState.logoClickCount = 0; }, 2000);
}
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key==='A'){e.preventDefault();openAdmin();}});
function admLogout(){closeAdmin();}
function openChangePwModal(){document.getElementById('cpwCurrent').value='';document.getElementById('cpwNew').value='';document.getElementById('cpwRepeat').value='';document.getElementById('changePwModal').classList.add('open');}
function closeChangePwModal(){document.getElementById('changePwModal').classList.remove('open');}
async function saveChangePw(){const cur=document.getElementById('cpwCurrent').value;const nw=document.getElementById('cpwNew').value;const rp=document.getElementById('cpwRepeat').value;if(!cur||!nw||!rp){showToast('Tüm alanları doldurun.');return;}if(nw!==rp){showToast('Yeni şifreler eşleşmiyor.');return;}try{await Api.post('/api/change-password',{current_password:cur,new_password:nw});closeChangePwModal();showToast('Şifre başarıyla değiştirildi.');}catch(e){showToast('Hata: '+(e.message||'Şifre değiştirilemedi.'));}}
function openAdmin(){
  const sel=document.getElementById('admCatSel');
  if(sel.options.length<=1){categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;sel.appendChild(o);});}
  const nCat=document.getElementById('nCat');
  if(nCat.options.length===0){categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;nCat.appendChild(o);});}
  adminChanges={};
  renderAdmTable(); updateAdmStats();
  document.getElementById('adminOverlay').classList.add('open');
  // En güncel stok/override verisini çek
  Api.getOverrides().then(ov=>{
    _applyOverrides(ov);
    renderAdmTable(); updateAdmStats();
  }).catch(()=>{});
}
function closeAdmin(){document.getElementById('adminOverlay').classList.remove('open');}
function updateAdmStats(){
  const ov=getOv();
  const ic=Object.keys(ov.images||{}).length,nc=Object.keys(ov.names||{}).length,pc=Object.keys(ov.prices||{}).length;
  const tot=categories.reduce((s,c)=>s+c.products.length,0);
  const tracked=Object.values(productMap).filter(p=>p.stock!==null&&p.stock!==undefined).length;
  const outOfStock=Object.values(productMap).filter(p=>p.stock===0).length;
  document.getElementById('admStats').innerHTML=`<div class="adm-stat">Ürün: <span>${tot}</span></div><div class="adm-stat">Görsel Override: <span>${ic}</span></div><div class="adm-stat">İsim/Fiyat: <span>${nc+pc}</span></div><div class="adm-stat">Stok Takipli: <span>${tracked}</span></div>${outOfStock>0?`<div class="adm-stat" style="color:var(--c-red)">Tükenen: <span>${outOfStock}</span></div>`:''}`;
}
function renderAdmTable(){
  const q=document.getElementById('admSearch').value.toLowerCase().trim();
  const cf=document.getElementById('admCatSel').value;
  const ov=getOv(); const tbody=document.getElementById('admTableBody');
  let rows=[];
  categories.forEach(cat=>{
    if(cf&&cat.id!==cf)return;
    cat.products.forEach(p=>{if(q&&!p.name.toLowerCase().includes(q)&&!p.code.toLowerCase().includes(q))return;rows.push({p,cat});});
  });
  document.getElementById('admFooterInfo').textContent=rows.length+' ürün · Override: '+Object.keys(ov.images||{}).length+' görsel';
  tbody.innerHTML=rows.map(({p,cat})=>{
    const hi=!!(ov.images&&ov.images[p.code]),hn=!!(ov.names&&ov.names[p.code]),hp=!!(ov.prices&&ov.prices[p.code]),ha=hi||hn||hp;
    const curN=(ov.names&&ov.names[p.code])||p.name;
    const curP=(ov.prices&&ov.prices[p.code]!==undefined)?ov.prices[p.code]:p.price;
    const liveP=productMap[p.code]?productMap[p.code].price:p.price;
    const stockVal=productMap[p.code]&&productMap[p.code].stock!==null&&productMap[p.code].stock!==undefined?productMap[p.code].stock:'';
    const hs=stockVal!=='';
    const img=PRODUCT_IMAGES[p.code];
    const sc=p.code
    const sn=curN.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const thumb=img?`<img src="${img}" alt="" data-action="openLb" data-code="${sc}">`:`<div class="at-thumb-ph"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>`;
    const tags=[hi?'<span style="background:#d1fae5;color:#059669;border-radius:3px;padding:1px 4px;font-size:.58rem;font-weight:700">IMG</span>':'',hn?'<span style="background:#dbeafe;color:#3b82f6;border-radius:3px;padding:1px 4px;font-size:.58rem;font-weight:700">AD</span>':'',hp?'<span style="background:#fef3c7;color:#d97706;border-radius:3px;padding:1px 4px;font-size:.58rem;font-weight:700">FİY</span>':'',hs?(stockVal===0?'<span style="background:#fef2f2;color:#dc2626;border-radius:3px;padding:1px 4px;font-size:.58rem;font-weight:700">TÜKENDİ</span>':'<span style="background:#e0f2fe;color:#0891b2;border-radius:3px;padding:1px 4px;font-size:.58rem;font-weight:700">STOK</span>'):''].filter(Boolean).join(' ');
    const stockInputStyle = stockVal===0 ? 'color:#dc2626;font-weight:800;border-color:#fecaca' : (stockVal!==''&&stockVal<=5 ? 'color:#d97706;font-weight:700' : '');
    return `<tr id="atr-${p.code}" class="${ha||hs?'has-ov':''}"><td style="text-align:center"><div class="ov-dot ${ha||hs?'show':''}"></div></td><td><div class="at-thumb" data-action="openLb" data-code="${sc}">${thumb}</div></td><td><span class="at-code">${p.code}</span><br><span style="font-size:.58rem;color:#94a3b8">${cat.name}</span></td><td><input class="at-name-inp" id="name-${p.code}" value="${sn}" onchange="admMarkName('${sc}',this.value)"></td><td><div style="display:flex;align-items:center;gap:3px"><span style="color:#94a3b8;font-size:.7rem">$</span><input class="at-price-inp" type="number" value="${curP}" step="0.01" min="0" onchange="admMarkPrice('${sc}',this.value)"></div></td><td><input class="at-price-inp" style="width:64px;text-align:center;${stockInputStyle}" type="number" placeholder="—" value="${stockVal}" min="0" step="1" onchange="admMarkStock('${sc}',this.value)" title="Boş = stok takibi yok"></td><td><div style="display:flex;gap:5px;align-items:center"><button class="at-img-btn ${hi?'ov':''}" data-action="admPickImg" data-code="${sc}">${hi?'✓ Değiştir':'Yükle'}</button><button class="at-rst-btn ${ha||hs?'show':''}" data-action="admReset" data-code="${sc}" title="Sıfırla">↺</button></div></td><td style="text-align:center">${tags||'<span style="color:#e2e8f0">—</span>'}</td></tr>`;
  }).join('');
}
function admMarkName(code,v){if(!adminChanges[code])adminChanges[code]={};adminChanges[code].name=v;}
function admMarkPrice(code,v){if(!adminChanges[code])adminChanges[code]={};adminChanges[code].price=parseFloat(v)||0;}
function admMarkStock(code,v){
  if(!adminChanges[code])adminChanges[code]={};
  if(v===''||v===null||v===undefined){
    adminChanges[code].stock=null; // takip kapatılıyor
  } else {
    const n=Math.max(0,parseInt(v,10)||0);
    adminChanges[code].stock=n;
  }
}
let admPickCode=null;
function admPickImg(code){admPickCode=code;const p=document.getElementById('adminImgPicker');p.value='';p.click();}
function saveAdmChanges(){
  const entries=Object.entries(adminChanges);
  if(!entries.length){showToast('Değişiklik yok');return;}
  let n=0;
  const saves=entries.map(([code,ch])=>{
    const promises=[];
    const fields={};
    if(ch.name!==undefined){fields.name_ov=ch.name;if(productMap[code])productMap[code].name=ch.name;n++;}
    if(ch.price!==undefined){fields.price_ov=ch.price;if(productMap[code])productMap[code].price=ch.price;n++;}
    // Update local cache too
    const ov=getOv();if(!ov.names)ov.names={};if(!ov.prices)ov.prices={};
    if(ch.name!==undefined)ov.names[code]=ch.name;
    if(ch.price!==undefined)ov.prices[code]=ch.price;
    localStorage.setItem(OV_KEY,JSON.stringify(ov));
    if(Object.keys(fields).length) promises.push(Api.saveOverride(code,fields));
    // Stok değişikliği ayrı endpoint
    if(ch.stock!==undefined){
      n++;
      if(ch.stock===null){
        // takip kapatılıyor → tracked=false
        promises.push(Api.setStock(code,0,false).then(()=>{
          if(productMap[code])productMap[code].stock=null;
        }));
      } else {
        promises.push(Api.setStock(code,ch.stock,true).then(()=>{
          if(productMap[code])productMap[code].stock=ch.stock;
        }));
      }
    }
    return Promise.all(promises);
  });
  Promise.all(saves).then(function(){
    adminChanges={};renderGrid();renderAdmTable();updateAdmStats();
    showToast('✓ '+n+' değişiklik kaydedildi');
  }).catch(function(e){
    showToast('Hata: '+(e.message||'Kaydedilemedi'));
  });
}
function admReset(code){if(!confirm(code+' sıfırlansın mı? (Görsel, isim, fiyat ve stok takibi sıfırlanır)'))return;
  // Clear local cache
  const ov=getOv();if(ov.images)delete ov.images[code];if(ov.names)delete ov.names[code];if(ov.prices)delete ov.prices[code];localStorage.setItem(OV_KEY,JSON.stringify(ov));
  if(productMap[code])productMap[code].stock=null;
  Api.resetOverride(code).then(function(){
    showToast('✓ Sıfırlandı — yenileniyor...');setTimeout(()=>location.reload(),1000);
  }).catch(function(){
    showToast('✓ Sıfırlandı — yenileniyor...');setTimeout(()=>location.reload(),1000);
  });
}
function resetAllOv(){if(!confirm('TÜM değişiklikler silinecek. Emin misin?'))return;
  localStorage.removeItem(OV_KEY);
  Api.resetAllOverrides().then(function(){
    showToast('✓ Sıfırlandı — yenileniyor...');setTimeout(()=>location.reload(),1000);
  }).catch(function(){
    showToast('✓ Sıfırlandı — yenileniyor...');setTimeout(()=>location.reload(),1000);
  });
}
function showNewProductForm(){document.getElementById('admNewForm').classList.add('show');}
function hideNewProductForm(){document.getElementById('admNewForm').classList.remove('show');}
function addNewProduct(){
  const code=document.getElementById('nCode').value.trim();
  const name=document.getElementById('nName').value.trim();
  const price=parseFloat(document.getElementById('nPrice').value)||0;
  const catId=document.getElementById('nCat').value;
  if(!code||!name){showToast('Kod ve ad zorunlu!');return;}
  if(productMap[code]){showToast('Bu kod zaten mevcut!');return;}
  const cat=categories.find(c=>c.id===catId);
  if(!cat){showToast('Kategori bulunamadı!');return;}
  const p={code,name,price};
  cat.products.push(p); productMap[code]=p;
  hideNewProductForm();
  document.getElementById('nCode').value='';document.getElementById('nName').value='';document.getElementById('nPrice').value='';
  renderGrid();renderAdmTable();buildRail();
  showToast('✓ '+code+' eklendi');
}

// Admin image picker - attached after DOM ready
document.addEventListener('DOMContentLoaded',()=>{
  const picker=document.getElementById('adminImgPicker');
  if(picker) picker.addEventListener('change',function(e){
    const file=e.target.files[0]; if(!file||!admPickCode)return;
    const code=admPickCode;
    const btn=document.querySelector('#atr-'+code+' .at-img-btn');
    if(btn){btn.textContent='⏳...';btn.disabled=true;}
    // Safety: re-enable after 10s if something goes wrong
    const btnTimeout = setTimeout(()=>{if(btn){btn.disabled=false;btn.textContent='Yükle';}},10000);
    const reader=new FileReader();
    reader.onload=ev=>{
      const src=ev.target.result;
      const img=new Image();
      img.onload=()=>{
        let finalSrc=src;
        if(src.length>300*1024){const canvas=document.createElement('canvas');const scale=Math.min(1,400/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);finalSrc=canvas.toDataURL('image/jpeg',0.75);}
        const ov=getOv();if(!ov.images)ov.images={};ov.images[code]=finalSrc;localStorage.setItem(OV_KEY,JSON.stringify(ov));
        PRODUCT_IMAGES[code]=finalSrc;
        Api.saveOverride(code,{image_ov:finalSrc}).catch(()=>{ showToast('⚠️ Görsel sunucuya kaydedilemedi, yenilemede kaybolabilir'); });
        // Update card in grid - handle both img and placeholder cases
        const card = document.querySelector(`[data-code="${code}"]`);
        if (card) {
          const cardImg = card.querySelector('.pcard-img img');
          if (cardImg) {
            cardImg.src = finalSrc;
          } else {
            // Replace placeholder with real image
            const ph = card.querySelector('.pcard-img-ph');
            if (ph) {
              const newImg = document.createElement('img');
              newImg.src = finalSrc;
              newImg.alt = code;
              newImg.loading = 'lazy';
              newImg.dataset.action = 'openLb';
              newImg.dataset.code = code;
              ph.replaceWith(newImg);
            } else {
              // Rebuild entire card if neither found
              const parent = card.closest('.product-grid');
              if (parent) renderGrid();
            }
          }
        }
        clearTimeout(btnTimeout);renderAdmTable();updateAdmStats();showToast('✓ '+code+' görseli güncellendi');
      };img.src=src;
    };reader.readAsDataURL(file);
  });
});

