// Vân Quẻ · tự kiểm thử end-to-end trên chính ứng dụng (chạy: npm run e2e  hoặc  npm run e2e -- dark)
// main.js chỉ nạp tệp này khi có biến môi trường VQ_AUTOTEST (thư mục xuất kết quả).
const { app, net } = require('electron');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = function autotest({ getWin, store, send, account }) {
  const OUT = process.env.VQ_AUTOTEST;
  const theme = process.env.VQ_THEME || 'light';
  const pages = (process.env.VQ_PAGES || 'chao,start,tuvi,tubinh,battrach,kymon,hadolacthu,kinhdich,lich,nguhanh,lichsu,taixuong,danhdau,caidat').split(',');
  const errors = [], checks = [];
  const check = (name, ok, info = '') => { checks.push({ name, ok: !!ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };

  store.set('settings', { ...store.get('settings'), theme });
  app.on('web-contents-created', (_e, wc) => {
    wc.on('console-message', (e) => {
      if (e.level === 'error') { const msg = `[${wc.getType()}] ${e.message} (${e.sourceId}:${e.lineNumber})`; errors.push(msg); console.log('  lỗi console:', msg); }
    });
  });

  app.whenReady().then(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    while (!getWin()) await sleep(100);
    const win = getWin();
    // VQ_SIZE=1920x1080: chụp ảnh đúng cỡ cho trang Microsoft Store (tối thiểu 1366×768)
    if (process.env.VQ_SIZE) { const [w, h] = process.env.VQ_SIZE.split('x').map(Number); win.unmaximize(); win.setContentSize(w, h); }
    await new Promise((r) => (win.webContents.isLoading() ? win.webContents.once('did-finish-load', r) : r()));
    await sleep(2500);
    // Di trú từ bản 1.x: dữ liệu cũ nằm trong localStorage của vỏ
    await win.webContents.executeJavaScript(`localStorage.removeItem('vq-migrated-2'); localStorage.setItem('vq-bookmarks', JSON.stringify([{ url: 'https://vi.wikipedia.org/', title: 'Wikipedia' }]))`);
    win.webContents.reload();
    await new Promise((r) => win.webContents.once('did-finish-load', r));
    await sleep(2000);
    check('Di trú đánh dấu từ bản 1.x', store.get('bookmarks').some((b) => b.url === 'https://vi.wikipedia.org/')
      && !!(await win.webContents.executeJavaScript(`localStorage.getItem('vq-migrated-2')`)));
    const shot = async (name) => fs.writeFileSync(path.join(OUT, `${name}-${theme}.png`), (await win.webContents.capturePage()).toPNG());
    await shot('shell');

    // Bảo mật giao thức nội bộ
    const st = async (u, init) => { try { return (await net.fetch(u, init)).status; } catch (e) { return 'lỗi:' + e.message; } };
    check('vanque: chặn vượt thư mục (..\)', (await st('vanque://app/..%5cmain.js')) === 403);
    check('vanque: chặn vượt thư mục (fonts/..\)', (await st('vanque://app/fonts/..%5c..%5cmain.js')) === 403);
    check('vanque: trang không có → 404', (await st('vanque://app/khong-co.html')) === 404);
    check('vanque: trang tồn tại', (await st('vanque://app/tuvi.html')) === 200);
    check('vanque: font đóng gói', (await st('vanque://app/fonts/fonts.css')) === 200);
    check('API: từ chối origin lạ', (await st('vanque://app/api/settings', { headers: { origin: 'https://evil.example' } })) === 403);
    check('API: từ chối POST thiếu header X-VQ', (await st('vanque://app/api/history', { method: 'POST', body: '{"action":"clear","range":"all"}' })) === 403);
    check('API: từ chối POST có origin lạ dù kèm X-VQ', (await st('vanque://app/api/history', { method: 'POST', headers: { origin: 'https://evil.example', 'x-vq': '1' }, body: '{"action":"clear","range":"all"}' })) === 403);

    // Lần đầu mở: trang chào + đăng nhập tuvi.work (máy chủ giả lập do test/e2e.js chạy)
    if (process.env.VQ_TUVI_BASE && !process.env.VQ_PAGES) await accountFlow(win, check, shot);

    for (const p of pages) {
      send('open-tab', { url: `vanque://app/${p}.html` });
      await sleep(p === 'start' ? 3000 : 2200);
      await shot(p);
      console.log('  đã chụp', p);
    }
    // Trang nội bộ gọi API cùng origin được
    const guests = require('electron').webContents.getAllWebContents().filter((w) => w.getType() === 'webview' && w.getURL().startsWith('vanque://'));
    const g = guests[guests.length - 1];
    if (g) {
      const r = await g.executeJavaScript(`fetch('/api/settings').then(r => r.status)`).catch((e) => 'lỗi ' + e.message);
      check('API: trang nội bộ đọc được cài đặt', r === 200, String(r));
      const w = await g.executeJavaScript(`UI.api('settings', null, { patch: { showBookmarksBar: true } }).then(() => 'ok').catch((e) => e.message)`).catch((e) => 'lỗi ' + e.message);
      check('API: trang nội bộ ghi được cài đặt (POST)', w === 'ok', String(w));
      const ua = await g.executeJavaScript('navigator.userAgent');
      check('User-Agent không lộ tên ứng dụng / Electron', !/Electron|Browser\/\d|Qu.?\S*\/\d/.test(ua), ua.slice(-80));
      const fonts = await g.executeJavaScript(`document.fonts.ready.then(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(','))`).catch(() => '');
      check('Font Phudu / Be Vietnam Pro đã nạp', /Phudu/.test(fonts) && /Be Vietnam Pro/.test(fonts), fonts.slice(0, 80));
    } else check('API: trang nội bộ đọc được cài đặt', false, 'không tìm thấy webview');

    if (!process.env.VQ_PAGES) await behaviour(win, check, shot);

    check('Không có lỗi console', errors.length === 0, errors.length ? errors.length + ' lỗi' : '');
    fs.writeFileSync(path.join(OUT, `report-${theme}.json`), JSON.stringify({ checks, errors }, null, 2));
    const failed = checks.filter((c) => !c.ok).length;
    console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra end-to-end đều đạt ✦');
    app.exit(failed ? 1 : 0);
  });

  /** Đăng nhập từ trang chào rồi lập một lá số và chờ nó lên máy chủ */
  async function accountFlow(win, check, shot) {
    const { webContents } = require('electron');
    const guestBy = (re) => webContents.getAllWebContents().filter((w) => w.getType() === 'webview').find((w) => re.test(w.getURL()));
    // Trình duyệt mặc định được thay bằng một yêu cầu HTTP đi theo chuyển hướng về cổng loopback
    account.open = (u) => fetch(u).then((r) => r.text());
    const chao = guestBy(/chao\.html/);
    check('Lần đầu mở hiện trang chào mời đăng nhập', !!chao && !store.get('settings').welcomed);
    if (!chao) return;
    await sleep(800);
    await shot('chao');
    await chao.executeJavaScript(`document.querySelector('.gbtn').click()`).catch((e) => console.log('  không bấm được nút đăng nhập:', e.message));
    for (let i = 0; i < 40 && !account.state().signedIn; i++) await sleep(150);
    const st = account.state();
    check('Đăng nhập tuvi.work qua mã một lần + PKCE', st.signedIn && st.user?.email === 'thu@tuvi.work', st.error || st.user?.email || '');
    check('Token không lộ ra trạng thái công khai, lưu dạng mã hóa', !JSON.stringify(st).includes('|') && !!store.get('auth').token && !String(store.get('auth').token).includes('|'));
    await sleep(2200); // trang chào báo thành công rồi tự vào Thiên Môn
    check('Sau đăng nhập: vào Thiên Môn, nút tài khoản hiện chữ cái đầu', /start\.html/.test(chao.getURL()) && store.get('settings').welcomed
      && (await win.webContents.executeJavaScript(`document.querySelector('#acctBtn').classList.contains('on') && document.querySelector('#acctBtn').textContent`)) === 'Đ');

    send('open-tab', { url: 'vanque://app/tuvi.html' });
    await sleep(1800);
    const tv = guestBy(/tuvi\.html/);
    if (tv) {
      await tv.executeJavaScript(`(() => { document.querySelector('#name').value = 'Thử Đồng Bộ'; document.querySelector('#d').value = 15; document.querySelector('#m').value = 8; document.querySelector('#y').value = 1988; document.querySelector('#hr').value = 4; document.querySelector('#f').requestSubmit(); })()`);
      for (let i = 0; i < 40 && !store.get('laSo').some((c) => c.chartKey && !c.dirty); i++) await sleep(150);
      const c = store.get('laSo').find((x) => x.ten === 'Thử Đồng Bộ');
      check('Lập lá số → lưu vào sổ và đồng bộ lên tuvi.work (giờ Thìn = 5)', c?.chartKey === 'ls:1988-8-15-5-nam' && !c.dirty, c ? `${c.chartKey} dirty=${c.dirty}` : 'không có');
      await sleep(400);
      check('Sổ lá số hiện trên trang Tử Vi, có dấu đã lưu trên tuvi.work', await tv.executeJavaScript(`[...document.querySelectorAll('#soList .so-item')].some((e) => /Thử Đồng Bộ/.test(e.textContent) && e.querySelector('.cloud'))`));
      await shot('tuvi-so');
    } else check('Lập lá số → lưu vào sổ và đồng bộ lên tuvi.work', false, 'không thấy trang Tử Vi');
  }

  /** Kiểm thử hành vi của vỏ trình duyệt bằng phím / chuột giả lập */
  async function behaviour(win, check, shot) {
    const { webContents } = require('electron');
    const sh = (js) => win.webContents.executeJavaScript(js);
    const key = async (keyCode, modifiers = []) => {
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
      await sleep(400);
    };
    const tabCount = () => sh(`document.querySelectorAll('#tabs .tab').length`);
    const activeGuest = () => webContents.getAllWebContents().filter((w) => w.getType() === 'webview').find((w) => w.id === activeId);
    let activeId = null;
    const refreshActive = async () => { activeId = await sh(`(() => { const v = document.querySelector('webview.active'); return v ? v.getWebContentsId() : null; })()`); };

    win.focus(); win.webContents.focus();
    const n0 = await tabCount();
    await key('T', ['control']); await sleep(800);
    check('Ctrl+T mở thẻ mới', (await tabCount()) === n0 + 1);
    await key('W', ['control']);
    check('Ctrl+W đóng thẻ', (await tabCount()) === n0);
    await key('T', ['control', 'shift']);
    check('Ctrl+Shift+T mở lại thẻ vừa đóng', (await tabCount()) === n0 + 1);

    // Gợi ý thanh địa chỉ
    await sh(`(() => { const u = document.querySelector('#url'); u.focus(); u.value = 'kinh dich'; u.dispatchEvent(new Event('input')); })()`);
    await sleep(600);
    const sugg = await sh(`[...document.querySelectorAll('#suggest .row')].map((r) => r.textContent).join(' | ')`);
    check('Omnibox gợi ý phân hệ Kinh Dịch (gõ không dấu)', /Kinh Dịch/.test(sugg), sugg.slice(0, 90));
    await sh(`document.querySelector('#url').blur()`);

    // Đánh dấu trang đang mở
    await sleep(300);
    const nb = store.get('bookmarks').length;
    await sh(`document.querySelector('#star').click()`); await sleep(500);
    check('Đánh dấu trang (☆ → ★) và lưu vào kho', store.get('bookmarks').length === nb + 1 && (await sh(`document.querySelector('#star').textContent`)) === '★');
    await sleep(800);
    check('Phiên làm việc được lưu', store.get('session').tabs.length === (await tabCount()), `${store.get('session').tabs.length} thẻ`);

    // Trang file:// xin quyền thông báo → thanh xin quyền
    const page = path.join(OUT, 'quyen.html');
    fs.writeFileSync(page, '<!doctype html><meta charset="utf-8"><title>Trang thử quyền</title><a id="a" href="#">x</a><script>setTimeout(() => Notification.requestPermission(), 300)</script>');
    send('open-tab', { url: 'file:///' + page.replace(/\\/g, '/') });
    await sleep(2200);
    check('Thanh xin quyền hiện ra', await sh(`!document.querySelector('#permbar').hidden && /thông báo/.test(document.querySelector('#permbar').textContent)`));
    await sh(`document.querySelector('#permbar .btn:not(.ghost)').click()`); await sleep(400);
    check('Cho phép + nhớ lựa chọn được lưu', store.get('settings').permissions?.['file://']?.notifications === 'allow');
    check('Lịch sử ghi nhận trang file://', store.get('history').some((h) => h.url.endsWith('quyen.html')));

    // Trang web không được tự dẫn vào trang nội bộ
    await refreshActive();
    const g = activeGuest();
    if (g) {
      await g.executeJavaScript(`location.href = 'vanque://app/caidat.html'`).catch(() => {});
      await sleep(1000);
      check('Chặn trang web điều hướng vào vanque://', g.getURL().startsWith('file:'), g.getURL());
      // Tải xuống vào thư mục thử nghiệm
      store.set('settings', { ...store.get('settings'), downloadDir: OUT });
      g.downloadURL('data:text/plain;charset=utf-8,V%C3%A2n%20Qu%E1%BA%BB');
      await sleep(2000);
      const d = store.get('downloads').at(-1);
      check('Tải xuống hoàn tất và hiện nút tải', d?.state === 'completed' && fs.existsSync(d.path) && !(await sh(`document.querySelector('#dlBtn').hidden`)), d ? d.state + ' ' + path.basename(d.path) : 'không có');
    } else check('Chặn trang web điều hướng vào vanque://', false, 'không thấy webview');

    // Đổi giao diện tối bằng phím tắt rồi đổi lại
    const before = await sh(`document.documentElement.dataset.theme`);
    await key('D', ['control', 'shift']); await sleep(400);
    const after = await sh(`document.documentElement.dataset.theme`);
    check('Ctrl+Shift+D đổi sáng/tối', before !== after, `${before} → ${after}`);
    await key('D', ['control', 'shift']);

    // Thao tác trên trang Kinh Dịch: Mai Hoa theo giờ, theo số, sổ quẻ
    send('open-tab', { url: 'vanque://app/kinhdich.html' });
    await sleep(2000); await refreshActive();
    const kd = activeGuest();
    if (kd) {
      const r1 = await kd.executeJavaScript(`document.querySelector('#mai').click(); new Promise(r => setTimeout(() => r(document.querySelectorAll('#result .card').length), 400))`);
      check('Kinh Dịch: Mai Hoa theo giờ ra quẻ', r1 >= 2, r1 + ' thẻ');
      const r2 = await kd.executeJavaScript(`(() => { const a = document.querySelector('#n1'), b = document.querySelector('#n2'); a.value = 5; b.value = 7; document.querySelector('#numf').requestSubmit(); return new Promise(r => setTimeout(() => r(document.querySelector('#result').textContent), 400)); })()`);
      // 5 → Tốn (thượng), 7 → Cấn (hạ): Phong Sơn Tiệm; hào động (5+7) mod 6 = 0 → 6
      check('Kinh Dịch: Mai Hoa theo số 5·7 = Phong Sơn Tiệm', /Phong Sơn Tiệm/.test(r2));
      const logN = await kd.executeJavaScript(`JSON.parse(localStorage.getItem('vq-que-log') || '[]').length`);
      check('Kinh Dịch: sổ quẻ ghi lại các lần gieo', logN >= 2, logN + ' mục');
    }
    await shot('behaviour');
  }
};
