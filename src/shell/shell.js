/* Vân Quẻ Browser — vỏ trình duyệt: thẻ, thanh địa chỉ, Bát Quẻ Môn, xin quyền, tải xuống, thiên thời */
(async () => {
  const $ = (s) => document.querySelector(s);
  const vq = window.vq;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

  const INTERNAL = 'vanque://app/';
  const HOME = INTERNAL + 'start.html';
  // [khóa, ký hiệu, tên, mô tả, hiện trên thanh Bát Quẻ Môn]
  const MODULES = [
    ['start', '☯', 'Thiên Môn', 'Trang khởi đầu', 0],
    ['tuvi', '☰', 'Tử Vi', 'Lá số Tử Vi Đẩu Số', 1], ['tubinh', '☷', 'Tử Bình', 'Tứ trụ bát tự', 1],
    ['battrach', '☶', 'Bát Trạch', 'Bát Trạch Minh Cảnh', 1], ['kymon', '☵', 'Kỳ Môn', 'Kỳ Môn Độn Giáp', 1],
    ['hadolacthu', '☲', 'Hà Đồ Lạc Thư', 'Số trời, phi tinh', 1], ['kinhdich', '☳', 'Kinh Dịch', 'Gieo quẻ, 64 quẻ', 1],
    ['lich', '☴', 'Vạn Niên Lịch', 'Âm lịch, hoàng đạo, 12 trực', 1], ['nguhanh', '☱', 'Ngũ Hành', 'Sinh khắc, nạp âm', 1],
    ['lichsu', '⌛', 'Lịch sử', 'Các trang đã xem', 0], ['taixuong', '⤓', 'Tải xuống', 'Tệp đã tải', 0],
    ['danhdau', '★', 'Đánh dấu', 'Quản lý đánh dấu', 0], ['caidat', '⚙', 'Cài đặt', 'Tùy chỉnh trình duyệt', 0],
    ['chao', '☁', 'Chào mừng', 'Đăng nhập tài khoản tuvi.work', 0],
  ];
  const MOD = Object.fromEntries(MODULES.map((m) => [m[0], m]));
  const ALIAS = { home: 'start', thienmon: 'start', 'tu-vi': 'tuvi', tutru: 'tubinh', batu: 'tubinh', bazi: 'tubinh', phongthuy: 'battrach',
    kmdg: 'kymon', hado: 'hadolacthu', lacthu: 'hadolacthu', dich: 'kinhdich', gieoque: 'kinhdich', lichvan: 'lich', amlich: 'lich',
    history: 'lichsu', downloads: 'taixuong', bookmarks: 'danhdau', settings: 'caidat', about: 'caidat', gioithieu: 'caidat', taikhoan: 'caidat', dangnhap: 'chao' };
  const PERM_TEXT = {
    notifications: ['🔔', 'muốn gửi thông báo'], geolocation: ['⌖', 'muốn biết vị trí của bạn'],
    'display-capture': ['🖵', 'muốn chia sẻ màn hình'], midi: ['♫', 'muốn dùng thiết bị MIDI'], midiSysex: ['♫', 'muốn điều khiển thiết bị MIDI'],
    'clipboard-read': ['📋', 'muốn đọc bộ nhớ tạm'], 'idle-detection': ['⏾', 'muốn biết khi bạn rời máy'],
    'storage-access': ['⛁', 'muốn dùng cookie trên trang khác'], 'top-level-storage-access': ['⛁', 'muốn dùng cookie trên trang khác'],
    openExternal: ['↗', 'muốn mở ứng dụng bên ngoài'], 'speaker-selection': ['🔈', 'muốn chọn loa'], 'window-management': ['▣', 'muốn quản lý cửa sổ'],
  };

  // ───────── Khởi động: nạp dữ liệu từ tiến trình chính ─────────
  const boot = await vq.boot();
  let settings = boot.settings, bookmarks = boot.bookmarks, systemTheme = boot.systemTheme, account = boot.account || {};
  let engines = {};
  vq.api('settings').then((r) => { engines = r.engines; });
  const searchUrl = (q) => ((engines[settings.searchEngine] || { url: 'https://www.google.com/search?q=%s' }).url).replace('%s', encodeURIComponent(q));
  const engineName = () => (engines[settings.searchEngine] || { name: 'Google' }).name;

  let tabs = [], active = null, seq = 0;
  const closed = []; // ngăn xếp thẻ vừa đóng

  // ───────── Địa chỉ ─────────
  const internalKey = (url) => { const m = /^vanque:\/\/app\/([\w-]+)\.html/.exec(url || ''); return m ? m[1] : null; };
  const isInternal = (url) => String(url || '').startsWith(INTERNAL);
  function resolve(text) {
    const t = text.trim(); if (!t) return HOME;
    const vqm = /^vq:\/*([\w-]*)(.*)$/i.exec(t);
    if (vqm) { const k = ALIAS[vqm[1].toLowerCase()] || vqm[1].toLowerCase() || 'start'; return `${INTERNAL}${k}.html${vqm[2] || ''}`; }
    if (/^(https?|file|vanque):\/\//i.test(t)) return t;
    if (/^about:blank$/i.test(t)) return t;
    if (/^[a-z]:[\\/]/i.test(t)) return 'file:///' + t.replace(/\\/g, '/');
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?(\/.*)?$/i.test(t)) return 'http://' + t;
    if (/^[^\s/]+\.[a-z¡-￿]{2,}(:\d+)?([/?#]\S*)?$/i.test(t)) return 'https://' + t;
    const k = ALIAS[fold(t).replace(/\s+/g, '')] || (MOD[fold(t).replace(/\s+/g, '')] ? fold(t).replace(/\s+/g, '') : null);
    if (k) return `${INTERNAL}${k}.html`;
    return searchUrl(t);
  }
  const display = (url) => { const k = internalKey(url); if (k) return k === 'start' ? '' : 'vq:' + k + url.replace(/^vanque:\/\/app\/[\w-]+\.html/, ''); return url || ''; };
  const hostOf = (url) => { try { return new URL(url).host; } catch (e) { return ''; } };

  // ───────── Thẻ ─────────
  function createTab(url = HOME, { background = false, pinned = false, muted = false, title = '', lazy = false, index = null } = {}) {
    const tab = { id: ++seq, wv: null, el: null, url, title: title || '', favicon: null, pinned, muted, audible: false, zoom: 0, loading: false, crashed: false, wcId: null, perms: [] };
    const e = el('div', 'tab' + (pinned ? ' pinned' : ''));
    e.setAttribute('role', 'tab');
    e.innerHTML = '<span class="loader"><i></i><i></i><i></i></span><span class="fav">☯</span><span class="title"></span><button class="audio" title="Tắt / bật tiếng thẻ (Ctrl+M)">🔊</button><button class="close" title="Đóng thẻ (Ctrl+W)">✕</button>';
    tab.el = e;
    e.addEventListener('mousedown', (ev) => {
      if (ev.button === 1) { ev.preventDefault(); closeTab(tab); return; }
      if (ev.button === 0 && !ev.target.closest('button')) { activate(tab); startDrag(tab, ev); }
    });
    e.addEventListener('auxclick', (ev) => ev.button === 1 && ev.preventDefault());
    e.addEventListener('contextmenu', (ev) => { ev.preventDefault(); openTabMenu(tab, ev.clientX, ev.clientY); });
    e.querySelector('.close').addEventListener('click', (ev) => { ev.stopPropagation(); closeTab(tab); });
    e.querySelector('.audio').addEventListener('click', (ev) => { ev.stopPropagation(); toggleMute(tab); });
    e.addEventListener('dblclick', (ev) => { if (!ev.target.closest('button')) togglePin(tab); });

    // Thẻ ghim luôn nằm bên trái
    let i = index ?? tabs.length;
    const firstUnpinned = tabs.findIndex((t) => !t.pinned);
    if (pinned) i = Math.min(i, firstUnpinned < 0 ? tabs.length : firstUnpinned);
    else if (firstUnpinned >= 0) i = Math.max(i, firstUnpinned); else i = Math.max(i, tabs.length);
    tabs.splice(i, 0, tab);
    syncTabDom();
    if (!lazy || !background) ensureView(tab);
    else tab.el.classList.add('unloaded');
    if (!background || !active) activate(tab);
    paintTab(tab); saveSession();
    return tab;
  }

  function syncTabDom() {
    const strip = $('#tabs');
    tabs.forEach((t, i) => { if (strip.children[i] !== t.el) strip.insertBefore(t.el, strip.children[i] || null); });
  }

  /** Tạo webview khi thẻ thật sự cần (thẻ khôi phục ở nền sẽ không tải cho tới khi được mở) */
  function ensureView(tab) {
    if (tab.wv) return tab.wv;
    const wv = document.createElement('webview');
    wv.setAttribute('allowpopups', '');
    wv.setAttribute('src', tab.url);
    tab.wv = wv;
    tab.el.classList.remove('unloaded');
    bindWebview(tab);
    $('#views').append(wv);
    if (tab === active) wv.classList.add('active');
    return wv;
  }

  function bindWebview(tab) {
    const wv = tab.wv;
    wv.addEventListener('did-attach', () => { try { tab.wcId = wv.getWebContentsId(); } catch (e) {} if (tab.muted) wv.setAudioMuted(true); });
    wv.addEventListener('dom-ready', () => {
      try { tab.wcId = wv.getWebContentsId(); } catch (e) {}
      if (isInternal(wv.getURL())) pushThemeTo(tab);
      if (tab.zoom) wv.setZoomLevel(tab.zoom);
      wv.setAudioMuted(!!tab.muted);
      hideSplash();
    });
    wv.addEventListener('did-start-loading', () => { tab.loading = true; tab.crashed = false; tab.el.classList.add('loading'); tab.el.classList.remove('crashed'); tab.crashEl?.remove(); if (tab === active) syncNav(); });
    wv.addEventListener('did-stop-loading', () => { tab.loading = false; tab.el.classList.remove('loading'); if (tab === active) syncNav(); });
    wv.addEventListener('page-title-updated', (e) => { tab.title = e.title; paintTab(tab); saveSession(); });
    wv.addEventListener('page-favicon-updated', (e) => { tab.favicon = e.favicons?.find((f) => /^(https?|data):/.test(f)) || null; paintTab(tab); });
    const onNav = (e) => {
      if (tab.url !== e.url && hostOf(tab.url) !== hostOf(e.url)) { tab.favicon = null; dropPerms(tab); }
      tab.url = e.url;
      if (isInternal(e.url)) tab.favicon = null;
      paintTab(tab); if (tab === active) syncNav(); saveSession();
    };
    wv.addEventListener('did-navigate', onNav);
    wv.addEventListener('did-navigate-in-page', (e) => { if (e.isMainFrame) onNav(e); });
    wv.addEventListener('update-target-url', (e) => { if (tab === active) $('#hover').textContent = display(e.url) || e.url; });
    wv.addEventListener('found-in-page', (e) => {
      if (tab !== active || !e.result.finalUpdate) return;
      $('#findn').textContent = `${e.result.activeMatchOrdinal || 0}/${e.result.matches || 0}`;
      $('#findbar').classList.toggle('none', !e.result.matches && !!$('#findq').value);
    });
    wv.addEventListener('did-fail-load', (e) => {
      if (e.errorCode === -3 || !e.isMainFrame) return; // -3: người dùng hủy
      const html = failPage(e.validatedURL, `${e.errorDescription || 'Lỗi mạng'} (${e.errorCode})`);
      wv.executeJavaScript(`document.open();document.write(${JSON.stringify(html)});document.close();`).catch(() => {});
    });
    wv.addEventListener('render-process-gone', (e) => {
      tab.crashed = true; tab.loading = false; tab.el.classList.add('crashed'); tab.el.classList.remove('loading', 'audible');
      if (e.details?.reason === 'clean-exit') return;
      showCrash(tab, e.details?.reason);
    });
    wv.addEventListener('media-started-playing', () => setAudible(tab, true));
    wv.addEventListener('media-paused', () => setTimeout(() => { try { setAudible(tab, wv.isCurrentlyAudible()); } catch (e) { setAudible(tab, false); } }, 400));
    wv.addEventListener('enter-html-full-screen', () => { document.body.classList.add('html-fs'); vq.win('fullscreen-on'); });
    wv.addEventListener('leave-html-full-screen', () => { document.body.classList.remove('html-fs'); vq.win('fullscreen-off'); });
    wv.addEventListener('focus', () => { hidePops(); });
  }

  function failPage(url, msg) {
    const dark = document.documentElement.dataset.theme === 'dark';
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Không tới được — ${esc(hostOf(url) || url)}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-content:center;text-align:center;padding:24px;background:${dark ? '#14110c' : '#f4ecd9'};color:${dark ? '#efe4c6' : '#241c12'};font-family:'Be Vietnam Pro','Segoe UI',sans-serif">
<div style="font-size:72px;color:#b8860b;line-height:1">☵</div><h1 style="margin:10px 0 6px">Quẻ Thuần Khảm — hiểm trùng</h1>
<p style="opacity:.8;max-width:560px;word-break:break-all">Không thể tới <b>${esc(url)}</b></p><p style="opacity:.65">${esc(msg)}</p>
<p style="font-style:italic;opacity:.6">«Giữ lòng thành, ắt vượt hiểm» — kiểm tra kết nối rồi bấm F5 để thử lại.</p></body></html>`;
  }

  function showCrash(tab, reason) {
    tab.crashEl?.remove();
    const c = el('div', 'crash');
    c.innerHTML = `<div class="k">☶</div><h2>Quẻ Sơn Địa Bác — trang đã sụp</h2><p>Tiến trình hiển thị dừng đột ngột (${esc(reason || 'không rõ')}).</p>`;
    const b = el('button', 'btn', 'Tải lại trang'); b.onclick = () => { c.remove(); tab.wv.reload(); };
    c.append(b); tab.crashEl = c;
    c.hidden = tab !== active;
    $('#views').append(c);
  }

  function paintTab(tab) {
    const k = internalKey(tab.url), fav = tab.el.querySelector('.fav');
    if (tab.crashed) fav.textContent = '☶';
    else if (k && MOD[k]) fav.textContent = MOD[k][1];
    else if (tab.favicon) {
      if (fav.firstChild?.src !== tab.favicon) { fav.textContent = ''; const img = new Image(); img.src = tab.favicon; img.onerror = () => (fav.textContent = '◍'); fav.append(img); }
    } else fav.textContent = '◍';
    const title = k && MOD[k] ? (tab.title && !/^(Thẻ mới|.*\.html)$/.test(tab.title) ? tab.title.replace(/ · Vân Quẻ$/, '') : MOD[k][2]) : tab.title || display(tab.url) || 'Thẻ mới';
    tab.el.querySelector('.title').textContent = title;
    tab.el.title = title + '\n' + (display(tab.url) || 'Thiên Môn');
    tab.el.classList.toggle('muted', !!tab.muted); tab.el.classList.toggle('audible', !!tab.audible && !tab.muted);
    tab.el.querySelector('.audio').textContent = tab.muted ? '🔇' : '🔊';
    if (tab === active) document.title = title + ' — Vân Quẻ';
  }

  function activate(tab) {
    if (!tab) return;
    active = tab;
    ensureView(tab);
    tabs.forEach((t) => {
      t.el.classList.toggle('active', t === tab); t.el.setAttribute('aria-selected', t === tab);
      t.wv?.classList.toggle('active', t === tab);
      if (t.crashEl) t.crashEl.hidden = t !== tab;
    });
    tab.el.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    syncNav(); paintTab(tab); paintPerm(); closeFind();
    $('#hover').textContent = '';
    if (isInternal(tab.url) && internalKey(tab.url) === 'start' && document.activeElement !== $('#url')) setTimeout(() => tab.wv?.focus(), 0);
    else setTimeout(() => tab.wv?.focus(), 0);
    saveSession();
  }

  function closeTab(tab) {
    const i = tabs.indexOf(tab); if (i < 0) return;
    if (tab.url && tab.url !== 'about:blank') closed.push({ url: tab.url, title: tab.title, pinned: tab.pinned, index: i });
    if (closed.length > 25) closed.shift();
    tab.perms.forEach((p) => vq.replyPermission({ id: p.id, allow: false }));
    tab.el.remove(); tab.wv?.remove(); tab.crashEl?.remove(); tabs.splice(i, 1);
    if (!tabs.length) { createTab(HOME); return; }
    if (tab === active) activate(tabs[Math.min(i, tabs.length - 1)]);
    saveSession();
  }
  const closeTabs = (list) => list.slice().forEach(closeTab);
  function reopen() { const c = closed.pop(); if (c) createTab(c.url, { pinned: c.pinned, index: c.index, title: c.title }); }
  function togglePin(tab) {
    tab.pinned = !tab.pinned; tab.el.classList.toggle('pinned', tab.pinned);
    tabs.splice(tabs.indexOf(tab), 1);
    const firstUnpinned = tabs.findIndex((t) => !t.pinned);
    tabs.splice(tab.pinned ? (firstUnpinned < 0 ? tabs.length : firstUnpinned) : (firstUnpinned < 0 ? tabs.length : firstUnpinned), 0, tab);
    syncTabDom(); paintTab(tab); saveSession();
  }
  function toggleMute(tab) { if (!tab) return; tab.muted = !tab.muted; tab.wv?.setAudioMuted(tab.muted); paintTab(tab); saveSession(); }
  function setAudible(tab, on) { tab.audible = on; paintTab(tab); }
  function duplicate(tab) { createTab(tab.url, { index: tabs.indexOf(tab) + 1, pinned: tab.pinned }); }

  let saveTimer;
  function saveSession() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      vq.api('session', null, { tabs: tabs.map((t) => ({ url: t.url, title: t.title, pinned: t.pinned, muted: t.muted })), active: tabs.indexOf(active) }).catch(() => {});
    }, 500);
  }

  // Kéo thả sắp xếp thẻ
  function startDrag(tab, ev) {
    const x0 = ev.clientX; let dragging = false;
    const move = (e) => {
      if (!dragging && Math.abs(e.clientX - x0) < 6) return;
      dragging = true; tab.el.classList.add('dragging');
      const group = tabs.filter((t) => t.pinned === tab.pinned);
      const target = group.find((t) => { if (t === tab) return false; const r = t.el.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right; });
      if (target) {
        const from = tabs.indexOf(tab), to = tabs.indexOf(target);
        tabs.splice(from, 1); tabs.splice(to, 0, tab); syncTabDom();
      }
    };
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); tab.el.classList.remove('dragging'); if (dragging) saveSession(); };
    addEventListener('mousemove', move); addEventListener('mouseup', up);
  }
  $('#tabs').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { $('#tabs').scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  $('#tabs').addEventListener('dblclick', (e) => { if (e.target === $('#tabs')) createTab(HOME); });

  // ───────── Thanh điều hướng ─────────
  function syncNav() {
    if (!active) return;
    const wv = active.wv; let back = false, fwd = false;
    try { back = wv.canGoBack(); fwd = wv.canGoForward(); } catch (e) {}
    $('#back').disabled = !back; $('#fwd').disabled = !fwd;
    $('#reload').textContent = active.loading ? '✕' : '↻';
    $('#reload').title = active.loading ? 'Dừng tải (Esc)' : 'Tải lại (F5)';
    if (document.activeElement !== $('#url')) $('#url').value = display(active.url);
    const b = $('#badge'), u = active.url || '';
    if (isInternal(u)) { b.className = 'badge'; b.textContent = '☯ Vân Quẻ'; b.title = 'Trang nội bộ của Vân Quẻ — chạy hoàn toàn ngoại tuyến'; }
    else if (u.startsWith('https://')) { b.className = 'badge secure'; b.textContent = '🔒'; b.title = 'Kết nối bảo mật (HTTPS) · ' + hostOf(u); }
    else if (u.startsWith('http://')) { b.className = 'badge insecure'; b.textContent = 'Không an toàn'; b.title = 'Kết nối không mã hóa — đừng nhập mật khẩu'; }
    else if (u.startsWith('file://')) { b.className = 'badge'; b.textContent = '🗎'; b.title = 'Tệp trên máy'; }
    else { b.className = 'badge'; b.textContent = '☯'; b.title = ''; }
    const marked = bookmarks.some((x) => x.url === u);
    $('#star').classList.toggle('on', marked); $('#star').textContent = marked ? '★' : '☆';
    $('#star').title = marked ? 'Bỏ đánh dấu (Ctrl+D)' : 'Đánh dấu trang (Ctrl+D)';
    $('#zoomPill').hidden = !active.zoom;
    $('#zoomPill').textContent = zoomPct(active.zoom) + '%';
  }
  const zoomPct = (z) => Math.round(Math.pow(1.2, z) * 100);
  function navigate(url, tab = active) {
    if (!tab) return createTab(url);
    tab.url = url;
    if (!tab.wv) ensureView(tab); else tab.wv.loadURL(url).catch(() => {});
    if (tab === active) syncNav();
  }
  /** Mở một trang nội bộ: chuyển tới thẻ đã mở sẵn nếu có */
  function openInternal(key) {
    const t = tabs.find((x) => internalKey(x.url) === key);
    if (t) activate(t); else createTab(`${INTERNAL}${key}.html`);
  }

  $('#back').onclick = () => active?.wv?.goBack();
  $('#fwd').onclick = () => active?.wv?.goForward();
  $('#reload').onclick = (e) => { if (!active?.wv) return; if (active.loading) active.wv.stop(); else if (e.shiftKey) active.wv.reloadIgnoringCache(); else active.wv.reload(); };
  $('#home').onclick = () => navigate(HOME);
  $('#brand').onclick = () => navigate(HOME);
  $('#newtab').onclick = () => createTab(HOME);
  $('#zoomPill').onclick = () => zoom(0);

  // ───────── Thanh địa chỉ + gợi ý ─────────
  let sugg = [], si = -1, suggSeq = 0;
  $('#omni').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = si >= 0 && sugg[si] ? sugg[si].url : resolve($('#url').value);
    hideSuggest();
    if (e.submitter?.id === 'alt' || window.event?.altKey) createTab(v); else navigate(v);
    active?.wv?.focus();
  });
  $('#url').addEventListener('focus', () => setTimeout(() => $('#url').select(), 0));
  $('#url').addEventListener('blur', () => setTimeout(() => { hideSuggest(); syncNav(); }, 150));
  $('#url').addEventListener('input', () => showSuggest($('#url').value));
  $('#url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.altKey) { e.preventDefault(); const v = si >= 0 && sugg[si] ? sugg[si].url : resolve($('#url').value); hideSuggest(); createTab(v); return; }
    if (e.key === 'Escape') { if ($('#suggest').classList.contains('show')) hideSuggest(); else { $('#url').value = display(active?.url); } active?.wv?.focus(); return; }
    if (!$('#suggest').classList.contains('show')) return;
    if (e.key === 'ArrowDown') { si = Math.min(sugg.length - 1, si + 1); paintSuggest(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { si = Math.max(-1, si - 1); paintSuggest(); e.preventDefault(); }
  });
  async function showSuggest(q) {
    const raw = q.trim(); if (!raw) return hideSuggest();
    const f = fold(raw.replace(/^vq:/i, ''));
    const my = ++suggSeq;
    const list = MODULES.filter((m) => fold(m[2] + ' ' + m[3] + ' ' + m[0]).includes(f)).slice(0, 4)
      .map((m) => ({ sym: m[1], text: m[2], hint: 'vq:' + m[0], url: `${INTERNAL}${m[0]}.html` }));
    bookmarks.filter((b) => fold(b.title + ' ' + b.url).includes(f)).slice(0, 3)
      .forEach((b) => list.push({ sym: '★', text: b.title, sub: b.url, hint: 'Đánh dấu', url: b.url }));
    const resolved = resolve(raw), isSearch = resolved === searchUrl(raw);
    const head = { sym: isSearch ? '⌕' : '↗', text: raw, hint: isSearch ? 'Tìm trên ' + engineName() : 'Mở trang', url: resolved };
    sugg = [head, ...list]; si = -1; paintSuggest(f);
    const hist = await vq.api('suggest', { q: raw, limit: 5 }).catch(() => []);
    if (my !== suggSeq) return;
    const seen = new Set(sugg.map((s) => s.url));
    hist.filter((h) => !seen.has(h.url)).forEach((h) => sugg.push({ sym: '⌛', text: h.title || h.url, sub: h.title ? h.url : '', hint: 'Lịch sử', url: h.url }));
    sugg = sugg.slice(0, 10); paintSuggest(f);
  }
  function paintSuggest(f = '') {
    const box = $('#suggest'); box.innerHTML = '';
    sugg.forEach((s, i) => {
      const d = el('div', 'row' + (i === si ? ' sel' : ''));
      d.setAttribute('role', 'option');
      const b = el('b', '', s.sym), t = el('span', 'txt');
      t.append(highlight(s.text, f)); if (s.sub) t.append(el('span', 'url', s.sub.replace(/^https?:\/\/(www\.)?/, '')));
      d.append(b, t, el('small', '', s.hint));
      d.addEventListener('mousedown', (e) => { e.preventDefault(); hideSuggest(); if (e.button === 1 || e.ctrlKey) createTab(s.url, { background: true }); else navigate(s.url); active?.wv?.focus(); });
      box.append(d);
    });
    box.classList.toggle('show', sugg.length > 0);
  }
  function highlight(text, f) {
    const frag = document.createDocumentFragment(), ft = fold(text), i = f ? ft.indexOf(f) : -1;
    if (i < 0 || ft.length !== text.length) { frag.append(text); return frag; }
    frag.append(text.slice(0, i), el('mark', '', text.slice(i, i + f.length)), text.slice(i + f.length));
    return frag;
  }
  function hideSuggest() { $('#suggest').classList.remove('show'); si = -1; suggSeq++; }

  // ───────── Bát Quẻ Môn + đánh dấu ─────────
  function paintBookmarks() {
    const bar = $('#bookmarks');
    bar.hidden = !settings.showBookmarksBar;
    bar.innerHTML = '<span class="lbl">Bát Quẻ Môn</span>';
    MODULES.filter((m) => m[4]).forEach(([k, sym, name, desc]) => {
      const b = el('button', 'bm'); b.title = `${desc} (vq:${k})\nCtrl/chuột giữa: mở thẻ nền`;
      b.append(el('span', 't', sym), el('span', '', name));
      b.onclick = (e) => (e.ctrlKey ? createTab(`${INTERNAL}${k}.html`, { background: true }) : navigate(`${INTERNAL}${k}.html`));
      b.onauxclick = (e) => { if (e.button === 1) createTab(`${INTERNAL}${k}.html`, { background: true }); };
      bar.append(b);
    });
    if (bookmarks.length) bar.append(el('span', 'div'));
    bookmarks.forEach((bm) => {
      const b = el('button', 'bm'); b.title = `${bm.title}\n${bm.url}`;
      const k = internalKey(bm.url);
      b.append(el('span', 't', k && MOD[k] ? MOD[k][1] : '★'), el('span', '', bm.title || bm.url));
      b.onclick = (e) => (e.ctrlKey ? createTab(bm.url, { background: true }) : navigate(bm.url));
      b.onauxclick = (e) => { if (e.button === 1) createTab(bm.url, { background: true }); };
      b.oncontextmenu = (e) => { e.preventDefault(); openBookmarkMenu(bm, e.clientX, e.clientY); };
      bar.append(b);
    });
  }
  async function toggleBookmark() {
    if (!active || !/^(https?|vanque|file):/.test(active.url)) return;
    const existing = bookmarks.find((x) => x.url === active.url);
    if (existing) { bookmarks = await vq.api('bookmarks', null, { action: 'remove', id: existing.id }); toast('☆', 'Đã bỏ đánh dấu'); }
    else { bookmarks = await vq.api('bookmarks', null, { action: 'add', url: active.url, title: active.title || display(active.url) }); toast('★', 'Đã đánh dấu “' + (active.title || display(active.url)).slice(0, 60) + '”', 'Quản lý', () => openInternal('danhdau')); }
    paintBookmarks(); syncNav();
  }
  $('#star').onclick = toggleBookmark;

  // ───────── Sáng / Tối ─────────
  const effTheme = () => (settings.theme === 'system' ? systemTheme : settings.theme);
  function applyTheme() {
    const t = effTheme();
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('vq-theme-eff', t); } catch (e) {}
    tabs.forEach((tab) => { if (tab.wv && isInternal(tab.url)) pushThemeTo(tab); });
  }
  function pushThemeTo(tab) {
    const t = effTheme();
    tab.wv?.executeJavaScript(`try{localStorage.setItem('vq-theme','${t}');document.documentElement.dataset.theme='${t}'}catch(e){}`).catch(() => {});
  }
  /** Báo cho các trang nội bộ đang mở rằng dữ liệu đã đổi (để tự làm mới) */
  function notifyPages(what) {
    tabs.forEach((tab) => { if (tab.wv && isInternal(tab.url)) tab.wv.executeJavaScript(`dispatchEvent(new CustomEvent('vq-store',{detail:${JSON.stringify(what)}}))`).catch(() => {}); });
  }
  /** Nút tài khoản trên thanh công cụ: chữ cái đầu tên khi đã đăng nhập */
  function paintAccount() {
    const b = $('#acctBtn'), u = account.user;
    b.classList.toggle('on', !!account.signedIn);
    b.classList.toggle('busy', !!(account.syncing || account.loggingIn));
    b.textContent = account.signedIn ? ((u?.name || u?.email || '?').trim()[0] || '?').toUpperCase() : '';
    b.title = account.signedIn ? `${u?.name || ''}${u?.email ? ' · ' + u.email : ''}
${account.error || (account.lastSync ? 'Đã đồng bộ sổ lá số' : 'Chưa đồng bộ')}` : 'Đăng nhập tài khoản tuvi.work';
  }
  $('#acctBtn').hidden = !account.configured; // bản chưa được cấp khóa tuvi.work: ẩn hẳn phần đăng nhập
  $('#acctBtn').onclick = () => openInternal(account.signedIn ? 'caidat' : 'chao');
  paintAccount();
  const toggleTheme = () => vq.api('settings', null, { patch: { theme: effTheme() === 'dark' ? 'light' : 'dark' } });
  $('#theme').onclick = toggleTheme;

  vq.onStoreChanged(({ key, value }) => {
    if (key === 'settings') { settings = value; applyTheme(); paintBookmarks(); }
    if (key === 'bookmarks') { bookmarks = value; paintBookmarks(); syncNav(); }
    if (key === 'account') { account = value || {}; paintAccount(); }
    notifyPages(key);
  });
  vq.onSystemTheme((t) => { systemTheme = t; applyTheme(); });

  // ───────── Xin quyền ─────────
  vq.onPermission((req) => {
    const tab = tabs.find((t) => t.wcId === req.wcId) || active;
    tab.perms.push(req);
    if (tab === active) paintPerm();
    else tab.el.classList.add('attention');
  });
  function dropPerms(tab) { tab.perms.forEach((p) => vq.replyPermission({ id: p.id, allow: false })); tab.perms = []; if (tab === active) paintPerm(); }
  function paintPerm() {
    const bar = $('#permbar'), req = active?.perms[0];
    bar.hidden = !req; bar.innerHTML = '';
    if (!req) return;
    let [sym, what] = PERM_TEXT[req.permission] || ['⚿', `muốn dùng quyền “${req.permission}”`];
    if (req.permission === 'media') {
      const v = req.mediaTypes.includes('video'), a = req.mediaTypes.includes('audio');
      [sym, what] = [v ? '📷' : '🎙', `muốn dùng ${v && a ? 'camera và micro' : v ? 'camera' : 'micro'}`];
    }
    if (req.permission === 'openExternal' && req.externalURL) what += ` (${req.externalURL.split(':')[0]}:)`;
    const msg = el('span', 'msg'); msg.append(el('b', '', req.origin.replace(/^https?:\/\//, '')), ' ' + what + '.');
    const remember = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = true; remember.append(cb, 'Nhớ cho trang này');
    const reply = (allow) => { vq.replyPermission({ id: req.id, allow, remember: cb.checked }); active.perms.shift(); paintPerm(); };
    const ok = el('button', 'btn', 'Cho phép'), no = el('button', 'btn ghost', 'Chặn');
    ok.onclick = () => reply(true); no.onclick = () => reply(false);
    bar.append(el('span', 'sym', sym), msg, remember, no, ok);
    if (active.perms.length > 1) bar.append(el('small', '', `+${active.perms.length - 1}`));
  }

  // ───────── Tải xuống ─────────
  const liveDl = new Map(boot.downloads.map((d) => [d.id, d]));
  const fmtBytes = (n) => (!n ? '0 B' : n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB');
  function paintDlBtn() {
    const btn = $('#dlBtn'), list = [...liveDl.values()];
    if (list.length) btn.hidden = false;
    const running = list.filter((d) => d.state === 'progressing');
    btn.classList.toggle('active', running.length > 0);
    const tot = running.reduce((s, d) => s + (d.total || 0), 0), rec = running.reduce((s, d) => s + (d.received || 0), 0);
    $('#dlArc').style.strokeDashoffset = running.length ? 94.25 * (1 - (tot ? rec / tot : 0.15)) : 94.25;
    btn.title = running.length ? `Đang tải ${running.length} tệp — ${fmtBytes(rec)}${tot ? ' / ' + fmtBytes(tot) : ''}` : 'Tải xuống (Ctrl+J)';
  }
  vq.onDownload((d) => {
    liveDl.set(d.id, d); paintDlBtn();
    if (d.isNew) { toast('⤓', `Đang tải “${d.filename}”`); $('#dlBtn').classList.remove('pulse'); void $('#dlBtn').offsetWidth; $('#dlBtn').classList.add('pulse'); }
    if (d.state === 'completed') toast('✓', `Đã tải xong “${d.filename}”`, 'Mở', () => vq.downloadAction('open', d.id).catch((e) => toast('⚠', e.message)));
    if (d.state === 'interrupted') toast('⚠', `Tải “${d.filename}” bị gián đoạn`);
    if (!$('#dlpop').hidden) paintDlPop();
    notifyPages('downloads');
  });
  vq.onDownloadsChanged(() => { notifyPages('downloads'); if (!$('#dlpop').hidden) paintDlPop(); });
  async function paintDlPop() {
    const list = (await vq.api('downloads')).slice(0, 6), box = $('#dlpop'); box.innerHTML = '';
    const h = el('h4', '', 'Tải xuống gần đây'); box.append(h);
    if (!list.length) box.append(el('div', 'empty', 'Chưa tải tệp nào.'));
    list.forEach((d) => {
      const row = el('div', 'dl'), icon = el('span', 't', d.state === 'completed' ? '🗎' : d.state === 'progressing' ? '⤓' : '⚠');
      const mid = el('div'), name = el('div', 'n' + (d.state === 'completed' && d.exists ? ' click' : ''), d.filename);
      if (d.state === 'completed' && d.exists) name.onclick = () => vq.downloadAction('open', d.id).catch((e) => toast('⚠', e.message));
      const info = el('small', '', d.state === 'progressing' ? `${fmtBytes(d.received)}${d.total ? ' / ' + fmtBytes(d.total) : ''}${d.paused ? ' · tạm dừng' : ''}`
        : d.state === 'completed' ? (d.exists ? fmtBytes(d.received) + ' · ' + hostOf(d.url) : 'Đã bị xóa khỏi máy') : d.state === 'cancelled' ? 'Đã hủy' : 'Bị gián đoạn');
      mid.append(name, info);
      if (d.state === 'progressing') { const bar = el('div', 'bar'), fill = el('i'); fill.style.width = (d.total ? (d.received / d.total) * 100 : 10) + '%'; bar.append(fill); mid.append(bar); }
      const act = el('button', 'ico sm', d.state === 'progressing' ? '✕' : '📂');
      act.title = d.state === 'progressing' ? 'Hủy' : 'Hiện trong thư mục';
      act.onclick = () => vq.downloadAction(d.state === 'progressing' ? 'cancel' : 'show', d.id);
      row.append(icon, mid, act); box.append(row);
    });
    const foot = el('div', 'foot'), all = el('button', '', 'Xem tất cả'), folder = el('button', '', 'Mở thư mục');
    all.onclick = () => { hidePops(); openInternal('taixuong'); }; folder.onclick = () => vq.downloadAction('folder');
    foot.append(folder, all); box.append(foot);
  }
  $('#dlBtn').onclick = (e) => { e.stopPropagation(); const open = $('#dlpop').hidden; hidePops(); if (open) { $('#dlpop').hidden = false; paintDlPop(); } };
  paintDlBtn();

  // ───────── Tìm trong trang ─────────
  function openFind() { $('#findbar').hidden = false; $('#findq').focus(); $('#findq').select(); if ($('#findq').value) find(true, false); }
  function closeFind() { if ($('#findbar').hidden) return; $('#findbar').hidden = true; try { active?.wv?.stopFindInPage('clearSelection'); } catch (e) {} $('#findn').textContent = ''; }
  const find = (forward = true, findNext = true) => { const q = $('#findq').value; if (!active?.wv) return; if (!q) { active.wv.stopFindInPage('clearSelection'); $('#findn').textContent = ''; return; } active.wv.findInPage(q, { forward, findNext }); };
  $('#findq').addEventListener('input', () => find(true, false));
  $('#findq').addEventListener('keydown', (e) => { if (e.key === 'Enter') find(!e.shiftKey); if (e.key === 'Escape') { closeFind(); active?.wv?.focus(); } });
  $('#findp').onclick = () => find(false); $('#findnx').onclick = () => find(true); $('#findx').onclick = closeFind;

  // ───────── Menu ─────────
  function zoom(d) { if (!active?.wv) return; active.zoom = d === 0 ? 0 : Math.max(-5, Math.min(7, active.zoom + d)); active.wv.setZoomLevel(active.zoom); syncNav(); if (!$('#menu').hidden) buildMenu(); }
  const menuItem = (box, sym, label, kbd, fn, disabled = false) => {
    const b = el('button', 'mi'); b.append(el('span', 't', sym), el('span', '', label), el('kbd', '', kbd || ''));
    b.disabled = disabled; b.onclick = () => { hidePops(); fn(); }; box.append(b); return b;
  };
  function buildMenu() {
    const m = $('#menu'); m.innerHTML = `<div class="mh"><span class="seal" style="width:40px;height:40px;font-size:13px;background:var(--son);color:var(--card);border-color:var(--son)">VQ</span><div><b>Vân Quẻ Browser</b><small>Vân khởi quẻ thành — Lý số tại tâm</small></div></div>`;
    menuItem(m, '＋', 'Thẻ mới', 'Ctrl+T', () => createTab(HOME));
    menuItem(m, '↺', 'Mở lại thẻ vừa đóng', 'Ctrl+Shift+T', reopen, !closed.length);
    m.append(el('hr'));
    const g = el('div', 'grid9');
    MODULES.filter((x) => x[4]).forEach(([k, sym, name]) => { const b = el('button'); b.title = 'vq:' + k; b.append(el('span', 't', sym), el('span', '', name)); b.onclick = () => { hidePops(); openInternal(k); }; g.append(b); });
    m.append(g, el('hr'));
    menuItem(m, '⌛', 'Lịch sử', 'Ctrl+H', () => openInternal('lichsu'));
    menuItem(m, '⤓', 'Tải xuống', 'Ctrl+J', () => openInternal('taixuong'));
    menuItem(m, '★', 'Đánh dấu', 'Ctrl+Shift+O', () => openInternal('danhdau'));
    m.append(el('hr'));
    const zr = el('div', 'zoomrow'); zr.append(el('span', 'l', 'Thu phóng'));
    const zm = el('button', 'ico sm', '－'), zp = el('button', 'ico sm', '＋'), zv = el('b', '', (active ? zoomPct(active.zoom) : 100) + '%'), zf = el('button', 'ico sm', '⛶');
    zm.onclick = () => zoom(-1); zp.onclick = () => zoom(1); zv.onclick = () => zoom(0); zf.title = 'Toàn màn hình (F11)'; zf.onclick = () => { hidePops(); vq.win('fullscreen'); };
    zr.append(zm, zv, zp, zf); m.append(zr);
    menuItem(m, '⌕', 'Tìm trong trang', 'Ctrl+F', openFind);
    menuItem(m, '⎙', 'In / Lưu PDF', 'Ctrl+P', () => active?.wv?.print());
    menuItem(m, '◐', effTheme() === 'dark' ? 'Giao diện sáng' : 'Giao diện tối', 'Ctrl+Shift+D', toggleTheme);
    menuItem(m, '▤', settings.showBookmarksBar ? 'Ẩn thanh Bát Quẻ Môn' : 'Hiện thanh Bát Quẻ Môn', 'Ctrl+Shift+B', toggleBar);
    m.append(el('hr'));
    menuItem(m, '⚙', 'Cài đặt', 'Ctrl+,', () => openInternal('caidat'));
    menuItem(m, '⚒', 'Công cụ nhà phát triển', 'F12', () => active?.wv?.openDevTools());
  }
  const toggleBar = () => vq.api('settings', null, { patch: { showBookmarksBar: !settings.showBookmarksBar } });
  $('#menuBtn').onclick = (e) => { e.stopPropagation(); const open = $('#menu').hidden; hidePops(); if (open) { buildMenu(); $('#menu').hidden = false; } };

  function placePop(box, x, y) {
    box.hidden = false; box.style.left = '0px'; box.style.top = '0px';
    const r = box.getBoundingClientRect();
    box.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    box.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  }
  function openTabMenu(tab, x, y) {
    hidePops();
    const m = $('#tabmenu'); m.innerHTML = '';
    const i = tabs.indexOf(tab);
    menuItem(m, '＋', 'Thẻ mới bên phải', '', () => createTab(HOME, { index: i + 1 }));
    m.append(el('hr'));
    menuItem(m, '↻', 'Tải lại', 'F5', () => (tab.wv ? tab.wv.reload() : ensureView(tab)));
    menuItem(m, '⧉', 'Nhân bản thẻ', '', () => duplicate(tab));
    menuItem(m, '⚲', tab.pinned ? 'Bỏ ghim thẻ' : 'Ghim thẻ', 'nháy đúp', () => togglePin(tab));
    menuItem(m, tab.muted ? '🔊' : '🔇', tab.muted ? 'Bật tiếng trang' : 'Tắt tiếng trang', 'Ctrl+M', () => toggleMute(tab));
    menuItem(m, '★', bookmarks.some((b) => b.url === tab.url) ? 'Đã đánh dấu' : 'Đánh dấu trang', '', async () => {
      if (!bookmarks.some((b) => b.url === tab.url)) { bookmarks = await vq.api('bookmarks', null, { action: 'add', url: tab.url, title: tab.title || display(tab.url) }); paintBookmarks(); syncNav(); }
    });
    m.append(el('hr'));
    menuItem(m, '✕', 'Đóng thẻ', 'Ctrl+W', () => closeTab(tab));
    menuItem(m, '⊟', 'Đóng các thẻ khác', '', () => closeTabs(tabs.filter((t) => t !== tab && !t.pinned)), tabs.filter((t) => t !== tab && !t.pinned).length === 0);
    menuItem(m, '⇥', 'Đóng các thẻ bên phải', '', () => closeTabs(tabs.slice(i + 1).filter((t) => !t.pinned)), !tabs.slice(i + 1).some((t) => !t.pinned));
    m.append(el('hr'));
    menuItem(m, '↺', 'Mở lại thẻ vừa đóng', 'Ctrl+Shift+T', reopen, !closed.length);
    placePop(m, x, y);
  }
  function openBookmarkMenu(bm, x, y) {
    hidePops();
    const m = $('#tabmenu'); m.innerHTML = '';
    menuItem(m, '↗', 'Mở', '', () => navigate(bm.url));
    menuItem(m, '＋', 'Mở trong thẻ mới', '', () => createTab(bm.url, { background: true }));
    menuItem(m, '⎘', 'Sao chép địa chỉ', '', () => navigator.clipboard.writeText(bm.url).then(() => toast('⎘', 'Đã sao chép địa chỉ')));
    m.append(el('hr'));
    menuItem(m, '✎', 'Sửa / sắp xếp…', '', () => openInternal('danhdau'));
    menuItem(m, '✕', 'Xóa đánh dấu', '', async () => { bookmarks = await vq.api('bookmarks', null, { action: 'remove', id: bm.id }); paintBookmarks(); syncNav(); toast('☆', 'Đã xóa “' + bm.title.slice(0, 50) + '”'); });
    placePop(m, x, y);
  }
  function hidePops() { document.querySelectorAll('.pop').forEach((p) => (p.hidden = true)); }
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('.pop') && !e.target.closest('#menuBtn, #dlBtn')) hidePops(); });
  window.addEventListener('blur', () => setTimeout(() => { if (document.activeElement?.tagName === 'WEBVIEW') hidePops(); }, 0));

  // ───────── Thông báo nhỏ ─────────
  function toast(sym, text, action, fn) {
    const t = el('div', 'toast'); t.append(el('span', 's', sym), el('span', '', text));
    if (action) { const b = el('button', '', action); b.onclick = () => { fn(); dismiss(); }; t.append(b); }
    const dismiss = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
    $('#toasts').append(t); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(dismiss, action ? 6000 : 3200);
  }

  // ───────── Phím tắt ─────────
  function shortcut(s) {
    const i = tabs.indexOf(active), wv = active?.wv;
    switch (s) {
      case 'new': createTab(HOME); setTimeout(() => $('#url').focus(), 50); break;
      case 'close': closeTab(active); break;
      case 'reopen': reopen(); break;
      case 'focus-url': $('#url').focus(); $('#url').select(); break;
      case 'reload': wv?.reload(); break;
      case 'hard-reload': wv?.reloadIgnoringCache(); break;
      case 'find': openFind(); break;
      case 'find-next': if ($('#findbar').hidden) openFind(); else find(true); break;
      case 'find-prev': if ($('#findbar').hidden) openFind(); else find(false); break;
      case 'bookmark': toggleBookmark(); break;
      case 'bookmarks': openInternal('danhdau'); break;
      case 'toggle-bookmarks-bar': toggleBar(); break;
      case 'history': openInternal('lichsu'); break;
      case 'downloads': openInternal('taixuong'); break;
      case 'settings': openInternal('caidat'); break;
      case 'theme': toggleTheme(); break;
      case 'mute': toggleMute(active); break;
      case 'print': wv?.print(); break;
      case 'home': navigate(HOME); break;
      case 'next-tab': activate(tabs[(i + 1) % tabs.length]); break;
      case 'prev-tab': activate(tabs[(i - 1 + tabs.length) % tabs.length]); break;
      case 'zoom-in': zoom(1); break; case 'zoom-out': zoom(-1); break; case 'zoom-reset': zoom(0); break;
      case 'back': wv?.goBack(); break; case 'forward': wv?.goForward(); break;
      case 'fullscreen': vq.win('fullscreen'); break;
      case 'devtools': if (wv) (wv.isDevToolsOpened() ? wv.closeDevTools() : wv.openDevTools()); break;
      case 'escape':
        if (document.body.classList.contains('html-fs')) break;
        if (!$('#findbar').hidden) closeFind(); else if (active?.loading && document.activeElement === wv) wv.stop();
        hidePops(); hideSuggest(); break;
      default: if (s.startsWith('tab-')) { const n = +s.slice(4); activate(n === 9 ? tabs[tabs.length - 1] : tabs[n - 1]); }
    }
  }
  document.addEventListener('keydown', (e) => {
    const s = window.VQKeys.shortcutOf({ key: e.key, control: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, alt: e.altKey });
    if (!s) return;
    // Trong ô nhập: để trình soạn thảo xử lý phím chỉnh sửa thông thường
    if (e.target.matches?.('input') && ['zoom-out', 'zoom-in'].includes(s) === false && /^(escape)$/.test(s)) return;
    if (!window.VQKeys.PASSTHROUGH.has(s)) e.preventDefault();
    shortcut(s);
  });

  // ───────── Cửa sổ ─────────
  document.querySelectorAll('.winctl button').forEach((b) => (b.onclick = () => vq.win(b.dataset.w)));
  $('.drag').addEventListener('dblclick', () => vq.win('max'));
  vq.onWinState((s) => {
    $('[data-w=max]').textContent = s === 'max' ? '❐' : '☐';
    $('[data-w=max]').title = s === 'max' ? 'Khôi phục' : 'Phóng to';
    if (s !== 'full') document.body.classList.remove('html-fs');
  });
  vq.onOpenTab(({ url, background }) => createTab(url, { background }));
  vq.onShortcut(shortcut);

  // ───────── Thiên thời (thanh trạng thái — chữ ký Vân Quẻ) ─────────
  function thoi() {
    if (!window.VQ) return;
    const n = new Date(), d = VQ.dayInfo(n.getDate(), n.getMonth() + 1, n.getFullYear(), n.getHours());
    const hd = d.gioHoangDao.includes(d.hour.chi);
    $('#thoi').innerHTML = `<b>Giờ ${esc(d.hour.text)}</b>${hd ? ' ✦' : ''} · Ngày ${esc(d.day.text)} · ${d.lunar.day}/${d.lunar.month}${d.lunar.leap ? 'N' : ''} ${esc(d.year.text)} · Tiết ${esc(d.tietKhi.name)} · ${esc(d.ngay.than)} · Trực ${esc(d.truc.name)}`;
    $('#thoi').title = `${d.weekday} ${n.toLocaleDateString('vi-VN')} — ${hd ? 'giờ hoàng đạo ✦' : 'giờ thường'}\nGiờ hoàng đạo: ${d.gioHoangDao.map((z) => VQ.CHI[z]).join(', ')}\nBấm để mở Vạn Niên Lịch`;
  }
  $('#thoi').onclick = () => openInternal('lich');
  thoi(); setInterval(thoi, 30000);

  // ───────── Khởi động ─────────
  let splashGone = false;
  function hideSplash() { if (splashGone) return; splashGone = true; setTimeout(() => $('#splash').classList.add('gone'), 250); }
  setTimeout(hideSplash, 1600);

  // Di trú một lần từ bản 1.x (đánh dấu & phiên từng nằm trong localStorage của vỏ).
  // Giữ nguyên khóa cũ để quay về 1.x vẫn còn dữ liệu; cờ 'vq-migrated-2' ngăn nhập lại lần sau.
  try {
    if (!localStorage.getItem('vq-migrated-2')) {
      const old = JSON.parse(localStorage.getItem('vq-bookmarks') || 'null');
      if (Array.isArray(old)) for (const b of old) if (b?.url && !bookmarks.some((x) => x.url === b.url)) bookmarks = await vq.api('bookmarks', null, { action: 'add', url: b.url, title: b.title || b.url });
      const oldSess = JSON.parse(localStorage.getItem('vq-session') || 'null');
      if (Array.isArray(oldSess) && !boot.session.tabs?.length) boot.session = { tabs: oldSess.filter((t) => t?.url).map((t) => ({ url: t.url, pinned: !!t.pinned })), active: 0 };
      const oldTheme = localStorage.getItem('vq-theme');
      if (['light', 'dark'].includes(oldTheme) && settings.theme === 'system') { settings = { ...settings, theme: oldTheme }; vq.api('settings', null, { patch: { theme: oldTheme } }).catch(() => {}); }
      localStorage.setItem('vq-migrated-2', String(Date.now()));
    }
  } catch (e) { console.warn('Di trú dữ liệu cũ thất bại', e); }

  applyTheme();
  paintBookmarks();
  const sess = settings.restoreSession ? boot.session : { tabs: [] };
  if (sess.tabs?.length) {
    const act = Math.max(0, Math.min(sess.tabs.length - 1, sess.active | 0));
    sess.tabs.forEach((t, i) => createTab(t.url, { background: i !== act, pinned: t.pinned, muted: t.muted, title: t.title, lazy: i !== act }));
  }
  (boot.openUrls || []).forEach((u) => createTab(u));
  // Lần đầu mở: trang chào mời đăng nhập tài khoản tuvi.work (có nút "Để sau")
  if (!settings.welcomed && account.configured) createTab(INTERNAL + 'chao.html');
  else if (!tabs.length) createTab(HOME);
})();
