# Đóng góp cho Vân Quẻ

Cảm ơn bạn đã ghé qua! Vân Quẻ là trình duyệt dành cho người yêu lý số, viết bằng Electron và JavaScript thuần (không framework, không bước biên dịch). Mọi đóng góp đều quý: báo lỗi, sửa công thức an sao, dịch thuật, giao diện, kiểm thử.

## Bắt đầu

Cần Node.js 22 (xem `.nvmrc`) và Windows, macOS hoặc Linux.

```bash
git clone https://github.com/datnpq/vanque-browser.git
cd vanque-browser
npm ci
npm start
```

## Trước khi gửi pull request

```bash
npm test          # kiểm tra đơn vị: lõi lý số, phím tắt, kho dữ liệu, đăng nhập + đồng bộ (máy chủ giả lập)
npm run e2e       # end-to-end trên chính ứng dụng, giao diện sáng
npm run e2e:dark  # như trên, giao diện tối
```

Cả ba lệnh phải đạt. Kiểm thử end-to-end tự bật máy chủ tuvi.work giả (`test/mock-tuvi.js`), không cần mạng hay tài khoản thật.

## Quy ước

- **Tiếng Việt có dấu** cho giao diện, chú thích và thông điệp commit. Tên biến, hàm có thể tiếng Việt không dấu (`laSo`, `paintSo`) hoặc tiếng Anh, theo mã xung quanh.
- **Không thêm thư viện phụ thuộc lúc chạy** nếu không thật cần. Lý số phải chạy hoàn toàn ngoại tuyến.
- **Công thức lý số cần nguồn.** Khi sửa cách an sao, tính tiết khí, thần sát…, ghi nguồn đối chiếu trong PR và thêm một ca kiểm thử khóa kết quả vào `test/selftest.js`. Chỗ các phái không thống nhất, nêu rõ phái được chọn.
- **Bảo mật:** trang nội bộ (`src/pages`) không có preload; dữ liệu chỉ đi qua API `vanque://app/api/…` với header `X-VQ` cho lệnh ghi. Không nới lỏng kiểm tra `Origin`, CSP hay trình xử lý quyền.
- Định dạng theo `.editorconfig` (2 dấu cách, LF, UTF-8 không BOM).

## Đăng nhập tuvi.work khi phát triển

Bản dựng từ mã nguồn không kèm khóa kết nối tuvi.work, nên phần đăng nhập tự ẩn. Để thử luồng đăng nhập, chạy với máy chủ của bạn hoặc máy chủ giả:

```bash
node test/mock-tuvi.js 8787                                         # cửa sổ 1: máy chủ giả, tự bấm "Cho phép"
VQ_TUVI_BASE=http://127.0.0.1:8787 VQ_TUVI_KEY=khoa-thu npm start   # cửa sổ 2
```

Bản phát hành chính thức nhận khóa lúc build qua bí mật CI, không lưu trong kho mã.

## Báo lỗi và đề xuất

Dùng [Issues](https://github.com/datnpq/vanque-browser/issues) với mẫu có sẵn. Lỗ hổng bảo mật xin **không** báo công khai, xem [SECURITY.md](SECURITY.md).

Khi đóng góp, bạn đồng ý mã của mình được phát hành theo [giấy phép MIT](LICENSE) và tuân thủ [Quy tắc ứng xử](CODE_OF_CONDUCT.md).
