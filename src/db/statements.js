// src/db/statements.js — Tüm prepared SQL statements
'use strict';
const db = require('./connection');

const stmts = {
  // ── Users ──────────────────────────────────────────
  getUserByUsername:  db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserById:        db.prepare('SELECT id, username, role, display_name FROM users WHERE id = ?'),
  getAllUsers:        db.prepare('SELECT id, username, role, display_name, created_at FROM users ORDER BY created_at ASC'),
  insertUser:         db.prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'),
  updateUserPassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
  updateUser:         db.prepare('UPDATE users SET display_name = ?, role = ? WHERE id = ?'),
  deleteUser:         db.prepare('DELETE FROM users WHERE id = ?'),

  // ── Quotes ─────────────────────────────────────────
  getQuotes: db.prepare(`
    SELECT q.*, u.display_name as creator_name
    FROM quotes q JOIN users u ON q.created_by = u.id
    ORDER BY q.created_at DESC
  `),
  insertQuote: db.prepare(
    'INSERT INTO quotes (quote_no, firm_name, total, disc, rate, items_json, payment_json, created_by) VALUES (?,?,?,?,?,?,?,?)'
  ),
  deleteQuote: db.prepare('DELETE FROM quotes WHERE id = ?'),

  // ── Orders ─────────────────────────────────────────
  getOrders: db.prepare(`
    SELECT o.*, u.display_name as creator_name
    FROM orders o JOIN users u ON o.created_by = u.id
    ORDER BY o.created_at DESC
  `),
  getOrderById:      db.prepare('SELECT * FROM orders WHERE id = ?'),
  insertOrder:       db.prepare(
    'INSERT INTO orders (order_no, firm_name, status, total, disc, rate, items_json, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?)'
  ),
  updateOrderStatus: db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?"),
  deleteOrder:       db.prepare('DELETE FROM orders WHERE id = ?'),

  // ── Service Customers ──────────────────────────────
  getCustomers: db.prepare(`
    SELECT sc.*, u.display_name as creator_name
    FROM service_customers sc JOIN users u ON sc.created_by = u.id
    ORDER BY sc.name ASC
  `),
  insertCustomer: db.prepare(
    'INSERT INTO service_customers (name, phone, city, address, device, install_date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)'
  ),
  updateCustomer: db.prepare(
    'UPDATE service_customers SET name=?, phone=?, city=?, address=?, device=?, install_date=?, notes=? WHERE id=?'
  ),
  deleteCustomer: db.prepare('DELETE FROM service_customers WHERE id = ?'),

  // ── Service Records ────────────────────────────────
  getRecordsByCustomer: db.prepare('SELECT * FROM service_records WHERE customer_id = ? ORDER BY date DESC'),
  getAllRecords:         db.prepare('SELECT * FROM service_records ORDER BY date DESC'),
  insertRecord:         db.prepare(
    'INSERT INTO service_records (customer_id, type, date, next_date, tech, fee, notes, created_by) VALUES (?,?,?,?,?,?,?,?)'
  ),
  updateRecord: db.prepare(
    'UPDATE service_records SET type=?, date=?, next_date=?, tech=?, fee=?, notes=? WHERE id=?'
  ),
  deleteRecord: db.prepare('DELETE FROM service_records WHERE id = ?'),

  // ── Product Overrides ──────────────────────────────
  getOverrides:      db.prepare('SELECT * FROM product_overrides'),
  upsertOverride:    db.prepare(`
    INSERT INTO product_overrides (code, name_ov, price_ov, image_ov, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      name_ov    = COALESCE(excluded.name_ov,  name_ov),
      price_ov   = COALESCE(excluded.price_ov, price_ov),
      image_ov   = COALESCE(excluded.image_ov, image_ov),
      updated_at = excluded.updated_at
  `),
  // Stok: stock_qty NULL olabilir (takip edilmiyor demek), bu yüzden COALESCE değil direkt SET
  upsertStock: db.prepare(`
    INSERT INTO product_overrides (code, stock_qty, stock_tracked, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      stock_qty     = excluded.stock_qty,
      stock_tracked = excluded.stock_tracked,
      updated_at    = excluded.updated_at
  `),
  adjustStock: db.prepare(`
    INSERT INTO product_overrides (code, stock_qty, stock_tracked, updated_at)
    VALUES (?, MAX(0, ?), 1, datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      stock_qty  = MAX(0, COALESCE(stock_qty, 0) + ?),
      updated_at = excluded.updated_at
  `),
  resetOverride:     db.prepare('DELETE FROM product_overrides WHERE code = ?'),
  resetAllOverrides: db.prepare('DELETE FROM product_overrides'),
};

module.exports = stmts;
