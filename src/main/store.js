// Vân Quẻ · kho dữ liệu bền vững (JSON trong thư mục userData, ghi nguyên tử, gộp lần ghi)
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const SEARCH_ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  coccoc: { name: 'Cốc Cốc', url: 'https://coccoc.com/search?query=%s' },
  brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
};

const DEFAULTS = {
  settings: {
    searchEngine: 'google', theme: 'system', restoreSession: true, showBookmarksBar: true,
    historyEnabled: true, askDownload: false, downloadDir: '', permissions: {}, welcomed: false,
  },
  bookmarks: [],
  history: [],
  session: { tabs: [], active: 0 },
  downloads: [],
  windowState: {},
  account: {},   // người dùng tuvi.work, mốc đồng bộ (không có token)
  auth: {},      // token đã mã hóa bằng safeStorage — không bao giờ gửi ra vỏ/trang
  laSo: [],      // sổ lá số, đồng bộ với tuvi.work khi đăng nhập
};
const LIMITS = { history: 20000, downloads: 300, laSo: 500 };

class Store extends EventEmitter {
  constructor(dir) {
    super();
    this.dir = dir;
    this.data = {};
    this.timers = {};
    fs.mkdirSync(dir, { recursive: true });
    for (const key of Object.keys(DEFAULTS)) this.data[key] = this._load(key);
    this.data.settings = { ...DEFAULTS.settings, ...this.data.settings };
  }
  _file(key) { return path.join(this.dir, `${key}.json`); }
  _load(key) {
    try {
      const v = JSON.parse(fs.readFileSync(this._file(key), 'utf8'));
      if (Array.isArray(DEFAULTS[key]) !== Array.isArray(v)) throw new Error('sai kiểu');
      return v;
    } catch (e) {
      return structuredClone(DEFAULTS[key]);
    }
  }
  get(key) { return this.data[key]; }
  set(key, value) {
    if (!(key in DEFAULTS)) throw new Error('Khóa không hợp lệ: ' + key);
    if (Array.isArray(value) && LIMITS[key] && value.length > LIMITS[key]) value = value.slice(-LIMITS[key]);
    this.data[key] = value;
    this._schedule(key);
    this.emit('change', key, value);
  }
  update(key, fn) { this.set(key, fn(this.data[key])); }
  _schedule(key) {
    clearTimeout(this.timers[key]);
    this.timers[key] = setTimeout(() => this._write(key), 400);
  }
  _write(key) {
    delete this.timers[key];
    const file = this._file(key), tmp = file + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(this.data[key]));
      fs.renameSync(tmp, file);
    } catch (e) {
      console.error('[store] không ghi được', key, e.message);
    }
  }
  /** Ghi ngay mọi thay đổi đang chờ (gọi khi thoát ứng dụng) */
  flush() { for (const key of Object.keys(this.timers)) { clearTimeout(this.timers[key]); this._write(key); } }

  // ───────── Lịch sử ─────────
  addHistory(url, title = '') {
    if (!this.data.settings.historyEnabled) return;
    const list = this.data.history, last = list[list.length - 1], now = Date.now();
    if (last && last.url === url && now - last.time < 30 * 60 * 1000) { last.time = now; if (title) last.title = title; this.set('history', list); return; }
    list.push({ url, title, time: now });
    this.set('history', list);
  }
  setHistoryTitle(url, title) {
    const list = this.data.history;
    for (let i = list.length - 1; i >= Math.max(0, list.length - 20); i--) {
      if (list[i].url === url) { if (list[i].title !== title) { list[i].title = title; this.set('history', list); } return; }
    }
  }
  /** Gợi ý cho thanh địa chỉ: gộp theo URL, xếp theo số lần ghé + độ mới */
  suggest(query, limit = 6) {
    const q = fold(query);
    if (!q) return [];
    const map = new Map();
    for (const h of this.data.history) {
      if (!fold(h.url + ' ' + h.title).includes(q)) continue;
      const e = map.get(h.url) || { url: h.url, title: h.title, visits: 0, time: 0 };
      e.visits++; if (h.time >= e.time) { e.time = h.time; if (h.title) e.title = h.title; }
      map.set(h.url, e);
    }
    const now = Date.now();
    const score = (e) => e.visits * 2 + Math.max(0, 30 - (now - e.time) / 864e5) + (stripScheme(e.url).startsWith(q) ? 50 : 0);
    return [...map.values()].sort((a, b) => score(b) - score(a)).slice(0, limit);
  }
  /** Trang ghé nhiều nhất (cho Thiên Môn) */
  topSites(limit = 8) {
    const map = new Map();
    for (const h of this.data.history) {
      const e = map.get(h.url) || { url: h.url, title: h.title, visits: 0 };
      e.visits++; if (h.title) e.title = h.title; map.set(h.url, e);
    }
    return [...map.values()].sort((a, b) => b.visits - a.visits).slice(0, limit);
  }
}

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const stripScheme = (u) => fold(u).replace(/^https?:\/\/(www\.)?/, '');

module.exports = { Store, SEARCH_ENGINES, DEFAULTS, fold };
