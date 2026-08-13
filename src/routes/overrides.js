// src/routes/overrides.js — Ürün özelleştirmeleri ve stok
'use strict';
const router = require('express').Router();
const stmts  = require('../db/statements');
const { auth }           = require('../middleware/auth');
const { ok, err }        = require('../middleware/respond');
const { broadcastEvent } = require('../middleware/sse');

// GET /api/overrides — herkes görebilir (auth yeterli)
router.get('/', auth(), (req, res) => {
  const rows = stmts.getOverrides.all();
  const overrides = { images: {}, names: {}, prices: {}, stock: {} };
  rows.forEach(r => {
    if (r.image_ov != null) overrides.images[r.code] = r.image_ov;
    if (r.name_ov  != null) overrides.names[r.code]  = r.name_ov;
    if (r.price_ov != null) overrides.prices[r.code] = r.price_ov;
    if (r.stock_tracked) {
      overrides.stock[r.code] = {
        qty:     r.stock_qty != null ? r.stock_qty : 0,
        tracked: true,
      };
    }
  });
  ok(res, { overrides });
});

// POST /api/overrides — sadece admin (isim/fiyat/görsel)
router.post('/', auth(['admin']), (req, res) => {
  const { code } = req.body || {};
  if (!code) return err(res, 'code gerekli');
  const name_ov  = req.body.name_ov  !== undefined ? req.body.name_ov  : (req.body.name  !== undefined ? req.body.name  : null);
  const price_ov = req.body.price_ov !== undefined ? req.body.price_ov : (req.body.price !== undefined ? req.body.price : null);
  const image_ov = req.body.image_ov !== undefined ? req.body.image_ov : (req.body.image !== undefined ? req.body.image : null);
  stmts.upsertOverride.run(
    code,
    name_ov  !== null ? name_ov  : null,
    price_ov !== null ? Number(price_ov) : null,
    image_ov !== null ? image_ov : null
  );
  ok(res, { message: 'Kaydedildi' });
});

// ── STOK ────────────────────────────────────────────

// PUT /api/overrides/:code/stock — sadece admin, stok miktarını mutlak olarak ayarla
router.put('/:code/stock', auth(['admin']), (req, res) => {
  const code = req.params.code;
  const { qty, tracked } = req.body || {};
  if (qty === undefined && tracked === undefined) return err(res, 'qty veya tracked gerekli');

  const current = stmts.getOverrides.all().find(r => r.code === code);
  const newQty     = qty !== undefined ? Math.max(0, Number(qty) || 0) : (current?.stock_qty ?? 0);
  const newTracked = tracked !== undefined ? (tracked ? 1 : 0) : (current?.stock_tracked ?? 1);

  stmts.upsertStock.run(code, newQty, newTracked);
  broadcastEvent('stock-changed', { code, qty: newQty, tracked: !!newTracked });
  ok(res, { message: 'Stok güncellendi', qty: newQty, tracked: !!newTracked });
});

// PATCH /api/overrides/:code/stock — sadece admin, stoğu artır/azalt (delta)
router.patch('/:code/stock', auth(['admin']), (req, res) => {
  const code = req.params.code;
  const delta = Number(req.body?.delta);
  if (!delta || isNaN(delta)) return err(res, 'delta (sayı) gerekli');

  stmts.adjustStock.run(code, delta, delta);
  const row = stmts.getOverrides.all().find(r => r.code === code);
  const qty = row?.stock_qty ?? 0;
  broadcastEvent('stock-changed', { code, qty, tracked: true });
  ok(res, { message: 'Stok güncellendi', qty });
});

// DELETE /api/overrides/:code  (tek ürün sıfırla — isim/fiyat/görsel/stok)
router.delete('/:code', auth(['admin']), (req, res) => {
  stmts.resetOverride.run(req.params.code);
  broadcastEvent('stock-changed', { code: req.params.code, qty: null, tracked: false });
  ok(res, { message: 'Sıfırlandı' });
});

// DELETE /api/overrides  (tümünü sıfırla)
router.delete('/', auth(['admin']), (req, res) => {
  stmts.resetAllOverrides.run();
  ok(res, { message: 'Tümü sıfırlandı' });
});

module.exports = router;
