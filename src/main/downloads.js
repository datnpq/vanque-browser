// Vân Quẻ · quản lý tải xuống (theo dõi tiến độ, lưu danh sách, mở / hiện thư mục / hủy)
const { app, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

class Downloads {
  constructor(store, notify, getWin = () => null) {
    this.store = store;
    this.getWin = getWin;
    this.notify = notify;           // (event, payload) → gửi về vỏ trình duyệt
    this.live = new Map();          // id → DownloadItem đang chạy
    // Mục còn "đang tải" từ phiên trước coi như bị gián đoạn
    store.set('downloads', store.get('downloads').map((d) => (d.state === 'progressing' ? { ...d, state: 'interrupted' } : d)));
  }

  attach(session) {
    session.on('will-download', (_e, item) => {
      const win = this.getWin();
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const s = this.store.get('settings');
      const dir = s.downloadDir && fs.existsSync(s.downloadDir) ? s.downloadDir : app.getPath('downloads');
      if (s.askDownload) {
        item.setSaveDialogOptions({ title: 'Lưu tệp — Vân Quẻ', defaultPath: path.join(dir, item.getFilename()) });
      } else {
        item.setSavePath(uniquePath(dir, item.getFilename()));
      }
      const rec = { id, url: item.getURL(), filename: item.getFilename(), path: item.getSavePath(), mime: item.getMimeType(),
        total: item.getTotalBytes(), received: 0, state: 'progressing', paused: false, start: Date.now(), end: null };
      this.live.set(id, item);
      this._upsert(rec);
      this.notify('download', { ...rec, isNew: true });
      let last = 0;
      item.on('updated', (_ev, state) => {
        rec.path = item.getSavePath() || rec.path; rec.filename = path.basename(rec.path || rec.filename);
        rec.received = item.getReceivedBytes(); rec.total = item.getTotalBytes();
        rec.state = state === 'interrupted' ? 'interrupted' : 'progressing'; rec.paused = item.isPaused();
        const now = Date.now();
        if (now - last > 250) { last = now; this._upsert(rec); this.notify('download', rec); }
        if (win && !win.isDestroyed()) win.setProgressBar(this._overallProgress());
      });
      item.once('done', (_ev, state) => {
        this.live.delete(id);
        rec.state = state; rec.received = item.getReceivedBytes(); rec.end = Date.now();
        rec.path = item.getSavePath() || rec.path; rec.filename = path.basename(rec.path || rec.filename);
        this._upsert(rec);
        this.notify('download', rec);
        if (win && !win.isDestroyed()) win.setProgressBar(this.live.size ? this._overallProgress() : -1);
      });
    });
  }

  _overallProgress() {
    let r = 0, t = 0;
    for (const item of this.live.values()) { r += item.getReceivedBytes(); t += item.getTotalBytes(); }
    return t > 0 ? r / t : 2; // 2 = chế độ không xác định
  }
  _upsert(rec) {
    const list = this.store.get('downloads').filter((d) => d.id !== rec.id);
    list.push({ ...rec });
    this.store.set('downloads', list);
  }
  list() {
    return this.store.get('downloads').slice().reverse().map((d) => ({ ...d, exists: d.state === 'completed' ? fs.existsSync(d.path) : undefined }));
  }

  async action(act, id) {
    const rec = this.store.get('downloads').find((d) => d.id === id);
    const item = this.live.get(id);
    switch (act) {
      case 'open': if (rec && fs.existsSync(rec.path)) { const err = await shell.openPath(rec.path); if (err) throw new Error(err); } else throw new Error('Tệp không còn tồn tại'); break;
      case 'show': if (rec && fs.existsSync(rec.path)) shell.showItemInFolder(rec.path); else shell.openPath(app.getPath('downloads')); break;
      case 'cancel': item?.cancel(); break;
      case 'pause': item?.pause(); break;
      case 'resume': if (item?.canResume()) item.resume(); break;
      case 'remove': this.store.set('downloads', this.store.get('downloads').filter((d) => d.id !== id)); break;
      case 'clear': this.store.set('downloads', this.store.get('downloads').filter((d) => d.state === 'progressing')); break;
      case 'folder': shell.openPath(this.store.get('settings').downloadDir || app.getPath('downloads')); break;
      case 'choose-dir': {
        const r = await dialog.showOpenDialog({ title: 'Chọn thư mục tải xuống', properties: ['openDirectory', 'createDirectory'] });
        if (!r.canceled && r.filePaths[0]) this.store.update('settings', (s) => ({ ...s, downloadDir: r.filePaths[0] }));
        break;
      }
      default: throw new Error('Thao tác không hợp lệ');
    }
    this.notify('downloads-changed', null);
  }
}

/** Tránh ghi đè: "tệp.pdf" → "tệp (1).pdf" */
function uniquePath(dir, name) {
  const safe = (name || 'tep-tai-ve').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 200);
  const ext = path.extname(safe), base = safe.slice(0, safe.length - ext.length);
  let p = path.join(dir, safe);
  for (let i = 1; fs.existsSync(p) && i < 1000; i++) p = path.join(dir, `${base} (${i})${ext}`);
  return p;
}

module.exports = { Downloads, uniquePath };
