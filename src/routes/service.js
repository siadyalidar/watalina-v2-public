// src/routes/service.js — Servis müşterileri ve kayıtları
'use strict';
const router = require('express').Router();
const stmts  = require('../db/statements');
const { auth }           = require('../middleware/auth');
const { ok, err }        = require('../middleware/respond');
const { broadcastEvent } = require('../middleware/sse');

const mapCustomer = r => ({
  id:          String(r.id),
  name:        r.name,
  phone:       r.phone,
  city:        r.city,
  address:     r.address,
  device:      r.device,
  installDate: r.install_date,
  note:        r.notes,
  createdAt:   r.created_at,
});

const mapRecord = r => ({
  id:        String(r.id),
  custId:    String(r.customer_id),
  type:      r.type,
  date:      r.date,
  nextDate:  r.next_date,
  tech:      r.tech,
  fee:       r.fee,
  note:      r.notes,
  createdAt: r.created_at,
});

// ── Müşteriler ─────────────────────────────────────

// GET /api/service/customers
router.get('/customers', auth(['admin', 'service']), (req, res) => {
  ok(res, { customers: stmts.getCustomers.all().map(mapCustomer) });
});

// POST /api/service/customers
router.post('/customers', auth(['admin', 'service']), (req, res) => {
  const { name, phone, city, address, device, installDate, note } = req.body || {};
  if (!name) return err(res, 'Müşteri adı gerekli');
  const info = stmts.insertCustomer.run(
    name, phone || '', city || '', address || '',
    device || '', installDate || null, note || '', req.user.id
  );
  broadcastEvent('svc-changed', { resource: 'customers', action: 'create', id: String(info.lastInsertRowid), by: req.user.id });
  ok(res, { id: info.lastInsertRowid });
});

// PUT /api/service/customers/:id
router.put('/customers/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, city, address, device, installDate, note } = req.body || {};
  if (!name) return err(res, 'Müşteri adı gerekli');
  stmts.updateCustomer.run(name, phone || '', city || '', address || '', device || '', installDate || null, note || '', id);
  broadcastEvent('svc-changed', { resource: 'customers', action: 'update', id: String(id), by: req.user.id });
  ok(res, { message: 'Güncellendi' });
});

// DELETE /api/service/customers/:id
router.delete('/customers/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  stmts.deleteCustomer.run(id);
  broadcastEvent('svc-changed', { resource: 'customers', action: 'delete', id: String(id), by: req.user.id });
  ok(res, { message: 'Silindi' });
});

// ── Kayıtlar ───────────────────────────────────────

// GET /api/service/records
router.get('/records', auth(['admin', 'service']), (req, res) => {
  ok(res, { records: stmts.getAllRecords.all().map(mapRecord) });
});

// GET /api/service/customers/:id/records
router.get('/customers/:id/records', auth(['admin', 'service']), (req, res) => {
  ok(res, { records: stmts.getRecordsByCustomer.all(Number(req.params.id)).map(mapRecord) });
});

// POST /api/service/records
router.post('/records', auth(['admin', 'service']), (req, res) => {
  const { custId, type, date, nextDate, tech, fee, note } = req.body || {};
  if (!custId || !date) return err(res, 'custId ve date gerekli');
  const info = stmts.insertRecord.run(
    Number(custId), type || 'maintenance', date,
    nextDate || null, tech || '', Number(fee) || 0,
    note || '', req.user.id
  );
  broadcastEvent('svc-changed', { resource: 'records', action: 'create', id: String(info.lastInsertRowid), custId: String(custId), by: req.user.id });
  ok(res, { id: info.lastInsertRowid });
});

// DELETE /api/service/records/:id
router.delete('/records/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  stmts.deleteRecord.run(id);
  broadcastEvent('svc-changed', { resource: 'records', action: 'delete', id: String(id), by: req.user.id });
  ok(res, { message: 'Silindi' });
});

module.exports = router;
