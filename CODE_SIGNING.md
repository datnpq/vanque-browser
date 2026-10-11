# Chính sách ký số mã (Code signing policy)

> Trạng thái: **đang xin** chứng thư ký số miễn phí cho dự án mã nguồn mở từ SignPath Foundation. Các bản phát hành hiện tại (≤ 2.0.1) **chưa ký số**, Windows SmartScreen có thể cảnh báo. Mỗi bản đều kèm `SHA256SUMS.txt` để bạn đối chiếu.

Khi được duyệt:

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

## Cái gì được ký

Chỉ các tệp do chính dự án này build từ mã nguồn trong kho, trên GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)), từ một tag phiên bản `v*`:

- `VanQue-Setup-x64.exe` (bộ cài)
- `VanQue-Portable-x64.exe` (bản chạy không cần cài)

Không ký tệp build trên máy cá nhân, không ký mã của bên thứ ba ngoài những gì được đóng gói kèm Electron.

## Vai trò

| Vai trò | Người |
|---|---|
| Committer & reviewer | [@datnpq](https://github.com/datnpq) và cộng tác viên được cấp quyền ghi |
| Approver (duyệt từng lần ký) | [@datnpq](https://github.com/datnpq) |

Mọi thay đổi vào nhánh `main` đi qua pull request hoặc commit của người có quyền ghi; tài khoản có quyền ghi bắt buộc bật xác thực hai lớp (2FA) trên GitHub.

## Quyền riêng tư

This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.

Cụ thể: Vân Quẻ chỉ kết nối mạng khi bạn duyệt web, và khi bạn **tự chọn** đăng nhập tài khoản tuvi.work để đồng bộ sổ lá số. Xem [chính sách quyền riêng tư](https://vanque.pages.dev/quyen-rieng-tu).
