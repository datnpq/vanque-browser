# Chính sách bảo mật

## Phiên bản được hỗ trợ

Chỉ bản phát hành mới nhất trên [GitHub Releases](https://github.com/datnpq/vanque-browser/releases/latest) nhận bản vá bảo mật.

## Báo lỗ hổng

Xin **đừng** mở issue công khai. Hãy báo riêng qua [GitHub Security Advisories](https://github.com/datnpq/vanque-browser/security/advisories/new) của kho mã.

Vui lòng kèm: phiên bản Vân Quẻ, hệ điều hành, các bước tái hiện và tác động bạn đánh giá. Chúng tôi sẽ phản hồi trong vòng 7 ngày, cùng bạn thống nhất thời điểm công bố sau khi có bản vá, và ghi công bạn trong ghi chú phát hành nếu bạn muốn.

## Phạm vi đặc biệt quan tâm

- Trang web thoát khỏi webview: gọi được API `vanque://app/api`, điều hướng vào trang nội bộ, vượt qua trình xử lý quyền.
- Lộ token tài khoản tuvi.work hoặc mã đăng nhập một lần qua cổng loopback.
- Lộ dữ liệu lá số (ngày giờ sinh) ra ngoài ý muốn người dùng.
