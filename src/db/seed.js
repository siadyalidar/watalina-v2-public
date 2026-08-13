// src/db/seed.js — İlk açılışta varsayılan admin oluşturur
'use strict';
const bcrypt = require('bcryptjs');
const db     = require('./connection');

const seed = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (count === 0) {
    db.prepare(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'
    ).run('admin', bcrypt.hashSync('admin123', 10), 'admin', 'Admin');
    console.log('✓ Varsayılan admin oluşturuldu  →  kullanıcı: admin  /  şifre: admin123');
    console.log('  ⚠️  Lütfen giriş yaptıktan sonra şifreyi değiştirin!');
  }
});

seed();
