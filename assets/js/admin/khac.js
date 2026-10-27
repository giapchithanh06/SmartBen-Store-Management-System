/* Admin – Liên hệ (đánh dấu đã xử lý, xoá) và Báo cáo doanh thu (theo sản phẩm, theo hãng, theo trạng thái, xuất CSV, khôi phục dữ liệu mẫu) */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc, TT = SB.TRANG_THAI;

  // ===================== LIÊN HỆ =====================
  var bangLH = document.getElementById("bangLienHe");
  if (bangLH) {
    var veLH = function () {
      var ds = KHO.lay("lienHe").sort(function (a, b) { return (a.daXuLy - b.daXuLy) || (new Date(b.ngayGui) - new Date(a.ngayGui)); });
      document.getElementById("demLH").textContent = ds.length + " lời nhắn · " + ds.filter(function (l) { return !l.daXuLy; }).length + " chưa xử lý.";
      bangLH.innerHTML = !ds.length ? '<div class="ad-empty">Chưa có lời nhắn nào.</div>' : '<div class="ad-list">' + ds.map(function (l) {
        return '<div class="ad-item" style="align-items: flex-start;"><span class="icon' + (l.daXuLy ? "" : " cam") + '"><i class="fas ' + (l.daXuLy ? "fa-check" : "fa-envelope") + '"></i></span>' +
          '<span class="info"><b style="white-space: normal;">' + esc(l.chuDe) + "</b><small>" + esc(l.hoTen) + " · " + esc(l.email) + (l.soDienThoai ? " · " + esc(l.soDienThoai) : "") + " · " + SB.ngayGio(l.ngayGui) + "</small>" +
          '<span class="d-block mt-1" style="white-space: pre-line; font-size: .9rem;">' + esc(l.tinNhan) + "</span></span>" +
          '<span class="ad-actions" style="flex: none;"><a class="ad-icon-btn" href="mailto:' + esc(l.email) + "?subject=" + encodeURIComponent("Re: " + l.chuDe) + '" title="Trả lời qua email" aria-label="Trả lời"><i class="fas fa-reply"></i></a>' +
          '<button type="button" class="ad-icon-btn" data-xu-ly="' + l.id + '" title="' + (l.daXuLy ? "Đánh dấu chưa xử lý" : "Đánh dấu đã xử lý") + '" aria-label="Đổi trạng thái"><i class="fas ' + (l.daXuLy ? "fa-undo-alt" : "fa-check") + '"></i></button>' +
          '<button type="button" class="ad-icon-btn do" data-xoa="' + l.id + '" title="Xoá" aria-label="Xoá lời nhắn"><i class="fas fa-trash-alt"></i></button></span></div>';
      }).join("") + "</div>";
    };
    bangLH.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-xu-ly")) {
        var l = KHO.tim("lienHe", b.getAttribute("data-xu-ly"));
        KHO.sua("lienHe", l.id, { daXuLy: !l.daXuLy }); veLH();
      } else {
        var id = b.getAttribute("data-xoa");
        AD.xacNhan("Xoá lời nhắn?", "Lời nhắn sẽ bị xoá vĩnh viễn.", function () { KHO.xoa("lienHe", id); GD.toast("Đã xoá lời nhắn."); veLH(); }, "Xoá");
      }
    });
    veLH();
  }

  // ===================== BÁO CÁO =====================
  var bangBC = document.getElementById("bangDoanhThu");
  if (bangBC) {
    var don = KHO.lay("donHang"), hopLe = don.filter(function (d) { return d.trangThai !== TT.HUY; });
    var tong = hopLe.reduce(function (t, d) { return t + d.tongTien; }, 0);
    var tienHang = hopLe.reduce(function (t, d) { return t + d.tamTinh; }, 0);
    var giam = hopLe.reduce(function (t, d) { return t + d.giamGia; }, 0);
    document.getElementById("theBaoCao").innerHTML =
      '<div class="ad-stat"><span class="ico lam"><i class="fas fa-receipt"></i></span><div><p>Đơn hợp lệ</p><h3>' + hopLe.length + "</h3><span>" + (don.length - hopLe.length) + " đơn đã huỷ không tính</span></div></div>" +
      '<div class="ad-stat"><span class="ico"><i class="fas fa-coins"></i></span><div><p>Tổng doanh thu</p><h3>' + SB.tien(tong) + "</h3><span>Gồm phí ship, đã trừ giảm giá</span></div></div>" +
      '<div class="ad-stat"><span class="ico cam"><i class="fas fa-mobile-alt"></i></span><div><p>Tiền hàng</p><h3>' + SB.tien(tienHang) + "</h3><span>Tổng tạm tính các đơn</span></div></div>" +
      '<div class="ad-stat"><span class="ico do"><i class="fas fa-ticket-alt"></i></span><div><p>Đã giảm cho khách</p><h3>' + SB.tien(giam) + "</h3><span>Từ mã giảm giá</span></div></div>";

    var theoSP = {};
    hopLe.forEach(function (d) { d.chiTiet.forEach(function (c) { var x = theoSP[c.sanPhamId] = theoSP[c.sanPhamId] || { ten: c.ten, sl: 0, tien: 0 }; x.sl += c.soLuong; x.tien += c.soLuong * c.donGia; }); });
    var ds = Object.keys(theoSP).map(function (k) { return theoSP[k]; }).sort(function (a, b) { return b.tien - a.tien; });
    var max = ds.length ? ds[0].tien : 1;
    bangBC.innerHTML = '<thead><tr><th>Sản phẩm</th><th class="num">Đã bán</th><th class="num">Doanh thu</th><th style="width: 34%;">Tỉ lệ</th></tr></thead><tbody>' +
      (ds.length ? ds.map(function (x) {
        return '<tr><td class="font-weight-bold">' + esc(x.ten) + '</td><td class="num">' + x.sl + ' máy</td><td class="num font-weight-bold">' + SB.tien(x.tien) +
          '</td><td><div class="ad-progress"><span style="width: ' + Math.round(x.tien * 100 / max) + '%;"></span></div></td></tr>';
      }).join("") : '<tr><td colspan="4" class="ad-empty">Chưa có dữ liệu bán hàng.</td></tr>') + "</tbody>";

    // Theo hãng (giống thống kê theo hãng của web gốc)
    var theoHang = {};
    hopLe.forEach(function (d) { d.chiTiet.forEach(function (c) {
      var h = c.hang || ((KHO.tim("sanPham", c.sanPhamId) || {}).hang) || "Khác";
      var x = theoHang[h] = theoHang[h] || { sl: 0, tien: 0 }; x.sl += c.soLuong; x.tien += c.soLuong * c.donGia;
    }); });
    var dsHang = Object.keys(theoHang).map(function (h) { return { hang: h, sl: theoHang[h].sl, tien: theoHang[h].tien }; }).sort(function (a, b) { return b.tien - a.tien; });
    var tongHang = dsHang.reduce(function (t, x) { return t + x.tien; }, 0) || 1;
    document.getElementById("bangTheoHang").innerHTML = '<thead><tr><th>Hãng</th><th class="num">Đã bán</th><th class="num">Doanh thu</th><th style="width: 30%;">Tỉ trọng</th></tr></thead><tbody>' +
      (dsHang.length ? dsHang.map(function (x) {
        var pt = Math.round(x.tien * 1000 / tongHang) / 10;
        return '<tr><td class="font-weight-bold">' + esc(x.hang) + '</td><td class="num">' + x.sl + ' máy</td><td class="num">' + SB.tien(x.tien) +
          '</td><td><div class="d-flex align-items-center" style="gap: 8px;"><div class="ad-progress" style="flex: 1;"><span style="width: ' + pt + '%;"></span></div><small>' + String(pt).replace(".", ",") + '%</small></div></td></tr>';
      }).join("") : '<tr><td colspan="4" class="ad-empty">Chưa có dữ liệu bán hàng.</td></tr>') + "</tbody>";

    // Theo trạng thái
    document.getElementById("bangTrangThai").innerHTML = '<thead><tr><th>Trạng thái</th><th class="num">Số đơn</th><th class="num">Giá trị</th></tr></thead><tbody>' +
      TT.TAT_CA.map(function (t) {
        var c = don.filter(function (d) { return d.trangThai === t; });
        return "<tr><td>" + GD.nhanTrangThai(t) + '</td><td class="num">' + c.length + '</td><td class="num">' + SB.tien(c.reduce(function (s, d) { return s + d.tongTien; }, 0)) + "</td></tr>";
      }).join("") + "</tbody>";

    // Xuất CSV đơn hàng
    document.getElementById("btnXuatCSV").addEventListener("click", function () {
      var dong = [["Mã đơn", "Ngày đặt", "Khách hàng", "Điện thoại", "Tỉnh/Thành", "Thanh toán", "Trạng thái", "Tạm tính", "Phí ship", "Giảm giá", "Tổng tiền"]];
      don.forEach(function (d) { dong.push([SB.maDon(d.id), SB.ngayGio(d.ngayDat), d.hoTenNguoiNhan, d.soDienThoai, d.tinhThanh, d.phuongThuc, d.trangThai, d.tamTinh, d.phiVanChuyen, d.giamGia, d.tongTien]); });
      var csv = "﻿" + dong.map(function (r) { return r.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      a.download = "smartben-don-hang.csv";
      document.body.appendChild(a); a.click(); a.remove();
    });

    document.getElementById("btnKhoiPhuc").addEventListener("click", function () {
      AD.xacNhan("Khôi phục dữ liệu mẫu?", "Toàn bộ sản phẩm, đơn hàng, tài khoản, mã giảm giá, tin tức đã thay đổi trên trình duyệt này sẽ trở về dữ liệu mẫu ban đầu. Bạn sẽ phải đăng nhập lại.", function () {
        KHO.khoiPhuc();
        SB.TaiKhoan.dangXuat();
        GD.nhan("Đã khôi phục dữ liệu mẫu. Đăng nhập lại bằng admin@smartben.vn / admin123.");
        location.href = "../dang-nhap.html";
      }, "Khôi phục");
    });
  }
})();
