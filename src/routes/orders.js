// src/routes/orders.js — Sipariş işlemleri
'use strict';
const router = require('express').Router();
const stmts  = require('../db/statements');
const { auth }            = require('../middleware/auth');
const { ok, err }         = require('../middleware/respond');
const { broadcastEvent }  = require('../middleware/sse');
const db = require('../db/connection');

const VALID_STATUSES = ['beklemede', 'onaylandi', 'kargoda', 'teslim', 'iptal'];

const mapOrder = r => ({
  id:           String(r.id),
  no:           r.order_no,
  firm:         r.firm_name,
  status:       r.status,
  total:        r.total,
  disc:         r.disc,
  rate:         r.rate,
  items:        JSON.parse(r.items_json || '{}'),
  notes:        r.notes,
  date:         r.created_at.slice(0, 10),
  updatedAt:    r.updated_at,
  created_by:   r.created_by,
  creator_name: r.creator_name,
});

// GET /api/orders
router.get('/', auth(['admin', 'sales']), (req, res) => {
  ok(res, { orders: stmts.getOrders.all().map(mapOrder) });
});

// POST /api/orders
router.post('/', auth(['admin', 'sales']), (req, res) => {
  const { no, firm, status, total, disc, rate, items, notes } = req.body || {};
  if (!no) return err(res, 'Sipariş numarası gerekli');
  try {
    const info = stmts.insertOrder.run(
      no, firm || '', status || 'beklemede',
      Number(total) || 0, Number(disc) || 0, Number(rate) || 0,
      JSON.stringify(items || {}), notes || '', req.user.id
    );
    // Stok takipli ürünlerin stoğunu düş
    const itemMap = items || {};
    Object.entries(itemMap).forEach(([code, item]) => {
      const qty = Number(item.qty) || 0;
      if (qty > 0) {
        try { stmts.adjustStock.run(code, -qty, -qty); } catch (_) {}
      }
    });
    broadcastEvent('order-changed', { action: 'create', id: String(info.lastInsertRowid), by: req.user.id });
    ok(res, { id: info.lastInsertRowid });
  } catch (e) {
    err(res, 'Kayıt başarısız: ' + e.message);
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', auth(['admin', 'sales']), (req, res) => {
  const id     = Number(req.params.id);
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) return err(res, 'Geçersiz durum');
  if (!stmts.getOrderById.get(id))      return err(res, 'Sipariş bulunamadı', 404);
  const prevOrder = stmts.getOrderById.get(id);
  stmts.updateOrderStatus.run(status, id);
  // İptal edilince stoğu geri yükle (önceki durum iptal değilse)
  if (status === 'iptal' && prevOrder.status !== 'iptal') {
    const itemMap = JSON.parse(prevOrder.items_json || '{}');
    Object.entries(itemMap).forEach(([code, item]) => {
      const qty = Number(item.qty) || 0;
      if (qty > 0) {
        try { stmts.adjustStock.run(code, qty, qty); } catch (_) {}
      }
    });
  }
  // Teslim edilince otomatik tahsilat kaydi
  if (status === 'teslim' && prevOrder.status !== 'teslim') {
    try {
      const firstAcc = db.prepare('SELECT id FROM cash_accounts WHERE is_active=1 ORDER BY id ASC LIMIT 1').get();
      if (firstAcc && prevOrder.total > 0) {
        const today = new Date().toISOString().slice(0, 10);
        db.prepare('INSERT INTO cash_transactions (account_id, date, person, description, amount, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          firstAcc.id, today,
          prevOrder.firm_name || 'Siparis',
          'Otomatik tahsilat - Siparis #' + prevOrder.order_no,
          prevOrder.total,
          'in',
          req.user.id
        );
      }
    } catch(e) { console.error('Otomatik tahsilat hatasi:', e.message); }
  }
  broadcastEvent('order-changed', { action: 'status', id: String(id), status, by: req.user.id });
  ok(res, { message: 'Durum güncellendi' });
});

// DELETE /api/orders/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  const id = Number(req.params.id);
  if (!stmts.getOrderById.get(id)) return err(res, 'Sipariş bulunamadı', 404);
  stmts.deleteOrder.run(id);
  broadcastEvent('order-changed', { action: 'delete', id: String(id), by: req.user.id });
  ok(res, { message: 'Silindi' });
});

module.exports = router;
