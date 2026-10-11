// Vân Quẻ · tài khoản tuvi.work: đăng nhập (mã một lần + PKCE qua cổng loopback) và đồng bộ sổ lá số
// Không phụ thuộc trực tiếp vào Electron để kiểm thử được bằng node: mọi thứ cần thiết được truyền vào.
const http = require('http');
const crypto = require('crypto');

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const LOGIN_TIMEOUT = 5 * 60 * 1000;
const PULL_LIMIT = 50; // số trang tối đa mỗi lần kéo (200 lá số/trang)

/** Lá số trong sổ: dương lịch, giờ theo chi 1–12 (1 = Tý) như tuvi.work */
function cleanChart(c) {
  const n = (v, lo, hi) => { v = Math.trunc(+v); if (!(v >= lo && v <= hi)) throw Object.assign(new Error('Lá số không hợp lệ'), { status: 400 }); return v; };
  return {
    ten: String(c.ten || '').trim().slice(0, 50),
    lich: c.lich === 'am' ? 'am' : 'duong',
    ngay: n(c.ngay, 1, 31), thang: n(c.thang, 1, 12), nam: n(c.nam, 1900, 2100), gio: n(c.gio, 1, 12),
    gioi_tinh: c.gioi_tinh === 'nu' ? 'nu' : 'nam',
  };
}
const sameChart = (a, b) => a.lich === b.lich && a.ngay === b.ngay && a.thang === b.thang && a.nam === b.nam && a.gio === b.gio && a.gioi_tinh === b.gioi_tinh;
const newId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

class Account {
  /**
   * @param {object} o
   * @param {import('./store').Store} o.store
   * @param {string} o.base       gốc web, vd https://tuvi.work
   * @param {string} o.apiKey     khóa X-Tuvi-Key riêng của Vân Quẻ (định danh công khai, không phải bí mật)
   * @param {Function} o.fetch    fetch tương thích WHATWG
   * @param {Function} o.open     mở URL bằng trình duyệt mặc định
   * @param {{encrypt:Function, decrypt:Function, available:Function}} o.crypt  mã hóa token (safeStorage)
   * @param {Function} [o.onFocus] đưa cửa sổ lên sau khi đăng nhập xong
   */
  constructor({ store, base, apiKey, version = '', fetch, open, crypt, onFocus = () => {} }) {
    Object.assign(this, { store, base: base.replace(/\/+$/, ''), apiKey, version, fetch, open, crypt, onFocus });
    this.api = this.base + '/api/v1';
    this.memToken = null;   // khi không mã hóa được, token chỉ giữ trong bộ nhớ
    this.pending = null;    // phiên đăng nhập đang chờ
    this.syncing = null;
    this.timer = null;
  }

  // ───────── Trạng thái công khai (không bao giờ chứa token) ─────────
  state() {
    const a = this.store.get('account');
    return {
      signedIn: !!this.token(), user: a.user || null, lastSync: a.lastSync || 0, error: a.error || '',
      syncing: !!this.syncing, loggingIn: !!this.pending, persistent: this.crypt.available(), configured: this.configured(),
    };
  }
  configured() { return !!this.apiKey && !/CHUA-CAP/.test(this.apiKey); }
  _patch(p) { this.store.set('account', { ...this.store.get('account'), ...p }); }

  token() {
    if (this.memToken) return this.memToken;
    const enc = this.store.get('auth').token;
    if (!enc) return null;
    try { return this.crypt.decrypt(enc); } catch { return null; }
  }
  _saveToken(t) {
    if (this.crypt.available()) { this.store.set('auth', { token: this.crypt.encrypt(t) }); this.memToken = null; }
    else { this.memToken = t; this.store.set('auth', {}); }
  }

