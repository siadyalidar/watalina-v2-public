function generatePDF() {
  const items = Object.values(cart);
  if (!items.length) { showToast('Sepet boş!'); return; }
  const firma   = document.getElementById('cFirma').value   || 'Belirtilmedi';
  const yetkili = document.getElementById('cYetkili').value || '';
  const tel     = document.getElementById('cTel').value     || '—';
  const vd      = document.getElementById('cVD').value      || '—';
  const vn      = document.getElementById('cVN').value      || '—';
  const email   = document.getElementById('cEmail').value   || '—';
  // Ödeme yöntemi
  const pmSel = document.querySelector('input[name="paymentMethod"]:checked');
  const pmType = pmSel ? pmSel.value : '';
  let paymentBlock = '';
  if (pmType === 'kredi_karti') {
    const banka = document.getElementById('pmKKBanka').value || '—';
    paymentBlock = `<tr><td style="color:#64748b;width:110px">Yöntem</td><td style="font-weight:700;color:#1e293b">💳 Kredi Kartı</td></tr><tr><td style="color:#64748b">POS / Banka</td><td style="font-weight:600">${banka}</td></tr>`;
  } else if (pmType === 'nakit') {
    paymentBlock = `<tr><td style="color:#64748b;width:110px">Yöntem</td><td style="font-weight:700;color:#059669">💵 Nakit Ödeme</td></tr>`;
  } else if (pmType === 'iban') {
    const ibanNo    = document.getElementById('pmIBANNo').value    || '—';
    const ibanBanka = document.getElementById('pmIBANBanka').value || '—';
    const ibanHesap = document.getElementById('pmIBANHesap').value || 'Watalina';
    paymentBlock = `<tr><td style="color:#64748b;width:110px">Yöntem</td><td style="font-weight:700;color:#0891b2">🏦 IBAN Transferi</td></tr><tr><td style="color:#64748b">Banka</td><td style="font-weight:600">${ibanBanka}</td></tr><tr><td style="color:#64748b">IBAN</td><td style="font-weight:700;font-family:monospace;font-size:9.5px;letter-spacing:.04em">${ibanNo}</td></tr><tr><td style="color:#64748b">Hesap Sahibi</td><td style="font-weight:600">${ibanHesap}</td></tr>`;
  } else {
    paymentBlock = `<tr><td style="color:#64748b;width:110px">Banka</td><td style="font-weight:600;color:#1e293b">—</td></tr><tr><td style="color:#64748b">IBAN</td><td style="font-weight:700;font-family:monospace;color:#1e293b;font-size:9.5px">—</td></tr><tr><td style="color:#64748b">Hesap</td><td style="font-weight:600">Watalina</td></tr>`;
  }
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric'});
  const timeStr = now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  const orderNo = 'WTL-'+now.getFullYear().toString().slice(-2)+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+Date.now().toString().slice(-4);
  const validUntil = new Date(now.getTime()+7*86400000).toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric'});
  let origSub=0, discSub=0;
  items.forEach(i=>{ origSub+=i.price*i.qty; const ep=discountPct>0?i.price*(1-discountPct/100):i.price; discSub+=ep*i.qty; });
  const discAmt=origSub-discSub;
  let tax=0, taxTL=null;
  if(exchangeRate>0){taxTL=discSub*exchangeRate*kdvPct/100; tax=taxTL/exchangeRate;}
  else tax=discSub*kdvPct/100;
  const grand=discSub+tax;
  const grandTL=exchangeRate>0?grand*exchangeRate:null;
  const totalQty=items.reduce((s,i)=>s+i.qty,0);
  const logoSrc = document.querySelector('.tb-logo')?document.querySelector('.tb-logo').src:''
  const rowsHtml = items.map((item,i)=>{
    const ep=discountPct>0?item.price*(1-discountPct/100):item.price;
    const lt=ep*item.qty;
    const bg=i%2===0?'#ffffff':'#f8fafc';
    const img=PRODUCT_IMAGES[item.code];
    const imgTag=img?`<img src="${img}" style="width:34px;height:28px;object-fit:contain;border-radius:4px;display:block">`:`<div style="width:34px;height:28px;background:#f1f5f9;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;font-weight:600">—</div>`;
    const unitCell=discountPct>0
      ?`<div style="text-decoration:line-through;color:#aaa;font-size:10px">${fmtUSD(item.price)}</div><div style="color:#059669;font-weight:700;font-size:11.5px">${fmtUSD(ep)}</div>${exchangeRate>0?`<div style="color:#0891b2;font-size:9.5px">${fmtTL(ep*exchangeRate)}</div>`:''}`
      :`<div style="font-weight:600;font-size:11.5px">${fmtUSD(item.price)}</div>${exchangeRate>0?`<div style="color:#0891b2;font-size:9.5px">${fmtTL(item.price*exchangeRate)}</div>`:''}`;
    const lineCell=`<div style="font-weight:800;font-size:12.5px">${fmtUSD(lt)}</div>${exchangeRate>0?`<div style="color:#0891b2;font-size:9.5px">${fmtTL(lt*exchangeRate)}</div>`:''}`;
    return `<tr style="background:${bg}"><td style="padding:8px 10px;border-bottom:1px solid #f0f4f8;color:#6b7280;font-size:9.5px;font-family:monospace">${item.code}</td><td style="padding:8px 6px;border-bottom:1px solid #f0f4f8">${imgTag}</td><td style="padding:8px 10px;border-bottom:1px solid #f0f4f8;font-size:11px;color:#1e293b">${item.name}</td><td style="padding:8px 10px;border-bottom:1px solid #f0f4f8;text-align:center;font-weight:800;font-size:13px">${item.qty}</td><td style="padding:8px 10px;border-bottom:1px solid #f0f4f8;text-align:right">${unitCell}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f4f8;text-align:right">${lineCell}</td></tr>`;
  }).join('');
  const summaryBlock=[
    exchangeRate>0?`<tr><td colspan="2" style="padding:6px 14px;background:#eff6ff;color:#3b82f6;font-size:10.5px">Kur: 1 USD = ${fmtTL(exchangeRate)}</td></tr>`:'',
    `<tr><td style="padding:6px 14px;color:#64748b;font-size:11px">Ara Toplam</td><td style="padding:6px 14px;text-align:right;font-weight:600;font-size:11px">${fmtUSD(origSub)}${exchangeRate>0?`<br><span style="color:#0891b2;font-size:9.5px">${fmtTL(origSub*exchangeRate)}</span>`:''}</td></tr>`,
    discountPct>0?`<tr style="background:#fef9f0"><td style="padding:6px 14px;color:#d97706;font-size:11px">İskonto (%${discountPct})</td><td style="padding:6px 14px;text-align:right;color:#dc2626;font-weight:700;font-size:11px">−${fmtUSD(discAmt)}</td></tr><tr><td style="padding:6px 14px;color:#64748b;font-size:11px">İskontolu Tutar</td><td style="padding:6px 14px;text-align:right;font-weight:600;color:#059669;font-size:11px">${fmtUSD(discSub)}${exchangeRate>0?`<br><span style="color:#0891b2;font-size:9.5px">${fmtTL(discSub*exchangeRate)}</span>`:''}</td></tr>`:'',
    `<tr style="background:#fffbeb"><td style="padding:6px 14px;color:#d97706;font-size:11px">KDV %${kdvPct}${exchangeRate>0?' <span style="font-size:9px;color:#aaa">(TL bazlı)</span>':''}</td><td style="padding:6px 14px;text-align:right;color:#d97706;font-weight:600;font-size:11px">${fmtUSD(tax)}${taxTL?`<br><span style="color:#0891b2;font-size:9.5px">${fmtTL(taxTL)}</span>`:''}</td></tr>`,
    `<tr style="background:#0f1923"><td style="padding:10px 14px;color:white;font-weight:800;font-size:13px">GENEL TOPLAM</td><td style="padding:10px 14px;text-align:right;color:white;font-weight:900;font-size:15px">${fmtUSD(grand)}${grandTL?`<br><span style="color:#7dd3fc;font-size:11px">${fmtTL(grandTL)}</span>`:''}</td></tr>`,
  ].join('');
  const html=`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Watalina Teklif ${orderNo}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;background:white;font-size:12px}@page{margin:11mm 12mm;size:A4}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
/* ── LOGIN PAGE ─────────────────────────────────────── */
#loginOverlay{position:fixed;inset:0;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);display:flex;align-items:center;justify-content:center;z-index:9999;transition:opacity .3s}
#loginOverlay.hidden{opacity:0;pointer-events:none}
.login-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px 44px;width:360px;max-width:90vw}
.login-logo{display:flex;align-items:center;gap:12px;margin-bottom:32px}
.login-logo-text{color:#fff;font-size:1.15rem;font-weight:800;letter-spacing:.06em}
.login-logo-sub{color:rgba(255,255,255,.4);font-size:.6rem;font-weight:600;letter-spacing:.1em;display:block;margin-top:2px}
.login-title{color:#fff;font-size:1rem;font-weight:700;margin-bottom:6px}
.login-sub{color:rgba(255,255,255,.4);font-size:.75rem;margin-bottom:28px}
.login-field{margin-bottom:16px}
.login-field label{display:block;color:rgba(255,255,255,.6);font-size:.72rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:7px}
.login-field input{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:11px 14px;color:#fff;font-size:.9rem;outline:none;transition:border .2s;box-sizing:border-box}
.login-field input:focus{border-color:#e85d26}
.login-btn{width:100%;background:#e85d26;border:none;border-radius:10px;padding:13px;color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;margin-top:8px;transition:background .2s}
.login-btn:hover{background:#d14f1e}
.login-btn:disabled{background:rgba(232,93,38,.4);cursor:not-allowed}
.login-error{color:#f87171;font-size:.78rem;margin-top:10px;min-height:20px;text-align:center}
/* ── USER BADGE ─────────────────────────────────────── */
.tb-user-badge{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 12px 5px 8px;cursor:default}
.tb-user-avatar{width:24px;height:24px;border-radius:50%;background:#e85d26;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:#fff}
.tb-user-name{color:rgba(255,255,255,.85);font-size:.72rem;font-weight:600}
.tb-user-role{color:rgba(255,255,255,.35);font-size:.62rem;font-weight:500;text-transform:uppercase;letter-spacing:.06em}
.tb-logout-btn{background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;padding:2px 4px;border-radius:5px;font-size:.7rem;transition:color .2s}
.tb-logout-btn:hover{color:#f87171}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
  <tr><td style="background:#0f1923;padding:16px 20px;border-radius:10px 10px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><img src="${logoSrc}" alt="Watalina" style="height:32px;display:block;margin-bottom:4px" onerror="this.outerHTML='<span style=color:white;font-size:18px;font-weight:800>Watalina</span>'"><div style="color:rgba(255,255,255,.45);font-size:9px;letter-spacing:.1em;text-transform:uppercase">Su Arıtma Teknolojileri · www.watalina.com</div></td>
      <td style="text-align:right;vertical-align:top"><div style="color:rgba(255,255,255,.45);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase">SİPARİŞ TEKLİFİ</div><div style="color:white;font-size:17px;font-weight:800;margin:3px 0">${orderNo}</div><div style="color:rgba(255,255,255,.55);font-size:9.5px">${dateStr} · ${timeStr}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:linear-gradient(90deg,#005bcc,#0891b2);height:3px;border-radius:0 0 4px 4px"></td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border-collapse:separate;border-spacing:6px 0">
  <tr>
    <td width="34%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:11px 13px;vertical-align:top">
      <div style="font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">MÜŞTERİ</div>
      <div style="font-weight:800;font-size:12px;color:#0f1923;margin-bottom:3px">${firma}</div>
      ${yetkili?`<div style="color:#475569;font-size:10.5px;margin-bottom:2px">Yetkili: ${yetkili}</div>`:''}
      <div style="color:#64748b;font-size:10px">Tel: ${tel}${email!=='—'?` · E-posta: ${email}`:''}</div>
      ${vn!=='—'?`<div style="color:#94a3b8;font-size:9.5px;margin-top:3px">VKN: ${vn} · ${vd}</div>`:''} 
    </td>
    <td width="33%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:11px 13px;vertical-align:top">
      <div style="font-size:8px;font-weight:700;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">TEKLİF</div>
      <table width="100%" cellpadding="2" style="font-size:10.5px">
        <tr><td style="color:#64748b">No</td><td style="text-align:right;font-weight:700;font-family:monospace">${orderNo}</td></tr>
        <tr><td style="color:#64748b">Tarih</td><td style="text-align:right">${dateStr}</td></tr>
        <tr><td style="color:#64748b">Geçerlilik</td><td style="text-align:right;color:#d97706;font-weight:700">${validUntil}</td></tr>
        <tr><td style="color:#64748b">Kalemler</td><td style="text-align:right;font-weight:700">${items.length} ürün / ${totalQty} adet</td></tr>
        ${discountPct>0?`<tr><td style="color:#059669">Bayi İskontosu</td><td style="text-align:right;color:#059669;font-weight:800">%${discountPct}</td></tr>`:''}
      </table>
    </td>
    <td width="33%" style="background:#0f1923;border-radius:7px;padding:11px 13px;vertical-align:top">
      <div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px">ÖZET</div>
      ${discountPct>0?`<div style="color:rgba(255,255,255,.5);font-size:9.5px;text-decoration:line-through">${fmtUSD(origSub)}</div><div style="color:#34d399;font-size:10px">−${fmtUSD(discAmt)} iskonto</div><div style="border-top:1px solid rgba(255,255,255,.1);margin:5px 0"></div>`:''} 
      <div style="color:rgba(255,255,255,.6);font-size:9px;margin-bottom:2px">KDV Hariç</div>
      <div style="color:white;font-size:14px;font-weight:800">${fmtUSD(discSub)}</div>
      <div style="color:rgba(255,255,255,.4);font-size:8.5px;margin:3px 0">+ KDV %${kdvPct}: ${fmtUSD(tax)}</div>
      <div style="background:rgba(255,255,255,.08);border-radius:5px;padding:6px 9px;margin-top:4px">
        <div style="color:rgba(255,255,255,.5);font-size:8px;text-transform:uppercase;letter-spacing:.1em">Genel Toplam</div>
        <div style="color:white;font-size:16px;font-weight:900">${fmtUSD(grand)}</div>
        ${grandTL?`<div style="color:#7dd3fc;font-size:10px">${fmtTL(grandTL)}</div>`:''}
      </div>
    </td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
  <thead><tr style="background:#1e293b">
    <th style="padding:9px 10px;color:white;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-align:left;text-transform:uppercase;width:65px">KOD</th>
    <th style="padding:9px 6px;width:42px"></th>
    <th style="padding:9px 10px;color:white;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-align:left;text-transform:uppercase">ÜRÜN ADI</th>
    <th style="padding:9px 10px;color:white;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-align:center;text-transform:uppercase;width:46px">AD</th>
    <th style="padding:9px 10px;color:white;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-align:right;text-transform:uppercase;width:86px">BİRİM</th>
    <th style="padding:9px 12px;color:white;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-align:right;text-transform:uppercase;width:96px">TUTAR</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-collapse:separate;border-spacing:6px 0">
  <tr>
    <td width="55%" style="vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:7px;overflow:hidden;margin-bottom:8px">
        <tr><td style="background:#f8fafc;padding:8px 13px;border-bottom:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase">ŞARTLAR &amp; NOTLAR</td></tr>
        <tr><td style="padding:10px 13px">
          <table width="100%" cellpadding="3" style="font-size:10.5px">
            <tr><td style="color:#94a3b8;width:110px">Geçerlilik</td><td style="color:#d97706;font-weight:700">7 gün · ${validUntil}</td></tr>
            <tr><td style="color:#94a3b8">Döviz</td><td style="font-weight:600">USD (Amerikan Doları)</td></tr>
            <tr><td style="color:#94a3b8">KDV</td><td style="font-weight:600">%${kdvPct} — fiyatlara dahil değil</td></tr>
            <tr><td style="color:#94a3b8">Ödeme</td><td style="font-weight:600">%50 ön ödeme, teslimatta kalan</td></tr>
            <tr><td style="color:#94a3b8">Teslimat</td><td style="font-weight:600">3–7 iş günü (stoka göre)</td></tr>
            <tr><td style="color:#94a3b8">Garanti</td><td style="font-weight:600">2 yıl Watalina garantisi</td></tr>
          </table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:7px;overflow:hidden">
        <tr><td style="background:#f8fafc;padding:8px 13px;border-bottom:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase">ONAY</td></tr>
        <tr><td style="padding:10px 13px">
          <table width="100%" cellpadding="0"><tr>
            <td width="48%" style="text-align:center;border-top:1px solid #cbd5e1;padding-top:5px;font-size:9px;color:#94a3b8">MÜŞTERİ İMZA / KAŞE<br><span style="font-size:10px;color:#475569;font-weight:700">${firma}</span><div style="height:34px"></div></td>
            <td width="4%"></td>
            <td width="48%" style="text-align:center;border-top:1px solid #cbd5e1;padding-top:5px;font-size:9px;color:#94a3b8">YETKİLİ İMZA / KAŞE<br><span style="font-size:10px;color:#475569;font-weight:700">Watalina</span><div style="height:34px"></div></td>
          </tr></table>
        </td></tr>
      </table>
    </td>
    <td width="45%" style="vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:7px;overflow:hidden;margin-bottom:8px">
        <tr><td colspan="2" style="background:#f8fafc;padding:8px 13px;border-bottom:1px solid #e2e8f0;font-size:8px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase">FİYAT ÖZETİ</td></tr>
        <tr><td colspan="2" style="padding:0"><table width="100%">${summaryBlock}</table></td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dbeafe;border-radius:7px;background:#eff6ff">
        <tr><td style="padding:10px 13px">
          <div style="font-size:8px;font-weight:700;color:#3b82f6;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">ÖDEME BİLGİLERİ</div>
          <table width="100%" cellpadding="3" style="font-size:10.5px">
            ${paymentBlock}
          </table>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e2e8f0;padding-top:8px">
  <tr>
    <td style="font-size:9px;color:#94a3b8;line-height:1.7">Bu teklif bilgi amaçlıdır. Fiyatlar USD cinsinden olup KDV hariçtir.${exchangeRate>0?' Kur: 1 USD = '+fmtTL(exchangeRate)+'.':''} Sipariş onayı yazılı yapılmalıdır.</td>
    <td style="text-align:right;font-size:9px;color:#94a3b8;line-height:1.7;white-space:nowrap"><strong style="color:#475569">Watalina Su Arıtma</strong> · www.watalina.com<br>${orderNo} · ${dateStr}</td>
  </tr>
</table>
<div class="no-print" style="position:fixed;bottom:20px;right:20px;display:flex;gap:8px">
  <button onclick="window.print()" style="background:#005bcc;color:white;border:none;border-radius:9px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(0,91,204,.4)">Yazdır / PDF Kaydet</button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:9px;padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer">✕ Kapat</button>
</div>
</body></html>`;
  const win = window.open('', '_blank', 'width=920,height=720');
  if (!win) { showToast('Popup engellendi! Lütfen izin verin.'); return; }
  try {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch(e) {
    console.error('PDF window write failed:', e);
    showToast('PDF açılamadı. Popup engelleyicisini kontrol edin.');
    try { win.close(); } catch(_){}
  }
  const grandVal=parseFloat(grand.toFixed(2));
  saveRecentQuote(orderNo,firma,grandVal);
}
