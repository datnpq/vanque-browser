/*!
 * Vân Quẻ · Lý Số Core
 * Âm lịch (thuật toán Hồ Ngọc Đức), Can Chi, Tiết Khí, Nạp Âm, Tứ Trụ (Tử Bình),
 * Tử Vi Đẩu Số (an sao cơ bản), Bát Trạch, Cửu Tinh Phi Tinh, Kỳ Môn Độn Giáp (chuyển bàn),
 * Kinh Dịch (64 quẻ, gieo xu, Mai Hoa).
 */
(function (root) {
  'use strict';
  const PI = Math.PI, INT = Math.floor, TZ = 7;
  const mod = (a, n) => ((a % n) + n) % n;

  // ───────────────────────── Danh mục ─────────────────────────
  const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const CON_GIAP = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];
  const HANH = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'];
  const CAN_HANH = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const CHI_HANH = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const TANG_CAN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
  const TIET_KHI = ['Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng', 'Hạ Chí', 'Tiểu Thử',
    'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết',
    'Đại Tuyết', 'Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập'];
  const NAP_AM = ['Hải Trung Kim', 'Lư Trung Hỏa', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Kiếm Phong Kim', 'Sơn Đầu Hỏa',
    'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Bạch Lạp Kim', 'Dương Liễu Mộc', 'Tuyền Trung Thủy', 'Ốc Thượng Thổ',
    'Tích Lịch Hỏa', 'Tùng Bách Mộc', 'Trường Lưu Thủy', 'Sa Trung Kim', 'Sơn Hạ Hỏa', 'Bình Địa Mộc',
    'Bích Thượng Thổ', 'Kim Bạch Kim', 'Phú Đăng Hỏa', 'Thiên Hà Thủy', 'Đại Trạch Thổ', 'Thoa Xuyến Kim',
    'Tang Đố Mộc', 'Đại Khê Thủy', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thạch Lựu Mộc', 'Đại Hải Thủy'];
  const GIO_RANGE = ['23h–1h', '1h–3h', '3h–5h', '5h–7h', '7h–9h', '9h–11h', '11h–13h', '13h–15h', '15h–17h', '17h–19h', '19h–21h', '21h–23h'];

  const canChi = (c, z) => CAN[mod(c, 10)] + ' ' + CHI[mod(z, 12)];
  const sexagenary = (c, z) => mod(6 * c - 5 * z, 60);           // chỉ số 0..59 trong lục thập hoa giáp
  const napAm = (c, z) => NAP_AM[INT(sexagenary(c, z) / 2)];
  const napAmHanh = (c, z) => HANH.indexOf(napAm(c, z).split(' ').pop());

  // ───────────────────────── Âm lịch (Hồ Ngọc Đức) ─────────────────────────
  function jdFromDate(dd, mm, yy) {
    const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }
  function jdToDate(jd) {
    let b, c;
    if (jd > 2299160) { const a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
    else { b = 0; c = jd + 32082; }
    const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
    return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
  }
  function newMoon(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }
  const getNewMoonDay = (k, tz) => INT(newMoon(k) + 0.5 + tz / 24);
  /** Kinh độ mặt trời (radian) tại thời điểm Julian (UT) */
  function sunLongitudeRad(jdn) {
    const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    return L - PI * 2 * INT(L / (PI * 2));
  }
  const getSunLongitude = (dayNumber, tz) => INT((sunLongitudeRad(dayNumber - 0.5 - tz / 24) / PI) * 6);
  function getLunarMonth11(yy, tz) {
    const off = jdFromDate(31, 12, yy) - 2415021, k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    return nm;
  }
  function getLeapMonthOffset(a11, tz) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last, i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
    return i - 1;
  }
  function solar2lunar(dd, mm, yy, tz = TZ) {
    const dayNumber = jdFromDate(dd, mm, yy), k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, tz);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
    let a11 = getLunarMonth11(yy, tz), b11 = a11, lunarYear;
    if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
    else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
    const lunarDay = dayNumber - monthStart + 1, diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0, lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, tz);
      if (diff >= leapMonthDiff) { lunarMonth = diff + 10; if (diff === leapMonthDiff) lunarLeap = 1; }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap, jd: dayNumber };
  }
  function lunar2solar(ld, lm, ly, leap = 0, tz = TZ) {
    let a11, b11;
    if (lm < 11) { a11 = getLunarMonth11(ly - 1, tz); b11 = getLunarMonth11(ly, tz); }
    else { a11 = getLunarMonth11(ly, tz); b11 = getLunarMonth11(ly + 1, tz); }
    const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let off = lm - 11; if (off < 0) off += 12;
    if (b11 - a11 > 365) {
      const leapOff = getLeapMonthOffset(a11, tz);
      let leapMonth = leapOff - 2; if (leapMonth < 0) leapMonth += 12;
      if (leap && lm !== leapMonth) return null;
      if (leap || off >= leapOff) off += 1;
    } else if (leap) return null;
    const [d, m, y] = jdToDate(getNewMoonDay(k + off, tz) + ld - 1);
    return { day: d, month: m, year: y };
  }
  /** Kinh độ mặt trời (độ) tại giờ địa phương */
  function sunDegAt(dd, mm, yy, hour = 12, minute = 0, tz = TZ) {
    const jdUT = jdFromDate(dd, mm, yy) - 0.5 + (hour + minute / 60 - tz) / 24;
    return (sunLongitudeRad(jdUT) * 180) / PI;
  }
  function tietKhiOf(dd, mm, yy, hour = 12) {
    const deg = sunDegAt(dd, mm, yy, hour);
    return { deg, index: INT(deg / 15), name: TIET_KHI[INT(deg / 15)] };
  }
  /** Giờ chi (0=Tý) từ giờ đồng hồ */
  const hourChi = (h) => INT(((h + 1) % 24) / 2);

  /** Thông tin tổng hợp của một ngày dương lịch */
  function dayInfo(dd, mm, yy, hour = 12) {
    const L = solar2lunar(dd, mm, yy);
    const jd = L.jd, yc = mod(L.year + 6, 10), yz = mod(L.year + 8, 12);
    const dc = mod(jd + 9, 10), dz = mod(jd + 1, 12);
    const mc = mod(2 * yc + 1 + L.month, 10), mz = mod(L.month + 1, 12);
    const hz = hourChi(hour), hc = mod(2 * dc + hz, 10);
    return {
      solar: { day: dd, month: mm, year: yy }, lunar: L, jd,
      year: { can: yc, chi: yz, text: canChi(yc, yz) },
      month: { can: mc, chi: mz, text: canChi(mc, mz) },
      day: { can: dc, chi: dz, text: canChi(dc, dz) },
      hour: { can: hc, chi: hz, text: canChi(hc, hz) },
      weekday: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][mod(jd + 1, 7)],
      tietKhi: tietKhiOf(dd, mm, yy, hour),
      gioHoangDao: gioHoangDao(dz), ngay: ngayHoangDao(L.month, dz),
      truc: thapNhiTruc(dd, mm, yy, dz), tu: nhiThapBatTu(jd),
    };
  }
  // Thập nhị trực: Kiến tại ngày có chi trùng chi tháng tiết khí (tháng Dần bắt đầu từ Lập Xuân; ngày giao tiết tính theo tháng mới)
  const TRUC = [
    ['Kiến', 'Xuất hành, giá thú, khai trương', 'Động thổ, đào giếng'], ['Trừ', 'Trừ bỏ cái cũ, chữa bệnh, dọn dẹp', 'Giá thú, xuất vốn'],
    ['Mãn', 'Cầu tài, khai trương, cúng tế', 'Kiện tụng, nhậm chức'], ['Bình', 'Sửa sang, đổ mái, làm đường', 'Đào mương, khai kênh'],
    ['Định', 'Ký kết, giá thú, nhập học', 'Kiện tụng, xuất hành xa'], ['Chấp', 'Xây dựng, trồng trọt, tuyển người', 'Xuất kho, chuyển nhà'],
    ['Phá', 'Phá dỡ, chữa bệnh', 'Mọi việc lớn — kỵ giá thú, khai trương'], ['Nguy', 'Cúng tế, tu thân', 'Leo cao, đi sông nước, việc mạo hiểm'],
    ['Thành', 'Khai trương, giá thú, nhập trạch, mọi việc', 'Kiện tụng'], ['Thu', 'Thu hoạch, thu nợ, nhập kho', 'An táng, xuất hành'],
    ['Khai', 'Khai trương, nhậm chức, giá thú, xuất hành', 'An táng, động thổ'], ['Bế', 'Đắp đê, lấp hố, xây tường', 'Khai trương, chữa mắt, xuất hành']];
  function thapNhiTruc(dd, mm, yy, dz) {
    const monthChi = mod(INT(mod(sunDegAt(dd, mm, yy, 23, 59) - 315, 360) / 30) + 2, 12);
    const i = mod(dz - monthChi, 12);
    return { index: i, name: TRUC[i][0], nen: TRUC[i][1], ky: TRUC[i][2] };
  }
  // Nhị thập bát tú: chỉ số = (JDN + 11) mod 28, Giác = 0 (khớp chu kỳ Thất Diệu theo thứ trong tuần)
  const TU28 = [['Giác', 'Mộc'], ['Cang', 'Kim'], ['Đê', 'Thổ'], ['Phòng', 'Nhật'], ['Tâm', 'Nguyệt'], ['Vĩ', 'Hỏa'], ['Cơ', 'Thủy'],
    ['Đẩu', 'Mộc'], ['Ngưu', 'Kim'], ['Nữ', 'Thổ'], ['Hư', 'Nhật'], ['Nguy', 'Nguyệt'], ['Thất', 'Hỏa'], ['Bích', 'Thủy'],
    ['Khuê', 'Mộc'], ['Lâu', 'Kim'], ['Vị', 'Thổ'], ['Mão', 'Nhật'], ['Tất', 'Nguyệt'], ['Chủy', 'Hỏa'], ['Sâm', 'Thủy'],
    ['Tỉnh', 'Mộc'], ['Quỷ', 'Kim'], ['Liễu', 'Thổ'], ['Tinh', 'Nhật'], ['Trương', 'Nguyệt'], ['Dực', 'Hỏa'], ['Chẩn', 'Thủy']];
  const TU_PHUONG = ['Đông Phương Thanh Long', 'Bắc Phương Huyền Vũ', 'Tây Phương Bạch Hổ', 'Nam Phương Chu Tước'];
  function nhiThapBatTu(jd) {
    const i = mod(jd + 11, 28);
    return { index: i, name: TU28[i][0], dieu: TU28[i][1], phuong: TU_PHUONG[INT(i / 7)], full: `${TU28[i][0]} ${TU28[i][1]}` };
  }
  // Giờ hoàng đạo theo chi ngày
  const GHD = { 0: [0, 1, 3, 6, 8, 9], 1: [2, 3, 5, 8, 10, 11], 2: [0, 1, 4, 5, 7, 10], 3: [0, 2, 3, 6, 7, 9], 4: [2, 4, 5, 8, 9, 11], 5: [1, 4, 6, 7, 10, 11] };
  const gioHoangDao = (dz) => GHD[dz % 6];
  const TRUC_THAN = [['Thanh Long', 1], ['Minh Đường', 1], ['Thiên Hình', 0], ['Chu Tước', 0], ['Kim Quỹ', 1], ['Kim Đường', 1],
    ['Bạch Hổ', 0], ['Ngọc Đường', 1], ['Thiên Lao', 0], ['Huyền Vũ', 0], ['Tư Mệnh', 1], ['Câu Trận', 0]];
  function ngayHoangDao(lunarMonth, dz) {
    const start = [0, 2, 4, 6, 8, 10][(lunarMonth - 1) % 6];
    const t = TRUC_THAN[mod(dz - start, 12)];
    return { than: t[0], hoangDao: !!t[1] };
  }

  // ───────────────────────── Tứ Trụ · Tử Bình ─────────────────────────
  const THAP_THAN = [['Tỷ Kiên', 'Kiếp Tài'], ['Thực Thần', 'Thương Quan'], ['Thiên Tài', 'Chính Tài'], ['Thất Sát', 'Chính Quan'], ['Thiên Ấn', 'Chính Ấn']];
  function thapThan(dayCan, c) {
    const rel = mod(CAN_HANH[c] - CAN_HANH[dayCan], 5);
    return THAP_THAN[rel][(dayCan % 2) === (c % 2) ? 0 : 1];
  }
  const TRUONG_SINH = ['Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];
  const TS_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // vị trí Trường Sinh của 10 can
  function vongTruongSinh(c, z) {
    const s = TS_START[c];
    return TRUONG_SINH[c % 2 === 0 ? mod(z - s, 12) : mod(s - z, 12)];
  }
  function tuTru(dd, mm, yy, hour, minute = 0, gender = 'nam') {
    const deg = sunDegAt(dd, mm, yy, hour, minute);
    const m = INT(mod(deg - 315, 360) / 30); // 0 = tháng Dần (Lập Xuân)
    let y = yy; if (mm <= 2 && m >= 10) y = yy - 1;
    const yc = mod(y - 4, 10), yz = mod(y - 4, 12);
    const mc = mod(2 * yc + 2 + m, 10), mz = mod(m + 2, 12);
    let jd = jdFromDate(dd, mm, yy); if (hour >= 23) jd += 1; // giờ Tý muộn tính sang ngày mới
    const dc = mod(jd + 9, 10), dz = mod(jd + 1, 12);
    const hz = hourChi(hour), hc = mod(2 * dc + hz, 10);
    const pillars = [['Năm', yc, yz], ['Tháng', mc, mz], ['Ngày', dc, dz], ['Giờ', hc, hz]].map(([label, c, z]) => ({
      label, can: c, chi: z, text: canChi(c, z), napAm: napAm(c, z),
      canHanh: HANH[CAN_HANH[c]], chiHanh: HANH[CHI_HANH[z]],
      thapThan: label === 'Ngày' ? 'Nhật Chủ' : thapThan(dc, c),
      tangCan: TANG_CAN[z].map((t) => ({ can: CAN[t], hanh: HANH[CAN_HANH[t]], thapThan: thapThan(dc, t) })),
      truongSinh: vongTruongSinh(dc, z),
    }));
    // Lực lượng ngũ hành: can 1.0; tàng can chính khí 1.0 · trung khí 0.5 · dư khí 0.3; chi tháng (nguyệt lệnh) ×2
    const count = [0, 0, 0, 0, 0];
    pillars.forEach((p, pi) => {
      count[CAN_HANH[p.can]] += 1;
      const w = pi === 1 ? 2 : 1;
      TANG_CAN[p.chi].forEach((t, i) => (count[CAN_HANH[t]] += w * [1, 0.5, 0.3][i]));
    });
    // Đại vận
    const yangYear = yc % 2 === 0, forward = (yangYear && gender === 'nam') || (!yangYear && gender !== 'nam');
    const tietBoundary = findTietBoundary(dd, mm, yy, hour, forward);
    const startAge = Math.max(1, Math.round(tietBoundary / 3));
    const daiVan = [];
    for (let i = 1; i <= 8; i++) {
      const c = mod(mc + (forward ? i : -i), 10), z = mod(mz + (forward ? i : -i), 12);
      daiVan.push({ age: startAge + (i - 1) * 10, text: canChi(c, z), thapThan: thapThan(dc, c), napAm: napAm(c, z) });
    }
    const dm = CAN_HANH[dc];
    const support = count[dm] + count[mod(dm - 1, 5)], drain = count[mod(dm + 1, 5)] + count[mod(dm + 2, 5)] + count[mod(dm + 3, 5)];
    const ratio = support / (support + drain);
    // Vượng – Tướng – Hưu – Tù – Tử của Nhật chủ theo hành chi tháng
    const mh = CHI_HANH[mz], rel = mod(dm - mh, 5);
    const lenh = ['Vượng', 'Tướng', 'Tử', 'Tù', 'Hưu'][rel]; // 0 cùng hành · 1 tháng sinh NC · 2 tháng khắc NC · 3 NC khắc tháng · 4 NC sinh tháng
    const strength = ratio >= 0.56 ? 'Thân vượng (thiên cường)' : ratio <= 0.44 ? 'Thân nhược (thiên nhược)' : 'Trung hòa (cân bằng)';
    const dungThan = ratio >= 0.56 ? [mod(dm + 1, 5), mod(dm + 2, 5), mod(dm + 3, 5)] : ratio <= 0.44 ? [mod(dm - 1, 5), dm] : [mod(dm + 1, 5), mod(dm - 1, 5)];
    return {
      pillars, count: count.map((v, i) => ({ hanh: HANH[i], value: +v.toFixed(1) })),
      nhatChu: { can: CAN[dc], hanh: HANH[dm], amDuong: dc % 2 ? 'Âm' : 'Dương' },
      strength, support: +support.toFixed(1), drain: +drain.toFixed(1), ratio: +ratio.toFixed(3), lenh, dacLenh: rel <= 1,
      dungThan: dungThan.map((i) => HANH[i]),
      thanSat: thanSatTuTru(pillars, dc, yz, dz), quanHe: quanHeTuTru(pillars),
      khongVong: [mod(dz - dc + 10, 12), mod(dz - dc + 11, 12)].map((z) => CHI[z]),
      daiVan, forward, startAge, tietKhi: TIET_KHI[INT(deg / 15)], dayCan: dc,
    };
  }
  /** Thần sát cơ bản của bát tự (theo can ngày, chi năm / chi ngày) */
  function thanSatTuTru(pillars, dc, yz, dz) {
    const QUY_NHAN = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [3, 5], [3, 5]][dc];
    const triad = (z) => z % 4; // 0 Thân Tý Thìn · 1 Tỵ Dậu Sửu · 2 Dần Ngọ Tuất · 3 Hợi Mão Mùi
    const MA = [2, 11, 8, 5], DAO = [9, 6, 3, 0], CAI = [4, 1, 10, 7];
    const defs = [
      ['Thiên Ất Quý Nhân', 'Quý nhân phù trợ, gặp dữ hóa lành', (z) => QUY_NHAN.includes(z)],
      ['Văn Xương', 'Thông minh, học hành, văn chương', (z) => z === [5, 6, 8, 9, 8, 9, 11, 0, 2, 3][dc]],
      ['Lộc Thần', 'Lộc ăn, tài lộc tự đến', (z) => z === [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][dc]],
      ['Dương Nhận', 'Cương mãnh, quyết đoán — dễ va chạm', (z) => dc % 2 === 0 && z === [3, 0, 6, 0, 6, 0, 9, 0, 0, 0][dc]],
      ['Dịch Mã', 'Di chuyển, đi xa, thay đổi', (z) => z === MA[triad(yz)] || z === MA[triad(dz)]],
      ['Đào Hoa', 'Duyên dáng, giao tế, tình cảm', (z) => z === DAO[triad(yz)] || z === DAO[triad(dz)]],
      ['Hoa Cái', 'Nghệ thuật, tôn giáo, cô độc thanh cao', (z) => z === CAI[triad(yz)] || z === CAI[triad(dz)]],
    ];
    return defs.map(([name, desc, test]) => ({ name, desc, at: pillars.filter((p) => test(p.chi)).map((p) => p.label) })).filter((x) => x.at.length);
  }
  /** Hợp – xung – hình – hại giữa các can chi trong tứ trụ */
  function quanHeTuTru(pillars) {
    const out = [], P = pillars;
    const TAM_HOP = [[[8, 0, 4], 'Thủy'], [[11, 3, 7], 'Mộc'], [[2, 6, 10], 'Hỏa'], [[5, 9, 1], 'Kim']];
    const TAM_HOI = [[[2, 3, 4], 'Mộc'], [[5, 6, 7], 'Hỏa'], [[8, 9, 10], 'Kim'], [[11, 0, 1], 'Thủy']];
    const HOP_HOA = ['Thổ', 'Kim', 'Thủy', 'Mộc', 'Hỏa'];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const a = P[i], b = P[j], pair = `${a.label}–${b.label}`;
      if (mod(a.can - b.can, 10) === 5 || mod(b.can - a.can, 10) === 5) out.push({ type: 'hợp', text: `${CAN[a.can]} ${CAN[b.can]} hợp hóa ${HOP_HOA[Math.min(a.can, b.can) % 5]} (${pair})` });
      if (Math.abs(a.can - b.can) === 6 && a.can % 5 !== 4) out.push({ type: 'xung', text: `${CAN[a.can]} ${CAN[b.can]} tương xung (${pair})` });
      const x = a.chi, y = b.chi;
      if (mod(x + y, 12) === 1) out.push({ type: 'hợp', text: `${CHI[x]} ${CHI[y]} lục hợp (${pair})` });
      if (mod(x - y, 12) === 6) out.push({ type: 'xung', text: `${CHI[x]} ${CHI[y]} lục xung (${pair})` });
      if (mod(x + y, 12) === 7) out.push({ type: 'hại', text: `${CHI[x]} ${CHI[y]} lục hại (${pair})` });
      if ((x === 0 && y === 3) || (x === 3 && y === 0)) out.push({ type: 'hình', text: `Tý Mão vô lễ chi hình (${pair})` });
      if (x === y && [4, 6, 9, 11].includes(x)) out.push({ type: 'hình', text: `${CHI[x]} tự hình (${pair})` });
    }
    const zs = P.map((p) => p.chi);
    for (const [g, hanh] of TAM_HOP) {
      const n = g.filter((z) => zs.includes(z)).length;
      if (n === 3) out.push({ type: 'hợp', text: `${g.map((z) => CHI[z]).join(' ')} tam hợp ${hanh} cục` });
      else if (n === 2 && zs.includes(g[1])) out.push({ type: 'hợp', text: `${g.filter((z) => zs.includes(z)).map((z) => CHI[z]).join(' ')} bán hợp ${hanh}` });
    }
    for (const [g, hanh] of TAM_HOI) if (g.every((z) => zs.includes(z))) out.push({ type: 'hợp', text: `${g.map((z) => CHI[z]).join(' ')} tam hội ${hanh} phương` });
    for (const g of [[2, 5, 8], [1, 10, 7]]) if (g.every((z) => zs.includes(z))) out.push({ type: 'hình', text: `${g.map((z) => CHI[z]).join(' ')} tam hình` });
    return out;
  }
  /** Can chi năm theo Lập Xuân + thập thần so với Nhật chủ (lưu niên) */
  function luuNien(year, dayCan) {
    const c = mod(year - 4, 10), z = mod(year - 4, 12);
    return { year, can: c, chi: z, text: canChi(c, z), napAm: napAm(c, z), thapThan: thapThan(dayCan, c), chiThapThan: thapThan(dayCan, TANG_CAN[z][0]) };
  }
  /** Số ngày đến tiết (Tiết lệnh, bội 30° tính từ 315°) kế tiếp / trước đó */
  function findTietBoundary(dd, mm, yy, hour, forward) {
    const jd0 = jdFromDate(dd, mm, yy) - 0.5 + (hour - TZ) / 24;
    const deg0 = (sunLongitudeRad(jd0) * 180) / PI;
    const seg = INT(mod(deg0 - 315, 360) / 30);
    const target = mod(315 + (forward ? seg + 1 : seg) * 30, 360);
    for (let i = 0; i <= 3200; i++) {
      const t = jd0 + (forward ? i : -i) / 100;
      const d = (sunLongitudeRad(t) * 180) / PI;
      if (Math.abs(mod(d - target + 180, 360) - 180) < 0.012) return i / 100;
    }
    return 15;
  }

  // ───────────────────────── Tử Vi Đẩu Số ─────────────────────────
  const CUNG = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'];
  const CUC = { 4: ['Thủy Nhị Cục', 2], 0: ['Mộc Tam Cục', 3], 3: ['Kim Tứ Cục', 4], 2: ['Thổ Ngũ Cục', 5], 1: ['Hỏa Lục Cục', 6] };
  const TU_HOA = [
    ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
    ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
    ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'], ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
    ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'], ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
    ['Thiên Lương', 'Tử Vi', 'Tả Phù', 'Vũ Khúc'], ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang']];
  const HOA_NAME = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
  // Miếu (M) Vượng (V) Đắc (Đ) Bình (B) Hãm (H) theo chi Tý..Hợi
  const BRIGHT = {
    'Tử Vi': 'BĐMBVMMĐMBVB', 'Thiên Cơ': 'ĐĐHMMVĐĐVMMH', 'Thái Dương': 'HĐVVVMMĐHHHH', 'Vũ Khúc': 'VMVĐMHVMVĐMH',
    'Thiên Đồng': 'VHMĐHĐHHMHHĐ', 'Liêm Trinh': 'VĐVHMHVĐVHMH', 'Thiên Phủ': 'MBMBVĐMĐVĐVĐ', 'Thái Âm': 'VĐHHHHHĐVMMM',
    'Tham Lang': 'HMĐHVHHMĐHVH', 'Cự Môn': 'VHVMHHVHĐMHĐ', 'Thiên Tướng': 'VĐMHVĐVĐMHVĐ', 'Thiên Lương': 'VĐVVMHMĐVHMH',
    'Thất Sát': 'MĐMHHVMĐMHHV', 'Phá Quân': 'MVHHĐHMVHHĐH',
  };
  const BAC_SI = [['Bác Sĩ', 1], ['Lực Sĩ', 1], ['Thanh Long', 1], ['Tiểu Hao', 0], ['Tướng Quân', 1], ['Tấu Thư', 1],
    ['Phi Liêm', 0], ['Hỷ Thần', 1], ['Bệnh Phù', 0], ['Đại Hao', 0], ['Phục Binh', 0], ['Quan Phủ', 0]];
  const THAI_TUE = [['Thái Tuế', 0], ['Thiếu Dương', 1], ['Tang Môn', 0], ['Thiếu Âm', 1], ['Quan Phù', 0], ['Tử Phù', 0],
    ['Tuế Phá', 0], ['Long Đức', 1], ['Bạch Hổ', 0], ['Phúc Đức', 1], ['Điếu Khách', 0], ['Trực Phù', 0]];
  function lapLaSo({ name = '', lunarDay, lunarMonth, lunarYear, hour, gender = 'nam', solar = null, viewYear = null }) {
    const Y = mod(lunarYear - 4, 10), YZ = mod(lunarYear - 4, 12), h = hour, m = lunarMonth, d = lunarDay;
    const menh = mod(2 + (m - 1) - h, 12), than = mod(2 + (m - 1) + h, 12);
    const danCan = mod(2 * Y + 2, 10);
    const palaces = Array.from({ length: 12 }, (_, z) => ({
      chi: z, chiName: CHI[z], can: mod(danCan + mod(z - 2, 12), 10), name: '', isThan: z === than,
      chinh: [], phu: [], sat: [], luu: [], hoa: [], truongSinh: '', daiHan: 0, tieuHan: '',
    }));
    palaces.forEach((p) => { p.canName = CAN[p.can]; p.name = CUNG[mod(p.chi - menh, 12)]; });
    const menhP = palaces[menh];
    const cucH = napAmHanh(menhP.can, menh), [cucName, cucNum] = CUC[cucH];
    // An Tử Vi
    let q = 1; while (q * cucNum < d) q++;
    const diff = q * cucNum - d;
    const tv = mod(2 + q - 1 + (diff % 2 === 0 ? diff : -diff), 12);
    const tf = mod(4 - tv, 12);
    const put = (z, star, list = 'chinh') => palaces[mod(z, 12)][list].push(star);
    [['Tử Vi', 0], ['Thiên Cơ', -1], ['Thái Dương', -3], ['Vũ Khúc', -4], ['Thiên Đồng', -5], ['Liêm Trinh', -8]].forEach(([s, o]) => put(tv + o, s));
    [['Thiên Phủ', 0], ['Thái Âm', 1], ['Tham Lang', 2], ['Cự Môn', 3], ['Thiên Tướng', 4], ['Thiên Lương', 5], ['Thất Sát', 6], ['Phá Quân', 10]].forEach(([s, o]) => put(tf + o, s));
    // Phụ tinh
    const LT = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][Y];
    const KHOI = [1, 0, 11, 11, 1, 0, 6, 6, 3, 3][Y], VIET = [7, 8, 9, 9, 7, 8, 2, 2, 5, 5][Y];
    const tam = YZ % 4; // 0: Thân Tý Thìn, 1: Tỵ Dậu Sửu, 2: Dần Ngọ Tuất, 3: Hợi Mão Mùi
    const MA = [2, 11, 8, 5][tam], DAO = [9, 6, 3, 0][tam];
    const HOA_TINH_START = [2, 3, 1, 9][tam], LINH_START = [10, 10, 3, 10][tam];
    const amDuongThuan = (Y % 2 === 0) === (gender === 'nam');
    const hoaTinh = amDuongThuan ? HOA_TINH_START + h : HOA_TINH_START - h;
    const linhTinh = amDuongThuan ? LINH_START - h : LINH_START + h;
    const goodStars = [['Tả Phù', 4 + (m - 1)], ['Hữu Bật', 10 - (m - 1)], ['Văn Xương', 10 - h], ['Văn Khúc', 4 + h],
      ['Lộc Tồn', LT], ['Thiên Khôi', KHOI], ['Thiên Việt', VIET], ['Thiên Mã', MA], ['Hồng Loan', 3 - YZ], ['Thiên Hỷ', 9 - YZ],
      ['Đào Hoa', DAO], ['Thiên Quan', [7, 4, 5, 2, 3, 9, 11, 9, 10, 6][Y]], ['Thiên Phúc', [9, 8, 0, 11, 3, 2, 6, 5, 6, 5][Y]],
      ['Long Trì', 4 + YZ], ['Phượng Các', 10 - YZ], ['Ân Quang', 0], ['Thiên Quý', 0]];
    // Ân Quang / Thiên Quý theo Văn Xương / Văn Khúc + ngày
    goodStars[15][1] = 10 - h + (d - 2); goodStars[16][1] = 4 + h - (d - 2);
    goodStars.forEach(([s, z]) => put(z, s, 'phu'));
    [['Kình Dương', LT + 1], ['Đà La', LT - 1], ['Địa Không', 11 - h], ['Địa Kiếp', 11 + h], ['Hỏa Tinh', hoaTinh], ['Linh Tinh', linhTinh],
      ['Thiên Hình', 9 + (m - 1)], ['Thiên Diêu', 1 + (m - 1)], ['Cô Thần', [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2][YZ]],
      ['Quả Tú', [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10][YZ]], ['Thiên Khốc', 6 - YZ], ['Thiên Hư', 6 + YZ]].forEach(([s, z]) => put(z, s, 'sat'));
    // Sao phụ bổ sung (đối chiếu tracuulasotuvi.com · lasotuvi): cát tinh → 'phu', hung/sát tinh → 'sat'
    const VK = 4 + h; // vị trí Văn Khúc
    [['Tam Thai', 4 + (m - 1) + (d - 1)], ['Bát Tọa', 10 - (m - 1) - (d - 1)], ['Thai Phụ', VK + 2], ['Phong Cáo', VK - 2],
      ['Thiên Tài', menh + YZ], ['Thiên Thọ', than + YZ], ['Thiên Giải', 8 + (m - 1)], ['Địa Giải', 7 + (m - 1)], ['Giải Thần', 10 - YZ],
      ['Thiên Y', 1 + (m - 1)], ['Thiên Trù', [5, 6, 0, 5, 6, 8, 2, 6, 9, 10][Y]], ['Thiên Đức', 9 + YZ], ['Nguyệt Đức', 5 + YZ],
      ['Văn Tinh', LT + 3], ['Đường Phù', LT + 5], ['Quốc Ấn', LT + 8], ['Hoa Cái', MA + 2], ['Đẩu Quân', YZ - (m - 1) + h]].forEach(([s, z]) => put(z, s, 'phu'));
    // Lưu Hà: các phái khác nhau ở Đinh/Canh/Tân — dùng bảng Thái Thứ Lang (lyso.vn, lasotuvi)
    [['Thiên Thương', menh + 5], ['Thiên Sứ', menh + 7], ['Thiên La', 4], ['Địa Võng', 10], ['Kiếp Sát', MA + 3],
      ['Phá Toái', [5, 1, 9][YZ % 3]], ['Lưu Hà', [9, 10, 7, 4, 5, 6, 8, 3, 11, 2][Y]], ['Thiên Không', YZ + 1]].forEach(([s, z]) => put(z, s, 'sat'));
    // Vòng Bác Sĩ (khởi tại Lộc Tồn; Dương Nam / Âm Nữ thuận, ngược lại nghịch) và vòng Thái Tuế (khởi tại chi năm, luôn thuận)
    BAC_SI.forEach(([s, good], i) => put(LT + (amDuongThuan ? i : -i), s, good ? 'phu' : 'sat'));
    THAI_TUE.forEach(([s, good], i) => put(YZ + i, s, good ? 'phu' : 'sat'));
    // Tứ Hóa năm sinh
    TU_HOA[Y].forEach((star, i) => {
      palaces.forEach((p) => { if (p.chinh.includes(star) || p.phu.includes(star)) p.hoa.push({ star, hoa: HOA_NAME[i] }); });
    });
    // Độ sáng chính tinh
    palaces.forEach((p) => { p.chinhDetail = p.chinh.map((s) => ({ name: s, bright: (BRIGHT[s] || '')[p.chi] || '' })); });
    // Đại hạn & Tràng Sinh
    const fwd = amDuongThuan;
    for (let i = 0; i < 12; i++) palaces[mod(menh + (fwd ? i : -i), 12)].daiHan = cucNum + i * 10;
    const tsStart = { 4: 8, 2: 8, 0: 11, 3: 5, 1: 2 }[cucH];
    for (let i = 0; i < 12; i++) palaces[mod(tsStart + (fwd ? i : -i), 12)].truongSinh = TRUONG_SINH[i];
    // Tuần / Triệt
    const tuan = [mod(YZ - Y + 10, 12), mod(YZ - Y + 11, 12)];
    const triet = [[8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][Y % 5];
    tuan.forEach((z) => (palaces[z].tuan = true)); triet.forEach((z) => (palaces[z].triet = true));
    // Tiểu hạn (năm xem)
    const vy = viewYear || new Date().getFullYear();
    const tieuStart = [10, 7, 4, 1][tam], tieuFwd = gender === 'nam';
    const vyz = mod(vy - 4, 12);
    const tieuHan = mod(tieuStart + (tieuFwd ? 1 : -1) * mod(vyz - YZ, 12), 12);
    palaces[tieuHan].tieuHan = vy;
    // Sao lưu niên của năm xem hạn + Tứ Hóa lưu niên
    const vyc = mod(vy - 4, 10), LLT = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][vyc];
    palaces.forEach((p) => { p.luu = []; });
    [['L.Thái Tuế', vyz], ['L.Lộc Tồn', LLT], ['L.Kình Dương', LLT + 1], ['L.Đà La', LLT - 1], ['L.Thiên Mã', [2, 11, 8, 5][vyz % 4]],
      ['L.Tang Môn', vyz + 2], ['L.Bạch Hổ', vyz + 8], ['L.Thiên Khốc', 6 - vyz], ['L.Thiên Hư', 6 + vyz]].forEach(([s, z]) => put(z, s, 'luu'));
    TU_HOA[vyc].forEach((star, i) => {
      palaces.forEach((p) => { if (p.chinh.includes(star) || p.phu.includes(star)) p.hoa.push({ star, hoa: HOA_NAME[i], luu: true }); });
    });
    const MENH_CHU = ['Tham Lang', 'Cự Môn', 'Lộc Tồn', 'Văn Khúc', 'Liêm Trinh', 'Vũ Khúc', 'Phá Quân', 'Vũ Khúc', 'Liêm Trinh', 'Văn Khúc', 'Lộc Tồn', 'Cự Môn'];
    const THAN_CHU = ['Linh Tinh', 'Thiên Tướng', 'Thiên Lương', 'Thiên Đồng', 'Văn Xương', 'Thiên Cơ', 'Hỏa Tinh', 'Thiên Tướng', 'Thiên Lương', 'Thiên Đồng', 'Văn Xương', 'Thiên Cơ'];
    const banMenh = napAm(Y, YZ);
    const cucMenhRel = relationHanh(cucH, napAmHanh(Y, YZ));
    return {
      name, gender, solar, lunar: { day: d, month: m, year: lunarYear }, hour: h,
      yearText: canChi(Y, YZ), amDuong: (Y % 2 === 0 ? 'Dương ' : 'Âm ') + (gender === 'nam' ? 'Nam' : 'Nữ'),
      thuan: fwd, banMenh, cuc: cucName, cucNum, menh, than, tuViAt: tv, palaces,
      menhChu: MENH_CHU[menh], thanChu: THAN_CHU[YZ], cucMenhRel, viewYear: vy,
      thanCu: palaces[than].name,
    };
  }
  function relationHanh(a, b) {
    if (a === b) return 'Cục và Mệnh bình hòa';
    if (mod(a + 1, 5) === b) return 'Cục sinh Mệnh — tốt';
    if (mod(b + 1, 5) === a) return 'Mệnh sinh Cục — hao tổn nhẹ';
    if (mod(a + 2, 5) === b) return 'Cục khắc Mệnh — trở ngại';
    return 'Mệnh khắc Cục — vất vả nhưng làm chủ';
  }

  // ───────────────────────── Bát Trạch · Cửu Tinh ─────────────────────────
  const QUAI = { 1: 'Khảm', 2: 'Khôn', 3: 'Chấn', 4: 'Tốn', 6: 'Càn', 7: 'Đoài', 8: 'Cấn', 9: 'Ly' };
  const QUAI_HUONG = { 1: 'Bắc', 2: 'Tây Nam', 3: 'Đông', 4: 'Đông Nam', 6: 'Tây Bắc', 7: 'Tây', 8: 'Đông Bắc', 9: 'Nam' };
  const QUAI_HANH = { 1: 'Thủy', 2: 'Thổ', 3: 'Mộc', 4: 'Mộc', 6: 'Kim', 7: 'Kim', 8: 'Thổ', 9: 'Hỏa' };
  const HUONG_KEYS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const HUONG_VN = { N: 'Bắc', NE: 'Đông Bắc', E: 'Đông', SE: 'Đông Nam', S: 'Nam', SW: 'Tây Nam', W: 'Tây', NW: 'Tây Bắc' };
  const DU_NIEN = [
    ['Sinh Khí', true, 'Tham Lang', 'Đại cát — vượng tài lộc, danh tiếng, sinh lực dồi dào'],
    ['Thiên Y', true, 'Cự Môn', 'Cát — sức khỏe, quý nhân phù trợ, chữa lành'],
    ['Diên Niên', true, 'Vũ Khúc', 'Cát — hòa thuận, tình duyên bền, trường thọ'],
    ['Phục Vị', true, 'Tả Phù', 'Tiểu cát — bình yên, vững vàng, thi cử'],
    ['Họa Hại', false, 'Lộc Tồn', 'Hung — thị phi, thất bại nhỏ, hao tổn'],
    ['Lục Sát', false, 'Văn Khúc', 'Hung — kiện tụng, tình cảm rối ren'],
    ['Ngũ Quỷ', false, 'Liêm Trinh', 'Đại hung — hỏa hoạn, tiểu nhân, bệnh tật'],
    ['Tuyệt Mệnh', false, 'Phá Quân', 'Đại hung — phá sản, bệnh nặng, tổn thọ'],
  ];
  const BAT_TRACH = {
    1: ['SE', 'E', 'S', 'N', 'W', 'NW', 'NE', 'SW'], 2: ['NE', 'W', 'NW', 'SW', 'E', 'S', 'SE', 'N'],
    3: ['S', 'N', 'SE', 'E', 'SW', 'NE', 'NW', 'W'], 4: ['N', 'S', 'E', 'SE', 'NW', 'W', 'SW', 'NE'],
    6: ['W', 'NE', 'SW', 'NW', 'SE', 'N', 'E', 'S'], 7: ['NW', 'SW', 'NE', 'W', 'N', 'SE', 'S', 'E'],
    8: ['SW', 'NW', 'W', 'NE', 'S', 'E', 'N', 'SE'], 9: ['E', 'SE', 'N', 'S', 'NE', 'SW', 'W', 'NW'],
  };
  const HUONG_QUAI = { N: 1, SW: 2, E: 3, SE: 4, NW: 6, W: 7, NE: 8, S: 9 };
  function cungPhi(year, gender) {
    let k = gender === 'nam' ? mod(11 - mod(year, 9), 9) : mod(mod(year, 9) + 4, 9);
    if (k === 0) k = 9;
    const raw = k;
    if (k === 5) k = gender === 'nam' ? 2 : 8;
    return { so: k, raw, quai: QUAI[k], huong: QUAI_HUONG[k], hanh: QUAI_HANH[k], nhom: [1, 3, 4, 9].includes(k) ? 'Đông Tứ Mệnh' : 'Tây Tứ Mệnh' };
  }
  function batTrach(kua) {
    return BAT_TRACH[kua].map((dir, i) => ({ dir, dirName: HUONG_VN[dir], name: DU_NIEN[i][0], good: DU_NIEN[i][1], star: DU_NIEN[i][2], desc: DU_NIEN[i][3] }));
  }
  const CUU_TINH = ['', 'Nhất Bạch · Tham Lang', 'Nhị Hắc · Cự Môn', 'Tam Bích · Lộc Tồn', 'Tứ Lục · Văn Khúc', 'Ngũ Hoàng · Liêm Trinh',
    'Lục Bạch · Vũ Khúc', 'Thất Xích · Phá Quân', 'Bát Bạch · Tả Phù', 'Cửu Tử · Hữu Bật'];
  const CUU_TINH_COLOR = ['', '#e8e4d8', '#3a3a3a', '#2f8f5b', '#2e7d5b', '#c9a227', '#f2efe6', '#b23a2a', '#ffffff', '#7a2a6b'];
  const FLY_ORDER = [5, 6, 7, 8, 9, 1, 2, 3, 4];
  /** Phi tinh: trả về map cung → sao (thuận) */
  function phiTinh(center, forward = true) {
    const map = {};
    FLY_ORDER.forEach((p, i) => { map[p] = mod(center - 1 + (forward ? i : -i), 9) + 1; });
    return map;
  }
  const yearStar = (y) => { const c = mod(1 - (y - 2026), 9); return c === 0 ? 9 : c; };
  /** Năm phi tinh đổi tại Lập Xuân (~4/2), không phải 1/1 */
  const yearStarAt = (dd, mm, yy) => yearStar(solarYearAt(dd, mm, yy));
  const solarYearAt = (dd, mm, yy) => (mm <= 2 && mod(sunDegAt(dd, mm, yy, 23, 59) - 315, 360) >= 300 ? yy - 1 : yy);

  // ───────────────────────── Kỳ Môn Độn Giáp (chuyển bàn) ─────────────────────────
  const KM_CUC = [[1, 7, 4], [2, 8, 5], [3, 9, 6], [8, 5, 2], [9, 6, 3], [1, 7, 4], [3, 9, 6], [4, 1, 7], [5, 2, 8], [4, 1, 7], [5, 2, 8], [6, 3, 9],
    [9, 3, 6], [8, 2, 5], [7, 1, 4], [2, 5, 8], [1, 4, 7], [9, 3, 6], [7, 1, 4], [6, 9, 3], [5, 8, 2], [6, 9, 3], [5, 8, 2], [4, 7, 1]];
  const KM_TERM = ['Đông Chí', 'Tiểu Hàn', 'Đại Hàn', 'Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân', 'Thanh Minh', 'Cốc Vũ', 'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng',
    'Hạ Chí', 'Tiểu Thử', 'Đại Thử', 'Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Sương Giáng', 'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết'];
  const NGHI = ['Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý', 'Đinh', 'Bính', 'Ất'];
  const SAO_KM = { 1: 'Thiên Bồng', 2: 'Thiên Nhuế', 3: 'Thiên Xung', 4: 'Thiên Phụ', 5: 'Thiên Cầm', 6: 'Thiên Tâm', 7: 'Thiên Trụ', 8: 'Thiên Nhậm', 9: 'Thiên Anh' };
  const MON_KM = { 1: 'Hưu Môn', 2: 'Tử Môn', 3: 'Thương Môn', 4: 'Đỗ Môn', 6: 'Khai Môn', 7: 'Kinh Môn', 8: 'Sinh Môn', 9: 'Cảnh Môn' };
  const MON_CAT = { 'Hưu Môn': 1, 'Sinh Môn': 1, 'Khai Môn': 1, 'Cảnh Môn': 0.5, 'Đỗ Môn': 0.5, 'Thương Môn': 0, 'Tử Môn': 0, 'Kinh Môn': 0 };
  const THAN_KM = ['Trực Phù', 'Đằng Xà', 'Thái Âm', 'Lục Hợp', 'Bạch Hổ', 'Huyền Vũ', 'Cửu Địa', 'Cửu Thiên'];
  const RING = [1, 8, 3, 4, 9, 2, 7, 6]; // vòng cung theo chiều kim đồng hồ
  function kyMon(dd, mm, yy, hour, minute = 0) {
    const deg = sunDegAt(dd, mm, yy, hour, minute);
    const t = INT(mod(deg - 270, 360) / 15);
    let jd = jdFromDate(dd, mm, yy); if (hour >= 23) jd += 1;
    const dc = mod(jd + 9, 10), dz = mod(jd + 1, 12), dn = sexagenary(dc, dz);
    const phuDau = dn - (dn % 5), pz = phuDau % 12;
    const nguyen = [0, 6, 3, 9].includes(pz) ? 0 : [2, 8, 5, 11].includes(pz) ? 1 : 2;
    const duong = t < 12, cuc = KM_CUC[t][nguyen];
    const step = (p, n) => (duong ? mod(p - 1 + n, 9) + 1 : mod(p - 1 - n, 9) + 1);
    // Địa bàn
    const dia = {}; NGHI.forEach((ng, i) => { dia[step(cuc, i)] = ng; });
    const palaceOf = (ng) => +Object.keys(dia).find((p) => dia[p] === ng);
    // Giờ
    const hz = hourChi(hour), hc = mod(2 * dc + hz, 10), hn = sexagenary(hc, hz);
    const tuanIdx = INT(hn / 10), tuanNghi = NGHI[tuanIdx];
    const tpPalace = palaceOf(tuanNghi); const tp8 = tpPalace === 5 ? 2 : tpPalace;
    const trucPhu = SAO_KM[tpPalace === 5 ? 2 : tpPalace], trucSu = MON_KM[tp8];
    const hourStem = hc === 0 ? tuanNghi : CAN[hc];
    let target = palaceOf(hourStem); if (target === 5) target = 2;
    const off = RING.indexOf(target) - RING.indexOf(tp8);
    const thien = {}, sao = {}, mon = {}, than = {};
    RING.forEach((p, i) => {
      const dst = RING[mod(i + off, 8)];
      sao[dst] = SAO_KM[p] + (p === 2 ? ' · Cầm' : '');
      thien[dst] = dia[p] + (p === 2 ? ' / ' + dia[5] : '');
    });
    let doorAt = step(tpPalace, hn % 10); if (doorAt === 5) doorAt = 2;
    const doff = RING.indexOf(doorAt) - RING.indexOf(tp8);
    RING.forEach((p, i) => { mon[RING[mod(i + doff, 8)]] = MON_KM[p]; });
    const startI = RING.indexOf(target);
    THAN_KM.forEach((n, i) => { than[RING[mod(startI + (duong ? i : -i), 8)]] = n; });
    const palaces = [4, 9, 2, 3, 5, 7, 8, 1, 6].map((p) => ({
      p, quai: p === 5 ? 'Trung Cung' : QUAI[p], huong: p === 5 ? 'Trung' : QUAI_HUONG[p],
      dia: dia[p], thien: thien[p] || '', sao: sao[p] || SAO_KM[5], mon: mon[p] || '', than: than[p] || '',
      cat: mon[p] ? MON_CAT[mon[p]] : null,
    }));
    return {
      tiet: KM_TERM[t], duong, nguyen: ['Thượng', 'Trung', 'Hạ'][nguyen], cuc,
      label: (duong ? 'Dương' : 'Âm') + ' Độn ' + cuc + ' Cục', dayText: canChi(dc, dz), hourText: canChi(hc, hz),
      tuanThu: 'Giáp ' + CHI[mod(hz - (hn % 10), 12)] + ' (' + tuanNghi + ')', trucPhu, trucSu, palaces,
    };
  }

  // ───────────────────────── Kinh Dịch ─────────────────────────
  const TRIGRAM = [ // Tiên Thiên 1..8, hào từ dưới lên
    { name: 'Càn', tuong: 'Thiên', sym: '☰', lines: [1, 1, 1], hanh: 'Kim' }, { name: 'Đoài', tuong: 'Trạch', sym: '☱', lines: [1, 1, 0], hanh: 'Kim' },
    { name: 'Ly', tuong: 'Hỏa', sym: '☲', lines: [1, 0, 1], hanh: 'Hỏa' }, { name: 'Chấn', tuong: 'Lôi', sym: '☳', lines: [1, 0, 0], hanh: 'Mộc' },
    { name: 'Tốn', tuong: 'Phong', sym: '☴', lines: [0, 1, 1], hanh: 'Mộc' }, { name: 'Khảm', tuong: 'Thủy', sym: '☵', lines: [0, 1, 0], hanh: 'Thủy' },
    { name: 'Cấn', tuong: 'Sơn', sym: '☶', lines: [0, 0, 1], hanh: 'Thổ' }, { name: 'Khôn', tuong: 'Địa', sym: '☷', lines: [0, 0, 0], hanh: 'Thổ' }];
  const KW = [[1, 10, 13, 25, 44, 6, 33, 12], [43, 58, 49, 17, 28, 47, 31, 45], [14, 38, 30, 21, 50, 64, 56, 35], [34, 54, 55, 51, 32, 40, 62, 16],
    [9, 61, 37, 42, 57, 59, 53, 20], [5, 60, 63, 3, 48, 29, 39, 8], [26, 41, 22, 27, 18, 4, 52, 23], [11, 19, 36, 24, 46, 7, 15, 2]];
  const QUE = ['', ['Thuần Càn', 'Cương kiện, sáng tạo — trời hành kiện, quân tử tự cường'], ['Thuần Khôn', 'Nhu thuận, bao dung — đất dày chở muôn vật'],
    ['Thủy Lôi Truân', 'Gian nan buổi đầu — kiên nhẫn gây dựng'], ['Sơn Thủy Mông', 'Non dại, cần học hỏi — tìm thầy chỉ lối'],
    ['Thủy Thiên Nhu', 'Chờ đợi đúng thời — chưa nên vội'], ['Thiên Thủy Tụng', 'Tranh tụng — nên hòa giải, tránh kiện'],
    ['Địa Thủy Sư', 'Quân đội, kỷ luật — cần người cầm đầu chính đáng'], ['Thủy Địa Tỷ', 'Thân cận, liên kết — hợp tác tốt'],
    ['Phong Thiên Tiểu Súc', 'Tích nhỏ thành lớn — tạm dừng gom sức'], ['Thiên Trạch Lý', 'Lễ nghi, cẩn trọng — dẫm đuôi hổ không bị cắn'],
    ['Địa Thiên Thái', 'Thông suốt, an thái — trời đất giao hòa'], ['Thiên Địa Bĩ', 'Bế tắc — giữ mình, chờ thời'],
    ['Thiên Hỏa Đồng Nhân', 'Đồng lòng — hợp quần thì thành'], ['Hỏa Thiên Đại Hữu', 'Có lớn, sung túc — giữ đức để giữ của'],
    ['Địa Sơn Khiêm', 'Khiêm tốn — được người kính trọng'], ['Lôi Địa Dự', 'Vui vẻ, hưng phấn — chuẩn bị trước thì thành'],
    ['Trạch Lôi Tùy', 'Tùy thời, theo người — linh hoạt'], ['Sơn Phong Cổ', 'Sửa chữa đổ nát — cải cách'],
    ['Địa Trạch Lâm', 'Đến gần, lớn lên — cơ hội tới'], ['Phong Địa Quan', 'Quan sát, chiêm nghiệm — nhìn rộng'],
    ['Hỏa Lôi Phệ Hạp', 'Cắn đứt trở ngại — xử lý dứt khoát'], ['Sơn Hỏa Bí', 'Trang sức, vẻ ngoài — chớ trọng hình thức'],
    ['Sơn Địa Bác', 'Bóc lột, suy tàn — nên tĩnh'], ['Địa Lôi Phục', 'Trở lại, phục hồi — nhất dương sinh'],
    ['Thiên Lôi Vô Vọng', 'Không càn bậy — thuận lẽ tự nhiên'], ['Sơn Thiên Đại Súc', 'Tích lớn — nuôi dưỡng tài đức'],
    ['Sơn Lôi Di', 'Nuôi dưỡng — cẩn ngôn, tiết ẩm thực'], ['Trạch Phong Đại Quá', 'Quá mức — cột cong, cần chống đỡ'],
    ['Thuần Khảm', 'Hiểm trùng — giữ lòng thành vượt hiểm'], ['Thuần Ly', 'Sáng sủa, nương tựa — văn minh'],
    ['Trạch Sơn Hàm', 'Cảm ứng — tình duyên, giao cảm'], ['Lôi Phong Hằng', 'Lâu bền — giữ đạo thường'],
    ['Thiên Sơn Độn', 'Lui ẩn — biết lui là khôn'], ['Lôi Thiên Đại Tráng', 'Mạnh mẽ — chớ cậy sức'],
    ['Hỏa Địa Tấn', 'Tiến lên — mặt trời mọc'], ['Địa Hỏa Minh Di', 'Ánh sáng bị che — giấu tài'],
    ['Phong Hỏa Gia Nhân', 'Gia đạo — trong nhà yên thì ngoài yên'], ['Hỏa Trạch Khuê', 'Chia lìa, trái ý — việc nhỏ thì được'],
    ['Thủy Sơn Kiển', 'Khó khăn — quay về tu thân'], ['Lôi Thủy Giải', 'Giải tỏa — nạn qua'],
    ['Sơn Trạch Tổn', 'Bớt đi — tổn dưới ích trên'], ['Phong Lôi Ích', 'Thêm vào — lợi việc lớn'],
    ['Trạch Thiên Quải', 'Quyết đoán — dứt bỏ tiểu nhân'], ['Thiên Phong Cấu', 'Gặp gỡ bất ngờ — đề phòng cám dỗ'],
    ['Trạch Địa Tụy', 'Tụ họp — đông người hội lại'], ['Địa Phong Thăng', 'Thăng tiến — từ thấp lên cao'],
    ['Trạch Thủy Khốn', 'Khốn cùng — giữ chí'], ['Thủy Phong Tỉnh', 'Giếng nước — nguồn nuôi không cạn'],
    ['Trạch Hỏa Cách', 'Cách mạng, đổi mới'], ['Hỏa Phong Đỉnh', 'Cái vạc — ổn định, đổi mới thành công'],
    ['Thuần Chấn', 'Sấm động — sợ hãi rồi cười nói'], ['Thuần Cấn', 'Dừng lại — biết dừng đúng chỗ'],
    ['Phong Sơn Tiệm', 'Tiến dần — từ từ mà chắc'], ['Lôi Trạch Quy Muội', 'Em gái về nhà chồng — chớ vội'],
    ['Lôi Hỏa Phong', 'Thịnh lớn — giữa trưa rồi sẽ xế'], ['Hỏa Sơn Lữ', 'Lữ khách — thận trọng nơi đất khách'],
    ['Thuần Tốn', 'Thuận nhập — mềm mỏng mà thấm'], ['Thuần Đoài', 'Vui vẻ — hòa duyệt'],
    ['Phong Thủy Hoán', 'Ly tán — gom lòng người'], ['Thủy Trạch Tiết', 'Tiết chế — có chừng mực'],
    ['Phong Trạch Trung Phu', 'Thành tín — lòng tin cảm hóa'], ['Lôi Sơn Tiểu Quá', 'Hơi quá — việc nhỏ thì nên'],
    ['Thủy Hỏa Ký Tế', 'Đã xong — đề phòng sau thành'], ['Hỏa Thủy Vị Tế', 'Chưa xong — còn hy vọng']];
  const trigramIndex = (l) => TRIGRAM.findIndex((t) => t.lines.join('') === l.join(''));
  function hexagram(lines) { // 6 hào dưới lên, 1 dương 0 âm
    const lo = trigramIndex(lines.slice(0, 3)), up = trigramIndex(lines.slice(3, 6));
    const n = KW[up][lo];
    return { number: n, name: QUE[n][0], meaning: QUE[n][1], upper: TRIGRAM[up], lower: TRIGRAM[lo], lines };
  }
  /** Gieo 3 đồng xu ×6. Trả hào: 6 lão âm(động), 7 thiếu dương, 8 thiếu âm, 9 lão dương(động) */
  function gieoXu(rand = Math.random) {
    const hao = [];
    for (let i = 0; i < 6; i++) { let s = 0; for (let j = 0; j < 3; j++) s += rand() < 0.5 ? 2 : 3; hao.push(s); }
    return docQue(hao);
  }
  function docQue(hao) {
    const lines = hao.map((v) => (v === 7 || v === 9 ? 1 : 0));
    const changed = hao.map((v) => (v === 9 ? 0 : v === 6 ? 1 : v === 7 ? 1 : 0));
    const moving = hao.map((v, i) => (v === 6 || v === 9 ? i + 1 : 0)).filter(Boolean);
    const ho = [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]];
    const chinh = hexagram(lines);
    return { hao, moving, chinh, bien: moving.length ? hexagram(changed) : null, ho: hexagram(ho), theDung: theDung(chinh, moving) };
  }
  /** Mai Hoa: quái chứa hào động là Dụng, quái tĩnh là Thể; luận sinh khắc ngũ hành */
  function theDung(q, moving) {
    const lo = moving.filter((m) => m <= 3).length, up = moving.length - lo;
    if (!moving.length || lo === up) return null;
    const dungUp = up > lo, the = dungUp ? q.lower : q.upper, dung = dungUp ? q.upper : q.lower;
    const T = HANH.indexOf(the.hanh), D = HANH.indexOf(dung.hanh);
    const [rel, verdict, cat] = T === D ? ['Thể Dụng tỷ hòa', 'Cát — mọi việc thuận, có người đồng lòng', 1]
      : mod(D + 1, 5) === T ? ['Dụng sinh Thể', 'Đại cát — được giúp đỡ, việc thành', 2]
      : mod(T + 2, 5) === D ? ['Thể khắc Dụng', 'Cát — chủ động nắm việc, thành nhưng phải gắng sức', 1]
      : mod(T + 1, 5) === D ? ['Thể sinh Dụng', 'Tiểu hung — hao tổn, phải bỏ công sức của cải', -1]
      : ['Dụng khắc Thể', 'Hung — trở ngại, bị chèn ép, nên thận trọng', -2];
    return { the, dung, theHanh: the.hanh, dungHanh: dung.hanh, rel, verdict, cat, dungAt: dungUp ? 'thượng quái' : 'hạ quái' };
  }
  function maiHoa(dd, mm, yy, hour) {
    const L = solar2lunar(dd, mm, yy), yzNum = mod(L.year - 4, 12) + 1, hNum = hourChi(hour) + 1;
    const s1 = yzNum + L.month + L.day, s2 = s1 + hNum;
    const up = mod(s1 - 1, 8), lo = mod(s2 - 1, 8), dong = mod(s2 - 1, 6) + 1;
    const lines = [...TRIGRAM[lo].lines, ...TRIGRAM[up].lines];
    const hao = lines.map((l, i) => (i + 1 === dong ? (l ? 9 : 6) : l ? 7 : 8));
    return Object.assign(docQue(hao), { formula: `Thượng quái (${yzNum}+${L.month}+${L.day}) mod 8 · Hạ quái (+giờ ${hNum}) mod 8 · Hào động mod 6 = ${dong}` });
  }

  const VQ = {
    CAN, CHI, CON_GIAP, HANH, CAN_HANH, CHI_HANH, TIET_KHI, NAP_AM, GIO_RANGE, CUNG, QUAI, QUAI_HUONG, QUAI_HANH, HUONG_KEYS, HUONG_VN,
    HUONG_QUAI, DU_NIEN, CUU_TINH, CUU_TINH_COLOR, TRIGRAM, QUE, TRUC_THAN, mod, canChi, sexagenary, napAm, napAmHanh,
    jdFromDate, jdToDate, solar2lunar, lunar2solar, sunDegAt, tietKhiOf, hourChi, dayInfo, gioHoangDao, ngayHoangDao,
    theDung, thapThan, tuTru, luuNien, lapLaSo, cungPhi, batTrach, phiTinh, yearStar, yearStarAt, solarYearAt, kyMon, TRUC, TU28, thapNhiTruc, nhiThapBatTu, hexagram, gieoXu, docQue, maiHoa,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = VQ; else root.VQ = VQ;
})(typeof self !== 'undefined' ? self : this);
