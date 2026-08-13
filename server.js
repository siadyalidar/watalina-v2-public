// server.js — Watalina uygulama giriş noktası
'use strict';

// 1. DB başlat (schema → migration → seed)
require('./src/db/schema');
require('./src/db/migrations');
require('./src/db/seed');

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { sseHandler } = require('./src/middleware/sse');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '15mb' }));   // base64 görseller için
app.use(express.static(path.join(__dirname, 'public')));

// ── API Rotaları ─────────────────────────────────────
app.use('/api',           require('./src/routes/auth'));
app.use('/api/users',     require('./src/routes/users'));
app.use('/api/quotes',    require('./src/routes/quotes'));
app.use('/api/orders',    require('./src/routes/orders'));
app.use('/api/service',   require('./src/routes/service'));
app.use('/api/overrides', require('./src/routes/overrides'));
app.use('/api/finance',   require('./src/routes/finance'));
app.use('/api/performance', require('./src/routes/performance'));

// ── SSE (gerçek zamanlı güncellemeler) ───────────────
app.get('/events', sseHandler);

// ── SPA Fallback ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Watalina çalışıyor → http://localhost:${PORT}`);
  console.log(`  DB: ${process.env.DB_PATH || 'watalina.db (local)'}`);
});
