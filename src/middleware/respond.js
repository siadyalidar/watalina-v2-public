// src/middleware/respond.js — ok / err yardımcı fonksiyonları
'use strict';

function ok(res, data)           { res.json({ ok: true, ...data }); }
function err(res, msg, code=400) { res.status(code).json({ ok: false, error: msg }); }

module.exports = { ok, err };
