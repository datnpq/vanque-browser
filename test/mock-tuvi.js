// Máy chủ tuvi.work giả lập cho kiểm thử: đăng nhập Vân Quẻ (mã một lần + PKCE) và đồng bộ lá số.
// Mô phỏng hợp đồng /api/v1 của tuvi.work (phong bì {data}, lỗi {message, code}), tự động "Cho phép" ở trang xin phép.
const http = require('http');
const crypto = require('crypto');

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function startMockTuvi({ apiKey = 'khoa-thu', deny = false, port = 0 } = {}) {
  const codes = new Map(), tokens = new Map(), charts = new Map();
  let version = 0;
  const user = { id: 7, name: 'Đạo Hữu Thử', email: 'thu@tuvi.work', avatar: null, credits: 0 };
  const log = [];

  const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private' }); res.end(JSON.stringify(body)); };
  const err = (res, status, code, message) => send(res, status, { message, code });
  const ser = (c) => ({ id: c.id, chartKey: c.chartKey, ten: c.ten, lich: c.lich, ngay: c.ngay, thang: c.thang, nam: c.nam, gio: c.gio, gioi_tinh: c.gioi_tinh,
    can_chi: c.can_chi, menh: c.menh, version: c.version, deleted: c.deleted, updatedAt: new Date(c.updatedAt).toISOString() });
  const readBody = (req) => new Promise((r) => { let s = ''; req.on('data', (d) => (s += d)); req.on('end', () => { try { r(JSON.parse(s || '{}')); } catch { r(null); } }); });

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    log.push(`${req.method} ${u.pathname}`);
    if (req.method === 'GET' && u.pathname === '/dang-nhap/vanque') {
      const cong = +u.searchParams.get('cong'), state = u.searchParams.get('state'), thach = u.searchParams.get('thach');
      if (!(cong >= 1024 && cong <= 65535) || !/^[A-Za-z0-9_-]{16,128}$/.test(state || '') || !/^[A-Za-z0-9_-]{43}$/.test(thach || '')) { res.writeHead(400).end('sai tham số'); return; }
      if (deny) { res.writeHead(302, { Location: `http://127.0.0.1:${cong}/xong?loi=tu_choi&state=${state}` }).end(); return; }
      const ma = crypto.randomBytes(32).toString('hex');
      codes.set(ma, { thach, exp: Date.now() + 120000 });
      res.writeHead(302, { Location: `http://127.0.0.1:${cong}/xong?` + new URLSearchParams({ ma, state }) }).end();
      return;
    }
    if (!u.pathname.startsWith('/api/v1/')) { res.writeHead(404).end(); return; }
    if (req.headers['x-tuvi-key'] !== apiKey) return err(res, 401, 'invalid_api_key', 'Khóa API không hợp lệ.');
    const path = u.pathname.slice(7);

    if (req.method === 'POST' && path === '/auth/vanque') {
      const b = await readBody(req);
      const entry = codes.get(b?.ma); codes.delete(b?.ma);
      const ok = entry && entry.exp > Date.now() && b8(b.verifier) === entry.thach;
      if (!ok) return err(res, 401, 'ma_khong_hop_le', 'Mã đăng nhập không hợp lệ hoặc đã hết hạn.');
      const token = `${tokens.size + 1}|` + crypto.randomBytes(20).toString('hex');
      tokens.set(token, user.id);
      return send(res, 200, { data: { token, user } });
    }
    const bearer = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!tokens.has(bearer)) return err(res, 401, 'unauthenticated', 'Chưa đăng nhập.');

    if (req.method === 'POST' && path === '/auth/dang-xuat') { tokens.delete(bearer); return send(res, 200, { data: { ok: true } }); }
    if (req.method === 'GET' && path === '/tai-khoan') return send(res, 200, { data: { ...user, laSo: [...charts.values()].filter((c) => !c.deleted).map(ser) } });
    if (req.method === 'GET' && path === '/charts/sync') {
      const cursor = +u.searchParams.get('cursor') || 0;
      const list = [...charts.values()].filter((c) => c.version > cursor).sort((a, b) => a.version - b.version);
      const page = list.slice(0, 200);
      return send(res, 200, { data: { charts: page.map(ser), cursor: page.length ? page.at(-1).version : cursor, hasMore: list.length > 200 } });
    }
    if (req.method === 'PUT' && path === '/charts') {
      const b = await readBody(req);
      if (!b || !['duong', 'am'].includes(b.lich) || !(b.gio >= 1 && b.gio <= 12) || !['nam', 'nu'].includes(b.gioi_tinh)) return send(res, 422, { message: 'Dữ liệu không hợp lệ.', code: 'validation_failed', errors: {} });
      const chartKey = `ls:${b.nam}-${b.thang}-${b.ngay}-${b.gio}-${b.gioi_tinh}`;
      const old = charts.get(chartKey);
      const c = { id: old?.id || charts.size + 1, chartKey, ten: b.ten || null, lich: b.lich, ngay: b.ngay, thang: b.thang, nam: b.nam, gio: b.gio, gioi_tinh: b.gioi_tinh,
        can_chi: 'Canh Ngọ', menh: 'Lộ Bàng Thổ', version: ++version, deleted: false, updatedAt: Date.now() };
      charts.set(chartKey, c);
      return send(res, 200, { data: { chart: ser(c) } });
    }
    const m = path.match(/^\/charts\/(ls:[0-9-]+-(nam|nu))$/);
    if (req.method === 'DELETE' && m) {
      const c = charts.get(decodeURIComponent(m[1]));
      if (c && !c.deleted) Object.assign(c, { deleted: true, version: ++version, updatedAt: Date.now() });
      return send(res, 200, { data: { ok: true, deleted: !!c, chart: c ? ser(c) : null } });
    }
    err(res, 404, 'not_found', 'Không có.');
  });
  const b8 = (v) => b64url(crypto.createHash('sha256').update(String(v || '')).digest());

  /** Thêm lá số "từ thiết bị khác" (để thử kéo về) */
  const addRemote = (c) => { const chartKey = `ls:${c.nam}-${c.thang}-${c.ngay}-${c.gio}-${c.gioi_tinh}`; charts.set(chartKey, { id: charts.size + 1, chartKey, can_chi: '', menh: '', deleted: false, ...c, version: ++version, updatedAt: Date.now() }); return chartKey; };

  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({
    base: `http://127.0.0.1:${server.address().port}`, apiKey, server, charts, tokens, codes, log, addRemote,
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }),
  })));
}

module.exports = { startMockTuvi };

// Chạy độc lập khi phát triển: node test/mock-tuvi.js [cổng]
if (require.main === module) {
  startMockTuvi({ port: Number(process.argv[2]) || 8787 }).then((m) => console.log(`Máy chủ tuvi.work giả: ${m.base} · khóa: ${m.apiKey}`));
}
