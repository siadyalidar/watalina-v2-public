// ─────────────────────────────────────────────────────
const API_BASE = window.location.origin;   // Railway URL otomatik alınır

// ─────────────────────────────────────────────────────
// AUTH STORE
// ─────────────────────────────────────────────────────
const Auth = {
  _token: null,
  _user:  null,

  load() {
    try {
      this._token = localStorage.getItem('wt_token');
      const u = localStorage.getItem('wt_user');
      this._user = u ? JSON.parse(u) : null;
    } catch(e) { this._token = null; this._user = null; }
  },
  save(token, user) {
    this._token = token;
    this._user  = user;
    localStorage.setItem('wt_token', token);
    localStorage.setItem('wt_user',  JSON.stringify(user));
  },
  clear() {
    this._token = null;
    this._user  = null;
    localStorage.removeItem('wt_token');
    localStorage.removeItem('wt_user');
  },
  get token()      { return this._token; },
  get user()       { return this._user; },
  get role()       { return this._user ? this._user.role : null; },
  get isLoggedIn() { return !!this._token; },
  can(page) {
    const r = this.role;
    if (!r) return false;
    if (r === 'admin')   return true;
    if (r === 'sales')   return page === 'sales';
    if (r === 'service') return page === 'service';
    return false;
  }
};

// ─────────────────────────────────────────────────────
// API LAYER  (replaces localStorage for shared data)
// ─────────────────────────────────────────────────────
const Api = {
  async _req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (Auth.token) opts.headers['Authorization'] = 'Bearer ' + Auth.token;
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { Auth.clear(); showLogin(); }
      throw new Error(data.error || 'API hatası');
    }
    return data;
  },
  get(path)         { return this._req('GET',    path); },
  post(path, body)  { return this._req('POST',   path, body); },
  put(path, body)   { return this._req('PUT',    path, body); },
  del(path)         { return this._req('DELETE', path); },
  req(method, path, body) { return this._req(method, path, body); },

  // ── Quotes ──
  async getQuotes() {
    const d = await this.get('/api/quotes');
    return d.quotes || [];
  },
  async saveQuote(q) {
    return this.post('/api/quotes', q);
  },
  async deleteQuote(id) {
    return this.del('/api/quotes/' + id);
  },

  // ── Orders ──
  async getOrders() {
    const d = await this.get('/api/orders');
    return d.orders || [];
  },
  async createOrder(o) {
    return this.post('/api/orders', o);
  },
  async updateOrderStatus(id, status) {
    return this.req('PATCH', '/api/orders/' + id + '/status', { status });
  },
  async deleteOrder(id) {
    return this.del('/api/orders/' + id);
  },
  async getDashboardStats() {
    const d = await this.get('/api/stats/dashboard');
    return d;
  },

  // ── Service ──
  async getSvcData() {
    const [cd, rd] = await Promise.all([
      this.get('/api/service/customers'),
      this.get('/api/service/records'),
    ]);
    return { customers: cd.customers || [], records: rd.records || [] };
  },
  async addCustomer(c) {
    return this.post('/api/service/customers', c);
  },
  async updateCustomer(id, c) {
    return this.put('/api/service/customers/' + id, c);
  },
  async deleteCustomer(id) {
    return this.del('/api/service/customers/' + id);
  },
  async addRecord(r) {
    return this.post('/api/service/records', r);
  },
  async deleteRecord(id) {
    return this.del('/api/service/records/' + id);
  },

  // ── Overrides ──
  async getOverrides() {
    const d = await this.get('/api/overrides');
    return d.overrides || { images: {}, names: {}, prices: {}, stock: {} };
  },
  async saveOverride(code, fields) {
    // Map frontend field names to backend names
    const body = { code };
    if (fields.name  !== undefined) body.name_ov  = fields.name;
    if (fields.price !== undefined) body.price_ov = fields.price;
    if (fields.image !== undefined) body.image_ov = fields.image;
    // Also pass through if already using _ov suffix
    if (fields.name_ov  !== undefined) body.name_ov  = fields.name_ov;
    if (fields.price_ov !== undefined) body.price_ov = fields.price_ov;
    if (fields.image_ov !== undefined) body.image_ov = fields.image_ov;
    return this.post('/api/overrides', body);
  },
  async resetOverride(code) {
    return this.del('/api/overrides/' + code);
  },
  async resetAllOverrides() {
    return this.del('/api/overrides');
  },
  async setStock(code, qty, tracked) {
    const body = {};
    if (qty     !== undefined) body.qty     = qty;
    if (tracked !== undefined) body.tracked = tracked;
    return this.put('/api/overrides/' + code + '/stock', body);
  },
  async adjustStock(code, delta) {
    return this.req('PATCH', '/api/overrides/' + code + '/stock', { delta });
  },
};

// ─────────────────────────────────────────────────────
// GLOBAL CONSTANTS  (localStorage keys kept for fallback)
