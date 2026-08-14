// src/routes/service.js — Servis müşterileri ve kayıtları
'use strict';
const router = require('express').Router();
const stmts  = require('../db/statements');
const { auth }             = require('../middleware/auth');
const { ok, err }          = require('../middleware/respond');
const { broadcastEvent }   = require('../middleware/sse');
const { geocodeCustomer }  = require('../services/geocode');

const mapCustomer = r => ({
  id:          String(r.id),
  name:        r.name,
  phone:       r.phone,
  il:        r.il,
  ilce:        r.ilce,
  city:        r.city,
  address:     r.address,
  device:      r.device,
  installDate: r.install_date,
  note:        r.notes,
  createdAt:   r.created_at,
  lat:         typeof r.latitude  === 'number' ? r.latitude  : null,
  lng:         typeof r.longitude === 'number' ? r.longitude : null,
  geoPrecision: r.geo_precision || null,
  geocodedAt:  r.geocoded_at || null,
});

// Adres alanları değişti mi? (gereksiz yeniden geocode yapmamak için)
function addressChanged(oldRow, next) {
  if (!oldRow) return true;
  return (oldRow.il || '') !== (next.il || '')
      || (oldRow.ilce || '') !== (next.ilce || '')
      || (oldRow.address || '') !== (next.address || '');
}

// Best-effort geocode: başarısız olursa müşteri kaydı yine de oluşur/güncellenir,
// koordinatlar sonradan "Konumları Belirle" ile veya bir sonraki güncellemede tamamlanabilir.
async function tryGeocodeAndSave(customerId, { il, ilce, address }) {
  try {
    const hit = await geocodeCustomer({ il, ilce, address });
    if (hit) {
      stmts.updateCustomerCoords.run(hit.lat, hit.lon, hit.precision, customerId);
      return true;
    }
  } catch (_e) { /* sessizce geç — konum daha sonra tekrar denenebilir */ }
  return false;
}

const mapRecord = r => ({
  id:        String(r.id),
  custId:    String(r.customer_id),
  type:      r.type,
  date:      r.date,
  nextDate:  r.next_date,
  tech:      r.tech,
  fee:       r.fee,
  note:      r.notes,
  createdAt: r.created_at,
});

// ── Müşteriler ─────────────────────────────────────

// GET /api/service/customers
router.get('/customers', auth(['admin', 'service']), (req, res) => {
  ok(res, { customers: stmts.getCustomers.all().map(mapCustomer) });
});

// POST /api/service/customers
router.post('/customers', auth(['admin', 'service']), async (req, res) => {
  const { name, phone, il, ilce, address, device, installDate, note } = req.body || {};
  if (!name) return err(res, 'Müşteri adı gerekli');
  const info = stmts.insertCustomer.run(
    name, phone || '', il || '', ilce || '', address || '',
    device || '', installDate || null, note || '', req.user.id
  );
  const id = info.lastInsertRowid;

  // Konum belirleme: müşteri il/ilçe/adres girdiyse arka planda geocode edilir,
  // kullanıcı "Kaydet" tıkladıktan hemen sonra beklemesin diye kısa süre denenir,
  // sonuç gelmezse "Konumları Belirle" ile daha sonra tamamlanabilir.
  let geocoded = false;
  if (il || ilce || address) {
    geocoded = await tryGeocodeAndSave(id, { il, ilce, address });
  }

  broadcastEvent('svc-changed', { resource: 'customers', action: 'create', id: String(id), by: req.user.id });
  ok(res, { id, geocoded });
});

// PUT /api/service/customers/:id
router.put('/customers/:id', auth(['admin', 'service']), async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, il, ilce, address, device, installDate, note } = req.body || {};
  if (!name) return err(res, 'Müşteri adı gerekli');

  const existing = stmts.getCustomerById.get(id);
  stmts.updateCustomer.run(name, phone || '', il || '', ilce || '', address || '', device || '', installDate || null, note || '', id);

  let geocoded = false;
  if ((il || ilce || address) && addressChanged(existing, { il, ilce, address })) {
    geocoded = await tryGeocodeAndSave(id, { il, ilce, address });
  }

  broadcastEvent('svc-changed', { resource: 'customers', action: 'update', id: String(id), by: req.user.id });
  ok(res, { message: 'Güncellendi', geocoded });
});