  async _call(method, path, body, { auth = true } = {}) {
    const headers = { Accept: 'application/json', 'X-Tuvi-Key': this.apiKey, 'X-Tuvi-App': 'vanque', 'X-Request-Id': crypto.randomUUID() };
    if (this.version) headers['X-Tuvi-App-Version'] = this.version;
    if (body) headers['Content-Type'] = 'application/json';
    if (auth) { const t = this.token(); if (!t) throw Object.assign(new Error('Chưa đăng nhập'), { status: 401 }); headers.Authorization = 'Bearer ' + t; }
    let res;
    try { res = await this.fetch(this.api + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { throw Object.assign(new Error('Không kết nối được tuvi.work'), { status: 0, offline: true }); }
    let json = null;
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      // Chỉ 'unauthenticated' nghĩa là token hết hiệu lực; 401 do khóa X-Tuvi-Key (missing_key/invalid_key) không được xóa phiên
      if (res.status === 401 && auth && json?.code === 'unauthenticated') this._expire();
      throw Object.assign(new Error(json?.message || `tuvi.work trả lỗi ${res.status}`), { status: res.status, code: json?.code });
    }
    return json?.data ?? json;
  }
  _expire() {
    this.memToken = null;
    this.store.set('auth', {});
    this._patch({ error: 'Phiên đăng nhập đã hết — hãy đăng nhập lại.', cursor: 0 });
  }

  // ───────── Đăng nhập ─────────
  /** Mở tuvi.work trong trình duyệt mặc định, chờ trang trả mã về cổng loopback rồi đổi lấy token */
  login() {
    if (!this.configured()) return Promise.reject(Object.assign(new Error('Bản Vân Quẻ này chưa được cấp khóa kết nối tuvi.work.'), { status: 503 }));
    if (this.pending) return this.pending.promise;
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(24));
    let finish;
    const promise = new Promise((resolve, reject) => { finish = { resolve, reject }; });
    const server = http.createServer((req, res) => this._callback(req, res, state, verifier));
    const timer = setTimeout(() => this._endLogin(new Error('Quá thời gian chờ đăng nhập.')), LOGIN_TIMEOUT);
    this.pending = { promise, finish, server, timer, state };
    this._notify();
    server.on('error', (e) => this._endLogin(e));
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const url = `${this.base}/dang-nhap/vanque?` + new URLSearchParams({ cong: port, state, thach: challenge });
      Promise.resolve(this.open(url)).catch((e) => this._endLogin(e));
    });
    return promise;
  }
  cancelLogin() { this._endLogin(Object.assign(new Error('Đã hủy đăng nhập.'), { cancelled: true })); }

  async _callback(req, res, state, verifier) {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname !== '/xong' || u.searchParams.get('state') !== state) { res.writeHead(404).end(); return; }
    const err = u.searchParams.get('loi'), code = u.searchParams.get('ma');
    try {
      if (err || !code) throw new Error(err === 'tu_choi' ? 'Bạn đã từ chối cho Vân Quẻ dùng tài khoản.' : 'tuvi.work không trả mã đăng nhập.');
      const data = await this._call('POST', '/auth/vanque', { ma: code, verifier }, { auth: false });
      if (!data?.token) throw new Error('tuvi.work không trả token.');
      this._saveToken(data.token);
      this._patch({ user: pickUser(data.user), error: '', cursor: 0, lastSync: 0 });
      page(res, 200, 'Đã đăng nhập', `Xin chào ${esc(data.user?.name || '')}! Vân Quẻ đã nối với tài khoản tuvi.work của bạn. Bạn có thể đóng thẻ này và quay lại Vân Quẻ.`);
      this._endLogin(null, this.state());
      this.onFocus();
      this.sync().catch(() => {});
    } catch (e) {
      page(res, 400, 'Chưa đăng nhập được', esc(e.message));
      this._endLogin(e);
    }
  }
  _endLogin(err, value) {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    clearTimeout(p.timer);
    p.server.close(); // trang kết quả gửi kèm Connection: close nên máy chủ đóng sau khi trả xong
    p.server.closeIdleConnections?.();
    if (err) { if (!err.cancelled) this._patch({ error: err.message }); p.finish.reject(err); } else p.finish.resolve(value);
    this._notify();
  }

  /**
   * Đăng xuất. keep = true: giữ sổ lá số trên máy nhưng gắn chủ cũ — không đẩy sang tài khoản khác đăng nhập sau;
   * keep = false: xóa sổ khỏi máy (vẫn còn trên tuvi.work).
   */
  async logout({ keep = true } = {}) {
    const owner = this.store.get('account').user?.id ?? null;
    if (this.token()) await this._call('POST', '/auth/dang-xuat', {}).catch(() => {});
    this.memToken = null;
    this.store.set('auth', {});
    this._patch({ user: null, error: '', cursor: 0, lastSync: 0 });
    this.store.set('laSo', keep ? this.store.get('laSo').filter((c) => !c.deleted).map((c) => ({ ...c, chartKey: null, dirty: true, owner: c.owner ?? owner })) : []);
    return this.state();
  }
  /** Lá số được phép đẩy lên tài khoản đang đăng nhập: lá số ẩn danh hoặc của chính người này */
  _mine(c) { const me = this.store.get('account').user?.id; return c.owner == null || c.owner === me; }

  /** Làm mới tên/ảnh đại diện từ GET /tai-khoan */
  async refreshUser() {
    const d = await this._call('GET', '/tai-khoan');
    this._patch({ user: pickUser(d) });
    return d;
  }

  // ───────── Sổ lá số (cục bộ) ─────────
  charts() { return this.store.get('laSo').filter((c) => !c.deleted); }
  saveChart(input) {
    const c = cleanChart(input);
    const list = [...this.store.get('laSo')];
    const i = list.findIndex((x) => !x.deleted && sameChart(x, c));
    const now = Date.now();
    let item;
    if (i >= 0) { item = { ...list[i], ten: c.ten || list[i].ten, updatedAt: now, dirty: true }; list[i] = item; }
    else { item = { id: newId(), chartKey: null, ...c, can_chi: '', menh: '', updatedAt: now, dirty: true, deleted: false }; list.unshift(item); }
    this.store.set('laSo', list.slice(0, 500));
    this.kick();
    return item;
  }
  removeChart(id) {
    const list = this.store.get('laSo').map((c) => (c.id === id ? { ...c, deleted: true, dirty: true, updatedAt: Date.now() } : c));
    this.store.set('laSo', list.filter((c) => !(c.deleted && !c.chartKey)));
    this.kick();
  }

  // ───────── Đồng bộ ─────────
  /** Hẹn đồng bộ sau một thay đổi cục bộ (gộp nhiều thay đổi liền nhau) */
  kick(ms = 1500) {
    if (!this.token()) return;
    clearTimeout(this.kickTimer);
    this.kickTimer = setTimeout(() => this.sync().catch(() => {}), ms);
  }
  startAuto(intervalMs = 10 * 60 * 1000) {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sync().catch(() => {}), intervalMs);
    this.timer.unref?.();
    if (this.token()) this.sync().catch(() => {});
  }
  stopAuto() { clearInterval(this.timer); clearTimeout(this.kickTimer); }

  sync() {
    if (!this.token()) return Promise.resolve(this.state());
    if (this.syncing) return this.syncing;
    this.syncing = this._sync().then(
      () => { this._patch({ lastSync: Date.now(), error: '' }); return this.state(); },
      (e) => { if (e.status !== 401) this._patch({ error: e.offline ? 'Ngoại tuyến — sẽ đồng bộ lại sau.' : e.message }); throw e; },
    ).finally(() => { this.syncing = null; this._notify(); });
    this._notify();
    return this.syncing;
  }

  async _sync() {
    const setList = (fn) => this.store.set('laSo', fn(this.store.get('laSo')));
    // 1) Gửi lệnh xóa
    for (const c of this.store.get('laSo').filter((x) => x.deleted && x.chartKey)) {
      // chartKey chỉ gồm "ls:", chữ số, gạch nối và nam/nu — gửi nguyên văn như app tuvi.work
      if (/^ls:[0-9-]+-(nam|nu)$/.test(c.chartKey)) await this._call('DELETE', '/charts/' + c.chartKey);
      setList((l) => l.filter((x) => x.id !== c.id));
    }
    // 2) Đẩy lá số mới/sửa — máy chủ tính chartKey, can chi, mệnh
    for (const c of this.store.get('laSo').filter((x) => x.dirty && !x.deleted && this._mine(x))) {
      const d = await this._call('PUT', '/charts', { ten: c.ten || undefined, lich: c.lich, ngay: c.ngay, thang: c.thang, nam: c.nam, gio: c.gio, gioi_tinh: c.gioi_tinh });
      const s = d.chart;
      setList((l) => {
        const cur = l.find((x) => x.id === c.id);
        if (!cur) return l;
        const merged = { ...cur, chartKey: s.chartKey, can_chi: s.can_chi || '', menh: s.menh || '', dirty: cur.updatedAt > c.updatedAt, owner: null };
        // Hai mục cùng chartKey (cùng ngày giờ sinh) → giữ một
        return [merged, ...l.filter((x) => x.id !== c.id && x.chartKey !== s.chartKey)].sort((a, b) => b.updatedAt - a.updatedAt);
      });
    }
    // 3) Kéo thay đổi từ máy chủ theo cursor
    let cursor = this.store.get('account').cursor || 0;
    for (let page = 0; page < PULL_LIMIT; page++) {
      const d = await this._call('GET', '/charts/sync?cursor=' + cursor);
      setList((l) => mergeRemote(l, d.charts || []));
      cursor = d.cursor ?? cursor;
      this._patch({ cursor });
      if (!d.hasMore) break;
    }
  }

  _notify() { this.store.emit('change', 'account', this.store.get('account')); }
}

