/* Vân Quẻ · UI helpers dùng chung cho các trang nội bộ */
(function () {
  try { const t = localStorage.getItem('vq-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  window.addEventListener('storage', (e) => { if (e.key === 'vq-theme' && e.newValue) document.documentElement.dataset.theme = e.newValue; });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v != null && v !== false) n.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach((c) => c != null && n.append(c.nodeType ? c : document.createTextNode(c)));
    return n;
  };
  const HANH_CLASS = { 'Mộc': 'h-moc', 'Hỏa': 'h-hoa', 'Thổ': 'h-tho', 'Kim': 'h-kim', 'Thủy': 'h-thuy' };

  const CLOUD = '<svg class="cloud" viewBox="0 0 140 70" width="120"><path d="M46 34 a10 10 0 1 1 20 0 a20 20 0 1 1 -40 0"/><path d="M66 44 h44"/><path d="M96 30 a7 7 0 1 1 14 0 a14 14 0 1 1 -28 0"/></svg>';
  const RAYS = '<svg class="rays" viewBox="0 0 1200 480" fill="none"><g stroke-width="1.5"><circle cx="600" cy="0" r="180"/><circle cx="600" cy="0" r="280"/><circle cx="600" cy="0" r="380"/><circle cx="600" cy="0" r="470" stroke-dasharray="4 7"/><line x1="600" y1="0" x2="1080" y2="0"/><line x1="600" y1="0" x2="1015.7" y2="240"/><line x1="600" y1="0" x2="840" y2="415.7"/><line x1="600" y1="0" x2="600" y2="480"/><line x1="600" y1="0" x2="360" y2="415.7"/><line x1="600" y1="0" x2="184.3" y2="240"/><line x1="600" y1="0" x2="120" y2="0"/></g></svg>';

  /** Trang trí header: tia nhật quang + mây */
  function decorateHead() {
    $$('.page-head').forEach((ph) => {
      ph.insertAdjacentHTML('afterbegin', RAYS);
      const c1 = h('div', { html: CLOUD }).firstChild; c1.style.cssText = 'left:5%;top:70px';
      const c2 = h('div', { html: CLOUD }).firstChild; c2.style.cssText = 'right:6%;top:130px;width:90px';
      ph.append(c1, c2);
    });
    if (!$('.foot')) {
      document.body.append(h('footer', { class: 'foot', html:
        '<span class="seal">VÂN<br>QUẺ</span><div>Vân Quẻ Browser · «Vân khởi quẻ thành — Lý số tại tâm»</div>' +
        '<div style="margin-top:4px;opacity:.75">Lý số để tham khảo, chiêm nghiệm — Đức năng thắng số.</div>' }));
    }
  }

  function fillSelect(sel, items, selected) {
    sel.innerHTML = '';
    items.forEach(([v, t]) => sel.append(h('option', { value: v, selected: String(v) === String(selected) ? 'selected' : null }, t)));
  }
  function fillDate({ day, month, year, hour }, init = {}) {
    const now = new Date();
    if (day) fillSelect(day, Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), init.day ?? 1);
    if (month) fillSelect(month, Array.from({ length: 12 }, (_, i) => [i + 1, 'Th.' + (i + 1)]), init.month ?? 1);
    if (year) fillSelect(year, Array.from({ length: 2100 - 1900 + 1 }, (_, i) => [2100 - i, 2100 - i]), init.year ?? 1990);
    if (hour) fillSelect(hour, VQ.CHI.map((c, i) => [i, `Giờ ${c} (${VQ.GIO_RANGE[i]})`]), init.hour ?? VQ.hourChi(now.getHours()));
  }
  /** Lưu/đọc hồ sơ người xem để các trang dùng chung */
  const profile = {
    get() { try { return JSON.parse(localStorage.getItem('vq-profile') || 'null'); } catch (e) { return null; } },
    set(p) { localStorage.setItem('vq-profile', JSON.stringify(p)); },
  };
  const hanhSpan = (hanh, text) => h('span', { class: HANH_CLASS[hanh] || '' }, text ?? hanh);
  /** Vẽ quẻ 6 hào (mảng từ dưới lên). moving = danh sách số thứ tự hào động (1..6) */
  function drawHex(lines, moving = [], width = 90) {
    const box = h('div', { style: `display:flex;flex-direction:column-reverse;gap:7px;width:${width}px` });
    lines.forEach((l, i) => box.append(h('i', { class: 'hao' + (l ? '' : ' hao--broken') + (moving.includes(i + 1) ? ' hao--son' : ''), style: 'height:9px' })));
    return box;
  }

  /** Gọi API nội bộ vanque://app/api/… (chỉ trang nội bộ gọi được) */
  async function api(route, query, body) {
    const qs = query ? '?' + new URLSearchParams(query) : '';
    const r = await fetch('/api/' + route + qs, body ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-vq': '1' }, body: JSON.stringify(body) } : {});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Lỗi ' + r.status);
    return data;
  }
  /** Nghe vỏ trình duyệt báo dữ liệu đổi ('settings' | 'bookmarks' | 'downloads') */
  const onStore = (fn) => window.addEventListener('vq-store', (e) => fn(e.detail));
  const fmtBytes = (n) => (!n ? '0 B' : n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB');
  const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  function fmtDay(t) {
    const d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    const base = d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
    return diff === 0 ? 'Hôm nay — ' + base : diff === 1 ? 'Hôm qua — ' + base : base;
  }
  const hostOf = (u) => { try { return new URL(u).host || u; } catch (e) { return u; } };
  /** Biểu tượng chữ cái cho một địa chỉ (không tải favicon từ mạng) */
  function siteIcon(url, title) {
    const host = hostOf(url).replace(/^www\./, '');
    const ch = (url.startsWith('vanque:') ? '☯' : (title || host || '?').trim()[0] || '?').toUpperCase();
    let hue = 0; for (const c of host) hue = (hue * 31 + c.charCodeAt(0)) % 360;
    return h('span', { class: 'site-ico', style: `--hue:${hue}` }, ch);
  }
  let toastBox;
  function toast(text) {
    if (!toastBox) { toastBox = h('div', { class: 'vq-toasts' }); document.body.append(toastBox); }
    const t = h('div', { class: 'vq-toast' }, text); toastBox.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  const GOOGLE_G = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.6 5.4 2.7 13.3l8 6.2C12.6 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.7 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-8-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.4-4.1-13.3-9.8l-8 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
  const ago = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : fmtDay(t); };
  /** Khung tài khoản tuvi.work dùng chung (Cài đặt, trang chào). Trả về hàm vẽ lại. */
  function accountBox(el, { onSignedIn } = {}) {
    let was = null;
    const act = (action, extra = {}) => api('account', null, { action, ...extra }).then(paint).catch((e) => toast(e.message));
    const logout = () => act('logout', { keep: confirm('Giữ sổ lá số trên máy này sau khi đăng xuất?\n\nOK — giữ lại (không gửi sang tài khoản khác đăng nhập sau).\nHủy — xóa khỏi máy này (vẫn còn trên tuvi.work).') });
    function paint(a) {
      el.innerHTML = '';
      el.className = 'acct';
      if (a.signedIn) {
        const u = a.user || {}, name = u.name || u.email || 'Đạo hữu';
        el.append(
          h('div', { class: 'acct-row' },
            h('span', { class: 'acct-av' }, name.trim()[0].toUpperCase()),
            h('div', { class: 'acct-who' }, h('b', {}, name), h('small', {}, u.email || ''),
              h('small', { class: 'acct-sync' }, a.syncing ? '⟳ Đang đồng bộ…' : a.lastSync ? '✓ Đã đồng bộ ' + ago(a.lastSync) : 'Chưa đồng bộ')),
            h('div', { class: 'acct-btns' },
              h('button', { class: 'btn btn--sm btn--ghost', onclick: () => act('sync'), disabled: a.syncing ? '' : null }, 'Đồng bộ ngay'),
              h('button', { class: 'btn btn--sm btn--ghost', onclick: () => logout() }, 'Đăng xuất'))),
        );
        if (!a.persistent) el.append(h('p', { class: 'note mt' }, 'Máy này không hỗ trợ mã hóa token, nên bạn sẽ phải đăng nhập lại mỗi lần mở Vân Quẻ.'));
        if (was === false && onSignedIn) onSignedIn(a);
      } else if (a.loggingIn) {
        el.append(h('div', { class: 'acct-row' }, h('span', { class: 'acct-spin' }), h('div', { class: 'acct-who' }, h('b', {}, 'Đang chờ bạn đăng nhập ở trình duyệt…'),
          h('small', {}, 'Trang tuvi.work đã mở trong trình duyệt mặc định. Đăng nhập Google rồi bấm “Cho phép” để quay lại đây.')),
          h('div', { class: 'acct-btns' }, h('button', { class: 'btn btn--sm btn--ghost', onclick: () => act('cancel') }, 'Hủy'))));
      } else {
        el.append(h('button', { class: 'gbtn', onclick: () => act('login'), disabled: a.configured ? null : '', html: GOOGLE_G + '<span>Đăng nhập bằng Google</span>' }),
          h('p', { class: 'small muted acct-note' }, 'Dùng tài khoản tuvi.work — chưa có sẽ được tạo mới, miễn phí. Sổ lá số sẽ đồng bộ giữa Vân Quẻ, tuvi.work và app tuvi.work.'));
        if (!a.configured) el.append(h('p', { class: 'note mt' }, 'Bản Vân Quẻ này chưa được cấp khóa kết nối tuvi.work.'));
      }
      if (a.error && !a.loggingIn) el.append(h('p', { class: 'acct-err' }, a.error));
      was = a.signedIn;
    }
    onStore((what) => { if (what === 'account') api('account').then(paint); });
    api('account').then(paint);
    return paint;
  }

  window.UI = { $, $$, h, HANH_CLASS, decorateHead, fillSelect, fillDate, profile, hanhSpan, drawHex, api, onStore, fmtBytes, fmtTime, fmtDay, hostOf, siteIcon, toast, accountBox };
  document.addEventListener('DOMContentLoaded', decorateHead);
})();
