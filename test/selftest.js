// Kiểm tra nhanh lõi lý số với các mốc đã biết
const VQ = require('../src/pages/lib/lyso.js');
let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? '✔' : '✘'} ${label}: ${JSON.stringify(got)}${ok ? '' : '  (mong đợi ' + JSON.stringify(want) + ')'}`);
};
const L = (d, m, y) => { const r = VQ.solar2lunar(d, m, y); return [r.day, r.month, r.year, r.leap]; };

eq('Tết Giáp Thìn 10/2/2024', L(10, 2, 2024), [1, 1, 2024, 0]);
eq('Tết Ất Tỵ 29/1/2025', L(29, 1, 2025), [1, 1, 2025, 0]);
eq('Tết Bính Ngọ 17/2/2026', L(17, 2, 2026), [1, 1, 2026, 0]);
eq('Nhuận 6/2025 (25/7/2025)', L(25, 7, 2025), [1, 6, 2025, 1]);
eq('Âm→Dương 1/1/2024', VQ.lunar2solar(1, 1, 2024), { day: 10, month: 2, year: 2024 });
eq('Ngày 1/1/2000 = Mậu Ngọ', VQ.dayInfo(1, 1, 2000).day.text, 'Mậu Ngọ');
eq('Năm 2024 = Giáp Thìn', VQ.dayInfo(1, 6, 2024).year.text, 'Giáp Thìn');
eq('Nạp âm Giáp Tý', VQ.napAm(0, 0), 'Hải Trung Kim');
eq('Nạp âm Canh Ngọ (1990)', VQ.napAm(6, 6), 'Lộ Bàng Thổ');
eq('Cung phi nam 1990', VQ.cungPhi(1990, 'nam').quai, 'Khảm');
eq('Cung phi nữ 1990', VQ.cungPhi(1990, 'nu').quai, 'Cấn');
eq('Cung phi nam 1984', VQ.cungPhi(1984, 'nam').quai, 'Đoài');
eq('Phi tinh 2024 trung cung', VQ.yearStar(2024), 3);
const tt = VQ.tuTru(4, 2, 2024, 18, 0, 'nam');
eq('Tứ trụ 4/2/2024 18h (sau Lập Xuân 16:27)', tt.pillars.map((p) => p.text), ['Giáp Thìn', 'Bính Dần', 'Mậu Tuất', 'Tân Dậu']);
const tt2 = VQ.tuTru(4, 2, 2024, 10, 0, 'nam');
eq('Tứ trụ 4/2/2024 10h (trước Lập Xuân)', tt2.pillars.slice(0, 2).map((p) => p.text), ['Quý Mão', 'Ất Sửu']);
eq('Quẻ Thuần Càn', VQ.hexagram([1, 1, 1, 1, 1, 1]).name, 'Thuần Càn');
eq('Quẻ Địa Thiên Thái', VQ.hexagram([1, 1, 1, 0, 0, 0]).name, 'Địa Thiên Thái');
const ls = VQ.lapLaSo({ lunarDay: 1, lunarMonth: 1, lunarYear: 1990, hour: 0, gender: 'nam' });
eq('Lá số 1/1/1990 giờ Tý: Mệnh tại', VQ.CHI[ls.menh], 'Dần');
console.log('  Cục:', ls.cuc, '· Tử Vi tại', VQ.CHI[ls.tuViAt], '· Bản mệnh', ls.banMenh);
const km = VQ.kyMon(9, 10, 2026, 12);
console.log('  Kỳ Môn 9/10/2026 12h:', km.tiet, km.nguyen, km.label, '· Trực phù', km.trucPhu, '· Trực sử', km.trucSu);
const d = VQ.dayInfo(9, 10, 2026, 12);
console.log('  Hôm nay:', d.lunar.day + '/' + d.lunar.month + '/' + d.lunar.year, d.day.text, d.tietKhi.name, d.ngay);

// ── Lịch: 12 Trực & Nhị thập bát tú (mốc từ baohatinh.vn / quantrimang.com lịch âm) ──
const T = (d, m, y) => VQ.dayInfo(d, m, y).truc.name, U = (d, m, y) => VQ.dayInfo(d, m, y).tu.name;
eq('Trực 1/1/2000 (Mậu Ngọ, tháng Tý)', T(1, 1, 2000), 'Phá');
eq('Trực 3/2/2025 (ngày Lập Xuân)', T(3, 2, 2025), 'Trừ');
eq('Trực 4/2/2025 (Giáp Thìn)', T(4, 2, 2025), 'Mãn');
eq('Trực 10/10/2026 (Đinh Tỵ)', T(10, 10, 2026), 'Nguy');
eq('Sao 28 tú 1/1/2000', U(1, 1, 2000), 'Vị');
eq('Sao 28 tú 4/2/2025', U(4, 2, 2025), 'Dực');
eq('Sao 28 tú 10/10/2026', U(10, 10, 2026), 'Liễu');
eq('Sao 28 tú 28/2/2017', U(28, 2, 2017), 'Thất');
eq('Phi tinh đổi tại Lập Xuân (20/1/2026 vẫn là năm 2025)', [VQ.yearStarAt(20, 1, 2026), VQ.yearStarAt(5, 2, 2026)], [2, 1]);
eq('Giờ hoàng đạo ngày Tý', VQ.gioHoangDao(0), [0, 1, 3, 6, 8, 9]);

// ── Tử Vi: khóa vị trí sao cho lá số Canh Ngọ 1/1/1990 giờ Tý, nam, xem năm 2026 ──
// Mỗi vị trí đã được đối chiếu tay theo công thức (tracuulasotuvi.com, lasotuvi): Lộc Tồn Canh→Thân, vòng Bác Sĩ thuận (Dương Nam)…
const where = (ls, star) => { const i = ls.palaces.findIndex((p) => [...p.chinh, ...p.phu, ...p.sat, ...p.luu].includes(star)); return i < 0 ? null : VQ.CHI[i]; };
const ls2 = VQ.lapLaSo({ lunarDay: 1, lunarMonth: 1, lunarYear: 1990, hour: 0, gender: 'nam', viewYear: 2026 });
const want = { 'Tử Vi': 'Ngọ', 'Thiên Phủ': 'Tuất', 'Lộc Tồn': 'Thân', 'Kình Dương': 'Dậu', 'Đà La': 'Mùi', 'Tả Phù': 'Thìn', 'Hữu Bật': 'Tuất',
  'Văn Xương': 'Tuất', 'Văn Khúc': 'Thìn', 'Thiên Mã': 'Thân', 'Tam Thai': 'Thìn', 'Bát Tọa': 'Tuất', 'Thai Phụ': 'Ngọ', 'Phong Cáo': 'Dần',
  'Thiên Tài': 'Thân', 'Thiên Thọ': 'Thân', 'Đẩu Quân': 'Ngọ', 'Quốc Ấn': 'Thìn', 'Đường Phù': 'Sửu', 'Bác Sĩ': 'Thân', 'Lực Sĩ': 'Dậu',
  'Thái Tuế': 'Ngọ', 'Tang Môn': 'Thân', 'Bạch Hổ': 'Dần', 'Thiên Khôi': 'Ngọ', 'Thiên Việt': 'Dần', 'Hoa Cái': 'Tuất', 'Kiếp Sát': 'Hợi',
  'Phá Toái': 'Tỵ', 'Thiên La': 'Thìn', 'Địa Võng': 'Tuất', 'L.Thái Tuế': 'Ngọ', 'L.Lộc Tồn': 'Tỵ' };
eq('Tử Vi: vị trí ' + Object.keys(want).length + ' sao', Object.fromEntries(Object.keys(want).map((k) => [k, where(ls2, k)])), want);
eq('Tử Vi: Cục / Thân', [ls2.cuc, VQ.CHI[ls2.than]], ['Thổ Ngũ Cục', 'Dần']);
eq('Tử Vi: Tuần / Triệt (Canh Ngọ)', [ls2.palaces.filter((p) => p.tuan).map((p) => p.chiName), ls2.palaces.filter((p) => p.triet).map((p) => p.chiName)], [['Tuất', 'Hợi'], ['Ngọ', 'Mùi']]); // Canh Ngọ thuộc tuần Giáp Tý → không vong Tuất Hợi
const nStars = ls2.palaces.reduce((a, p) => a + p.chinh.length + p.phu.length + p.sat.length, 0);
eq('Tử Vi: tổng số sao ≥ 90 (chưa kể sao lưu)', nStars >= 90, true);
eq('Tử Vi: Tứ Hóa lưu niên Bính (2026)', ls2.palaces.flatMap((p) => p.hoa.filter((x) => x.luu).map((x) => x.star)).sort(), ['Liêm Trinh', 'Thiên Cơ', 'Thiên Đồng', 'Văn Xương'].sort());

// ── Tử Bình ──
eq('Tử Bình: nguyệt lệnh Mậu sinh tháng Dần = Tử', tt.lenh, 'Tử');
eq('Tử Bình: không vong ngày Mậu Tuất', tt.khongVong, ['Thìn', 'Tỵ']);
eq('Tử Bình: thần sát', tt.thanSat.map((x) => x.name + ':' + x.at.join('+')), ['Dịch Mã:Tháng', 'Đào Hoa:Giờ', 'Hoa Cái:Năm+Ngày']);
eq('Tử Bình: quan hệ có Thìn Tuất xung & Bính Tân hợp', ['Thìn Tuất lục xung', 'Bính Tân hợp hóa Thủy'].every((t) => tt.quanHe.some((q) => q.text.startsWith(t))), true);
eq('Lưu niên 2026 với Nhật chủ Mậu', [VQ.luuNien(2026, tt.dayCan).text, VQ.luuNien(2026, tt.dayCan).thapThan], ['Bính Ngọ', 'Thiên Ấn']);

// ── Kinh Dịch: Thể – Dụng (Mai Hoa) ──
const td = VQ.docQue([9, 7, 7, 8, 8, 8]).theDung;
eq('Thái động hào 1 → Thể Khôn (Thổ) sinh Dụng Càn (Kim)', [td.the.name, td.dung.name, td.rel], ['Khôn', 'Càn', 'Thể sinh Dụng']);
eq('Quẻ tĩnh không có Thể–Dụng', VQ.docQue([7, 7, 7, 8, 8, 8]).theDung, null);
eq('Biến quẻ Thái động hào 1 = Địa Phong Thăng', VQ.docQue([9, 7, 7, 8, 8, 8]).bien.name, 'Địa Phong Thăng');

// ── Bát Trạch ──
eq('Cung phi nam 2000 / nữ 2000', [VQ.cungPhi(2000, 'nam').quai, VQ.cungPhi(2000, 'nu').quai], ['Ly', 'Càn']);
eq('Khảm mệnh: Sinh Khí hướng Đông Nam', VQ.batTrach(1)[0].dirName, 'Đông Nam');

// ── Vỏ trình duyệt: phím tắt dùng chung ──
const { shortcutOf } = require('../src/shell/keys.js');
const K = (key, m = {}) => shortcutOf({ key, ...m });
eq('Phím tắt', [K('t', { control: true }), K('T', { control: true, shift: true }), K('d', { control: true, shift: true }), K('h', { control: true }),
  K('ArrowLeft', { alt: true }), K('F5'), K('F5', { shift: true }), K('a')], ['new', 'reopen', 'theme', 'history', 'back', 'reload', 'hard-reload', null]);

// ── Kho dữ liệu (tiến trình chính) ──
const fs = require('fs'), os = require('os'), path = require('path');
const { Store } = require('../src/main/store.js');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vq-store-'));
const st = new Store(dir);
st.addHistory('https://vi.wikipedia.org/wiki/Kinh_Dịch', 'Kinh Dịch – Wikipedia');
st.addHistory('https://vi.wikipedia.org/wiki/Kinh_Dịch', 'Kinh Dịch – Wikipedia'); // gộp lượt ghé liên tiếp
st.addHistory('https://example.com/', 'Example');
eq('Lịch sử: gộp lượt ghé liền nhau', st.get('history').length, 2);
eq('Gợi ý: tìm không dấu “kinh dich”', st.suggest('kinh dich').map((x) => x.title), ['Kinh Dịch – Wikipedia']);
st.flush();
eq('Kho: ghi ra đĩa và đọc lại', new Store(dir).get('history').length, 2);
fs.writeFileSync(path.join(dir, 'settings.json'), '{hỏng');
eq('Kho: tệp hỏng → dùng mặc định', new Store(dir).get('settings').searchEngine, 'google');
fs.rmSync(dir, { recursive: true, force: true });

// ── Tài khoản tuvi.work: đăng nhập PKCE qua loopback + đồng bộ sổ lá số (với máy chủ giả lập) ──
(async () => {
  const { Account } = require('../src/main/account.js');
  const { startMockTuvi } = require('./mock-tuvi.js');
  const mock = await startMockTuvi();
  const adir = fs.mkdtempSync(path.join(os.tmpdir(), 'vq-acct-'));
  const ast = new Store(adir);
  const crypt = { available: () => true, encrypt: (t) => 'enc:' + Buffer.from(t).toString('base64'), decrypt: (b) => Buffer.from(b.slice(4), 'base64').toString() };
  const mk = (o = {}) => new Account({ store: ast, base: mock.base, apiKey: mock.apiKey, fetch, crypt, open: (u) => fetch(u).then((r) => r.text()), ...o });
  try {
    const acc = mk();
    eq('Tài khoản: chưa cấu hình khóa → không cho đăng nhập', await mk({ apiKey: 'VANQUE-KHOA-CHUA-CAP' }).login().then(() => 'đăng nhập', (e) => e.status), 503);
    // Lá số lập khi chưa đăng nhập vẫn ở trong sổ, chưa có chartKey
    const local = acc.saveChart({ ten: 'Mẹ', ngay: 1, thang: 1, nam: 1990, gio: 1, gioi_tinh: 'nu' });
    acc.saveChart({ ten: 'Mẹ', ngay: 1, thang: 1, nam: 1990, gio: 1, gioi_tinh: 'nu' });
    eq('Sổ lá số: lưu trùng ngày giờ → gộp một mục', [acc.charts().length, local.chartKey], [1, null]);
    mock.addRemote({ ten: 'Con', lich: 'am', ngay: 5, thang: 3, nam: 2015, gio: 7, gioi_tinh: 'nam' });

    const st1 = await acc.login();
    eq('Đăng nhập: có người dùng, token lưu dạng mã hóa', [st1.signedIn, st1.user.email, ast.get('auth').token.startsWith('enc:'), JSON.stringify(st1).includes('|')], [true, 'thu@tuvi.work', true, false]);
    await new Promise((r) => setTimeout(r, 50)); await acc.sync();
    const keys = acc.charts().map((c) => c.chartKey).sort();
    eq('Đồng bộ: đẩy lá số cục bộ + kéo lá số từ thiết bị khác', keys, ['ls:1990-1-1-1-nu', 'ls:2015-3-5-7-nam']);
    eq('Đồng bộ: máy chủ có lá số đẩy lên, kèm can chi', [mock.charts.get('ls:1990-1-1-1-nu')?.ten, acc.charts().find((c) => c.ten === 'Mẹ').can_chi], ['Mẹ', 'Canh Ngọ']);

    const con = acc.charts().find((c) => c.ten === 'Con');
    acc.removeChart(con.id); await acc.sync();
    eq('Đồng bộ: xóa lá số → máy chủ giữ tombstone', [acc.charts().length, mock.charts.get('ls:2015-3-5-7-nam').deleted], [1, true]);

    mock.charts.get('ls:1990-1-1-1-nu').ten = 'Mẹ yêu'; mock.charts.get('ls:1990-1-1-1-nu').version = 999;
    await acc.sync();
    eq('Đồng bộ: kéo thay đổi tên từ máy chủ theo cursor', acc.charts()[0].ten, 'Mẹ yêu');

    mock.tokens.clear(); // token bị thu hồi ở máy chủ
    await acc.sync().catch(() => {});
    eq('Token bị thu hồi → tự đăng xuất, giữ sổ lá số', [acc.state().signedIn, acc.charts().length, !!acc.state().error], [false, 1, true]);

    await acc.login();
    const realKey = acc.apiKey; acc.apiKey = 'khoa-sai';
    await acc.sync().catch(() => {});
    eq('401 do khóa API sai → không xóa phiên đăng nhập', acc.state().signedIn, true);
    acc.apiKey = realKey;
    await acc.logout({ keep: true });
    eq('Đăng xuất (giữ sổ): xóa token, lá số ở lại máy, gắn chủ cũ', [acc.state().signedIn, ast.get('auth').token, acc.charts().length, acc.charts()[0].owner], [false, undefined, 1, 7]);
    const before = mock.log.filter((l) => l === 'PUT /api/v1/charts').length;
    ast.set('laSo', ast.get('laSo').map((c) => ({ ...c, owner: 99 }))); // như thể của tài khoản khác
    await acc.login(); await new Promise((r) => setTimeout(r, 50)); await acc.sync();
    eq('Tài khoản khác đăng nhập → không đẩy sổ của người trước', [before > 0, mock.log.filter((l) => l === 'PUT /api/v1/charts').length - before, acc.charts().length], [true, 0, 2]); // 2 = lá số của người trước (chỉ trên máy) + lá số kéo về của tài khoản này
    await acc.logout({ keep: false });
    eq('Đăng xuất (xóa sổ): sổ lá số trống', acc.charts().length, 0);

    const denied = await startMockTuvi({ deny: true });
    eq('Từ chối ở trang xin phép → báo lỗi, không đăng nhập', await mk({ base: denied.base }).login().then(() => 'ok', (e) => e.message.includes('từ chối')), true);
    await denied.close();

    const noCrypt = mk({ crypt: { available: () => false, encrypt: () => { throw new Error('x'); }, decrypt: () => null } });
    await noCrypt.login();
    eq('Không mã hóa được → token chỉ giữ trong bộ nhớ', [noCrypt.state().signedIn, noCrypt.state().persistent, ast.get('auth').token], [true, false, undefined]);
  } catch (e) { fail++; console.log('✘ Tài khoản: lỗi bất ngờ', e); }
  finally { await mock.close(); ast.flush(); fs.rmSync(adir, { recursive: true, force: true }); }

  console.log(fail ? `\n${fail} kiểm tra thất bại` : '\nTất cả đều đạt ✦');
  process.exit(fail ? 1 : 0);
})();