/** Gộp thay đổi từ máy chủ vào sổ cục bộ (theo chartKey); mục đang chờ đẩy lên được giữ nguyên */
function mergeRemote(list, remote) {
  let out = [...list];
  for (const s of remote) {
    const i = out.findIndex((x) => x.chartKey === s.chartKey);
    const local = i >= 0 ? out[i] : null;
    if (local?.dirty) continue;
    if (s.deleted) { if (i >= 0) out.splice(i, 1); continue; }
    const item = {
      id: local?.id || newId(), chartKey: s.chartKey, ten: s.ten || '', lich: s.lich === 'am' ? 'am' : 'duong',
      ngay: s.ngay, thang: s.thang, nam: s.nam, gio: s.gio, gioi_tinh: s.gioi_tinh, can_chi: s.can_chi || '', menh: s.menh || '',
      updatedAt: Date.parse(s.updatedAt) || Date.now(), dirty: false, deleted: false,
    };
    if (i >= 0) out[i] = item; else out.push(item);
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

const pickUser = (u) => (u ? { id: u.id, name: String(u.name || ''), email: String(u.email || ''), avatar: u.avatar || null } : null);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function page(res, status, title, msg) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'close', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" });
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Vân Quẻ</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4ecd9;color:#241c12;font:16px/1.6 'Be Vietnam Pro','Segoe UI',system-ui,sans-serif;text-align:center">
<div style="max-width:440px;padding:24px"><div style="display:inline-grid;place-items:center;width:64px;height:64px;border-radius:14px;background:#b23a2a;color:#fff8ec;font-weight:800;line-height:1.05;transform:rotate(-6deg)">VÂN<br>QUẺ</div>
<h1 style="font-size:26px;margin:22px 0 8px">${title}</h1><p style="color:#5c4d38;margin:0">${msg}</p></div></body>`);
}

module.exports = { Account, mergeRemote, cleanChart };