// POST /api/service/customers/geocode-missing — konumu olmayan müşterileri toplu geocode eder.
// Nominatim kullanım limiti gereği (sn başına 1 istek) tek seferde en fazla BATCH_SIZE
// müşteri işlenir; kalan varsa frontend bu endpoint'i tekrar çağırarak ilerler.
const GEOCODE_BATCH_SIZE = 12;
router.post('/customers/geocode-missing', auth(['admin', 'service']), async (req, res) => {
  const rows = stmts.getCustomersMissingCoords.all().slice(0, GEOCODE_BATCH_SIZE);
  let geocodedCount = 0;
  let failedCount = 0;
  const updatedIds = [];

  for (const row of rows) {
    const hit = await tryGeocodeAndSave(row.id, { il: row.il, ilce: row.ilce, address: row.address });
    if (hit) { geocodedCount++; updatedIds.push(String(row.id)); }
    else failedCount++;
  }

  const remaining = stmts.countCustomersMissingCoords.get().cnt;
  if (updatedIds.length) {
    broadcastEvent('svc-changed', { resource: 'customers', action: 'geocode-batch', ids: updatedIds, by: req.user.id });
  }
  ok(res, { processed: rows.length, geocoded: geocodedCount, failed: failedCount, remaining, done: remaining === 0 });
});

// GET /api/service/customers/geocode-status — kaç müşterinin konumu eksik (banner için)
router.get('/customers/geocode-status', auth(['admin', 'service']), (req, res) => {
  ok(res, { missing: stmts.countCustomersMissingCoords.get().cnt });
});

// DELETE /api/service/customers/:id
router.delete('/customers/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  stmts.deleteCustomer.run(id);
  broadcastEvent('svc-changed', { resource: 'customers', action: 'delete', id: String(id), by: req.user.id });
  ok(res, { message: 'Silindi' });
});

// ── Kayıtlar ───────────────────────────────────────

// GET /api/service/records
router.get('/records', auth(['admin', 'service']), (req, res) => {
  ok(res, { records: stmts.getAllRecords.all().map(mapRecord) });
});

// GET /api/service/customers/:id/records
router.get('/customers/:id/records', auth(['admin', 'service']), (req, res) => {
  ok(res, { records: stmts.getRecordsByCustomer.all(Number(req.params.id)).map(mapRecord) });
});

// POST /api/service/records
router.post('/records', auth(['admin', 'service']), (req, res) => {
  const { custId, type, date, nextDate, tech, fee, note } = req.body || {};
  if (!custId || !date) return err(res, 'custId ve date gerekli');
  const info = stmts.insertRecord.run(
    Number(custId), type || 'maintenance', date,
    nextDate || null, tech || '', Number(fee) || 0,
    note || '', req.user.id
  );
  broadcastEvent('svc-changed', { resource: 'records', action: 'create', id: String(info.lastInsertRowid), custId: String(custId), by: req.user.id });
  ok(res, { id: info.lastInsertRowid });
});

// PUT /api/service/records/:id
router.put('/records/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  const { type, date, nextDate, tech, fee, note } = req.body || {};
  if (!date) return err(res, 'date gerekli');
  stmts.updateRecord.run(type || 'maintenance', date, nextDate || null, tech || '', Number(fee) || 0, note || '', id);
  broadcastEvent('svc-changed', { resource: 'records', action: 'update', id: String(id), by: req.user.id });
  ok(res, { message: 'Güncellendi' });
});

// DELETE /api/service/records/:id
router.delete('/records/:id', auth(['admin', 'service']), (req, res) => {
  const id = Number(req.params.id);
  stmts.deleteRecord.run(id);
  broadcastEvent('svc-changed', { resource: 'records', action: 'delete', id: String(id), by: req.user.id });
  ok(res, { message: 'Silindi' });
});

module.exports = router;
