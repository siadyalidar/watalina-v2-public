# Watalina Satış & Servis Sistemi

Su arıtma ürünleri için dahili satış teklifi, sipariş takibi ve saha servis yönetim uygulaması. Node.js + Express + SQLite tabanlı, tek sunucuda çalışan tam yığın web uygulaması.

---

## Hızlı Başlangıç

```bash
git clone https://github.com/siadyalidar/watalina.git
cd watalina
npm install
npm start
```

Uygulama `http://localhost:3000` adresinde çalışır.

**Varsayılan giriş bilgileri:**
```
Kullanıcı: admin
Şifre:     admin123
```
> ⚠️ İlk girişten sonra şifreyi mutlaka değiştirin.

---

## Proje Yapısı

```
watalina/
├── server.js                  ← Uygulama giriş noktası, route mount
│
├── src/
│   ├── routes/
│   │   ├── auth.js            ← POST /api/login, /api/change-password
│   │   ├── users.js           ← GET/POST/PUT/DELETE /api/users
│   │   ├── quotes.js          ← GET/POST/DELETE /api/quotes
│   │   ├── orders.js          ← GET/POST/PATCH/DELETE /api/orders
│   │   ├── service.js         ← /api/service/customers + /records
│   │   └── overrides.js       ← GET/POST/DELETE /api/overrides
│   │
│   ├── db/
│   │   ├── connection.js      ← SQLite bağlantısı (better-sqlite3)
│   │   ├── schema.js          ← CREATE TABLE tanımları
│   │   ├── migrations.js      ← ALTER TABLE migration'ları
│   │   ├── seed.js            ← Varsayılan admin oluşturma
│   │   └── statements.js      ← Tüm prepared statements
│   │
│   └── middleware/
│       ├── auth.js            ← JWT doğrulama middleware
│       ├── respond.js         ← ok() / err() yardımcıları
│       └── sse.js             ← Server-Sent Events yayıncısı
│
└── public/
    ├── index.html             ← SPA gövdesi (736 satır)
    ├── css/
    │   └── app.css            ← Tüm stiller
    └── js/
        ├── data.js            ← PRODUCT_IMAGES, categories kataloğu
        ├── api.js             ← Auth + Api nesnesi (tüm HTTP çağrıları)
        ├── state.js           ← AppState, product overrides
        ├── app.js             ← Login UI, appStart, rol yönetimi
        ├── catalog.js         ← Ürün rail, grid, kart, arama
        ├── router.js          ← AppRouter, sekme/panel render
        ├── cart.js            ← Sepet render, ayarlar, ödeme yöntemi
        ├── pdf.js             ← generatePDF() — teklif PDF şablonu
        ├── orders.js          ← Sipariş modal, dashboard render
        ├── service.js         ← Servis müşteri/kayıt UI
        ├── admin.js           ← Admin paneli fonksiyonları
        └── utils.js           ← showToast, fmtUSD, fmtTL, switchPage
```

---

## Ortam Değişkenleri

| Değişken    | Varsayılan                          | Açıklama               |
|-------------|-------------------------------------|------------------------|
| `PORT`      | `3000`                              | Sunucu portu           |
| `JWT_SECRET`| `watalina-dev-secret-change-in-prod`| JWT imzalama anahtarı  |
| `DB_PATH`   | `./watalina.db`                     | SQLite dosya yolu      |

---

## Veritabanı Şeması

### `users`
Rol tabanlı erişim: `admin` · `sales` · `service`

| Kolon          | Tip     | Açıklama               |
|----------------|---------|------------------------|
| `id`           | INTEGER | PK, otomatik artan     |
| `username`     | TEXT    | Benzersiz kullanıcı adı|
| `password_hash`| TEXT    | bcrypt hash            |
| `role`         | TEXT    | admin / sales / service|
| `display_name` | TEXT    | Görünen ad             |
| `created_at`   | TEXT    | Oluşturulma tarihi     |

### `quotes`
Satış teklifleri.

| Kolon          | Tip     | Açıklama                     |
|----------------|---------|------------------------------|
| `id`           | INTEGER | PK                           |
| `quote_no`     | TEXT    | Teklif numarası (WTL-XXXXXX) |
| `firm_name`    | TEXT    | Firma adı                    |
| `total`        | REAL    | Toplam (USD)                 |
| `disc`         | REAL    | İskonto yüzdesi              |
| `rate`         | REAL    | Döviz kuru                   |
| `items_json`   | TEXT    | Ürün sepeti (JSON)           |
| `payment_json` | TEXT    | Ödeme yöntemi (JSON)         |
| `created_by`   | INTEGER | FK → users.id                |

### `orders`
Siparişler. `status`: `beklemede` · `onaylandi` · `kargoda` · `teslim` · `iptal`

