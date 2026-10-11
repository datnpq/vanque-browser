// Vân Quẻ · giao thức nội bộ vanque://app/ — trang tĩnh trong src/pages + API JSON cho các trang quản lý
const { protocol, net, app, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { SEARCH_ENGINES, fold } = require('./store');

const SCHEME = 'vanque';
const ORIGIN = 'vanque://app';
const ROOT = path.join(__dirname, '..');
const DIRS = { pages: path.join(ROOT, 'pages'), fonts: path.join(ROOT, 'fonts') };

const CSP = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: http:", "font-src 'self'", "connect-src 'self'", "object-src 'none'",
  "base-uri 'none'", "frame-ancestors 'self'",
].join('; ');

function registerPrivileged() {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  ]);
}

/** Ánh xạ đường dẫn URL → tệp trong thư mục cho phép; trả null nếu vượt rào (../, tuyệt đối, ký tự lạ) */
function resolveFile(pathname) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'start.html';
  let base = DIRS.pages;
  if (rel.startsWith('fonts/')) { base = DIRS.fonts; rel = rel.slice(6); }
  const file = path.resolve(base, rel);
  const r = path.relative(base, file);
  if (!r || r.startsWith('..') || path.isAbsolute(r) || r.includes('\0')) return null;
  return file;
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' },
});

