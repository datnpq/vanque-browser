// Vân Quẻ · lá chắn cho nội dung web: cứng hóa webview, xin quyền, chặn điều hướng nguy hiểm, menu chuột phải
const { Menu, clipboard, BrowserWindow } = require('electron');
const { shortcutOf, PASSTHROUGH } = require('../shell/keys');
const { SEARCH_ENGINES } = require('./store');

const INTERNAL = 'vanque://app';
const ALWAYS_ALLOW = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock']);
const ASKABLE = new Set(['notifications', 'geolocation', 'media', 'display-capture', 'midi', 'midiSysex', 'clipboard-read',
  'idle-detection', 'storage-access', 'top-level-storage-access', 'openExternal', 'speaker-selection', 'window-management']);
const WEB_SCHEMES = /^(https?:|file:|vanque:|about:blank)/i;

const originOf = (u) => { try { const x = new URL(u); return x.protocol === 'file:' ? 'file://' : x.origin; } catch (e) { return ''; } };
const isInternal = (u) => typeof u === 'string' && u.startsWith(INTERNAL + '/');

function create({ store, getWin, send }) {
  const pending = new Map(); // id → { callback, wcId }
  let seq = 0;

  /** Quyết định quyền đã lưu cho origin (allow / deny / undefined) */
  const remembered = (origin, perm) => store.get('settings').permissions?.[origin]?.[perm];

  function installPermissions(session) {
    session.setPermissionRequestHandler((wc, permission, callback, details) => {
      const origin = originOf(details.requestingUrl || wc.getURL());
      if (origin === INTERNAL || ALWAYS_ALLOW.has(permission)) return callback(true);
      if (!ASKABLE.has(permission)) return callback(false);
      const saved = remembered(origin, permission);
      if (saved) return callback(saved === 'allow');
      const id = ++seq;
      pending.set(id, { callback, wcId: wc.id, origin, permission });
      wc.once('destroyed', () => { if (pending.has(id)) { pending.delete(id); callback(false); } });
      send('permission-request', {
        id, wcId: wc.id, origin, permission,
        mediaTypes: details.mediaTypes || [], externalURL: details.externalURL || '',
      });
    });
    session.setPermissionCheckHandler((wc, permission, requestingOrigin) => {
      const origin = originOf(requestingOrigin || wc?.getURL() || '');
      if (origin === INTERNAL || ALWAYS_ALLOW.has(permission)) return true;
      return remembered(origin, permission) === 'allow';
    });
  }

  function replyPermission({ id, allow, remember }) {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    p.callback(!!allow);
    if (remember && p.origin) store.update('settings', (s) => ({
      ...s, permissions: { ...s.permissions, [p.origin]: { ...(s.permissions[p.origin] || {}), [p.permission]: allow ? 'allow' : 'deny' } },
    }));
  }

  /** Vỏ trình duyệt: mọi <webview> đều bị ép sandbox, không preload, không Node */
  function hardenHost(contents) {
    contents.on('will-attach-webview', (e, prefs, params) => {
      delete prefs.preload;
      delete prefs.preloadURL;
      Object.assign(prefs, { nodeIntegration: false, nodeIntegrationInSubFrames: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false });
      if (params.src && !WEB_SCHEMES.test(params.src)) e.preventDefault();
    });
    contents.on('will-navigate', (e) => e.preventDefault()); // vỏ không bao giờ tự rời index.html
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  }

  /** Nội dung web trong thẻ (và cửa sổ popup con) */
  function guardGuest(contents) {
    contents.setWindowOpenHandler(({ url, disposition, features }) => {
      if (!WEB_SCHEMES.test(url) || (isInternal(url) && !isInternal(contents.getURL()))) return { action: 'deny' };
      // Popup có kích thước (đăng nhập OAuth, thanh toán…) → cửa sổ con để giữ window.opener
      if (disposition === 'new-window' && /width|height|popup/i.test(features || '')) {
        const f = Object.fromEntries((features || '').split(',').map((kv) => kv.split('=').map((s) => s.trim())));
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: Math.min(1400, +f.width || 640), height: Math.min(1000, +f.height || 720), parent: getWin() || undefined,
            autoHideMenuBar: true, backgroundColor: '#f4ecd9', title: 'Vân Quẻ',
            webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
          },
        };
      }
      send('open-tab', { url, background: disposition === 'background-tab' });
      return { action: 'deny' };
    });

    // Trang web bên ngoài không được tự dẫn vào trang nội bộ vanque://
    const blockInternal = (e, url) => { if (isInternal(url) && !isInternal(contents.getURL()) && contents.getURL() !== '') e.preventDefault(); };
    contents.on('will-navigate', (e) => blockInternal(e, e.url));
    contents.on('will-redirect', (e) => blockInternal(e, e.url));

    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      const sc = shortcutOf(input);
      if (!sc) return;
      if (!PASSTHROUGH.has(sc)) event.preventDefault();
      const host = BrowserWindow.fromWebContents(contents.hostWebContents || contents);
      if (host && host === getWin()) send('shortcut', sc);
    });

    // Lịch sử duyệt web (chỉ ghi http/https/file)
    const recordable = (u) => /^(https?|file):/i.test(u);
    contents.on('did-navigate', (_e, url, code) => { if (recordable(url) && code < 400) store.addHistory(url, contents.getTitle()); });
    contents.on('did-navigate-in-page', (_e, url, isMain) => { if (isMain && recordable(url)) store.addHistory(url, contents.getTitle()); });
    contents.on('page-title-updated', (_e, title) => { const url = contents.getURL(); if (recordable(url)) store.setHistoryTitle(url, title); });

    contents.on('context-menu', (_e, p) => contextMenu(contents, p));
  }

  function contextMenu(contents, p) {
    const engine = SEARCH_ENGINES[store.get('settings').searchEngine] || SEARCH_ENGINES.google;
    const openTab = (url, background = true) => send('open-tab', { url, background });
    const nav = contents.navigationHistory;
    const items = [];
    const sep = () => { if (items.length && items[items.length - 1].type !== 'separator') items.push({ type: 'separator' }); };

    if (p.misspelledWord) {
      (p.dictionarySuggestions || []).slice(0, 5).forEach((w) => items.push({ label: w, click: () => contents.replaceMisspelling(w) }));
      if (!p.dictionarySuggestions?.length) items.push({ label: 'Không có gợi ý chính tả', enabled: false });
      items.push({ label: 'Thêm vào từ điển', click: () => contents.session.addWordToSpellCheckerDictionary(p.misspelledWord) });
      sep();
    }
    if (p.linkURL) {
      items.push(
        { label: 'Mở liên kết trong thẻ mới', click: () => openTab(p.linkURL) },
        { label: 'Lưu liên kết thành…', click: () => contents.downloadURL(p.linkURL) },
        { label: 'Sao chép địa chỉ liên kết', click: () => clipboard.writeText(p.linkURL) });
      sep();
    }
    if (p.mediaType === 'image' && p.srcURL) {
      items.push(
        { label: 'Mở ảnh trong thẻ mới', click: () => openTab(p.srcURL) },
        { label: 'Lưu ảnh thành…', click: () => contents.downloadURL(p.srcURL) },
        { label: 'Sao chép ảnh', click: () => contents.copyImageAt(p.x, p.y) },
        { label: 'Sao chép địa chỉ ảnh', click: () => clipboard.writeText(p.srcURL) });
      sep();
    }
    if ((p.mediaType === 'video' || p.mediaType === 'audio') && p.srcURL && !p.srcURL.startsWith('blob:')) {
      items.push({ label: 'Lưu tệp đa phương tiện…', click: () => contents.downloadURL(p.srcURL) }, { label: 'Mở trong thẻ mới', click: () => openTab(p.srcURL) });
      sep();
    }
    if (p.isEditable) {
      items.push({ label: 'Hoàn tác', role: 'undo', enabled: p.editFlags.canUndo }, { label: 'Làm lại', role: 'redo', enabled: p.editFlags.canRedo }, { type: 'separator' },
        { label: 'Cắt', role: 'cut', enabled: p.editFlags.canCut }, { label: 'Sao chép', role: 'copy', enabled: p.editFlags.canCopy },
        { label: 'Dán', role: 'paste', enabled: p.editFlags.canPaste }, { label: 'Dán dạng văn bản thuần', role: 'pasteAndMatchStyle', enabled: p.editFlags.canPaste },
        { label: 'Chọn tất cả', role: 'selectAll' });
      sep();
    } else if (p.selectionText) {
      const t = p.selectionText.trim().replace(/\s+/g, ' ');
      items.push({ label: 'Sao chép', role: 'copy' },
        { label: `Tìm “${t.length > 26 ? t.slice(0, 26) + '…' : t}” trên ${engine.name}`, click: () => openTab(engine.url.replace('%s', encodeURIComponent(t)), false) });
      sep();
    }
    if (!p.linkURL && !p.selectionText && !p.isEditable && p.mediaType === 'none') {
      items.push(
        { label: 'Quay lại', enabled: nav.canGoBack(), click: () => nav.goBack() },
        { label: 'Tiến tới', enabled: nav.canGoForward(), click: () => nav.goForward() },
        { label: 'Tải lại', click: () => contents.reload() },
        { type: 'separator' },
        { label: 'Lưu trang thành…', enabled: /^https?:/.test(contents.getURL()), click: () => contents.downloadURL(contents.getURL()) },
        { label: 'In…', click: () => contents.print() });
      sep();
    }
    items.push({ label: 'Kiểm tra phần tử', click: () => contents.inspectElement(p.x, p.y) });
    const win = BrowserWindow.fromWebContents(contents.hostWebContents || contents) || getWin();
    Menu.buildFromTemplate(items).popup({ window: win });
  }

  return { installPermissions, replyPermission, hardenHost, guardGuest, pendingCount: () => pending.size };
}

module.exports = { create, originOf, isInternal };