### `service_customers`
Servis müşterileri (cihaz, konum, kurulum tarihi).

### `service_records`
Servis ziyaret kayıtları. `type`: `maintenance` · `filter` · `install` · `repair` · `visit`

### `product_overrides`
Ürün fiyat / isim / görsel admin tarafından özelleştirme.

---

## API Endpoint'leri

### Auth
| Method | Endpoint               | Yetki | Açıklama               |
|--------|------------------------|-------|------------------------|
| POST   | `/api/login`           | —     | Giriş, JWT döner       |
| POST   | `/api/change-password` | auth  | Kendi şifreni değiştir |

### Kullanıcılar
| Method | Endpoint                   | Yetki | Açıklama            |
|--------|----------------------------|-------|---------------------|
| GET    | `/api/users`               | admin | Tüm kullanıcılar    |
| POST   | `/api/users`               | admin | Yeni kullanıcı      |
| PUT    | `/api/users/:id`           | admin | Rol / isim güncelle |
| PUT    | `/api/users/:id/password`  | admin | Şifre sıfırla       |
| DELETE | `/api/users/:id`           | admin | Kullanıcı sil       |

### Teklifler
| Method | Endpoint           | Yetki       | Açıklama     |
|--------|--------------------|-------------|--------------|
| GET    | `/api/quotes`      | admin/sales | Tüm teklifler|
| POST   | `/api/quotes`      | admin/sales | Teklif kaydet|
| DELETE | `/api/quotes/:id`  | admin       | Teklif sil   |

### Siparişler
| Method | Endpoint                   | Yetki       | Açıklama       |
|--------|----------------------------|-------------|----------------|
| GET    | `/api/orders`              | admin/sales | Tüm siparişler |
| POST   | `/api/orders`              | admin/sales | Yeni sipariş   |
| PATCH  | `/api/orders/:id/status`   | admin/sales | Durum güncelle |
| DELETE | `/api/orders/:id`          | admin       | Sipariş sil    |

### Servis
| Method | Endpoint                             | Yetki          |
|--------|--------------------------------------|----------------|
| GET    | `/api/service/customers`             | admin/service  |
| POST   | `/api/service/customers`             | admin/service  |
| PUT    | `/api/service/customers/:id`         | admin/service  |
| DELETE | `/api/service/customers/:id`         | admin/service  |
| GET    | `/api/service/customers/:id/records` | admin/service  |
| GET    | `/api/service/records`               | admin/service  |
| POST   | `/api/service/records`               | admin/service  |
| DELETE | `/api/service/records/:id`           | admin/service  |

### Ürün Özelleştirme
| Method | Endpoint              | Yetki | Açıklama         |
|--------|-----------------------|-------|------------------|
| GET    | `/api/overrides`      | auth  | Tüm overrides    |
| POST   | `/api/overrides`      | admin | Override ekle    |
| DELETE | `/api/overrides/:code`| admin | Tek ürün sıfırla |
| DELETE | `/api/overrides`      | admin | Tümünü sıfırla   |

### Gerçek Zamanlı
| Endpoint                | Açıklama                                |
|-------------------------|-----------------------------------------|
| `GET /events?token=...` | SSE stream — `order-changed`, `svc-changed` olayları |

---

## Roller ve Yetki Matrisi

| Özellik            | admin | sales | service |
|--------------------|:-----:|:-----:|:-------:|
| Teklif oluştur     | ✓     | ✓     | —       |
| Sipariş yönet      | ✓     | ✓     | —       |
| Servis kayıtları   | ✓     | —     | ✓       |
| Kullanıcı yönetimi | ✓     | —     | —       |
| Ürün override      | ✓     | —     | —       |

---

## Railway Deployment

```bash
# railway.toml zaten yapılandırılmış
railway up
```

Ortam değişkenlerini Railway dashboard'dan ayarla:
- `JWT_SECRET` → güvenli rastgele string
- `DB_PATH` → `/data/watalina.db` (kalıcı volume)

---

## Geliştirme Notları

### Yeni route eklemek
`src/routes/` altına yeni dosya oluştur, `server.js`'de mount et:
```js
app.use('/api/yeni', require('./src/routes/yeni'));
```

### Migration eklemek
`src/db/migrations.js` dosyasına yeni blok ekle:
```js
const yeniTablo = col('yeni_tablo');
if (!yeniTablo.includes('yeni_kolon')) {
  db.exec("ALTER TABLE yeni_tablo ADD COLUMN yeni_kolon TEXT DEFAULT ''");
}
```

### Frontend modül eklemek
`public/js/` altına `yeni-modul.js` oluştur, `index.html` sonuna ekle:
```html
<script src="/js/yeni-modul.js"></script>
```
