// Vân Quẻ Browser — tiến trình chính (Electron)
const { app, BrowserWindow, ipcMain, session, Menu, nativeTheme, screen, shell, safeStorage, net } = require('electron');
const path = require('path');
const { Store } = require('./main/store');
const vanque = require('./main/protocol');
const guard = require('./main/guard');
const { Downloads } = require('./main/downloads');
const { Account } = require('./main/account');
const pkg = require('../package.json');

vanque.registerPrivileged();
app.setAppUserModelId('app.vanque.browser');
// Chế độ tự kiểm thử: dữ liệu riêng trong thư mục tạm để không đụng hồ sơ thật
if (process.env.VQ_AUTOTEST) app.setPath('userData', path.join(require('os').tmpdir(), `vanque-autotest-${process.pid}`));

// Một phiên bản duy nhất: mở lần hai → đưa cửa sổ cũ lên và mở các URL truyền vào
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const isMac = process.platform === 'darwin';
let win = null, store = null, downloads = null, shield = null, account = null;
const send = (ch, payload) => { if (win && !win.isDestroyed()) win.webContents.send(ch, payload); };

/** URL được truyền qua dòng lệnh (vd. "Mở bằng Vân Quẻ") */
const urlsFromArgv = (argv) => argv.slice(app.isPackaged ? 1 : 2).filter((a) => /^(https?|vanque):\/\//i.test(a) || /\.(html?|pdf|svg)$/i.test(a))
  .map((a) => (/^[a-z]+:\/\//i.test(a) ? a : 'file:///' + path.resolve(a).replace(/\\/g, '/')));

function createWindow() {
  const ws = store.get('windowState') || {};
  const visible = ws.bounds && screen.getAllDisplays().some((d) => {
    const a = d.workArea, b = ws.bounds;
    return b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y >= a.y - 10 && b.y < a.y + a.height - 60;
  });
  win = new BrowserWindow({
    ...(visible ? ws.bounds : { width: 1360, height: 880 }), minWidth: 820, minHeight: 560,
    // macOS giữ ba nút đèn giao thông gốc; Windows/Linux dùng nút tự vẽ trên thanh thẻ
    ...(isMac ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 12, y: 14 } } : { frame: false }),
    show: false, title: 'Vân Quẻ',
    backgroundColor: nativeTheme.shouldUseDarkColors && store.get('settings').theme !== 'light' ? '#14110c' : '#f4ecd9',
    icon: path.join(__dirname, 'shell', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: true, spellcheck: false },
  });
  if (visible && ws.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'shell', 'index.html'));

  const state = () => (win.isFullScreen() ? 'full' : win.isMaximized() ? 'max' : 'normal');
  for (const ev of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(ev, () => send('win-state', state()));
  const saveBounds = () => { if (!win.isDestroyed() && !win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) store.set('windowState', { bounds: win.getBounds(), maximized: false }); };
  win.on('resized', saveBounds); win.on('moved', saveBounds);
  win.on('close', () => { store.set('windowState', { bounds: win.isMaximized() || win.isFullScreen() ? (store.get('windowState').bounds || win.getNormalBounds()) : win.getBounds(), maximized: win.isMaximized() }); });
  win.on('closed', () => { win = null; });
  win.on('focus', () => send('win-focus', true));
}

app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() === 'webview') shield.guardGuest(contents);
  else if (contents.getType() === 'window') {
    // Cửa sổ popup con (OAuth…) cũng là nội dung web; cửa sổ chính là vỏ
    setImmediate(() => { if (win && contents === win.webContents) shield.hardenHost(contents); else shield.guardGuest(contents); });
  }
});

