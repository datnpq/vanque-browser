/* Vân Quẻ · bản đồ phím tắt dùng chung cho tiến trình chính (before-input-event) và vỏ trình duyệt (keydown).
   Đầu vào: { key, control, meta, shift, alt } — trả về tên lệnh hoặc null. */
(function (root) {
  function shortcutOf(input) {
    const k = String(input.key || '').toLowerCase(), mod = !!(input.control || input.meta), sh = !!input.shift, alt = !!input.alt;
    if (mod && sh) {
      const m = { t: 'reopen', r: 'hard-reload', b: 'toggle-bookmarks-bar', o: 'bookmarks', d: 'theme', i: 'devtools', delete: 'history' }[k];
      if (m) return m;
      if (k === 'tab') return 'prev-tab';
    }
    if (mod && !sh && !alt) {
      const m = { t: 'new', w: 'close', l: 'focus-url', r: 'reload', f: 'find', d: 'bookmark', p: 'print', h: 'history', j: 'downloads',
        ',': 'settings', m: 'mute', tab: 'next-tab', pagedown: 'next-tab', pageup: 'prev-tab', '=': 'zoom-in', '+': 'zoom-in', '-': 'zoom-out', '0': 'zoom-reset', f4: 'close' }[k];
      if (m) return m;
      if (/^[1-9]$/.test(k)) return 'tab-' + k;
    }
    if (alt && !mod) {
      if (k === 'arrowleft') return 'back';
      if (k === 'arrowright') return 'forward';
      if (k === 'home') return 'home';
      if (k === 'd') return 'focus-url';
    }
    if (!mod && !alt) {
      if (k === 'f5') return sh ? 'hard-reload' : 'reload';
      if (k === 'f6') return 'focus-url';
      if (k === 'f11') return 'fullscreen';
      if (k === 'f12') return 'devtools';
      if (k === 'f3') return sh ? 'find-prev' : 'find-next';
      if (k === 'escape') return 'escape';
    }
    return null;
  }
  /** Các lệnh không chặn mặc định (để trang vẫn nhận phím) */
  const PASSTHROUGH = new Set(['escape']);
  const api = { shortcutOf, PASSTHROUGH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VQKeys = api;
})(typeof self !== 'undefined' ? self : this);
