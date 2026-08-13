// src/routes/auth.js — Giriş ve şifre işlemleri
'use strict';
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const stmts   = require('../db/statements');
const { auth, JWT_SECRET } = require('../middleware/auth');
const { ok, err } = require('../middleware/respond');

// POST /api/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return err(res, 'Kullanıcı adı ve şifre gerekli');
  const user = stmts.getUserByUsername.get(username.trim().toLowerCase());
  if (!user) return err(res, 'Kullanıcı bulunamadı', 401);
  if (!bcrypt.compareSync(password, user.password_hash)) return err(res, 'Şifre hatalı', 401);
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    JWT_SECRET, { expiresIn: '12h' }
  );
  ok(res, { token, user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name } });
});

// POST /api/change-password  (kendi şifresini değiştir)
router.post('/change-password', auth(), (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return err(res, 'Eksik alan');
  if (new_password.length < 6) return err(res, 'Şifre en az 6 karakter olmalı');
  const user = stmts.getUserByUsername.get(req.user.username);
  if (!bcrypt.compareSync(current_password, user.password_hash)) return err(res, 'Mevcut şifre hatalı', 401);
  stmts.updateUserPassword.run(bcrypt.hashSync(new_password, 10), req.user.id);
  ok(res, { message: 'Şifre güncellendi' });
});

module.exports = router;