function install({ store, downloads, account }) {
  protocol.handle(SCHEME, async (req) => {
    const u = new URL(req.url);
    if (u.host !== 'app') return new Response('Không tồn tại', { status: 404 });
    if (u.pathname.startsWith('/api/')) {
      // Chỉ chính các trang vanque://app mới được gọi API (chặn trang web bên ngoài).
      // Chromium không gửi Origin cho fetch cùng nguồn trên giao thức tự định nghĩa, nên lệnh ghi phải mang header X-VQ:
      // trang web lạ muốn gửi header này sẽ bị buộc qua preflight CORS (không bao giờ được chấp thuận) và luôn kèm Origin.
      const origin = req.headers.get('origin');
      if (origin && origin !== ORIGIN) return json({ error: 'Cấm' }, 403);
      if (req.method !== 'GET' && origin !== ORIGIN && req.headers.get('x-vq') !== '1') return json({ error: 'Cấm' }, 403);
      try {
        const body = req.method === 'POST' ? await req.json() : null;
        return json(await api(u.pathname.slice(5), u.searchParams, body, { store, downloads, account }));
      } catch (e) {
        return json({ error: e.message }, e.status || 400);
      }
    }
    const file = resolveFile(u.pathname);
    if (!file) return new Response('Cấm', { status: 403 });
    const res = await net.fetch(pathToFileURL(file).toString()).catch(() => null);
    if (!res || !res.ok) return new Response(notFoundPage(u.pathname), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
    const headers = new Headers(res.headers);
    if (file.endsWith('.html')) { headers.set('content-security-policy', CSP); headers.set('content-type', 'text/html; charset=utf-8'); }
    headers.set('x-content-type-options', 'nosniff');
    return new Response(res.body, { status: 200, headers });
  });
}

function notFoundPage(p) {
  const esc = String(p).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<!doctype html><meta charset="utf-8"><title>Không có trang</title><link rel="stylesheet" href="/vq.css">
<body style="display:grid;place-content:center;min-height:100vh;text-align:center"><div style="font-size:64px;color:var(--vq-gold)">☶</div>
<h1>Quẻ Thuần Cấn — dừng lại</h1><p class="muted">Không có trang nội bộ <b>${esc}</b>.</p><p><a href="/start.html">Về Thiên Môn</a></p></body>`;
}

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const isUrl = (s) => typeof s === 'string' && /^(https?|vanque|file):\/\//i.test(s) && s.length < 4096;

async function api(route, q, body, { store, downloads, account }) {
  switch (route) {
    case 'account': {
      if (body) {
        const act = body.action;
        if (act === 'login') { account.login().catch(() => {}); return account.state(); } // chờ người dùng ở trình duyệt; kết quả báo qua store-changed
        if (act === 'cancel') { account.cancelLogin(); return account.state(); }
        if (act === 'logout') return account.logout({ keep: body.keep !== false });
        if (act === 'sync') { await account.sync().catch(() => {}); return account.state(); }
        if (act === 'refresh') { await account.refreshUser().catch(() => {}); return account.state(); }
        throw bad('Thao tác không hợp lệ');
      }
      return account.state();
    }

    case 'laso': {
      if (body) {
        if (body.action === 'save') return account.saveChart(body.chart || {});
        if (body.action === 'remove') { account.removeChart(String(body.id)); return { ok: true }; }
        throw bad('Thao tác không hợp lệ');
      }
      return account.charts();
    }

    case 'settings':
      if (body) {
        const s = { ...store.get('settings') };
        const p = body.patch || {};
        if ('searchEngine' in p) { if (!SEARCH_ENGINES[p.searchEngine]) throw bad('Máy tìm kiếm không hợp lệ'); s.searchEngine = p.searchEngine; }
        if ('theme' in p) { if (!['light', 'dark', 'system'].includes(p.theme)) throw bad('Giao diện không hợp lệ'); s.theme = p.theme; }
        for (const k of ['restoreSession', 'showBookmarksBar', 'historyEnabled', 'askDownload', 'welcomed']) if (k in p) s[k] = !!p[k];
        if ('downloadDir' in p) s.downloadDir = String(p.downloadDir || '');
        if (p.resetPermission) { const perms = { ...s.permissions }; delete perms[p.resetPermission]; s.permissions = perms; }
        if (p.resetAllPermissions) s.permissions = {};
        store.set('settings', s);
      }
      return { settings: store.get('settings'), engines: SEARCH_ENGINES, defaultDownloadDir: app.getPath('downloads') };

    case 'bookmarks': {
      let list = store.get('bookmarks');
      if (body) {
        const { action } = body;
        if (action === 'add') {
          if (!isUrl(body.url)) throw bad('Địa chỉ không hợp lệ');
          if (!list.some((b) => b.url === body.url)) list = [...list, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), url: body.url, title: String(body.title || body.url).slice(0, 300), added: Date.now() }];
        } else if (action === 'remove') list = list.filter((b) => b.id !== body.id);
        else if (action === 'update') list = list.map((b) => (b.id === body.id ? { ...b, title: String(body.title ?? b.title).slice(0, 300), url: isUrl(body.url) ? body.url : b.url } : b));
        else if (action === 'move') {
          const i = list.findIndex((b) => b.id === body.id), j = Math.max(0, Math.min(list.length - 1, i + (body.delta | 0)));
          if (i >= 0) { list = [...list]; const [x] = list.splice(i, 1); list.splice(j, 0, x); }
        } else throw bad('Thao tác không hợp lệ');
        store.set('bookmarks', list);
      }
      return list;
    }

    case 'history': {
      if (body) {
        if (body.action === 'delete') { const times = new Set(body.times || []); store.set('history', store.get('history').filter((h) => !times.has(h.time))); }
        else if (body.action === 'deleteUrl') store.set('history', store.get('history').filter((h) => h.url !== body.url));
        else if (body.action === 'clear') {
          const since = body.range === 'all' ? 0 : Date.now() - ({ hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6 }[body.range] || 0);
          store.set('history', since ? store.get('history').filter((h) => h.time < since) : []);
        } else throw bad('Thao tác không hợp lệ');
        return { ok: true };
      }
      const query = fold(q.get('q') || ''), before = +q.get('before') || Infinity, limit = Math.min(500, +q.get('limit') || 150);
      const all = store.get('history'), out = [];
      for (let i = all.length - 1; i >= 0 && out.length < limit; i--) {
        const h = all[i];
        if (h.time >= before) continue;
        if (query && !fold(h.url + ' ' + h.title).includes(query)) continue;
        out.push(h);
      }
      return { items: out, total: all.length };
    }

    case 'topsites': return store.topSites(+q.get('limit') || 8);

    case 'suggest': return store.suggest(q.get('q') || '', Math.min(10, +q.get('limit') || 6));

    case 'session':
      if (body) {
        const tabs = (Array.isArray(body.tabs) ? body.tabs : []).filter((t) => t && isUrl(t.url)).slice(0, 100)
          .map((t) => ({ url: t.url, title: String(t.title || '').slice(0, 300), pinned: !!t.pinned, muted: !!t.muted }));
        store.set('session', { tabs, active: Math.max(0, Math.min(tabs.length - 1, body.active | 0)) });
        return { ok: true };
      }
      return store.get('session');

    case 'downloads':
      if (body) { await downloads.action(body.action, body.id); return { ok: true }; }
      return downloads.list();

    case 'browsing-data': {
      if (!body) throw bad('Cần POST');
      const ses = session.defaultSession, done = [];
      if (body.cache) { await ses.clearCache(); done.push('bộ nhớ đệm'); }
      if (body.cookies) { await ses.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage', 'websql', 'filesystem'], origin: undefined }); done.push('cookie & dữ liệu trang'); }
      return { done };
    }

    case 'about':
      return { app: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node, v8: process.versions.v8, platform: `${process.platform} ${process.arch}`, userData: app.getPath('userData') };

    default: throw Object.assign(new Error('Không có API này'), { status: 404 });
  }
}

module.exports = { SCHEME, ORIGIN, registerPrivileged, install, resolveFile, api };
