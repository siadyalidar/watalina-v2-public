// src/middleware/sse.js — Server-Sent Events yayıncısı
'use strict';
const { JWT_SECRET } = require('./auth');
const jwt = require('jsonwebtoken');

const sseClients = new Set();

function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try { res.write(payload); } catch (_) { /* bağlantı kapandı */ }
  });
}

/** GET /events — EventSource bağlantısı */
function sseHandler(req, res) {
  const qtoken = req.query?.token;
  const header = req.headers.authorization || '';
  const token  = qtoken || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'Token gerekli' });
  try {
    jwt.verify(token, JWT_SECRET);
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

module.exports = { broadcastEvent, sseHandler };
