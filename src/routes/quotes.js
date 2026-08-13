// src/routes/quotes.js — Teklif işlemleri
'use strict';
const router = require('express').Router();
const stmts  = require('../db/statements');
const { auth }    = require('../middleware/auth');
const { ok, err } = require('../middleware/respond');

const mapQuote = r => ({
  id:           r.id,
  no:           r.quote_no,
  firm:         r.firm_name,
  total:        r.total,
  disc:         r.disc,
  rate:         r.rate,
  items:        JSON.parse(r.items_json   || '{}'),
  payment:      JSON.parse(r.payment_json || '{}'),
  date:         r.created_at.slice(0, 10),
  created_by:   r.created_by,
  creator_name: r.creator_name,
});

// GET /api/quotes
router.get('/', auth(['admin', 'sales']), (req, res) => {
  ok(res, { quotes: stmts.getQuotes.all().map(mapQuote) });
});

// POST /api/quotes
router.post('/', auth(['admin', 'sales']), (req, res) => {
  const { no, firm, total, disc, rate, items, payment } = req.body || {};
  if (!no) return err(res, 'Teklif numarası gerekli');
  try {
    const info = stmts.insertQuote.run(
      no, firm || '',
      Number(total) || 0, Number(disc) || 0, Number(rate) || 0,
      JSON.stringify(items   || {}),
      JSON.stringify(payment || {}),
      req.user.id
    );
    ok(res, { id: info.lastInsertRowid });
  } catch (e) {
    err(res, 'Kayıt başarısız: ' + e.message);
  }
});

// DELETE /api/quotes/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  stmts.deleteQuote.run(Number(req.params.id));
  ok(res, { message: 'Silindi' });
});

module.exports = router;
