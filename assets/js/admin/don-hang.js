/* Admin – Đơn hàng: danh sách (lọc trạng thái, tìm mã/tên/sđt, lọc theo khách, chuyển trạng thái nhanh, phân trang)
   và trang chi tiết (chuyển trạng thái, huỷ đơn hoàn kho, xác nhận đã nhận tiền QR) */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc, TT = SB.TRANG_THAI, MOI_TRANG = 15;

  function nutChuyen(d, lon) {
    return SB.DonHang.tiepTheo(d.trangThai).filter(function (t) { return lon || t !== TT.HUY; }).map(function (t) {
      if (t === TT.HUY) return '<button type="button" class="sb-btn sb-btn-danger" data-huy="' + d.id + '"><i class="fas fa-times"></i> Huỷ đơn</button>';
      return '<button type="button" class="sb-btn ' + (lon ? "sb-btn-grad" : "sb-btn-soft sb-btn-sm") + '" data-chuyen="' + d.id + '" data-sang="' + t + '" title="Chuyển sang ' + t + '">' +
        '<i class="fas ' + (t === TT.GIAO ? "fa-truck" : "fa-check") + '"></i> ' + (lon ? "Chuyển sang “" + t + "”" : t) + "</button>";
    }).join("");
  }

  function xuLyNut(e, sauKhi) {
    var b = e.target.closest("button[data-chuyen], button[data-huy]");
    if (!b) return;
    if (b.hasAttribute("data-huy")) {
      var d = KHO.tim("donHang", b.getAttribute("data-huy"));
      AD.xacNhan("Huỷ đơn " + SB.maDon(d.id) + "?", "Tồn kho của " + d.chiTiet.length + " sản phẩm sẽ được cộng lại" + (d.maGiamGiaApDung ? ", mã " + d.maGiamGiaApDung + " được hoàn 1 lượt" : "") + ".", function () {
        var loi = SB.DonHang.doiTrangThai(d.id, TT.HUY);
        GD.toast(loi || "Đã huỷ đơn " + SB.maDon(d.id) + ".", loi ? "loi" : "ok");
        sauKhi();
      }, "Huỷ đơn");
      return;
    }
    var id = +b.getAttribute("data-chuyen"), sang = b.getAttribute("data-sang");
    var loi = SB.DonHang.doiTrangThai(id, sang);
    GD.toast(loi || "Đơn " + SB.maDon(id) + " đã chuyển sang “" + sang + "”.", loi ? "loi" : "ok");
    sauKhi();
  }

  // ===================== DANH SÁCH =====================
  var bang = document.getElementById("bangDon");
  if (bang) {
    var q = new URLSearchParams(location.search);
    var trangThai = q.get("trangThai") || "", tuKhoa = (q.get("tuKhoa") || "").trim(), taiKhoanId = q.get("taiKhoanId") ? +q.get("taiKhoanId") : null;
    var trang = Math.max(1, parseInt(q.get("trang"), 10) || 1);
    var khach = taiKhoanId ? KHO.tim("taiKhoan", taiKhoanId) : null;
    if (khach) {
      document.getElementById("moTaTrang").textContent = "Đơn của khách " + khach.hoTen;
      document.getElementById("boLocKhach").hidden = false;
    }
    var form = document.getElementById("formTimDon");
    form.tuKhoa.value = tuKhoa; form.trangThai.value = trangThai;
    if (taiKhoanId) form.taiKhoanId.value = taiKhoanId; else form.taiKhoanId.remove();

    var ve = function () {
      var tatCa = KHO.lay("donHang").filter(function (d) { return !taiKhoanId || d.taiKhoanId === taiKhoanId; });
      if (tuKhoa) {
        var k = SB.boDau(tuKhoa).replace(/\s+/g, ""), so = tuKhoa.replace(/\D/g, "");
        tatCa = tatCa.filter(function (d) {
          return SB.maDon(d.id).toLowerCase().indexOf(k) >= 0 ||                       // mã đơn: FB00012 hoặc 12
            (/^\d+$/.test(k) && d.id === +k) ||
            SB.boDau(d.hoTenNguoiNhan).replace(/\s+/g, "").indexOf(k) >= 0 ||          // tên người nhận
            (so.length >= 3 && d.soDienThoai.indexOf(so) >= 0);                      // số điện thoại
        });
      }
      var dem = {};
      tatCa.forEach(function (d) { dem[d.trangThai] = (dem[d.trangThai] || 0) + 1; });
      var lk = function (t) { return GD.link("admin/don-hang.html", { trangThai: t, tuKhoa: tuKhoa, taiKhoanId: taiKhoanId }); };
      document.getElementById("tabTrangThai").innerHTML = '<a class="sb-chip' + (!trangThai ? " active" : "") + '" href="' + lk("") + '">Tất cả <span class="sb-chip-count">' + tatCa.length + "</span></a>" +
        TT.TAT_CA.map(function (t) { return '<a class="sb-chip' + (t === trangThai ? " active" : "") + '" href="' + lk(t) + '">' + t + ' <span class="sb-chip-count">' + (dem[t] || 0) + "</span></a>"; }).join("");

      var ds = (trangThai ? tatCa.filter(function (d) { return d.trangThai === trangThai; }) : tatCa).sort(function (a, b) { return new Date(b.ngayDat) - new Date(a.ngayDat); });
      var tongTrang = Math.ceil(ds.length / MOI_TRANG);
      if (tongTrang && trang > tongTrang) trang = tongTrang;
      var trangNay = ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);

      bang.innerHTML = !ds.length ? '<div class="ad-empty"><i class="fas fa-receipt fa-2x mb-2" style="color: var(--sb-primary);"></i><br />Không có đơn hàng nào phù hợp.</div>' :
        '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th class="num">SL</th><th class="num">Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        trangNay.map(function (d) {
          return '<tr><td><a class="font-weight-bold" href="don-hang-chi-tiet.html?id=' + d.id + '">' + SB.maDon(d.id) + "</a></td>" +
            "<td><b>" + esc(d.hoTenNguoiNhan) + '</b><br /><small class="text-muted">' + esc(d.soDienThoai) + (d.tinhThanh ? " · " + esc(d.tinhThanh) : "") + "</small></td>" +
            "<td><small>" + SB.gio(d.ngayDat) + "<br />" + SB.ngay(d.ngayDat) + '</small></td><td class="num">' + d.chiTiet.reduce(function (t, c) { return t + c.soLuong; }, 0) + " máy</td>" +
            '<td class="num font-weight-bold">' + SB.tien(d.tongTien) + "</td><td><small>" + d.phuongThuc + "</small><br />" +
            (d.daThanhToan ? '<span class="sb-pill ok">Đã trả</span>' : (d.trangThai !== TT.HUY ? '<span class="sb-pill warn">Chưa trả</span>' : "")) + "</td>" +
            "<td>" + GD.nhanTrangThai(d.trangThai) + '</td><td><div class="ad-actions">' + nutChuyen(d, false) +
            '<a class="ad-icon-btn" href="don-hang-chi-tiet.html?id=' + d.id + '" title="Xem chi tiết" aria-label="Xem chi tiết ' + SB.maDon(d.id) + '"><i class="fas fa-eye"></i></a></div></td></tr>';
        }).join("") + "</tbody></table></div>";

      var pt = document.getElementById("phanTrangDon");
      pt.innerHTML = tongTrang > 1 ? Array.apply(null, Array(tongTrang)).map(function (_, i) {
        var n = i + 1;
        return '<li class="' + (n === trang ? "active" : "") + '">' + (n === trang ? "<span>" + n + "</span>" : '<a href="' + GD.link("admin/don-hang.html", { trangThai: trangThai, tuKhoa: tuKhoa, taiKhoanId: taiKhoanId, trang: n }) + '">' + n + "</a>") + "</li>";
      }).join("") : "";
    };
    bang.addEventListener("click", function (e) { xuLyNut(e, ve); });
    ve();
    return;
  }

  // ===================== CHI TIẾT =====================
  var khung = document.getElementById("chiTietDon");
  if (!khung) return;
  var id = +GD.thamSo("id");
  var veCT = function () {
    var d = KHO.tim("donHang", id);
    if (!d) { GD.nhan("Không tìm thấy đơn hàng.", "loi"); location.replace("don-hang.html"); return; }
    var tk = d.taiKhoanId ? KHO.tim("taiKhoan", d.taiKhoanId) : null;
    var tiep = SB.DonHang.tiepTheo(d.trangThai);
    document.title = "Đơn " + SB.maDon(d.id) + " - Quản trị SmartBen";
    document.getElementById("dauTrang").innerHTML = '<div><a href="don-hang.html" class="text-muted" style="font-size: .88rem;"><i class="fas fa-arrow-left"></i> Danh sách đơn</a>' +
      "<h1>Đơn " + SB.maDon(d.id) + "</h1><p>Đặt lúc " + SB.ngayGio(d.ngayDat) + (d.ngayCapNhat ? " · Cập nhật " + SB.ngayGio(d.ngayCapNhat) : "") + "</p></div>" + GD.nhanTrangThai(d.trangThai);

    var choCK = d.phuongThuc === "QR" && !d.daThanhToan && d.trangThai !== TT.HUY;
    khung.innerHTML =
      '<div style="min-width: 0;"><div class="ad-panel mb-4"><div class="ad-panel-head"><div><span class="sb-eyebrow">Xử lý</span><h2>Chuyển trạng thái</h2></div></div>' +
      (tiep.length ? '<div class="ad-steps">' + nutChuyen(d, true) + '</div><p class="text-muted mt-3 mb-0" style="font-size: .82rem;">Quy trình: Chờ xử lý → Đang giao → Hoàn thành. Huỷ đơn sẽ tự cộng lại tồn kho và trả lượt cho mã giảm giá. Đơn COD chuyển “Hoàn thành” được tính là đã thanh toán.</p>'
        : '<p class="text-muted mb-0">Đơn đã ở trạng thái cuối (“' + d.trangThai + "”), không thể chuyển tiếp.</p>") +
      (choCK ? '<div class="sb-note-box mt-3 d-flex justify-content-between align-items-center flex-wrap" style="gap: 10px;"><span><i class="fas fa-qrcode"></i> Khách chọn chuyển khoản, nội dung cần kiểm tra: <b>' +
        SB.DonHang.noiDungChuyenKhoan(d) + "</b> · <b>" + SB.tien(d.tongTien) + '</b></span><button type="button" class="sb-btn sb-btn-soft sb-btn-sm" id="btnDaNhanTien"><i class="fas fa-check"></i> Đã nhận tiền</button></div>' : "") +
      "</div>" +
      '<div class="ad-panel"><div class="ad-panel-head"><div><span class="sb-eyebrow">Sản phẩm</span><h2>' + d.chiTiet.length + ' mặt hàng</h2></div></div>' +
      '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Sản phẩm</th><th class="num">Đơn giá</th><th class="num">Số lượng</th><th class="num">Thành tiền</th></tr></thead><tbody>' +
      d.chiTiet.map(function (c) {
        return '<tr><td><div class="ad-sp"><img src="' + GD.anhSP(c.anh) + '" alt="' + esc(c.ten) + '" onerror="GD.anhLoi(this)" /><div><b>' + esc(c.ten) + "</b><small>" + esc(c.hang || "") + '</small></div></div></td><td class="num">' + SB.tien(c.donGia) +
          '</td><td class="num">' + c.soLuong + '</td><td class="num font-weight-bold">' + SB.tien(c.donGia * c.soLuong) + "</td></tr>";
      }).join("") + '</tbody></table></div><div class="ml-auto mt-3" style="max-width: 360px;">' +
      '<div class="sb-sum-row"><span>Tạm tính</span><span>' + SB.tien(d.tamTinh) + '</span></div><div class="sb-sum-row"><span>Phí vận chuyển</span><span>' + (d.phiVanChuyen === 0 ? "Miễn phí" : SB.tien(d.phiVanChuyen)) + "</span></div>" +
      (d.giamGia > 0 ? '<div class="sb-sum-row giam"><span>Giảm giá (' + esc(d.maGiamGiaApDung) + ")</span><span>-" + SB.tien(d.giamGia) + "</span></div>" : "") +
      '<div class="sb-sum-total"><span class="font-weight-bold">Tổng</span><strong>' + SB.tien(d.tongTien) + "</strong></div></div></div></div>" +

      '<div style="min-width: 0;"><div class="ad-panel mb-4"><div class="ad-panel-head"><div><span class="sb-eyebrow">Giao hàng</span><h2>Người nhận</h2></div></div><dl class="ad-kv">' +
      "<dt>Họ tên</dt><dd>" + esc(d.hoTenNguoiNhan) + "</dd><dt>Điện thoại</dt><dd>" + esc(d.soDienThoai) + "</dd><dt>Email</dt><dd>" + (d.email ? esc(d.email) : "—") +
      "</dd><dt>Địa chỉ</dt><dd>" + esc(SB.DonHang.diaChiDayDu(d)) + "</dd><dt>Ghi chú</dt><dd>" + (d.ghiChu ? esc(d.ghiChu) : "—") + "</dd></dl></div>" +
      '<div class="ad-panel mb-4"><div class="ad-panel-head"><div><span class="sb-eyebrow">Thanh toán</span><h2>' + SB.DonHang.tenPhuongThuc(d) + "</h2></div></div>" +
      (d.daThanhToan ? '<span class="sb-pill ok"><i class="fas fa-check-circle"></i> Đã thanh toán</span>' : d.trangThai === TT.HUY ? '<span class="sb-pill bad">Đơn đã huỷ</span>' : '<span class="sb-pill warn"><i class="fas fa-clock"></i> Chưa thanh toán</span>') + "</div>" +
      '<div class="ad-panel"><div class="ad-panel-head"><div><span class="sb-eyebrow">Khách hàng</span><h2>' + (tk ? esc(tk.hoTen) : "Khách vãng lai") + "</h2></div></div>" +
      (tk ? '<dl class="ad-kv"><dt>Email</dt><dd>' + esc(tk.email) + "</dd><dt>Đăng ký</dt><dd>" + SB.ngay(tk.ngayDangKy) + "</dd><dt>Số đơn</dt><dd>" + SB.DonHang.cuaToi(tk.id).length + " đơn</dd></dl>" +
        '<a class="sb-btn sb-btn-soft sb-btn-sm mt-3" href="don-hang.html?taiKhoanId=' + tk.id + '">Xem các đơn của khách</a>' : '<p class="text-muted mb-0">Đơn đặt không đăng nhập tài khoản.</p>') + "</div></div>";

    var nut = document.getElementById("btnDaNhanTien");
    if (nut) nut.addEventListener("click", function () {
      KHO.sua("donHang", d.id, { daThanhToan: true, ngayCapNhat: new Date().toISOString() });
      GD.toast("Đã xác nhận nhận tiền cho đơn " + SB.maDon(d.id) + ".");
      veCT();
    });
  };
  khung.addEventListener("click", function (e) { xuLyNut(e, veCT); });
  veCT();
})();
