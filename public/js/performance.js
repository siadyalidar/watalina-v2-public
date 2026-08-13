// public/js/performance.js — Kisisel satis performansi
'use strict';

const Performance = (() => {
  function fmt(n) {
    return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  }

  async function load() {
    try {
      const data = await Api.get('/api/performance/me');

      // Kart guncelle
      const m = data.thisMonth || {};
      const a = data.allTime   || {};

      const el = id => document.getElementById(id);
      if (el('perfMonthLabel')) el('perfMonthLabel').textContent = m.label || '—';
      if (el('perfMonthTotal')) el('perfMonthTotal').textContent = fmt(m.total || 0);
      if (el('perfMonthCnt'))   el('perfMonthCnt').textContent   = (m.cnt || 0) + ' sipariş';
      if (el('perfMonthComm'))  el('perfMonthComm').textContent  = fmt(m.commission || 0);
      if (el('perfAllTotal'))   el('perfAllTotal').textContent   = fmt(a.total || 0);
      if (el('perfAllCnt'))     el('perfAllCnt').textContent     = (a.cnt || 0) + ' sipariş';

      // Aylik gecmis tablo
      const monthly = data.monthly || [];
      const tbody = el('perfMonthlyBody');
      if (tbody) {
        if (!monthly.length) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:var(--c-ink3)">Henüz teslim edilmiş sipariş yok</td></tr>';
        } else {
          tbody.innerHTML = monthly.map(r =>
            '<tr>' +
            '<td>' + r.month + '</td>' +
            '<td>' + r.cnt + '</td>' +
            '<td style="font-weight:600">' + fmt(r.total) + '</td>' +
            '<td style="color:#0d9488;font-weight:600">' + fmt(r.commission) + '</td>' +
            '</tr>'
          ).join('');
        }
      }
    } catch(e) { console.error('Performance.load error', e); }
  }

  async function loadTeam() {
    try {
      const data = await Api.get('/api/performance/team');
      const section = document.getElementById('perfTeamSection');
      if (!section) return;
      const team = data.team || [];
      const rows = !team.length
        ? '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:var(--c-ink3)">Bu ay teslim edilmiş sipariş yok</td></tr>'
        : team.map((r, i) => {
            const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
            return '<tr><td>' + medal + r.display_name + '</td><td>' + r.cnt + '</td><td style="font-weight:600">' + fmt(r.total) + '</td><td style="color:#0d9488;font-weight:600">' + fmt(r.commission) + '</td></tr>';
          }).join('');
      section.innerHTML = '<div style="font-weight:700;font-size:.85rem;color:var(--c-ink2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.8rem">Bu Ay — Takım Performansı</div>' +
        '<div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>Satışçı</th><th>Sipariş</th><th>Ciro (₺)</th><th>Komisyon (₺)</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    } catch(e) { console.error('Performance.loadTeam error', e); }
  }

  function init() {
    load();
    if (Auth.role === 'admin') loadTeam();
  }

  return { init };
})();
