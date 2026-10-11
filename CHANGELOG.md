# Nhật ký thay đổi

## Chưa phát hành

### Tài khoản tuvi.work & đồng bộ
- Trang chào lần đầu mở (`vq:chao`): mời đăng nhập bằng Google qua tuvi.work, có nút "Để sau"; nút tài khoản trên thanh công cụ; mục "Tài khoản tuvi.work" trong Cài đặt.
- Đăng nhập bằng mã một lần + PKCE S256 qua cổng loopback 127.0.0.1 (cần nhánh `vanque-dang-nhap` của tuvi.work); token mã hóa bằng `safeStorage`, tự đăng xuất khi máy chủ thu hồi token.
- Đồng bộ sổ lá số hai chiều với tuvi.work qua `/charts` (pull theo cursor, tombstone khi xóa).

## 2.0.1 — 2026-10-11 · Bản vá

### Sửa lỗi
- **Trang nội bộ không ghi được dữ liệu** (đổi cài đặt, xóa lịch sử, sửa/xóa đánh dấu, xóa dữ liệu duyệt web…): Chromium không gửi `Origin` cho fetch cùng nguồn trên giao thức `vanque://`, nên API chặn mọi lệnh POST (403). Lệnh ghi giờ mang header `X-VQ`; trang web lạ vẫn bị chặn (preflight CORS / Origin lạ). Thêm kiểm thử e2e cho lệnh ghi từ trang nội bộ.
- User-Agent còn lộ "VânQuẻBrowser/2.0.0" với trang web; nay bỏ đúng mục mang số phiên bản ứng dụng.

### Mới
- **Bản macOS** (12 trở lên, chip Apple và Intel, tệp DMG), build trên GitHub Actions. Chưa ký số Apple: lần đầu mở cần chuột phải → Mở. Ba nút cửa sổ gốc của macOS, menu Sửa để Cmd+C/V/X/A/Z hoạt động, Cmd+[ / Cmd+] để lùi / tiến, gợi ý phím hiện ⌘.
- Sổ lá số trên trang Tử Vi: lưu khi bấm "Lập lá số", mở lại / xóa (lưu trên máy). Hồ sơ lý số cũ được đưa vào sổ một lần.

## 2.0.0 — 2026-10-10 · Tái phát triển toàn diện

### Nền tảng & bảo mật
- Nâng Electron 33 → **44.7** (Chromium 152); electron-builder 26.
- Sửa `main.js` và `test/shots.js` bị lỗi mã hóa kép UTF-8 (menu chuột phải, tiêu đề cửa sổ hiện ký tự rác); bỏ BOM.
- Vỏ và mọi webview chạy sandbox; `will-attach-webview` gỡ preload/Node cưỡng bức.
- Trình xử lý quyền: mặc định từ chối, thanh hỏi quyền có "nhớ cho trang này" (trước đây Electron tự cấp mọi quyền).
- Chặn trang web điều hướng vào `vanque://`; API nội bộ kiểm `Origin`; CSP cho trang nội bộ; chặn vượt thư mục bằng `path.relative`.
- Trang lỗi không còn chèn URL thô vào HTML (lỗ XSS); IPC `open-external` không kiểm tra đã bị loại bỏ.
- Một phiên bản duy nhất, mở URL từ dòng lệnh, nhớ vị trí/kích thước cửa sổ.

### Trình duyệt
- Kho dữ liệu JSON trong tiến trình chính (cài đặt, đánh dấu, lịch sử, phiên, tải xuống); tự di trú dữ liệu từ bản 1.x.
- Trang mới: Lịch sử, Tải xuống, Đánh dấu (sửa/sắp xếp/xuất–nhập), Cài đặt.
- Thẻ: kéo-thả, menu chuột phải, ghim, tắt tiếng, cuộn dải thẻ (trước đây thẻ thừa bị khuất), thẻ khôi phục chỉ tải khi mở, trang sụp đổ.
- Thanh địa chỉ gợi ý từ lịch sử (tìm không dấu); chọn máy tìm kiếm; `Alt+Enter`.
- Tải xuống có vòng tiến độ, bảng tải gần đây, tạm dừng/tiếp tục/hủy.
- Phím tắt dùng chung một bản đồ (`shell/keys.js`); thêm Ctrl+H/J/M/,, Ctrl+Shift+B/O/D/R, F3, F6, Alt+D, Alt+Home. Sửa Ctrl+Shift+D (README cũ ghi đổi theme nhưng thực tế là đánh dấu).
- Phông chữ đóng gói offline (trước đây tải từ Google Fonts dù README ghi "100% offline").

### Lý số
- Tử Vi: từ ~43 lên **93 sao + 9 sao lưu niên**; vòng Bác Sĩ, vòng Thái Tuế, Tam Thai, Bát Tọa, Thai Phụ, Phong Cáo, Quốc Ấn, Đường Phù, Thiên Tài, Thiên Thọ, Đẩu Quân…; Tứ Hóa lưu niên. Công thức đối chiếu nguồn.
- Tử Bình: trọng số nguyệt lệnh, vượng–tướng–hưu–tù–tử, dụng thần gợi ý, thần sát, hợp–xung–hình–hại, không vong, lưu niên.
- Kinh Dịch: luận Thể–Dụng tự động, Mai Hoa theo số, sổ quẻ, tìm quẻ, sao chép kết quả.
- Lịch: thập nhị trực (nên/kỵ), nhị thập bát tú, ngày lễ, tiết khí trong tháng, đổi ngày âm↔dương, điều hướng bằng phím.
- Phi tinh năm đổi tại Lập Xuân thay vì 1/1.

### Kiểm thử
- `npm test`: 48 kiểm tra đơn vị (thêm mốc 12 Trực, 28 Tú, khóa 33 vị trí sao Tử Vi, Tử Bình, Thể–Dụng, phím tắt, kho dữ liệu).
- `npm run e2e` / `e2e:dark`: kiểm thử end-to-end trên chính ứng dụng — bảo mật giao thức, phím tắt, omnibox, đánh dấu, phiên, quyền, tải xuống, lịch sử, di trú, Kinh Dịch; chụp ảnh mọi trang. Thay `shots:dark` cũ (lệnh `set VQ_THEME=dark &&` gán nhầm `"dark "` nên giao diện tối không bao giờ áp dụng).
