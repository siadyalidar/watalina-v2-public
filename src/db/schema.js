// src/db/schema.js — Tablo tanımları
'use strict';
const db = require('./connection');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK(role IN ('admin','sales','service','finance')),
    display_name  TEXT    NOT NULL DEFAULT '',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_no     TEXT    NOT NULL,
    firm_name    TEXT    NOT NULL DEFAULT '',
    total        REAL    NOT NULL DEFAULT 0,
    disc         REAL    NOT NULL DEFAULT 0,
    rate         REAL    NOT NULL DEFAULT 0,
    items_json   TEXT    NOT NULL DEFAULT '{}',
    payment_json TEXT    NOT NULL DEFAULT '{}',
    created_by   INTEGER NOT NULL REFERENCES users(id),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no    TEXT    NOT NULL,
    firm_name   TEXT    NOT NULL DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'beklemede'
                        CHECK(status IN ('beklemede','onaylandi','kargoda','teslim','iptal')),
    total       REAL    NOT NULL DEFAULT 0,
    disc        REAL    NOT NULL DEFAULT 0,
    rate        REAL    NOT NULL DEFAULT 0,
    items_json  TEXT    NOT NULL DEFAULT '{}',
    notes       TEXT    NOT NULL DEFAULT '',
    created_by  INTEGER NOT NULL REFERENCES users(id),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS service_customers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    phone        TEXT    NOT NULL DEFAULT '',
    city         TEXT    NOT NULL DEFAULT '',
    address      TEXT    NOT NULL DEFAULT '',
    device       TEXT    NOT NULL DEFAULT '',
    install_date TEXT             DEFAULT NULL,
    notes        TEXT    NOT NULL DEFAULT '',
    created_by   INTEGER NOT NULL REFERENCES users(id),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER NOT NULL REFERENCES service_customers(id) ON DELETE CASCADE,
    type         TEXT    NOT NULL DEFAULT 'maintenance',
    date         TEXT    NOT NULL,
    next_date    TEXT             DEFAULT NULL,
    tech         TEXT    NOT NULL DEFAULT '',
    fee          REAL    NOT NULL DEFAULT 0,
    notes        TEXT    NOT NULL DEFAULT '',
    created_by   INTEGER NOT NULL REFERENCES users(id),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cash_transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT    NOT NULL,
    person      TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    amount      REAL    NOT NULL DEFAULT 0,
    type        TEXT    NOT NULL CHECK(type IN ('in','out')),
    created_by  INTEGER NOT NULL REFERENCES users(id),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_overrides (
    code          TEXT    PRIMARY KEY,
    name_ov       TEXT             DEFAULT NULL,
    price_ov      REAL             DEFAULT NULL,
    image_ov      TEXT             DEFAULT NULL,
    stock_qty     INTEGER          DEFAULT NULL,
    stock_tracked INTEGER NOT NULL DEFAULT 0,
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);
