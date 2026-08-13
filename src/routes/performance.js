// src/routes/performance.js — Kisisel satis performansi
'use strict';
const router = require('express').Router();
const db     = require('../db/connection');
const { auth } = require('../middleware/auth');
const { ok, err } = require('../middleware/respond');

const COMMISSION_RATE = 0.01;

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const start = y + '-' + m + '-01';
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = y + '-' + m + '-' + String(last).padStart(2, '0');
  return { start, end, label: y + '-' + m };
}

// Kendi performansim
router.get('/me', auth(['admin', 'sales']), (req, res) => {
  try {
    const uid = req.user.id;
    const { start, end, label } = getMonthRange();

    const allTime = db.prepare(`
      SELECT COUNT(*) as cnt,
             COALESCE(SUM(total - disc), 0) as total
      FROM orders
      WHERE created_by = ? AND status = 'teslim'
    `).get(uid);

    const thisMonth = db.prepare(`
      SELECT COUNT(*) as cnt,
             COALESCE(SUM(total - disc), 0) as total
      FROM orders
      WHERE created_by = ? AND status = 'teslim'
        AND date(created_at) BETWEEN date(?) AND date(?)
    `).get(uid, start, end);

    const monthly = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COUNT(*) as cnt,
             COALESCE(SUM(total - disc), 0) as total
      FROM orders
      WHERE created_by = ? AND status = 'teslim'
      GROUP BY month ORDER BY month DESC LIMIT 6
    `).all(uid);

    ok(res, {
      allTime: { ...allTime, commission: allTime.total * COMMISSION_RATE },
      thisMonth: { ...thisMonth, commission: thisMonth.total * COMMISSION_RATE, label },
      monthly: monthly.map(r => ({ ...r, commission: r.total * COMMISSION_RATE }))
    });
  } catch(e) { err(res, e.message); }
});

// Admin: tum satiscilar
router.get('/team', auth(['admin']), (req, res) => {
  try {
    const { start, end } = getMonthRange();

    const team = db.prepare(`
      SELECT u.id, u.display_name,
             COUNT(*) as cnt,
             COALESCE(SUM(o.total - o.disc), 0) as total
      FROM orders o
      JOIN users u ON o.created_by = u.id
      WHERE o.status = 'teslim'
        AND date(o.created_at) BETWEEN date(?) AND date(?)
      GROUP BY u.id ORDER BY total DESC
    `).all(start, end);

    ok(res, {
      team: team.map(r => ({ ...r, commission: r.total * COMMISSION_RATE }))
    });
  } catch(e) { err(res, e.message); }
});

module.exports = router;