app.whenReady().then(() => {
  store = new Store(path.join(app.getPath('userData'), 'vanque-data'));
  shield = guard.create({ store, getWin: () => win, send });
  downloads = new Downloads(store, send, () => win);
  const ses = session.defaultSession;

  // Tài khoản tuvi.work: VQ_TUVI_BASE / VQ_TUVI_KEY ghi đè cấu hình "tuvi" trong package.json (dùng khi phát triển, kiểm thử)
  account = new Account({
    store, base: process.env.VQ_TUVI_BASE || pkg.tuvi.base, apiKey: process.env.VQ_TUVI_KEY || pkg.tuvi.apiKey, version: app.getVersion(),
    fetch: (u, init) => net.fetch(u, init),
    open: (u) => shell.openExternal(u),
    crypt: {
      available: () => safeStorage.isEncryptionAvailable(),
      encrypt: (t) => safeStorage.encryptString(t).toString('base64'),
      decrypt: (b) => safeStorage.decryptString(Buffer.from(b, 'base64')),
    },
    onFocus: () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } },
  });

  vanque.install({ store, downloads, account });
  shield.installPermissions(ses);
  downloads.attach(ses);

  // Ẩn "Electron" và tên ứng dụng khỏi User-Agent để trang web xử lý như Chrome thông thường
  // Mã thông báo của ứng dụng là mục duy nhất mang đúng số phiên bản Vân Quẻ (tên có thể bị mã hóa lạ, vd "VânQuẻBrowser/2.0.0")
  const appTok = new RegExp('\\s\\S+/' + app.getVersion().replace(/\./g, '\\.') + '(?=\\s|$)', 'g');
  ses.setUserAgent(ses.getUserAgent().replace(/\s?Electron\/[\d.]+/, '').replace(appTok, ''));

  // Đồng bộ thay đổi dữ liệu về vỏ (thanh đánh dấu, cài đặt, giao diện…)
  store.on('change', (key, value) => {
    if (['settings', 'bookmarks'].includes(key)) send('store-changed', { key, value });
    else if (key === 'account') send('store-changed', { key, value: account.state() }); // trạng thái công khai, không kèm token
    else if (key === 'laSo') send('store-changed', { key, value: null });
  });
  nativeTheme.on('updated', () => send('system-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));

  const ctx = { store, downloads, account };
  ipcMain.handle('api', (_e, route, query, body) => vanque.api(String(route), new URLSearchParams(query || {}), body ?? null, ctx));
  ipcMain.handle('boot', () => ({
    settings: store.get('settings'), bookmarks: store.get('bookmarks'), session: store.get('session'),
    systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light', platform: process.platform,
    openUrls: urlsFromArgv(process.argv), version: app.getVersion(), account: account.state(),
    downloads: downloads.list().filter((d) => d.state === 'progressing'),
  }));
  ipcMain.on('win', (_e, act) => {
    if (!win) return;
    if (act === 'min') win.minimize();
    else if (act === 'max') (win.isMaximized() ? win.unmaximize() : win.maximize());
    else if (act === 'close') win.close();
    else if (act === 'fullscreen') win.setFullScreen(!win.isFullScreen());
    else if (act === 'fullscreen-off' && win.isFullScreen()) win.setFullScreen(false);
    else if (act === 'fullscreen-on' && !win.isFullScreen()) win.setFullScreen(true);
  });
  ipcMain.on('permission-reply', (_e, r) => shield.replyPermission(r || {}));
  ipcMain.handle('download-action', (_e, act, id) => downloads.action(act, id));

  // macOS cần menu ứng dụng để Cmd+C/V/X/A/Z hoạt động trong ô nhập; không gán phím trùng bản đồ phím tắt (Cmd+H, Cmd+M, Cmd+W…)
  Menu.setApplicationMenu(isMac ? Menu.buildFromTemplate([
    { label: app.name, submenu: [{ role: 'about', label: 'Giới thiệu Vân Quẻ' }, { type: 'separator' }, { role: 'hideOthers', label: 'Ẩn ứng dụng khác' }, { role: 'unhide', label: 'Hiện tất cả' }, { type: 'separator' }, { role: 'quit', label: 'Thoát Vân Quẻ' }] },
    { label: 'Sửa', submenu: [{ role: 'undo', label: 'Hoàn tác' }, { role: 'redo', label: 'Làm lại' }, { type: 'separator' }, { role: 'cut', label: 'Cắt' }, { role: 'copy', label: 'Sao chép' }, { role: 'paste', label: 'Dán' }, { role: 'pasteAndMatchStyle', label: 'Dán giữ kiểu' }, { role: 'selectAll', label: 'Chọn tất cả' }] },
  ]) : null);
  if (process.env.VQ_AUTOTEST) require('../test/autotest.js')({ getWin: () => win, store, send, account });
  createWindow();
  account.startAuto();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('second-instance', (_e, argv) => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
  for (const url of urlsFromArgv(argv)) send('open-tab', { url });
});

app.on('before-quit', () => store?.flush());
app.on('window-all-closed', () => { store?.flush(); if (process.platform !== 'darwin') app.quit(); });
