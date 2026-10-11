// Cầu nối an toàn giữa vỏ trình duyệt và tiến trình chính (chạy trong sandbox)
const { contextBridge, ipcRenderer } = require('electron');

const on = (channel) => (cb) => { const fn = (_e, d) => cb(d); ipcRenderer.on(channel, fn); return () => ipcRenderer.removeListener(channel, fn); };

contextBridge.exposeInMainWorld('vq', {
  boot: () => ipcRenderer.invoke('boot'),
  api: (route, query, body) => ipcRenderer.invoke('api', route, query, body),
  win: (act) => ipcRenderer.send('win', act),
  replyPermission: (r) => ipcRenderer.send('permission-reply', r),
  downloadAction: (act, id) => ipcRenderer.invoke('download-action', act, id),
  onOpenTab: on('open-tab'),
  onShortcut: on('shortcut'),
  onWinState: on('win-state'),
  onStoreChanged: on('store-changed'),
  onSystemTheme: on('system-theme'),
  onPermission: on('permission-request'),
  onDownload: on('download'),
  onDownloadsChanged: on('downloads-changed'),
  platform: process.platform,
});
