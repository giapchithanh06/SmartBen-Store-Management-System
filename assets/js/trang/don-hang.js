/* Dùng chung cho 3 trang: Đặt hàng thành công, Đơn hàng của tôi, Chi tiết đơn hàng.
   Trang nào thì dựa vào data-trang trên thẻ <body>. */
(function () {
  "use strict";
  var esc = GD.esc, TT = SB.TRANG_THAI;
  var trang = document.body.getAttribute("data-trang");

  function layDonDuocXem() {
    var d = KHO.tim("donHang", GD.thamSo("id"));
    if (!d || !SB.DonHang.coQuyenXem(d)) {
      GD.nhan(d ? "Bạn không có quyền xem đơn hàng này." : "Không tìm thấy đơn hàng.", "loi");
      location.replace(SB.TaiKhoan.hienTai() ? "don-hang-cua-toi.html" : "index.html");
      return null;
    }
    return d;
  }

  // ===================== ĐẶT HÀNG THÀNH CÔNG =====================
  if (trang === "dat-hang-thanh-cong") {
    var d = layDonDuocXem();
    if (!d) return;
    var canCK = d.phuongThuc === "QR" && !d.daThanhToan && d.trangThai !== TT.HUY;
    document.getElementById("camOn").textContent = "Cảm ơn " + d.hoTenNguoiNhan + "!";
    document.getElementById("ghiNhan").innerHTML = 'Đơn <b style="color: var(--sb-primary);">' + SB.maDon(d.id) + "</b> đã được ghi nhận lúc " + SB.ngayGio(d.ngayDat) + ".";
    document.getElementById("buocTiep").innerHTML = canCK ? "Vui lòng quét mã QR bên dưới để hoàn tất thanh toán."
      : "SmartBen sẽ gọi số <b>" + esc(d.soDienThoai) + "</b> để xác nhận và giao hàng sớm nhất.";
    document.getElementById("nutTheoDoi").href = "chi-tiet-don-hang.html?id=" + d.id;
    if (canCK) document.getElementById("khuQR").innerHTML = GD.khoiQR(d);
    document.getElementById("tomTat").innerHTML = GD.tomTatDon(d);
    GD.sauKhiVe();
    return;
  }

  // ===================== ĐƠN HÀNG CỦA TÔI =====================
  if (trang === "don-hang-cua-toi") {
    var tk = SB.TaiKhoan.hienTai();
    if (!tk) {
      GD.nhan("Vui lòng đăng nhập để xem lịch sử đơn hàng.", "loi");
      location.replace("dang-nhap.html?quayVe=don-hang-cua-toi.html");
      return;
    }
    var tatCa = SB.DonHang.cuaToi(tk.id);
    var chon = GD.thamSo("trangThai") || "";
    var dem = {};
    tatCa.forEach(function (x) { dem[x.trangThai] = (dem[x.trangThai] || 0) + 1; });
    document.getElementById("locTrangThai").innerHTML =
      '<a class="sb-chip' + (!chon ? " active" : "") + '" href="don-hang-cua-toi.html">Tất cả <span class="sb-chip-count">' + tatCa.length + "</span></a>" +
      TT.TAT_CA.map(function (t) {
        return '<a class="sb-chip' + (t === chon ? " active" : "") + '" href="don-hang-cua-toi.html?trangThai=' + encodeURIComponent(t) + '">' + t + ' <span class="sb-chip-count">' + (dem[t] || 0) + "</span></a>";
      }).join("");

    var ds = chon ? tatCa.filter(function (x) { return x.trangThai === chon; }) : tatCa;
    document.getElementById("dsDon").innerHTML = !ds.length
      ? GD.theRong("fa-receipt", chon ? "Không có đơn “" + chon + "”" : "Bạn chưa có đơn hàng nào", "Các đơn bạn đặt khi đã đăng nhập sẽ hiện ở đây.",
          '<a class="sb-btn sb-btn-grad mt-2" href="cua-hang.html">Bắt đầu mua sắm</a>')
      : ds.map(function (x) {
        var anh = x.chiTiet.slice(0, 4).map(function (c) { return '<img src="' + GD.anhSP(c.anh) + '" alt="' + esc(c.ten) + '" title="' + esc(c.ten) + " × " + c.soLuong + '" onerror="GD.anhLoi(this)" />'; }).join("");
        if (x.chiTiet.length > 4) anh += '<span class="them">+' + (x.chiTiet.length - 4) + "</span>";
        return '<article class="sb-card sb-order-card"><div class="sb-order-card-head"><div><b style="font-size: 1.05rem;">' + SB.maDon(x.id) + "</b>" +
          '<span class="text-muted ml-2" style="font-size: .85rem;"><i class="far fa-clock"></i> ' + SB.ngayGio(x.ngayDat) + "</span></div>" + GD.nhanTrangThai(x.trangThai) + "</div>" +
          '<div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 14px;"><div class="sb-order-thumbs">' + anh + "</div>" +
          '<div class="text-right"><div class="text-muted" style="font-size: .82rem;">' + x.chiTiet.length + " sản phẩm · " + SB.DonHang.tenPhuongThuc(x) + "</div>" +
          '<div class="sb-price" style="font-size: 1.25rem;">' + SB.tien(x.tongTien) + "</div></div>" +
          '<a class="sb-btn sb-btn-soft" href="chi-tiet-don-hang.html?id=' + x.id + '">Xem chi tiết <i class="fas fa-arrow-right"></i></a></div></article>';
      }).join("");
    return;
  }

  // ===================== CHI TIẾT ĐƠN HÀNG =====================
  if (trang === "chi-tiet-don-hang") {
    var don = layDonDuocXem();
    if (!don) return;
    var ve = function () {
      var daHuy = don.trangThai === TT.HUY;
      var buoc = don.trangThai === TT.XONG ? 3 : (don.trangThai === TT.GIAO ? 2 : 1);
      var canChuyen = don.phuongThuc === "QR" && !don.daThanhToan && !daHuy;
      document.getElementById("duongDan").innerHTML = '<a href="index.html">Trang chủ</a> <i class="fas fa-chevron-right"></i> ' +
        (SB.TaiKhoan.hienTai() ? '<a href="don-hang-cua-toi.html">Đơn hàng của tôi</a> <i class="fas fa-chevron-right"></i> ' : "") +
        '<span class="hien-tai">' + SB.maDon(don.id) + "</span>";
      document.getElementById("theoDoi").innerHTML =
        '<div class="sb-box-head"><div><span class="sb-eyebrow">Theo dõi đơn hàng</span><h1 style="font-size: 1.8rem; margin: 10px 0 4px;">Đơn ' + SB.maDon(don.id) + "</h1>" +
        '<span class="text-muted" style="font-size: .88rem;">Đặt lúc ' + SB.ngayGio(don.ngayDat) + (don.ngayCapNhat ? " · Cập nhật " + SB.ngayGio(don.ngayCapNhat) : "") + "</span></div>" +
        GD.nhanTrangThai(don.trangThai) + "</div>" +
        (daHuy
          ? '<div class="sb-note-box" style="background: var(--sb-red-soft); border-left-color: var(--sb-red); color: var(--sb-red); font-weight: 600;"><i class="fas fa-times-circle"></i> Đơn hàng đã được huỷ. Nếu bạn đã chuyển khoản, SmartBen sẽ liên hệ để hoàn tiền.</div>'
          : '<ol class="sb-timeline mt-2"><li class="xong"><i class="fas fa-clipboard-list"></i>Đã đặt hàng</li><li class="' + (buoc >= 2 ? "xong" : "") + '"><i class="fas fa-truck"></i>Đang giao</li>' +
            '<li class="' + (buoc >= 3 ? "xong" : "") + '"><i class="fas fa-check"></i>Hoàn thành</li></ol>') +
        (don.trangThai === TT.CHO
          ? '<div class="d-flex justify-content-between align-items-center flex-wrap mt-4 pt-3" style="gap: 10px; border-top: 1px solid var(--sb-border);">' +
            '<span class="text-muted" style="font-size: .88rem;">Đơn chưa được xử lý, bạn có thể tự huỷ.</span>' +
            '<button type="button" class="sb-btn sb-btn-danger" data-toggle="modal" data-target="#modalHuyDon"><i class="fas fa-times"></i> Huỷ đơn</button></div>' : "");
      document.getElementById("khuQR").innerHTML = canChuyen ? GD.khoiQR(don) : "";
      document.getElementById("tomTat").innerHTML = GD.tomTatDon(don);
      document.getElementById("tieuDeHuy").textContent = "Huỷ đơn " + SB.maDon(don.id) + "?";
      document.getElementById("moTaHuy").textContent = "Sản phẩm trong đơn sẽ được trả lại kho" + (don.maGiamGiaApDung ? ", mã " + don.maGiamGiaApDung + " được hoàn lượt dùng" : "") + ".";
      GD.sauKhiVe();
    };
    document.getElementById("btnXacNhanHuy").addEventListener("click", function () {
      $("#modalHuyDon").modal("hide");
      var hienTai = KHO.tim("donHang", don.id);
      if (hienTai.trangThai !== TT.CHO) {
        GD.toast("Đơn đã được cửa hàng xử lý nên không thể tự huỷ. Vui lòng liên hệ SmartBen để được hỗ trợ.", "loi");
      } else {
        var loi = SB.DonHang.huy(don.id);
        GD.toast(loi || "Đã huỷ đơn " + SB.maDon(don.id) + ".", loi ? "loi" : "ok");
      }
      don = KHO.tim("donHang", don.id);
      ve();
    });
    ve();
  }
})();
