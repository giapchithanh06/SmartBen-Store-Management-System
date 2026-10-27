# SmartBen – Website bán điện thoại (HTML, CSS, Bootstrap 4, JavaScript)

Tác giả: **Giáp Chí Thanh**

## Cách chạy
Mở file `index.html` bằng trình duyệt (bấm đúp) là chạy được, không cần máy chủ, không cần cơ sở dữ liệu.
Dữ liệu (sản phẩm, tài khoản, đơn hàng, mã giảm giá, đánh giá, tin tức, liên hệ) được lưu trong **localStorage** của trình duyệt.
Muốn đưa về dữ liệu ban đầu: Admin → Báo cáo doanh thu → **Khôi phục dữ liệu mẫu**.

## Tài khoản dùng thử
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@smartben.vn | admin123 |
| Khách hàng | minh.sv@gmail.com | 123456 |
| Khách hàng | ha.tran@gmail.com | 123456 |
| Khách hàng | bao.le@gmail.com | 123456 |

## Mã giảm giá mẫu
- `SINHVIEN`: giảm 5% (tối đa 300.000đ) cho đơn từ 1.000.000đ
- `SMARTBEN10`: giảm 10% (tối đa 500.000đ) cho đơn từ 3.000.000đ
- `GIAM200K`: giảm 200.000đ cho đơn từ 5.000.000đ

## Chức năng
**Khách hàng:** trang chủ (sản phẩm nổi bật, mua theo nhu cầu, các dải mới ra mắt / giá sốc online / trả góp 0% / giảm giá / giá rẻ) · cửa hàng lọc theo hãng, loại máy, mức giá, ưu đãi, RAM, số sao, còn hàng, sắp xếp, phân trang · tìm kiếm có gợi ý · chi tiết sản phẩm (thư viện ảnh, thông số kỹ thuật, khuyến mãi, đánh giá) · **so sánh tối đa 3 máy** · **yêu thích** · giỏ hàng (tối đa 5 máy/sản phẩm) · thanh toán COD hoặc QR, mã giảm giá · đơn hàng của tôi, huỷ đơn · **tài khoản: sửa thông tin, đổi mật khẩu** · **viết đánh giá (chỉ khách đã nhận máy)** · giới thiệu, liên hệ (bản đồ), chính sách (bảo hành, đổi trả, vận chuyển, thanh toán), tin tức.

**Quản trị:** tổng quan · báo cáo doanh thu theo sản phẩm, **theo hãng**, theo trạng thái, xuất CSV · đơn hàng (duyệt, giao, hoàn thành, huỷ) · sản phẩm (thêm/sửa với hãng, loại, nhãn khuyến mãi, thông số kỹ thuật, ảnh; ngừng bán, xoá) · mã giảm giá · khách hàng (**khoá / mở khoá, xoá**) · **đánh giá (ẩn/hiện, xoá)** · tin tức · liên hệ.

## Chỗ cần sửa
| Muốn sửa | File |
|---|---|
| Màu sắc, kiểu chữ, giao diện | `assets/css/site.css` (khách), `assets/css/admin.css` (quản trị) – biến màu ở đầu file (`:root`) |
| Logo | `assets/img/logo-smartben.svg`, biểu tượng tab: `assets/img/favicon.svg` |
| Header, menu, footer | `assets/js/giao-dien.js` (hàm `veHeader`, `veFooter`) |
| Hotline, phí ship, số máy tối đa, tài khoản QR | `assets/js/nghiep-vu.js` (đối tượng `CAU_HINH`) |
| Dữ liệu mẫu (sản phẩm, tài khoản, mã, tin tức) | `assets/js/du-lieu-mau.js` |
| Nội dung từng trang | file `.html` cùng tên; xử lý ở `assets/js/trang/*.js` và `assets/js/admin/*.js` |

## Lưu ý về ảnh
20 sản phẩm có ảnh trong `assets/img/products/`. 29 sản phẩm còn lại dùng ảnh trên mạng (giống đồ án gốc);
khi không có mạng hoặc ảnh không tải được, web tự vẽ ảnh thay thế hình điện thoại nên giao diện không bị vỡ.
Có thể tải ảnh về `assets/img/products/` rồi sửa tên ảnh trong Admin → Sản phẩm → Sửa.
