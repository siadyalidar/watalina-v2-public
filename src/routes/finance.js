// src/routes/finance.js - Kasa & Havale islemleri
'use strict';
const router = require('express').Router();
const db     = require('../db/connection');
const { auth } = require('../middleware/auth');
const { ok, err } = require('../middleware/respond');

const allowed = auth(['admin', 'finance']);

// KASALAR
router.get('/accounts', allowed, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cash_accounts ORDER BY id ASC').all();
    ok(res, rows);
  } catch(e) { err(res, e.message); }
});

router.post('/accounts', auth(['admin']), (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name) return err(res, 'Kasa adi gerekli');
    const r = db.prepare('INSERT INTO cash_accounts (name, description) VALUES (?, ?)').run(name.trim(), (description||'').trim());
    ok(res, { id: r.lastInsertRowid });
  } catch(e) { err(res, e.message); }
});

router.put('/accounts/:id', auth(['admin']), (req, res) => {
  try {
    const { name, description, is_active } = req.body || {};
    if (!name) return err(res, 'Kasa adi gerekli');
    db.prepare('UPDATE cash_accounts SET name=?, description=?, is_active=? WHERE id=?')
      .run(name.trim(), (description||'').trim(), is_active === false ? 0 : 1, req.params.id);
    ok(res, { updated: true });
  } catch(e) { err(res, e.message); }
});

router.delete('/accounts/:id', auth(['admin']), (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as n FROM cash_transactions WHERE account_id=?').get(req.params.id);
    if (count.n > 0) return err(res, 'Bu kasada islem var, silinemez');
    db.prepare('DELETE FROM cash_accounts WHERE id=?').run(req.params.id);
    ok(res, { deleted: true });
  } catch(e) { err(res, e.message); }
});

// ISLEMLER
router.get('/transactions', allowed, (req, res) => {
  try {
    let query = 'SELECT t.*, u.display_name as creator_name, a.name as account_name FROM cash_transactions t JOIN users u ON t.created_by = u.id JOIN cash_accounts a ON t.account_id = a.id';
    const params = [];
    const where  = [];
    if (req.query.account_id) { where.push('t.account_id = ?'); params.push(req.query.account_id); }
    if (req.query.start)      { where.push('date(t.date) >= date(?)'); params.push(req.query.start); }
    if (req.query.end)        { where.push('date(t.date) <= date(?)'); params.push(req.query.end); }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY t.date DESC, t.id DESC';
    const rows = db.prepare(query).all(...params);
    ok(res, rows);
  } catch(e) { err(res, e.message); }
});

router.get('/summary', allowed, (req, res) => {
  try {
    const wheres = [];
    const params = [];
    if (req.query.account_id) { wheres.push('account_id = ?'); params.push(req.query.account_id); }
    const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const row = db.prepare('SELECT COALESCE(SUM(CASE WHEN type=\'in\' THEN amount ELSE 0 END),0) as total_in, COALESCE(SUM(CASE WHEN type=\'out\' THEN amount ELSE 0 END),0) as total_out, COALESCE(SUM(CASE WHEN type=\'in\' THEN amount ELSE -amount END),0) as balance FROM cash_transactions ' + where).get(...params);
    // Bu ay
    const now = new Date();
    const monthStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    const monthWheres = ["strftime('%Y-%m', date) = ?"];
    const monthParams = [monthStr];
    if (req.query.account_id) { monthWheres.push('account_id = ?'); monthParams.push(req.query.account_id); }
    const monthRow = db.prepare('SELECT COALESCE(SUM(CASE WHEN type=\'in\' THEN amount ELSE 0 END),0) as month_in, COALESCE(SUM(CASE WHEN type=\'out\' THEN amount ELSE 0 END),0) as month_out FROM cash_transactions WHERE ' + monthWheres.join(' AND ')).get(...monthParams);
    ok(res, { ...row, ...monthRow });
  } catch(e) { err(res, e.message); }
});

router.post('/transactions', allowed, (req, res) => {
  try {
    const { date, person, description, amount, type, account_id } = req.body || {};
    if (!date || !person || !amount || !type || !account_id) return err(res, 'Eksik alan');
    if (!['in','out'].includes(type)) return err(res, 'Gecersiz tur');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return err(res, 'Gecersiz tutar');
    const r = db.prepare('INSERT INTO cash_transactions (account_id, date, person, description, amount, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(account_id, date, person.trim(), (description||'').trim(), amt, type, req.user.id);
    ok(res, { id: r.lastInsertRowid });
  } catch(e) { err(res, e.message); }
});

router.delete('/transactions/:id', auth(['admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM cash_transactions WHERE id = ?').run(req.params.id);
    ok(res, { deleted: true });
  } catch(e) { err(res, e.message); }
});

module.exports = router;
