/* =========================================================================
   SMARTBEN – GIAO DIỆN DÙNG CHUNG PHÍA KHÁCH HÀNG
   - Chèn header (logo, menu, tìm kiếm, giỏ hàng, tài khoản), banner đầu trang, dải logo đối tác, footer
   - Thông báo dạng toast (kể cả thông báo "nhắn" sang trang sau, giống TempData)
   - Hàm vẽ thẻ sản phẩm / thẻ tin tức / nhãn trạng thái đơn dùng lại ở nhiều trang
   - Kiểm tra dữ liệu form (bắt buộc, email, số điện thoại, độ dài, khớp mật khẩu)
   - Hiệu ứng: hiện dần khi cuộn, slider, dải cuộn ngang, ô số lượng, thư viện ảnh, sao chép, mật khẩu
   Mỗi trang HTML chỉ cần: <body data-trang="..." [data-banner="..." data-banner-tieu-de="..."]>
   Tác giả: Giáp Chí Thanh
   ========================================================================= */
(function () {
  "use strict";

  var body = document.body;
  var GOC = body.getAttribute("data-goc") || "";   // "" cho trang khách, "../" cho trang trong thư mục admin

  // ===================== TIỆN ÍCH =====================
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function thamSo(ten) { return new URLSearchParams(location.search).get(ten); }
  function anhSP(file) { return !file ? anhDuPhong("SmartBen") : (/^(data:|https?:)/.test(file) ? file : GOC + "assets/img/products/" + file); }
  // Ảnh dự phòng (vẽ bằng SVG) khi ảnh sản phẩm trên mạng không tải được hoặc chưa có ảnh
  function anhDuPhong(ten) {
    var chu = esc((ten || "SmartBen").slice(0, 26));
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#EEF4FF"/><stop offset="1" stop-color="#DCE8FF"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/>' +
      '<rect x="140" y="70" width="120" height="220" rx="22" fill="#0B1B33"/><rect x="150" y="88" width="100" height="184" rx="10" fill="#2F6BFF"/>' +
      '<circle cx="200" cy="280" r="5" fill="#9DB7FF"/><text x="200" y="335" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#0B1B33" text-anchor="middle">' + chu + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function anhLoi(img) { img.onerror = null; img.src = anhDuPhong(img.getAttribute("alt")); }
  function sao(diem, so) {
    var html = "";
    for (var i = 1; i <= 5; i++) html += '<i class="' + (diem >= i - 0.25 ? "fas fa-star" : (diem >= i - 0.75 ? "fas fa-star-half-alt" : "far fa-star")) + '"></i>';
    return '<span class="sb-stars" title="' + diem.toFixed(1) + '/5">' + html + (so != null ? '<small>(' + SB.so(so) + ')</small>' : "") + '</span>';
  }
  function anhTin(file) { return !file ? "" : (/^(data:|https?:)/.test(file) ? file : GOC + "assets/img/tintuc/" + file); }
  function link(trang, thamSoUrl) {
    var q = thamSoUrl ? Object.keys(thamSoUrl).filter(function (k) { return thamSoUrl[k] !== "" && thamSoUrl[k] != null && thamSoUrl[k] !== false; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(thamSoUrl[k]); }).join("&") : "";
    return GOC + trang + (q ? "?" + q : "");
  }

  // ===================== THÔNG BÁO (TOAST) =====================
  function khungToast() {
    var k = document.querySelector(".sb-toasts");
    if (!k) { k = document.createElement("div"); k.className = "sb-toasts"; k.setAttribute("aria-live", "polite"); body.appendChild(k); }
    return k;
  }
  function anToast(t) { t.classList.add("an"); setTimeout(function () { t.remove(); }, 260); }
  // loai: "ok" | "loi"; nutGio: hiện nút "Xem giỏ hàng"
  function toast(noiDung, loai, nutGio) {
    var loi = loai === "loi";
    var t = document.createElement("div");
    t.className = "sb-toast" + (loi ? " loi" : "");
    t.setAttribute("role", loi ? "alert" : "status");
    t.innerHTML = '<span class="sb-toast-icon"><i class="fas ' + (loi ? "fa-exclamation" : "fa-check") + '"></i></span>' +
      '<div class="sb-toast-body">' + esc(noiDung) +
      (nutGio ? '<div><a class="sb-btn sb-btn-soft sb-btn-sm" href="' + link("gio-hang.html") + '">Xem giỏ hàng <i class="fas fa-arrow-right"></i></a></div>' : "") +
      '</div><button class="sb-toast-close" type="button" aria-label="Đóng">&times;</button>';
    t.querySelector(".sb-toast-close").addEventListener("click", function () { anToast(t); });
    khungToast().appendChild(t);
    setTimeout(function () { if (body.contains(t)) anToast(t); }, loi ? 8000 : 5000);
  }
  // Nhắn thông báo sang trang kế tiếp (sau khi chuyển trang)
  function nhan(noiDung, loai, nutGio) {
    try { sessionStorage.setItem("sb_nhan", JSON.stringify({ n: noiDung, l: loai, g: !!nutGio })); } catch (e) { }
  }
  function hienNhan() {
    try {
      var x = JSON.parse(sessionStorage.getItem("sb_nhan") || "null");
      sessionStorage.removeItem("sb_nhan");
      if (x) toast(x.n, x.l, x.g);
    } catch (e) { }
  }

  // ===================== THÀNH PHẦN DÙNG LẠI =====================
  function theSanPham(sp, dsDanhGia) {
    var het = sp.ton <= 0, giam = SB.SanPham.dangGiam(sp);
    var url = link("san-pham.html", { id: sp.id });
    var km = SB.SanPham.nhanKhuyenMai(sp), dg = SB.SanPham.diemDanhGia(sp, dsDanhGia);
    var thich = SB.YeuThich.co(sp.id), soSanh = SB.SoSanh.co(sp.id);
    return '<article class="sb-product">' +
      '<div class="sb-product-img"><a href="' + url + '" aria-label="' + esc(sp.ten) + '">' +
      '<img src="' + anhSP(sp.anh) + '" alt="' + esc(sp.ten) + '" loading="lazy" onerror="GD.anhLoi(this)" /></a>' +
      (het ? '<span class="sb-tag het">Hết hàng</span>' : (km ? '<span class="sb-tag ' + km.lop + '">' + esc(km.chu) + '</span>' : "")) +
      (giam ? '<span class="sb-percent">-' + SB.SanPham.phanTramGiam(sp) + '%</span>' : "") +
      '<div class="sb-quick"><button type="button" class="' + (thich ? "on" : "") + '" data-yeu-thich="' + sp.id + '" title="Yêu thích" aria-label="Yêu thích ' + esc(sp.ten) + '"><i class="' + (thich ? "fas" : "far") + ' fa-heart"></i></button>' +
      '<button type="button" class="' + (soSanh ? "on" : "") + '" data-so-sanh="' + sp.id + '" title="So sánh" aria-label="So sánh ' + esc(sp.ten) + '"><i class="fas fa-balance-scale"></i></button></div></div>' +
      '<div class="sb-product-body">' +
      '<span class="sb-product-hang">' + esc(sp.hang) + '</span>' +
      '<h3 class="sb-product-name"><a href="' + url + '">' + esc(sp.ten) + '</a></h3>' +
      (dg.so ? sao(dg.sao, dg.so) : '<span class="sb-stars trong">Chưa có đánh giá</span>') +
      '<div class="sb-product-price"><span class="sb-price">' + SB.tien(sp.gia) + '</span>' +
      (giam ? '<span class="sb-old-price">' + SB.tien(sp.giaCu) + '</span>' : "") + '</div>' +
      '<div class="sb-product-actions"><button type="button" class="sb-btn sb-btn-grad" data-them-gio="' + sp.id + '"' + (het ? " disabled" : "") +
      ' aria-label="Thêm ' + esc(sp.ten) + ' vào giỏ"><i class="fas fa-cart-plus"></i> ' + (het ? "Hết hàng" : "Thêm vào giỏ") + '</button></div>' +
      '</div></article>';
  }

  function theTinTuc(t) {
    return '<a class="sb-news-card" href="' + link("tin-tuc-chi-tiet.html", { id: t.id }) + '">' +
      '<div class="sb-news-img">' + (t.anh ? '<img src="' + anhTin(t.anh) + '" alt="' + esc(t.tieuDe) + '" loading="lazy" />' : '<i class="fas fa-mobile-alt"></i>') + '</div>' +
      '<div class="sb-news-body"><div class="sb-news-meta"><span><i class="far fa-calendar-alt"></i> ' + SB.ngay(t.ngayDang) + '</span>' +
      '<span><i class="far fa-user"></i> ' + esc(t.nguoiDang) + '</span></div>' +
      '<h3>' + esc(t.tieuDe) + '</h3><p>' + esc(t.tomTat) + '</p><span class="sb-more">Đọc tiếp <i class="fas fa-arrow-right"></i></span></div></a>';
  }

  function nhanTrangThai(tt) {
    var lop = "cho", icon = "fa-clock";
    if (tt === SB.TRANG_THAI.GIAO) { lop = "giao"; icon = "fa-truck"; }
    else if (tt === SB.TRANG_THAI.XONG) { lop = "xong"; icon = "fa-check-circle"; }
    else if (tt === SB.TRANG_THAI.HUY) { lop = "huy"; icon = "fa-times-circle"; }
    return '<span class="sb-status ' + lop + '"><i class="fas ' + icon + '"></i> ' + esc(tt || SB.TRANG_THAI.CHO) + '</span>';
  }

  function theRong(icon, tieuDe, moTa, nut) {
    return '<div class="sb-card sb-empty"><i class="fas ' + icon + '"></i><h3>' + esc(tieuDe) + '</h3><p>' + esc(moTa) + '</p>' + (nut || "") + '</div>';
  }

  // ===================== KIỂM TRA FORM =====================
  // Dùng thuộc tính trên ô nhập:
  //   data-bat-buoc="Lời nhắc"   data-email="Lời nhắc"   data-mau="^0\d{9}$" data-mau-loi="Lời nhắc"
  //   data-it-nhat="6" data-it-nhat-loi="..."   data-nhieu-nhat="100"   data-khop="idOKhac" data-khop-loi="..."
  //   data-so-tu="1" (giá trị số nhỏ nhất)   data-so-loi="..."
  // Lỗi hiện trong <span class="sb-error" data-loi-cho="name"></span>
  function datLoi(form, input, loi) {
    var o = form.querySelector('[data-loi-cho="' + input.name + '"]');
    input.classList.toggle("input-validation-error", !!loi);
    if (o) o.textContent = loi || "";
  }
  function kiemTraO(form, input) {
    // Nhóm radio: chỉ ô mang thuộc tính kiểm tra mới đại diện cho cả nhóm (tránh ô sau xoá lỗi của ô trước)
    if (input.type === "radio" && !input.hasAttribute("data-bat-buoc")) {
      var dau = form.querySelector('[name="' + input.name + '"][data-bat-buoc]');
      return dau ? kiemTraO(form, dau) : true;
    }
    var v = (input.type === "checkbox" || input.type === "radio") ? (form.querySelector('[name="' + input.name + '"]:checked') ? "x" : "") : (input.value || "").trim();
    var loi = "";
    if (input.hasAttribute("data-bat-buoc") && !v) loi = input.getAttribute("data-bat-buoc") || "Vui lòng nhập thông tin này.";
    else if (v && input.hasAttribute("data-email") && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) loi = input.getAttribute("data-email") || "Email không đúng định dạng.";
    else if (v && input.hasAttribute("data-mau") && !new RegExp(input.getAttribute("data-mau")).test(v)) loi = input.getAttribute("data-mau-loi") || "Giá trị không hợp lệ.";
    else if (v && input.hasAttribute("data-it-nhat") && v.length < +input.getAttribute("data-it-nhat")) loi = input.getAttribute("data-it-nhat-loi") || "Quá ngắn.";
    else if (v && input.hasAttribute("data-nhieu-nhat") && v.length > +input.getAttribute("data-nhieu-nhat")) loi = "Tối đa " + input.getAttribute("data-nhieu-nhat") + " ký tự.";
    else if (input.hasAttribute("data-khop") && v !== (document.getElementById(input.getAttribute("data-khop")).value || "").trim()) loi = input.getAttribute("data-khop-loi") || "Không khớp.";
    else if (v && input.hasAttribute("data-so-tu") && !(Number(v) >= Number(input.getAttribute("data-so-tu")))) loi = input.getAttribute("data-so-loi") || "Giá trị không hợp lệ.";
    datLoi(form, input, loi);
    return !loi;
  }
  function kiemTraForm(form) {
    var hopLe = true, dauTien = null;
    $all("input, select, textarea", form).forEach(function (i) {
      if (!i.name || i.disabled) return;
      if (!kiemTraO(form, i)) { hopLe = false; dauTien = dauTien || i; }
    });
    if (dauTien) dauTien.focus();
    return hopLe;
  }
  function ganKiemTraTrucTiep(form) {
    $all("input, select, textarea", form).forEach(function (i) {
      i.addEventListener("blur", function () { if (i.value) kiemTraO(form, i); });
      i.addEventListener("change", function () { if (i.classList.contains("input-validation-error")) kiemTraO(form, i); });
      // Đang gõ sửa ô báo lỗi thì xoá lỗi ngay (tránh nội dung bị dịch chuyển đúng lúc bấm nút Gửi)
      i.addEventListener("input", function () { if (i.classList.contains("input-validation-error")) kiemTraO(form, i); });
    });
  }

  // ===================== HEADER / FOOTER =====================
  function veHeader() {
    var tk = SB.TaiKhoan.hienTai(), soGio = SB.GioHang.tongSoLuong();
    var tuKhoa = thamSo("tuKhoa") || "";
    var menu = [["trang-chu", "index.html", "Trang chủ"], ["cua-hang", "cua-hang.html", "Sản phẩm"], ["tin-tuc", "tin-tuc.html", "Tin tức"],
                ["gioi-thieu", "gioi-thieu.html", "Giới thiệu"], ["lien-he", "lien-he.html", "Liên hệ"]];
    var trang = body.getAttribute("data-trang");
    var htmlMenu = menu.map(function (m) {
      return '<li class="nav-item' + (m[0] === trang ? " active" : "") + '"><a class="nav-link" href="' + GOC + m[1] + '">' + m[2] + '</a></li>';
    }).join("");
    var htmlTK = tk
      ? '<div class="dropdown"><button class="sb-btn sb-btn-grad sb-user-btn dropdown-toggle" type="button" id="menuTaiKhoan" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
        '<i class="fas fa-user-circle"></i> <span class="sb-user-name">' + esc(tk.hoTen) + '</span></button>' +
        '<div class="dropdown-menu dropdown-menu-right" aria-labelledby="menuTaiKhoan">' +
        '<a class="dropdown-item" href="' + GOC + 'tai-khoan.html"><i class="fas fa-id-card"></i> Tài khoản của tôi</a>' +
        '<a class="dropdown-item" href="' + GOC + 'don-hang-cua-toi.html"><i class="fas fa-receipt"></i> Đơn hàng của tôi</a>' +
        '<a class="dropdown-item" href="' + GOC + 'tai-khoan.html#yeuThich"><i class="fas fa-heart"></i> Sản phẩm yêu thích</a>' +
        (tk.vaiTro === "Admin" ? '<a class="dropdown-item" href="' + GOC + 'admin/index.html"><i class="fas fa-shield-alt"></i> Trang quản trị</a>' : "") +
        '<div class="dropdown-divider"></div>' +
        '<a class="dropdown-item text-danger" href="#" data-toggle="modal" data-target="#modalDangXuat"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></div></div>'
      : '<a class="sb-btn sb-btn-grad" href="' + link("dang-nhap.html", { quayVe: location.pathname.split("/").pop() + location.search }) + '"><i class="fas fa-user"></i> Đăng nhập</a>';

    var header =
      '<header class="sb-header"><nav class="navbar navbar-expand-lg container">' +
      '<a class="navbar-brand sb-logo" href="' + GOC + 'index.html" aria-label="SmartBen - Trang chủ"><img src="' + GOC + 'assets/img/logo-smartben.svg" alt="SmartBen" /></a>' +
      '<div class="d-flex align-items-center d-lg-none" style="gap: 8px;">' +
      '<a class="sb-icon-btn" href="' + GOC + 'gio-hang.html" aria-label="Giỏ hàng"><i class="fas fa-shopping-cart"></i><span class="sb-badge-count" data-so-gio>' + soGio + '</span></a>' +
      '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#menuChinh" aria-controls="menuChinh" aria-expanded="false" aria-label="Mở menu"><i class="fas fa-bars"></i></button></div>' +
      '<div class="collapse navbar-collapse" id="menuChinh"><ul class="navbar-nav mx-auto">' + htmlMenu + '</ul>' +
      '<div class="d-flex align-items-center sb-header-actions" style="gap: 10px;">' +
      '<form class="sb-search" action="' + GOC + 'cua-hang.html" method="get" role="search">' +
      '<input type="search" name="tuKhoa" value="' + esc(tuKhoa) + '" placeholder="Tìm điện thoại, hãng..." aria-label="Tìm sản phẩm" list="goiYTimKiem" autocomplete="off" />' +
      '<datalist id="goiYTimKiem"></datalist>' +
      '<button type="submit" aria-label="Tìm"><i class="fas fa-search"></i></button></form>' +
      '<a class="sb-icon-btn d-none d-lg-inline-flex" href="' + GOC + 'so-sanh.html" title="So sánh" aria-label="So sánh sản phẩm"><i class="fas fa-balance-scale"></i><span class="sb-badge-count" data-so-so-sanh></span></a>' +
      '<a class="sb-icon-btn d-none d-lg-inline-flex" href="' + GOC + 'gio-hang.html" title="Giỏ hàng" aria-label="Giỏ hàng"><i class="fas fa-shopping-cart"></i><span class="sb-badge-count" data-so-gio>' + soGio + '</span></a>' +
      htmlTK + '</div></div></nav></header>';

    body.insertAdjacentHTML("afterbegin", header);

    // Gợi ý tìm kiếm: tên sản phẩm + tên hãng
    var goiY = {};
    SB.SanPham.dangBan().forEach(function (s) { goiY[s.ten] = 1; goiY[s.hang] = 1; });
    document.getElementById("goiYTimKiem").innerHTML = Object.keys(goiY).map(function (t) { return '<option value="' + esc(t) + '"></option>'; }).join("");

    // Banner đầu trang
    var banner = body.getAttribute("data-banner");
    if (banner) {
      var main = document.querySelector(".sb-main");
      main.insertAdjacentHTML("afterbegin", '<section class="sb-top-banner"><span class="sb-eyebrow">' + esc(banner) + '</span><h1>' +
        esc(body.getAttribute("data-banner-tieu-de") || document.title.split(" - ")[0]) + '</h1></section>');
    }

    if (tk) {
      body.insertAdjacentHTML("beforeend",
        '<div class="modal fade sb-modal" id="modalDangXuat" tabindex="-1" role="dialog" aria-labelledby="tieuDeDangXuat" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-sm" role="document"><div class="modal-content">' +
        '<div class="sb-modal-icon"><i class="fas fa-sign-out-alt"></i></div><h3 id="tieuDeDangXuat">Đăng xuất?</h3>' +
        '<p>Bạn có chắc muốn đăng xuất khỏi SmartBen không? Giỏ hàng hiện tại sẽ được xoá.</p>' +
        '<div class="sb-modal-actions"><button type="button" class="sb-btn sb-btn-outline" data-dismiss="modal">Ở lại</button>' +
        '<button type="button" class="sb-btn sb-btn-danger" id="btnDangXuat">Đăng xuất</button></div></div></div></div>');
      document.getElementById("btnDangXuat").addEventListener("click", function () {
        SB.TaiKhoan.dangXuat();
        nhan("Bạn đã đăng xuất.");
        location.href = GOC + "index.html";
      });
    }
  }

  function veFooter() {
    var hang = SB.SanPham.danhSachHang().map(function (h) {
      return '<a href="' + link("cua-hang.html", { hang: h }) + '" title="Điện thoại ' + esc(h) + '"><img src="' + GOC + 'assets/img/hang/' + h + (h === "Xiaomi" || h === "Realme" || h === "Coolpad" ? ".png" : ".jpg") + '" alt="' + esc(h) + '" loading="lazy" onerror="this.parentNode.textContent=this.alt" /></a>';
    }).join("");
    var nam = new Date().getFullYear(), C = SB.CAU_HINH;
    var footer =
      '<section class="sb-logos" aria-label="Thương hiệu"><div class="container"><span class="sb-logos-title">Thương hiệu chính hãng</span>' + hang + '</div></section>' +
      '<footer class="sb-footer"><div class="container"><div class="row">' +
      '<div class="col-lg-4 col-md-6 mb-4"><img class="sb-footer-logo" src="' + GOC + 'assets/img/logo-smartben.svg" alt="SmartBen" />' +
      '<p style="max-width: 36ch;">Điện thoại, máy tính bảng chính hãng giá tốt cho học sinh, sinh viên. Bảo hành 12 tháng, đổi trả 30 ngày, trả góp 0%.</p></div>' +
      '<div class="col-lg-2 col-md-6 col-6 mb-4"><h4>Mua sắm</h4><ul>' +
      '<li><a href="' + link("cua-hang.html", { loai: "Điện thoại thông minh" }) + '">Điện thoại thông minh</a></li>' +
      '<li><a href="' + link("cua-hang.html", { loai: "Máy tính bảng" }) + '">Máy tính bảng</a></li>' +
      '<li><a href="' + link("cua-hang.html", { giaDen: 5000000 }) + '">Góc sinh viên (dưới 5 triệu)</a></li>' +
      '<li><a href="' + link("cua-hang.html", { khuyenMai: "tragop" }) + '">Trả góp 0%</a></li><li><a href="' + GOC + 'so-sanh.html">So sánh sản phẩm</a></li></ul></div>' +
      '<div class="col-lg-2 col-md-6 col-6 mb-4"><h4>Hỗ trợ</h4><ul>' +
      '<li><a href="' + GOC + 'lien-he.html">Liên hệ</a></li><li><a href="' + GOC + 'chinh-sach.html#bao-hanh">Bảo hành</a></li>' +
      '<li><a href="' + GOC + 'chinh-sach.html#doi-tra">Đổi trả</a></li><li><a href="' + GOC + 'chinh-sach.html#van-chuyen">Vận chuyển</a></li>' +
      '<li><a href="' + GOC + 'chinh-sach.html#thanh-toan">Thanh toán</a></li></ul></div>' +
      '<div class="col-lg-4 col-md-6 mb-4"><h4>Liên hệ</h4><ul class="sb-contact">' +
      '<li><i class="fas fa-map-marker-alt"></i> 140 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh</li>' +
      '<li><i class="fas fa-phone"></i> ' + C.HOTLINE + ' (miễn phí, 8:00 – 21:30)</li><li><i class="fas fa-envelope"></i> hotro@smartben.vn</li></ul></div>' +
      '</div></div><div class="sb-footer-bottom"><div class="container">Bản quyền &copy; ' + nam + ' SmartBen · Thiết kế &amp; phát triển: <strong>' + esc(C.TAC_GIA) + '</strong> · ' +
      '<a href="' + GOC + 'chinh-sach.html#doi-tra">Chính sách đổi trả</a> · <a href="' + GOC + 'chinh-sach.html#bao-hanh">Bảo hành</a></div></div></footer>' +
      '<div class="sb-compare-bar" id="thanhSoSanh" hidden></div>';
    body.insertAdjacentHTML("beforeend", footer);
    veThanhSoSanh();
  }

  // Thanh so sánh nổi ở đáy trang
  function veThanhSoSanh() {
    var thanh = document.getElementById("thanhSoSanh");
    var ds = SB.SoSanh.lay().map(function (id) { return KHO.tim("sanPham", id); }).filter(Boolean);
    $all("[data-so-so-sanh]").forEach(function (el) { el.textContent = ds.length || ""; el.hidden = !ds.length; });
    if (!thanh) return;
    if (!ds.length || body.getAttribute("data-trang") === "so-sanh") { thanh.hidden = true; return; }
    thanh.hidden = false;
    thanh.innerHTML = '<span class="font-weight-bold" style="white-space: nowrap;"><i class="fas fa-balance-scale"></i> So sánh ' + ds.length + '/' + SB.CAU_HINH.TOI_DA_SO_SANH + '</span><div class="sb-cmp-items">' +
      ds.map(function (s) {
        return '<span class="sb-cmp-item"><img src="' + anhSP(s.anh) + '" alt="' + esc(s.ten) + '" onerror="GD.anhLoi(this)" /><span>' + esc(s.ten) + '</span>' +
          '<button type="button" data-so-sanh="' + s.id + '" aria-label="Bỏ ' + esc(s.ten) + '">&times;</button></span>';
      }).join("") + '</div>' +
      '<a class="sb-btn sb-btn-grad sb-btn-sm" href="' + GOC + 'so-sanh.html">So sánh ngay</a>' +
      '<button type="button" class="sb-btn sb-btn-white sb-btn-sm" id="xoaSoSanh">Xoá hết</button>';
    document.getElementById("xoaSoSanh").addEventListener("click", function () { SB.SoSanh.ghi([]); veThanhSoSanh(); capNhatNutNhanh(); });
  }

  // Đồng bộ trạng thái nút tim / so sánh trên các thẻ đang hiện
  function capNhatNutNhanh() {
    $all("[data-yeu-thich]").forEach(function (b) {
      var on = SB.YeuThich.co(b.getAttribute("data-yeu-thich"));
      b.classList.toggle("on", on);
      var i = b.querySelector("i"); if (i) i.className = (on ? "fas" : "far") + " fa-heart";
    });
    $all(".sb-quick [data-so-sanh], [data-so-sanh].sb-btn").forEach(function (b) { b.classList.toggle("on", SB.SoSanh.co(b.getAttribute("data-so-sanh"))); });
  }

  function capNhatSoGio() {
    var so = SB.GioHang.tongSoLuong();
    $all("[data-so-gio]").forEach(function (el) { el.textContent = so; });
  }

  // Nút "Thêm vào giỏ", "Yêu thích", "So sánh" trên mọi thẻ sản phẩm (ở lại trang, hiện thông báo)
  function ganNutThemGio() {
    document.addEventListener("click", function (e) {
      var nut = e.target.closest("[data-them-gio]");
      if (nut) {
        var kq = SB.GioHang.them(+nut.getAttribute("data-them-gio"), 1);
        toast(kq.thongBao, kq.ok ? "ok" : "loi", kq.ok);
        capNhatSoGio();
        return;
      }
      var tim = e.target.closest("[data-yeu-thich]");
      if (tim) {
        var sp = KHO.tim("sanPham", tim.getAttribute("data-yeu-thich"));
        toast(SB.YeuThich.batTat(sp.id) ? "Đã thêm " + sp.ten + " vào danh sách yêu thích." : "Đã bỏ " + sp.ten + " khỏi danh sách yêu thích.");
        capNhatNutNhanh();
        document.dispatchEvent(new CustomEvent("sb-yeu-thich"));
        return;
      }
      var ss = e.target.closest("[data-so-sanh]");
      if (ss) {
        var kq2 = SB.SoSanh.batTat(ss.getAttribute("data-so-sanh"));
        if (!kq2.ok) toast(kq2.thongBao, "loi");
        veThanhSoSanh(); capNhatNutNhanh();
        document.dispatchEvent(new CustomEvent("sb-so-sanh"));
      }
    });
  }

  // ===================== HIỆU ỨNG =====================
  function initReveal() {
    var items = $all(".reveal:not(.show)");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("show"); }); return; }
    body.classList.add("reveal-ready");
    var ob = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("show"); ob.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { ob.observe(el); });
  }

  function initSlider(root) {
    var slides = $all(".sb-slide", root);
    if (slides.length < 2) return;
    var dots = root.querySelector(".sb-dots"), i = 0, timer = null;
    slides.forEach(function (_, idx) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Ảnh " + (idx + 1));
      b.addEventListener("click", function () { show(idx); restart(); });
      if (dots) dots.appendChild(b);
    });
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      if (dots) $all("button", dots).forEach(function (d, k) { d.classList.toggle("active", k === i); });
    }
    function restart() {
      clearInterval(timer);
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(function () { show(i + 1); }, 4500);
    }
    var prev = root.querySelector(".sb-slider-nav.prev"), next = root.querySelector(".sb-slider-nav.next");
    if (prev) prev.addEventListener("click", function () { show(i - 1); restart(); });
    if (next) next.addEventListener("click", function () { show(i + 1); restart(); });
    show(0); restart();
  }

  function initStrips() {
    $all("[data-strip-target]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var strip = document.getElementById(btn.getAttribute("data-strip-target"));
        if (!strip) return;
        var step = (strip.firstElementChild ? strip.firstElementChild.getBoundingClientRect().width : 240) + 24;
        strip.scrollBy({ left: step * parseInt(btn.getAttribute("data-dir"), 10), behavior: "smooth" });
      });
    });
  }

  // Ô số lượng có nút -/+ ; onChange(giaTri) gọi khi đổi (dùng ở giỏ hàng)
  function initQty(root, onChange) {
    $all("[data-qty]", root).forEach(function (box) {
      if (box._da) return; box._da = true;
      var input = box.querySelector("input");
      var min = parseInt(input.getAttribute("min") || "1", 10), max = parseInt(input.getAttribute("max") || "999", 10);
      $all("button[data-step]", box).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = parseInt(input.value || "0", 10) + parseInt(b.getAttribute("data-step"), 10);
          if (isNaN(v)) v = min;
          input.value = Math.max(min, Math.min(max, v));
          if (onChange) onChange(box, +input.value);
        });
      });
      if (onChange) input.addEventListener("change", function () { onChange(box, parseInt(input.value, 10) || 0); });
    });
  }

  function initCopy(root) {
    $all("[data-copy]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-copy");
        var xong = function () { var cu = b.textContent; b.textContent = "Đã chép"; setTimeout(function () { b.textContent = cu; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(xong, function () { window.prompt("Sao chép nội dung:", text); });
        else window.prompt("Sao chép nội dung:", text);
      });
    });
  }

  function initPassword(root) {
    $all("[data-toggle-pass]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var input = document.getElementById(b.getAttribute("data-toggle-pass")), hien = input.type === "password";
        input.type = hien ? "text" : "password";
        b.innerHTML = hien ? '<i class="far fa-eye-slash"></i>' : '<i class="far fa-eye"></i>';
        b.setAttribute("aria-label", hien ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      });
    });
    $all("[data-strength]", root).forEach(function (input) {
      var bar = document.getElementById(input.getAttribute("data-strength"));
      var text = document.getElementById(input.getAttribute("data-strength") + "Text");
      var nhanDo = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
      input.addEventListener("input", function () {
        var v = input.value, d = 0;
        if (v.length >= 6) d++;
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) d++;
        if (/\d/.test(v)) d++;
        if (/[^A-Za-z0-9]/.test(v) || v.length >= 10) d++;
        if (!v) d = 0;
        bar.className = "sb-strength" + (d ? " m" + d : "");
        if (text) text.textContent = d ? "Độ mạnh: " + nhanDo[d] : "Nên dùng ít nhất 6 ký tự, có chữ hoa, chữ thường và số.";
      });
    });
  }

  // Đếm ngược thời gian giữ đơn chờ chuyển khoản QR
  function demNguoc(el) {
    if (!el) return;
    var giay = parseInt(el.getAttribute("data-con-giay"), 10), span = el.querySelector("span");
    (function ve() {
      if (giay <= 0) { span.textContent = "Đã quá thời gian giữ đơn"; return; }
      span.textContent = String(Math.floor(giay / 60)).padStart(2, "0") + ":" + String(giay % 60).padStart(2, "0");
      giay--; setTimeout(ve, 1000);
    })();
  }

  // Khối tóm tắt đơn (trang Thành công, Chi tiết đơn)
  function tomTatDon(d) {
    var dong = d.chiTiet.map(function (c) {
      return '<div class="sb-order-line"><img src="' + anhSP(c.anh) + '" alt="' + esc(c.ten) + '" onerror="GD.anhLoi(this)" /><div><b>' + esc(c.ten) + '</b><small>' + c.soLuong + ' × ' + SB.tien(c.donGia) + '</small></div>' +
        '<span class="font-weight-bold sb-num">' + SB.tien(c.donGia * c.soLuong) + '</span></div>';
    }).join("");
    var tt = d.daThanhToan ? '<span class="sb-pill ok ml-1">Đã thanh toán</span>' : (d.trangThai !== SB.TRANG_THAI.HUY ? '<span class="sb-pill warn ml-1">Chưa thanh toán</span>' : "");
    return '<div class="sb-box-head"><h3>Đơn ' + SB.maDon(d.id) + '</h3>' + nhanTrangThai(d.trangThai) + '</div>' + dong +
      '<div class="mt-3"><div class="sb-sum-row"><span>Tạm tính</span><span>' + SB.tien(d.tamTinh) + '</span></div>' +
      '<div class="sb-sum-row"><span>Phí vận chuyển</span><span>' + (d.phiVanChuyen === 0 ? "Miễn phí" : SB.tien(d.phiVanChuyen)) + '</span></div>' +
      (d.giamGia > 0 ? '<div class="sb-sum-row giam"><span>Giảm giá' + (d.maGiamGiaApDung ? " (" + esc(d.maGiamGiaApDung) + ")" : "") + '</span><span>-' + SB.tien(d.giamGia) + '</span></div>' : "") +
      '<div class="sb-sum-total"><span class="font-weight-bold">Tổng thanh toán</span><strong>' + SB.tien(d.tongTien) + '</strong></div></div>' +
      '<div class="sb-note-box mt-3"><div class="mb-1"><b><i class="fas fa-map-marker-alt"></i> Giao đến</b></div>' +
      esc(d.hoTenNguoiNhan) + ' · ' + esc(d.soDienThoai) + '<br />' + esc(SB.DonHang.diaChiDayDu(d)) +
      (d.ghiChu ? '<div class="mt-1"><i>Ghi chú: ' + esc(d.ghiChu) + '</i></div>' : "") +
      '<div class="mt-2"><b><i class="fas fa-wallet"></i> Thanh toán:</b> ' + SB.DonHang.tenPhuongThuc(d) + ' ' + tt + '</div></div>';
  }

  // Khối chuyển khoản QR
  function khoiQR(d) {
    var C = SB.CAU_HINH;
    var conGiay = Math.max(0, Math.round((new Date(d.ngayDat).getTime() + C.QR_SO_PHUT * 60000 - Date.now()) / 1000));
    var nd = SB.DonHang.noiDungChuyenKhoan(d);
    return '<section class="sb-card sb-card-pad mt-4" id="khoiQR"><div class="sb-box-head">' +
      '<h3><i class="fas fa-qrcode" style="color: var(--sb-primary);"></i> Quét mã để chuyển khoản</h3>' +
      '<span class="sb-timer" data-con-giay="' + conGiay + '"><i class="far fa-clock"></i> <span>--:--</span></span></div>' +
      '<div class="sb-qr"><img src="' + SB.DonHang.linkQR(d) + '" alt="Mã QR chuyển khoản ' + SB.tien(d.tongTien) + '" /><div><dl>' +
      '<dt>Ngân hàng</dt><dd>' + C.QR_TEN_NGAN_HANG + '</dd>' +
      '<dt>Số tài khoản</dt><dd>' + C.QR_SO_TAI_KHOAN + ' <button type="button" class="sb-copy" data-copy="' + C.QR_SO_TAI_KHOAN + '">Chép</button></dd>' +
      '<dt>Chủ tài khoản</dt><dd>' + C.QR_TEN_TAI_KHOAN + '</dd>' +
      '<dt>Số tiền</dt><dd class="sb-price">' + SB.tien(d.tongTien) + '</dd>' +
      '<dt>Nội dung</dt><dd>' + nd + ' <button type="button" class="sb-copy" data-copy="' + nd + '">Chép</button></dd></dl>' +
      '<p class="text-muted mt-3 mb-0" style="font-size: .82rem;">Ghi đúng nội dung để SmartBen tự đối soát. Sau khi nhận được tiền, cửa hàng xác nhận và chuyển đơn sang “Đang giao”. ' +
      'Quá ' + C.QR_SO_PHUT + ' phút chưa chuyển khoản, bạn vẫn có thể chuyển hoặc gọi ' + C.HOTLINE + ' để đổi sang COD.</p></div></div></section>';
  }

  function sauKhiVe(root) {
    initReveal();
    initCopy(root);
    demNguoc((root || document).querySelector("#khoiQR .sb-timer"));
  }

  // ===================== KHỞI ĐỘNG =====================
  window.GD = {
    GOC: GOC, esc: esc, $all: $all, thamSo: thamSo, anhSP: anhSP, anhTin: anhTin, link: link,
    toast: toast, nhan: nhan, theSanPham: theSanPham, anhLoi: anhLoi, anhDuPhong: anhDuPhong, sao: sao, veThanhSoSanh: veThanhSoSanh, capNhatNutNhanh: capNhatNutNhanh, theTinTuc: theTinTuc, nhanTrangThai: nhanTrangThai, theRong: theRong,
    kiemTraForm: kiemTraForm, ganKiemTraTrucTiep: ganKiemTraTrucTiep, datLoi: datLoi,
    capNhatSoGio: capNhatSoGio, initQty: initQty, initSlider: initSlider, initStrips: initStrips, initPassword: initPassword,
    tomTatDon: tomTatDon, khoiQR: khoiQR, sauKhiVe: sauKhiVe
  };

  if (!body.classList.contains("ad-body")) {
    veHeader();
    veFooter();
    ganNutThemGio();
  }
  document.addEventListener("DOMContentLoaded", function () {
    hienNhan();
    initReveal();
    $all(".sb-slider").forEach(initSlider);
    initStrips();
    initPassword();
    initCopy();
  });
})();
