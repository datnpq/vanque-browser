// Chạy tự kiểm thử end-to-end: node test/e2e.js [light|dark]  → ảnh + báo cáo trong test/shots/
// Kèm một máy chủ tuvi.work giả lập để thử đăng nhập và đồng bộ sổ lá số.
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron'); // đường dẫn tới tệp thực thi Electron
const { startMockTuvi } = require('./mock-tuvi.js');

(async () => {
  const theme = ['dark', 'light'].includes(process.argv[2]) ? process.argv[2] : 'light';
  const mock = await startMockTuvi();
  const env = { ...process.env, VQ_AUTOTEST: path.join(__dirname, 'shots'), VQ_THEME: theme, VQ_TUVI_BASE: mock.base, VQ_TUVI_KEY: mock.apiKey };
  const child = spawn(electron, [path.join(__dirname, '..')], { env, stdio: 'inherit' });
  child.on('exit', async (code) => {
    const pushed = [...mock.charts.values()].map((c) => c.chartKey);
    console.log(`  máy chủ giả: ${mock.log.length} yêu cầu · lá số trên máy chủ: ${pushed.join(', ') || '—'}`);
    await mock.close();
    process.exit(code ?? 1);
  });
})();
