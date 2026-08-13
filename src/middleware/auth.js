// src/middleware/auth.js — JWT doğrulama middleware
'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'watalina-dev-secret-change-in-prod';

/**
 * auth(roles?) — İstenen rollere sahip kullanıcıyı doğrular.
 * roles boşsa sadece geçerli token kontrolü yapar.
 */
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'Token gerekli' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ ok: false, error: 'Yetki yetersiz' });
      }
      next();
    } catch {
      return res.status(401).json({ ok: false, error: 'Geçersiz token' });
    }
  };
}

module.exports = { auth, JWT_SECRET };
