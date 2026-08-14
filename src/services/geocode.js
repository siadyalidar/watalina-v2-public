// src/services/geocode.js — Adresten koordinat (lat/lng) belirleme
//
// Nominatim (OpenStreetMap) kullanılır: ücretsiz, Türkiye adresleri için
// makul doğrulukta, API anahtarı gerektirmez. Kullanım politikası gereği
// (https://operations.osmfoundation.org/policies/nominatim/) saniyede en
// fazla 1 istek yapılır ve tanımlayıcı bir User-Agent gönderilir.
//
// Sonuçlar service_customers tablosunda kalıcı olarak saklanır — bir kez
// belirlenen konum tekrar tekrar geocode edilmez.
'use strict';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'WatalinaServisModulu/1.0 (https://github.com/siadyalidar/watalina-v2-public)';
const REQUEST_TIMEOUT_MS = 7000;
const MIN_INTERVAL_MS = 1100; // Nominatim: saniyede en fazla 1 istek

let _lastCallAt = 0;

function _wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function _throttle() {
  const now = Date.now();
  const elapsed = now - _lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) await _wait(MIN_INTERVAL_MS - elapsed);
  _lastCallAt = Date.now();
}

async function _query(q) {
  await _throttle();
  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(q)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'tr' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length) {
      const hit = arr[0];
      const lat = parseFloat(hit.lat);
      const lon = parseFloat(hit.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    }
    return null;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Bir müşteri adresini koordinata çevirir. Doğruluk için önce tam adres
 * denenir, bulunamazsa ilçe/il düzeyine düşülür (yine gerçek geocoding
 * sonucu — uydurma koordinat asla üretilmez).
 *
 * Döndürür: { lat, lon, precision } | null
 *   precision: 'address' | 'district' | 'province'
 */
async function geocodeCustomer({ il, ilce, address }) {
  const il2 = (il || '').trim();
  const ilce2 = (ilce || '').trim();
  const addr2 = (address || '').trim();

  const attempts = [];
  if (addr2 && (il2 || ilce2)) {
    attempts.push({
      q: [addr2, ilce2, il2, 'Türkiye'].filter(Boolean).join(', '),
      precision: 'address',
    });
  }
  if (ilce2 && il2) {
    attempts.push({ q: [ilce2, il2, 'Türkiye'].filter(Boolean).join(', '), precision: 'district' });
  }
  if (il2) {
    attempts.push({ q: [il2, 'Türkiye'].filter(Boolean).join(', '), precision: 'province' });
  }

  for (const attempt of attempts) {
    const hit = await _query(attempt.q);
    if (hit) return { lat: hit.lat, lon: hit.lon, precision: attempt.precision };
  }
  return null;
}

module.exports = { geocodeCustomer };
