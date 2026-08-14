// src/db/migrations.js — Mevcut DB'ye eksik kolonları ekler
'use strict';
const db = require('./connection');

const migrate = db.transaction(() => {
  const col = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);

  const ocols = col('orders');
  if (!ocols.includes('notes'))      db.exec("ALTER TABLE orders ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
  if (!ocols.includes('updated_at')) db.exec("ALTER TABLE orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))");

  const scols = col('service_customers');
  if (!scols.includes('address'))      db.exec("ALTER TABLE service_customers ADD COLUMN address TEXT NOT NULL DEFAULT ''");
  if (!scols.includes('install_date')) db.exec("ALTER TABLE service_customers ADD COLUMN install_date TEXT DEFAULT NULL");

  const rcols = col('service_records');
  if (!rcols.includes('type')) db.exec("ALTER TABLE service_records ADD COLUMN type TEXT NOT NULL DEFAULT 'maintenance'");
  if (!rcols.includes('tech')) db.exec("ALTER TABLE service_records ADD COLUMN tech TEXT NOT NULL DEFAULT ''");
  if (!rcols.includes('fee'))  db.exec("ALTER TABLE service_records ADD COLUMN fee REAL NOT NULL DEFAULT 0");

  const qcols = col('quotes');
  if (!qcols.includes('payment_json')) db.exec("ALTER TABLE quotes ADD COLUMN payment_json TEXT NOT NULL DEFAULT '{}'");

  // cash_accounts tablosu
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  if (!tables.includes('cash_accounts')) {
    db.exec(`CREATE TABLE IF NOT EXISTS cash_accounts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`);
    // Varsayilan 3 kasa
    db.prepare("INSERT INTO cash_accounts (name, description) VALUES (?, ?)").run('Örnek Kasa 1', '');
    db.prepare("INSERT INTO cash_accounts (name, description) VALUES (?, ?)").run('Örnek Kasa 2', '');
    db.prepare("INSERT INTO cash_accounts (name, description) VALUES (?, ?)").run('Örnek Kasa 3', '');
  }

  // cash_transactions tablosu
  if (!tables.includes('cash_transactions')) {
    db.exec(`CREATE TABLE IF NOT EXISTS cash_transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id  INTEGER NOT NULL DEFAULT 1 REFERENCES cash_accounts(id),
      date        TEXT    NOT NULL,
      person      TEXT    NOT NULL DEFAULT '',
      description TEXT    NOT NULL DEFAULT '',
      amount      REAL    NOT NULL DEFAULT 0,
      type        TEXT    NOT NULL CHECK(type IN ('in','out')),
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`);
  } else {
    // Mevcut tabloya account_id ekle
    const tcols = col('cash_transactions');
    if (!tcols.includes('account_id')) {
      db.exec("ALTER TABLE cash_transactions ADD COLUMN account_id INTEGER REFERENCES cash_accounts(id)");
    }
  }

  // finance rolune izin ver (SQLite CHECK constraint degistirilemez, sadece yeni kayitlar icin)

  const pcols = col('product_overrides');
  if (!pcols.includes('stock_qty'))     db.exec("ALTER TABLE product_overrides ADD COLUMN stock_qty INTEGER DEFAULT NULL");
  if (!pcols.includes('stock_tracked')) db.exec("ALTER TABLE product_overrides ADD COLUMN stock_tracked INTEGER NOT NULL DEFAULT 0");

  // il / ilce kolonlarini ekle
  const custCols = col('service_customers');
  if (!custCols.includes('il')) {
    db.exec("ALTER TABLE service_customers ADD COLUMN il TEXT DEFAULT ''");
  }
  if (!custCols.includes('ilce')) {
    db.exec("ALTER TABLE service_customers ADD COLUMN ilce TEXT DEFAULT ''");
  }

  const needsMigration = db.prepare(
    "SELECT id, city FROM service_customers WHERE city != '' AND il = ''"
  ).all();

  if (needsMigration.length) {
    const updateStmt = db.prepare(
      "UPDATE service_customers SET il = ?, ilce = ? WHERE id = ?"
    );
    for (const row of needsMigration) {
      const parts = row.city.split('-').map(s => s.trim());
      const il = parts[0] || '';
      const ilce = parts[1] || '';
      updateStmt.run(il, ilce, row.id);
    }
    console.log(`[migration] ${needsMigration.length} musterinin il/ilce bilgisi city alanindan tasindi - admin panelinden kontrol edin.`);
  }

  // Harita icin konum kolonlari — musteri adresinden geocode edilip
  // kalicı olarak saklanir, her sayfa acilisinda tekrar hesaplanmaz.
  const custCols2 = col('service_customers');
  if (!custCols2.includes('latitude'))     db.exec("ALTER TABLE service_customers ADD COLUMN latitude REAL DEFAULT NULL");
  if (!custCols2.includes('longitude'))    db.exec("ALTER TABLE service_customers ADD COLUMN longitude REAL DEFAULT NULL");
  if (!custCols2.includes('geocoded_at'))  db.exec("ALTER TABLE service_customers ADD COLUMN geocoded_at TEXT DEFAULT NULL");
  if (!custCols2.includes('geo_precision')) db.exec("ALTER TABLE service_customers ADD COLUMN geo_precision TEXT DEFAULT NULL");
});

migrate();
