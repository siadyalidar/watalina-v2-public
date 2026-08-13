// src/routes/users.js — Kullanıcı yönetimi (sadece admin)
'use strict';
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const stmts   = require('../db/statements');
const { auth }      = require('../middleware/auth');
const { ok, err }   = require('../middleware/respond');

const VALID_ROLES = ['admin', 'sales', 'service'];

// GET /api/users
router.get('/', auth(['admin']), (req, res) => {
  ok(res, { users: stmts.getAllUsers.all() });
});

// POST /api/users
router.post('/', auth(['admin']), (req, res) => {
  const { username, password, display_name, role } = req.body || {};
  if (!username || !password)         return err(res, 'Kullanıcı adı ve şifre gerekli');
  if (password.length < 6)            return err(res, 'Şifre en az 6 karakter olmalı');
  if (!VALID_ROLES.includes(role))    return err(res, 'Geçersiz rol (admin / sales / service)');
  try {
    const info = stmts.insertUser.run(
      username.trim().toLowerCase(),
      bcrypt.hashSync(password, 10),
      role,
      display_name?.trim() || username.trim()
    );
    ok(res, { id: info.lastInsertRowid });
  } catch {
    err(res, 'Bu kullanıcı adı zaten kullanımda');
  }
});

// PUT /api/users/:id
router.put('/:id', auth(['admin']), (req, res) => {
  const id     = Number(req.params.id);
  const target = stmts.getUserById.get(id);
  if (!target) return err(res, 'Kullanıcı bulunamadı', 404);

  const display_name = req.body.display_name?.trim() ?? target.display_name;
  const role         = req.body.role ?? target.role;
  if (!VALID_ROLES.includes(role)) return err(res, 'Geçersiz rol');

  if (target.role === 'admin' && role !== 'admin') {
    const admins = stmts.getAllUsers.all().filter(u => u.role === 'admin');
    if (admins.length <= 1) return err(res, 'En az bir admin hesabı kalmalı');
  }
  stmts.updateUser.run(display_name, role, id);
  ok(res, { message: 'Kullanıcı güncellendi' });
});

// PUT /api/users/:id/password  (admin başka kullanıcının şifresini sıfırlar)
router.put('/:id/password', auth(['admin']), (req, res) => {
  const id = Number(req.params.id);
  const { new_password } = req.body || {};
  if (!new_password || new_password.length < 6) return err(res, 'Şifre en az 6 karakter olmalı');
  if (!stmts.getUserById.get(id)) return err(res, 'Kullanıcı bulunamadı', 404);
  stmts.updateUserPassword.run(bcrypt.hashSync(new_password, 10), id);
  ok(res, { message: 'Şifre güncellendi' });
});

// DELETE /api/users/:id
router.delete('/:id', auth(['admin']), (req, res) => {
  const id     = Number(req.params.id);
  if (id === req.user.id) return err(res, 'Kendinizi silemezsiniz');
  const target = stmts.getUserById.get(id);
  if (!target) return err(res, 'Kullanıcı bulunamadı', 404);
  if (target.role === 'admin') {
    const admins = stmts.getAllUsers.all().filter(u => u.role === 'admin');
    if (admins.length <= 1) return err(res, 'En az bir admin hesabı kalmalı');
  }
  stmts.deleteUser.run(id);
  ok(res, { message: 'Kullanıcı silindi' });
});

module.exports = router;
