# Đưa Vân Quẻ lên Microsoft Store

Gói Store là **MSIX/AppX**. Khi nộp qua Partner Center, Microsoft tự ký gói, nên **không cần mua chứng chỉ ký số** cho bản Store.

## 1. Việc bạn làm trên Partner Center (một lần)

1. Đăng ký tài khoản nhà phát triển tại https://partner.microsoft.com/dashboard/registration (loại *Cá nhân* hoặc *Công ty*; công ty phải xác minh pháp nhân, mất vài ngày).
2. **Apps and games → New product → MSIX or PWA app** → giữ tên **`Vân Quẻ`**.
   - Tên giữ chỗ phải trùng `build.appx.displayName` trong `package.json`. Nếu tên đã có người dùng, giữ tên khác (ví dụ `Vân Quẻ Browser`) rồi sửa `displayName` cho khớp.
3. Vào **Product management → Product identity**, chép ba giá trị vào `build.appx` trong `package.json`:

   | Partner Center | `package.json` |
   |---|---|
   | `Package/Identity/Name` | `identityName` |
   | `Package/Identity/Publisher` (dạng `CN=…`) | `publisher` |
   | `Package/Properties/PublisherDisplayName` | `publisherDisplayName` |

## 2. Build gói

```bash
npm run dist:store     # → dist/Vân Quẻ <phiên bản>.appx (từ chối build nếu chưa điền bước 1.3)
```

- Ảnh tile nằm trong `build/appx/`, tạo lại bằng `python scripts/make-store-assets.py` khi đổi biểu tượng.
- Mỗi lần nộp bản mới phải tăng `version` trong `package.json` (Store dùng dạng `2.0.1.0`).
- Muốn chạy thử gói trước khi nộp: bật *Developer Mode* trong Windows, chạy Windows App Certification Kit (có trong Windows SDK) trên tệp `.appx`.

## 3. Nộp bài (Submission)

| Mục | Điền |
|---|---|
| Pricing | Free · Markets: tất cả (hoặc chỉ Việt Nam) |
| Category | Productivity (phụ: Books & reference) |
| Privacy policy URL | https://vanque.pages.dev/quyen-rieng-tu |
| Website | https://vanque.pages.dev |
| Support contact | https://github.com/datnpq/vanque-browser/issues |
| Age ratings | Làm bảng hỏi IARC. Trả lời **có** ở câu về truy cập Internet không giới hạn (đây là trình duyệt); không có nội dung bạo lực / cờ bạc. |
| Packages | Tải lên `dist/Vân Quẻ <phiên bản>.appx` |
| Store listing | Tiếng Việt (vi-VN) — nội dung ở mục 4 |
| Screenshots | `store/screenshots/*.png` (1920×1080, tối đa 10 ảnh) |
| Store logos | `build/icon.png` cho ô 1:1; có thể dùng `build/appx/LargeTile.scale-400.png` |

**Submission options → Notes for certification** (bản tiếng Anh cho người duyệt):

> Vân Quẻ is a Chromium-based (Electron) desktop web browser with built-in, fully offline Vietnamese astrology and calendar tools (Tử Vi, Tử Bình, I Ching, lunar calendar). Signing in is optional: users may connect their tuvi.work account (Google sign-in in the system browser) only to sync saved charts; every feature works signed out. The `runFullTrust` capability is required because the app is a packaged Win32/Electron desktop application. Webcam, microphone and location capabilities are declared only so that websites can request them; every request is denied by default and shown to the user in a permission bar.

**Restricted capability `runFullTrust`** — khi Partner Center hỏi lý do, dùng câu đầu của đoạn trên.

## 4. Nội dung trang Store (vi-VN)

**Tên:** Vân Quẻ

**Mô tả ngắn:**
Trình duyệt nhanh nhân Chromium, có sẵn Tử Vi, Tử Bình, Kinh Dịch và Vạn Niên Lịch. Mọi lá số được tính ngay trên máy bạn, không gửi đi đâu cả.

**Mô tả:**
Vân Quẻ là trình duyệt web dành cho người yêu huyền học Phương Đông. Bên cạnh đầy đủ tính năng duyệt web hiện đại, Vân Quẻ tích hợp sẵn tám phân hệ lý số, chạy hoàn toàn ngoại tuyến — ngày giờ sinh của bạn không bao giờ rời khỏi máy.

LÝ SỐ TÍCH HỢP
• Tử Vi Đẩu Số: lá số 12 cung, 93 sao cùng 9 sao lưu niên, Tứ Hóa gốc và lưu niên, Tuần – Triệt, đại hạn, tiểu hạn.
• Tử Bình Tứ Trụ: bát tự theo tiết khí, thập thần, tàng can, ngũ hành theo nguyệt lệnh, dụng thần, thần sát, đại vận, lưu niên.
• Kinh Dịch: gieo ba đồng xu, Mai Hoa theo giờ hoặc theo số, quẻ bản – hỗ – biến, luận Thể – Dụng, sổ quẻ, 64 quẻ.
• Vạn Niên Lịch: âm dương lịch 1900–2100, can chi, tiết khí, giờ hoàng đạo, 12 Trực, 28 Tú, đổi ngày âm ↔ dương.
• Bát Trạch Minh Cảnh, Kỳ Môn Độn Giáp, Hà Đồ Lạc Thư, Ngũ Hành nạp âm.

TRÌNH DUYỆT ĐẦY ĐỦ
• Thẻ kéo-thả, ghim, tắt tiếng; khôi phục phiên làm việc.
• Thanh địa chỉ gợi ý từ lịch sử, tìm được cả khi gõ không dấu; chọn Google, DuckDuckGo, Bing, Cốc Cốc hoặc Brave Search.
• Quản lý lịch sử, đánh dấu (xuất – nhập), tải xuống có tạm dừng và tiếp tục.
• Giao diện sáng "giấy dó" và tối "mực tàu", nhiều phím tắt.

RIÊNG TƯ TỪ GỐC
• Không tài khoản, không quảng cáo, không thu thập dữ liệu sử dụng.
• Trang web phải xin phép trước khi dùng vị trí, camera, micro hay gửi thông báo.

Lý số để tham khảo và chiêm nghiệm — đức năng thắng số.

**Tính năng nổi bật** (mỗi dòng một mục):
- Tử Vi 12 cung với 93 sao và sao lưu niên
- Tử Bình Tứ Trụ, dụng thần, đại vận, lưu niên
- Gieo quẻ Kinh Dịch, Mai Hoa, luận Thể – Dụng
- Vạn Niên Lịch 1900–2100 với 12 Trực và 28 Tú
- Lý số chạy ngoại tuyến, không gửi dữ liệu
- Quyền trang web mặc định là từ chối
- Giao diện sáng và tối
- Năm máy tìm kiếm, gợi ý gõ không dấu

**Từ khóa tìm kiếm** (tối đa 7): tử vi · lá số · phong thủy · kinh dịch · lịch âm · tử bình · trình duyệt

**Có gì mới (2.0.0):**
Viết lại toàn bộ trên Chromium 152: hỏi quyền trước khi trang web dùng thiết bị, trang lịch sử – tải xuống – đánh dấu – cài đặt, Tử Vi 93 sao cùng Tứ Hóa lưu niên, Tử Bình theo nguyệt lệnh, Kinh Dịch luận Thể – Dụng, lịch có 12 Trực và 28 Tú.

**Copyright:** © 2026 Vân Quẻ Môn
