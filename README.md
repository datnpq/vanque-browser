<div align="center">

# ☁️ Vân Quẻ Browser

**Trình duyệt Huyền Học Phương Đông**

*Tử Vi · Tử Bình · Bát Trạch · Kỳ Môn Độn Giáp · Hà Đồ Lạc Thư · Kinh Dịch · Vạn Niên Lịch*

<img src="src/shell/icon.png" width="120" alt="Vân Quẻ"/>

[**Tải cho Windows & macOS**](https://vanque.pages.dev) · [Bản phát hành](https://github.com/datnpq/vanque-browser/releases/latest) · [Đóng góp](CONTRIBUTING.md)

</div>

---

## ✨ Giới thiệu

**Vân Quẻ** (雲卦) là trình duyệt dành cho người yêu lý số Phương Đông, dựng trên Electron 44 (Chromium 152), mang theme **giấy dó – mực tàu – son đỏ – nhũ vàng**. Toàn bộ lý số, phông chữ và trang nội bộ chạy **ngoại tuyến 100%** — không gửi dữ liệu ra ngoài.

> *«Mệnh tốt không bằng vận tốt — vận tốt không bằng tâm tốt»*

## 🎯 Phân hệ lý số

| Module | Lệnh | Nội dung |
|--------|------|----------|
| **Tử Vi Đẩu Số** | `vq:tuvi` | 12 cung, **93 sao + 9 sao lưu niên** (14 chính tinh, phụ tinh, sát tinh, vòng Bác Sĩ, vòng Thái Tuế, Tràng Sinh), Tứ Hóa gốc & lưu niên, Tuần/Triệt, đại hạn, tiểu hạn, tam phương tứ chính |
| **Tử Bình Tứ Trụ** | `vq:tubinh` | Bát tự theo tiết khí, thập thần, tàng can, nạp âm, ngũ hành có trọng số nguyệt lệnh, vượng–tướng–hưu–tù–tử, dụng thần gợi ý, thần sát, hợp–xung–hình–hại, không vong, đại vận, lưu niên |
| **Bát Trạch Minh Cảnh** | `vq:battrach` | Cung phi, du niên bát biến, la bàn SVG (Nam trên / Bắc trên), phối mệnh–trạch, phủ phi tinh năm |
| **Kỳ Môn Độn Giáp** | `vq:kymon` | Chuyển bàn, phù đầu định nguyên, tam kỳ lục nghi, bát môn, cửu tinh, bát thần |
| **Hà Đồ Lạc Thư** | `vq:hadolacthu` | Sơ đồ chấm SVG, Tiên/Hậu Thiên, phi tinh cửu cung (đổi năm tại Lập Xuân) |
| **Kinh Dịch** | `vq:kinhdich` | Gieo 3 xu, Mai Hoa theo giờ & theo số, bản–hỗ–biến quẻ, **luận Thể–Dụng** tự động, sổ quẻ, 64 quẻ có tìm kiếm |
| **Vạn Niên Lịch** | `vq:lich` | Âm–dương lịch 1900–2100, can chi, tiết khí, hoàng đạo, **thập nhị trực** (nên/kỵ), **nhị thập bát tú**, ngày lễ, đổi ngày âm↔dương |
| **Ngũ Hành** | `vq:nguhanh` | Vòng sinh–khắc tương tác, tra mệnh, 60 hoa giáp nạp âm |

## 🌐 Trình duyệt

- **Thẻ**: kéo-thả sắp xếp, ghim, tắt tiếng (biểu tượng loa khi trang phát âm thanh), nhân bản, menu chuột phải (đóng thẻ khác / bên phải…), cuộn dải thẻ, mở lại thẻ đã đóng, khôi phục phiên — thẻ nền **chỉ tải khi được mở**
- **Thanh địa chỉ**: gợi ý từ phân hệ, đánh dấu và **lịch sử** (tìm không dấu), lệnh `vq:`, chọn máy tìm kiếm (Google, DuckDuckGo, Bing, Cốc Cốc, Brave), `Alt+Enter` mở thẻ mới
- **Trang quản lý**: `vq:lichsu` (lịch sử), `vq:taixuong` (tải xuống), `vq:danhdau` (đánh dấu: sửa, sắp xếp, xuất/nhập JSON), `vq:caidat` (cài đặt, quyền, xóa dữ liệu, phím tắt, giới thiệu)
- **Tải xuống**: nút tiến độ dạng vòng, bảng tải gần đây, tạm dừng / tiếp tục / hủy, tiến độ trên thanh tác vụ
- **Xin quyền**: thanh hỏi quyền cho thông báo, vị trí, camera/micro, chia sẻ màn hình, mở ứng dụng ngoài… kèm "nhớ cho trang này"
- Tìm trong trang, thu phóng theo thẻ, in/PDF, toàn màn hình video, trang lỗi & trang sụp đổ riêng, thanh trạng thái **thiên thời** (giờ can chi, hoàng đạo, tiết khí, trực)

## ☁️ Tài khoản tuvi.work (tùy chọn)

- Lần đầu mở có trang chào (`vq:chao`) mời **Đăng nhập bằng Google** — thực chất là đăng nhập/tạo tài khoản **tuvi.work**; bấm "Để sau" vẫn dùng đủ mọi tính năng
- Luồng: Vân Quẻ mở `https://tuvi.work/dang-nhap/vanque?cong=…&state=…&thach=…` trong trình duyệt mặc định (Google chặn đăng nhập trong webview) → người dùng bấm **Cho phép** → tuvi.work chuyển về `http://127.0.0.1:<cổng>/xong?ma=…` → Vân Quẻ đổi mã + PKCE verifier ở `POST /api/v1/auth/vanque` lấy token Sanctum `vanque`
- Token lưu bằng `safeStorage` (DPAPI) trong `vanque-data/auth.json`, không bao giờ gửi ra vỏ hay trang nội bộ
- **Sổ lá số** (trang Tử Vi) đồng bộ hai chiều qua API `/charts` sẵn có của tuvi.work — cùng sổ với tuvi.work và app tuvi.work
- Cấu hình ở mục `"tuvi"` trong `package.json`; kho mã chỉ giữ khóa giả, nên bản tự build ẩn phần đăng nhập. Bản phát hành nhận khóa `X-Tuvi-Key` lúc build từ bí mật CI `VQ_TUVI_KEY` (`-c.extraMetadata.tuvi.apiKey=…`). Khi phát triển, ghi đè bằng biến môi trường `VQ_TUVI_BASE`, `VQ_TUVI_KEY`
- `npm run e2e` tự chạy một máy chủ tuvi.work giả lập (`test/mock-tuvi.js`) để thử đăng nhập và đồng bộ

## 🔒 Bảo mật

- Vỏ trình duyệt và mọi `<webview>` chạy **sandbox**, `contextIsolation`, không Node; preload của webview bị gỡ bỏ cưỡng bức (`will-attach-webview`)
- Quyền mặc định **từ chối**, chỉ cấp khi người dùng đồng ý (Electron mặc định cấp hết)
- Trang web bên ngoài **không thể** điều hướng vào `vanque://`; API nội bộ kiểm tra `Origin`, có CSP, `nosniff`, chặn vượt thư mục
- Popup đăng nhập (OAuth) mở cửa sổ con sandbox để giữ `window.opener`

## 🚀 Cài đặt & chạy

```bash
npm install
npm start            # chạy ứng dụng
npm test             # kiểm tra đơn vị: lõi lý số, phím tắt, kho dữ liệu, đăng nhập + đồng bộ (máy chủ giả lập)
npm run e2e          # kiểm thử end-to-end trên chính ứng dụng (ảnh + báo cáo trong test/shots/)
npm run e2e:dark     # như trên, giao diện tối
npm run pack         # bản chạy không cần cài (dist/win-unpacked)
npm run dist         # bộ cài NSIS + portable (Windows), DMG chip Apple + Intel (macOS, phải build trên Mac), AppImage (Linux)
```

## 🏗 Kiến trúc

```
src/
├── main.js                 # Tiến trình chính: cửa sổ, IPC, một phiên bản duy nhất, nhớ kích thước cửa sổ
├── main/
│   ├── store.js            # Kho JSON (userData/vanque-data): cài đặt, đánh dấu, lịch sử, phiên, tải xuống
│   ├── protocol.js         # vanque://app/ — trang tĩnh + API JSON (/api/settings, history, bookmarks…)
│   ├── guard.js            # Bảo mật webview, xin quyền, chặn điều hướng, popup, menu chuột phải, ghi lịch sử
│   └── downloads.js        # Quản lý tải xuống
├── preload.js              # Cầu nối sandbox cho vỏ
├── shell/                  # Vỏ trình duyệt (index.html, shell.css, shell.js, keys.js dùng chung phím tắt)
├── fonts/                  # Phudu + Be Vietnam Pro (woff2, SIL OFL) — không cần mạng
└── pages/                  # Trang nội bộ vanque://app/*.html
    ├── lib/lyso.js         # 🧮 Lõi lý số (chạy cả trình duyệt lẫn Node)
    ├── lib/ui.js           # DOM helper, đồng bộ theme, gọi API
    └── vq.css              # Design system Vân Quẻ
test/
├── selftest.js             # Kiểm tra đơn vị (node)
├── autotest.js / e2e.js    # Kiểm thử end-to-end (chụp ảnh, bảo mật giao thức, phím tắt, quyền, tải xuống…)
```

Trang nội bộ không có preload; chúng đọc/ghi dữ liệu qua `fetch('/api/…')` cùng origin `vanque://app`. Vỏ dùng cùng hàm API qua IPC, nên logic kiểm tra dữ liệu chỉ có một nơi.

### Lõi `lyso.js` và độ tin cậy

- Âm lịch thuật toán Hồ Ngọc Đức (múi giờ +7), tiết khí theo kinh độ mặt trời, ranh giới Lập Xuân cho tứ trụ & phi tinh
- Công thức an sao Tử Vi được đối chiếu với tracuulasotuvi.com và mã nguồn lasotuvi; vị trí 33 sao của một lá số mẫu được khóa trong `test/selftest.js`
- **Lưu Hà** có tranh cãi giữa các phái (Đinh/Canh/Tân) — Vân Quẻ dùng bảng Thái Thứ Lang
- 12 Trực và 28 Tú được kiểm với các mốc ngày từ lịch âm baohatinh.vn / quantrimang.com; chưa gắn nhãn cát/hung cho 28 tú vì các nguồn không thống nhất

## ⌨️ Phím tắt chính

| Phím | Chức năng | Phím | Chức năng |
|------|-----------|------|-----------|
| `Ctrl+T` / `Ctrl+W` | Mở / đóng thẻ | `Ctrl+Shift+T` | Mở lại thẻ vừa đóng |
| `Ctrl+Tab` / `Ctrl+1…9` | Chuyển thẻ | `Ctrl+L` · `Alt+D` · `F6` | Thanh địa chỉ |
| `Ctrl+F` · `F3` | Tìm trong trang | `Ctrl+D` | Đánh dấu |
| `Ctrl+H` | Lịch sử | `Ctrl+J` | Tải xuống |
| `Ctrl+Shift+O` | Quản lý đánh dấu | `Ctrl+Shift+B` | Ẩn/hiện Bát Quẻ Môn |
| `Ctrl+,` | Cài đặt | `Ctrl+Shift+D` | Sáng / tối |
| `Ctrl+M` | Tắt tiếng thẻ | `F5` / `Ctrl+Shift+R` | Tải lại / bỏ bộ đệm |
| `Alt+←/→` | Quay lại / tiến tới | `Alt+Home` | Thiên Môn |
| `Ctrl+= / - / 0` | Thu phóng | `F11` / `F12` | Toàn màn hình / DevTools |

## 🤝 Đóng góp

Vân Quẻ là mã nguồn mở. Báo lỗi, sửa công thức lý số (kèm nguồn), giao diện, kiểm thử… đều được chào đón. Đọc [CONTRIBUTING.md](CONTRIBUTING.md) trước khi gửi pull request, và [Quy tắc ứng xử](CODE_OF_CONDUCT.md). Lỗ hổng bảo mật xin báo riêng theo [SECURITY.md](SECURITY.md).

Bản dựng từ mã nguồn hoạt động đầy đủ, chỉ ẩn phần đăng nhập tuvi.work (khóa kết nối chỉ có ở bản phát hành chính thức).

## ✍️ Ký số

Bản phát hành được build công khai trên GitHub Actions. Dự án đang xin chứng thư ký số miễn phí từ SignPath Foundation, xem [CODE_SIGNING.md](CODE_SIGNING.md). Trong lúc chờ, mỗi bản kèm `SHA256SUMS.txt` để đối chiếu.

## 📄 Giấy phép

[MIT](LICENSE) © Vân Quẻ Môn · Phông chữ Phudu & Be Vietnam Pro: SIL Open Font License 1.1

*Lý số để tham khảo, chiêm nghiệm — Đức năng thắng số.*
