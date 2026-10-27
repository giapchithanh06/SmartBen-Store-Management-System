/* =========================================================================
   SMARTBEN – KHUNG TRANG QUẢN TRỊ
   - Chặn người chưa đăng nhập hoặc không phải Admin (chuyển về trang đăng nhập)
   - Chèn thanh bên (menu), thanh trên (tìm sản phẩm, chuông đơn chờ, tài khoản), modal đăng xuất
   - Hộp xác nhận dùng chung (AD.xacNhan) thay cho confirm() của trình duyệt
   Mỗi trang admin: <body class="ad-body" data-goc="../" data-menu="san-pham">
   Tác giả: Giáp Chí Thanh
   ========================================================================= */
(function () {
  "use strict";
  var body = document.body;
  var tk = SB.TaiKhoan.hienTai();
  if (!tk || tk.vaiTro !== "Admin") {
    GD.nhan(tk ? "Tài khoản của bạn không có quyền vào trang quản trị." : "Vui lòng đăng nhập bằng tài khoản quản trị.", "loi");
    // Khách đã đăng nhập nhưng không phải admin -> về trang chủ; chưa đăng nhập -> trang đăng nhập rồi quay lại đây
    location.replace(tk ? "../index.html" : "../dang-nhap.html?quayVe=" + encodeURIComponent("admin/" + location.pathname.split("/").pop() + location.search));
    document.documentElement.style.display = "none";
    window.AD = null;   // các script trang admin thấy AD = null sẽ dừng lại
    return;
  }

  var esc = GD.esc;
  var menu = body.getAttribute("data-menu");
  var soDonCho = KHO.lay("donHang").filter(function (d) { return d.trangThai === SB.TRANG_THAI.CHO; }).length;
  var soLienHe = KHO.lay("lienHe").filter(function (l) { return !l.daXuLy; }).length;

  function muc(id, file, icon, ten, dem) {
    return '<a class="' + (menu === id ? "active" : "") + '" href="' + file + '"><i class="fas ' + icon + '"></i> ' + ten +
      (dem ? '<span class="ad-count">' + dem + "</span>" : "") + "</a>";
  }

  var sidebar =
    '<aside class="ad-sidebar" id="adSidebar">' +
    '<a class="ad-brand" href="index.html"><span class="ad-brand-icon"><i class="fas fa-mobile-alt"></i></span><span>SmartBen<small>Trang quản trị</small></span></a>' +
    '<nav class="ad-nav"><div class="ad-nav-label">Tổng quan</div>' +
    muc("tong-quan", "index.html", "fa-tachometer-alt", "Tổng quan") +
    muc("bao-cao", "bao-cao.html", "fa-chart-line", "Báo cáo doanh thu") +
    '<div class="ad-nav-label">Bán hàng</div>' +
    muc("don-hang", "don-hang.html", "fa-receipt", "Đơn hàng", soDonCho) +
    muc("san-pham", "san-pham.html", "fa-box-open", "Sản phẩm") +
    muc("ma-giam-gia", "ma-giam-gia.html", "fa-ticket-alt", "Mã giảm giá") +
    muc("khach-hang", "khach-hang.html", "fa-users", "Khách hàng") +
    '<div class="ad-nav-label">Nội dung</div>' +
    muc("danh-gia", "danh-gia.html", "fa-star", "Đánh giá") +
    muc("tin-tuc", "tin-tuc.html", "fa-newspaper", "Tin tức") +
    muc("lien-he", "lien-he.html", "fa-envelope", "Liên hệ", soLienHe) +
    '</nav><div class="ad-sidebar-foot">' +
    '<a href="../index.html" target="_blank"><i class="fas fa-store"></i> Xem cửa hàng</a>' +
    '<a href="#" data-toggle="modal" data-target="#modalDangXuat"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></div></aside>';

  var topbar =
    '<header class="ad-topbar"><button type="button" class="sb-icon-btn ad-menu-btn" id="adMenuBtn" aria-label="Mở menu"><i class="fas fa-bars"></i></button>' +
    '<form action="san-pham.html" method="get" role="search"><i class="fas fa-search"></i><input type="search" name="tuKhoa" placeholder="Tìm sản phẩm..." aria-label="Tìm sản phẩm" /></form>' +
    '<div class="ml-auto d-flex align-items-center" style="gap: 10px;">' +
    '<a class="sb-icon-btn ad-bell" href="don-hang.html?trangThai=' + encodeURIComponent(SB.TRANG_THAI.CHO) + '" title="Đơn chờ xử lý" aria-label="Đơn chờ xử lý"><i class="far fa-bell"></i>' +
    (soDonCho ? '<span class="sb-badge-count">' + soDonCho + "</span>" : "") + "</a>" +
    '<div class="dropdown"><button class="ad-user dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
    '<span class="av">' + esc(tk.hoTen.trim().charAt(0).toUpperCase()) + '</span><span class="text-left d-none d-sm-inline">' + esc(tk.hoTen) + "<small>Quản trị viên</small></span></button>" +
    '<div class="dropdown-menu dropdown-menu-right"><a class="dropdown-item" href="../index.html" target="_blank"><i class="fas fa-store mr-2"></i> Xem cửa hàng</a>' +
    '<a class="dropdown-item" href="bao-cao.html#khoiPhuc"><i class="fas fa-undo-alt mr-2"></i> Dữ liệu mẫu</a><div class="dropdown-divider"></div>' +
    '<a class="dropdown-item text-danger" href="#" data-toggle="modal" data-target="#modalDangXuat"><i class="fas fa-sign-out-alt mr-2"></i> Đăng xuất</a></div></div></div></header>';

  // Bọc nội dung trang vào khung admin
  var noiDung = document.getElementById("adNoiDung");
  var layout = document.createElement("div");
  layout.className = "ad-layout";
  layout.innerHTML = sidebar + '<div class="ad-main">' + topbar + "</div>";
  body.insertBefore(layout, noiDung);
  layout.querySelector(".ad-main").appendChild(noiDung);

  body.insertAdjacentHTML("beforeend",
    '<div class="modal fade sb-modal" id="modalDangXuat" tabindex="-1" role="dialog" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-sm" role="document"><div class="modal-content">' +
    '<div class="sb-modal-icon"><i class="fas fa-sign-out-alt"></i></div><h3>Đăng xuất tài khoản?</h3><p>Bạn sẽ thoát khỏi khu quản trị SmartBen.</p>' +
    '<div class="sb-modal-actions"><button type="button" class="sb-btn sb-btn-outline" data-dismiss="modal">Ở lại</button><button type="button" class="sb-btn sb-btn-danger" id="btnDangXuat">Đăng xuất</button></div></div></div></div>' +
    '<div class="modal fade sb-modal" id="modalXacNhan" tabindex="-1" role="dialog" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-sm" role="document"><div class="modal-content">' +
    '<div class="sb-modal-icon"><i class="fas fa-exclamation"></i></div><h3 id="xnTieuDe"></h3><p id="xnNoiDung"></p>' +
    '<div class="sb-modal-actions"><button type="button" class="sb-btn sb-btn-outline" data-dismiss="modal">Huỷ bỏ</button><button type="button" class="sb-btn sb-btn-danger" id="xnDongY">Đồng ý</button></div></div></div></div>');

  document.getElementById("btnDangXuat").addEventListener("click", function () {
    SB.TaiKhoan.dangXuat();
    GD.nhan("Bạn đã đăng xuất.");
    location.href = "../index.html";
  });

  // Mở/đóng thanh bên trên màn hình nhỏ
  var btn = document.getElementById("adMenuBtn"), bar = document.getElementById("adSidebar");
  btn.addEventListener("click", function (e) { e.stopPropagation(); bar.classList.toggle("mo"); });
  document.addEventListener("click", function (e) { if (!bar.contains(e.target)) bar.classList.remove("mo"); });

  var hamDongY = null;
  document.getElementById("xnDongY").addEventListener("click", function () {
    $("#modalXacNhan").modal("hide");
    if (hamDongY) hamDongY();
  });

  window.AD = {
    taiKhoan: tk,
    // Hộp xác nhận: AD.xacNhan("Tiêu đề", "Nội dung", function () { ... }, "Chữ trên nút")
    xacNhan: function (tieuDe, noiDung, dongY, chuNut) {
      document.getElementById("xnTieuDe").textContent = tieuDe;
      document.getElementById("xnNoiDung").textContent = noiDung;
      document.getElementById("xnDongY").textContent = chuNut || "Đồng ý";
      hamDongY = dongY;
      $("#modalXacNhan").modal("show");
    },
    // Đọc file ảnh người dùng chọn thành chuỗi data URL (lưu được trong localStorage), tự thu nhỏ để tiết kiệm dung lượng
    docAnh: function (file, canhDai, xong) {
      if (!file) return xong(null);
      if (!/^image\//.test(file.type)) { GD.toast("Chỉ chọn file ảnh (.jpg, .png, .webp, .gif).", "loi"); return xong(null); }
      if (file.size > 5 * 1024 * 1024) { GD.toast("Ảnh quá lớn (tối đa 5 MB).", "loi"); return xong(null); }
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var tile = Math.min(1, canhDai / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * tile); c.height = Math.round(img.height * tile);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          xong(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    },
    // Chuyển "dd/mm/yyyy" <-> giá trị ô input type=date
    ngayInput: function (iso) { if (!iso) return ""; var d = new Date(iso); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
    tuNgayInput: function (v) { if (!v) return null; var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toISOString(); }
  };
})();
