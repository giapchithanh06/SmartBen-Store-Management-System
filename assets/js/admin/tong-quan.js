/* Admin – Tổng quan: thẻ thống kê, doanh thu 7 ngày, top bán chạy, đơn gần đây, sắp hết hàng, khách mới, việc cần làm */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc, TT = SB.TRANG_THAI, C = SB.CAU_HINH;
  var don = KHO.lay("donHang"), sp = KHO.lay("sanPham"), tk = KHO.lay("taiKhoan"), lh = KHO.lay("lienHe");
  var donHopLe = don.filter(function (d) { return d.trangThai !== TT.HUY; });
  var dauThang = new Date(); dauThang.setDate(1); dauThang.setHours(0, 0, 0, 0);

  var soCho = don.filter(function (d) { return d.trangThai === TT.CHO; }).length;
  var soGiao = don.filter(function (d) { return d.trangThai === TT.GIAO; }).length;
  var sapHet = sp.filter(function (s) { return s.conHang && s.ton <= C.NGUONG_SAP_HET; }).sort(function (a, b) { return a.ton - b.ton; });
  var khach = tk.filter(function (t) { return t.vaiTro !== "Admin"; });
  var doanhThu = donHopLe.reduce(function (t, d) { return t + d.tongTien; }, 0);
  var doanhThuThang = donHopLe.filter(function (d) { return new Date(d.ngayDat) >= dauThang; }).reduce(function (t, d) { return t + d.tongTien; }, 0);

  document.getElementById("chao").textContent = "Chào " + AD.taiKhoan.hoTen + ", hôm nay có " + soCho + " đơn đang chờ xử lý";
  document.getElementById("nutDonMoi").href = "don-hang.html?trangThai=" + encodeURIComponent(TT.CHO);

  document.getElementById("theThongKe").innerHTML =
    '<div class="ad-stat"><span class="ico"><i class="fas fa-coins"></i></span><div><p>Doanh thu</p><h3>' + SB.tien(doanhThu) + '</h3><span>Tháng này: ' + SB.tien(doanhThuThang) + "</span></div></div>" +
    '<a class="ad-stat" href="don-hang.html"><span class="ico lam"><i class="fas fa-receipt"></i></span><div><p>Đơn hàng</p><h3>' + don.length + "</h3><span>" + soCho + " chờ xử lý · " + soGiao + " đang giao</span></div></a>" +
    '<a class="ad-stat" href="san-pham.html?tinhTrang=dangban"><span class="ico cam"><i class="fas fa-mobile-alt"></i></span><div><p>Sản phẩm đang bán</p><h3>' + sp.filter(function (s) { return s.conHang; }).length +
    '</h3><span class="' + (sapHet.length ? "canh-bao" : "") + '">' + sapHet.length + " sắp hết hàng</span></div></a>" +
    '<a class="ad-stat" href="khach-hang.html"><span class="ico do"><i class="fas fa-users"></i></span><div><p>Khách hàng</p><h3>' + khach.length + "</h3><span>+" +
    khach.filter(function (t) { return new Date(t.ngayDangKy) >= dauThang; }).length + " trong tháng</span></div></a>";

  // ---------- Doanh thu 7 ngày ----------
  var thu = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], ngay7 = [];
  for (var i = 6; i >= 0; i--) {
    var n = new Date(); n.setHours(0, 0, 0, 0); n.setDate(n.getDate() - i);
    var het = new Date(n); het.setDate(het.getDate() + 1);
    var trong = donHopLe.filter(function (d) { var t = new Date(d.ngayDat); return t >= n && t < het; });
    ngay7.push({ ngay: n, tien: trong.reduce(function (t, d) { return t + d.tongTien; }, 0), soDon: trong.length, homNay: i === 0 });
  }
  var max = Math.max.apply(null, ngay7.map(function (x) { return x.tien; }).concat([1]));
  var rutGon = function (v) { return v >= 1000000 ? (v / 1000000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + "tr" : (v >= 1000 ? Math.round(v / 1000) + "k" : String(v)); };
  document.getElementById("tong7Ngay").textContent = "7 ngày gần nhất: " + SB.tien(ngay7.reduce(function (t, x) { return t + x.tien; }, 0));
  document.getElementById("bieuDo").innerHTML = ngay7.map(function (x) {
    var cao = Math.max(2, Math.round(x.tien * 82 / max));
    return '<div class="ad-bar' + (x.homNay ? " hom-nay" : "") + '" title="' + SB.ngay(x.ngay) + ": " + SB.tien(x.tien) + " · " + x.soDon + ' đơn"><strong>' + (x.tien > 0 ? rutGon(x.tien) : "") +
      '</strong><div class="cot' + (x.tien > 0 ? "" : " rong") + '" style="height: ' + cao + '%;"></div></div>';
  }).join("");
  document.getElementById("nhanBieuDo").innerHTML = ngay7.map(function (x) {
    return "<span>" + thu[x.ngay.getDay()] + "<br /><small>" + SB.ngay(x.ngay).slice(0, 5) + "</small></span>";
  }).join("");

  // ---------- Top bán chạy ----------
  var ban = {};
  donHopLe.forEach(function (d) { d.chiTiet.forEach(function (c) { var b = ban[c.sanPhamId] = ban[c.sanPhamId] || { sl: 0, tien: 0 }; b.sl += c.soLuong; b.tien += c.soLuong * c.donGia; }); });
  var top = Object.keys(ban).map(function (id) { return { sp: sp.filter(function (s) { return s.id === +id; })[0], sl: ban[id].sl, tien: ban[id].tien }; })
    .filter(function (x) { return x.sp; }).sort(function (a, b) { return b.sl - a.sl; }).slice(0, 5);
  document.getElementById("topBanChay").innerHTML = top.length ? '<div class="ad-list">' + top.map(function (x, i) {
    return '<a class="ad-item" href="san-pham-form.html?id=' + x.sp.id + '"><span class="rank">' + (i + 1) + '</span><img src="' + GD.anhSP(x.sp.anh) + '" alt="" onerror="GD.anhLoi(this)" />' +
      '<span class="info"><b>' + esc(x.sp.ten) + "</b><small>Đã bán " + x.sl + " máy · " + SB.tien(x.tien) + "</small></span></a>";
  }).join("") + "</div>" : '<div class="ad-empty">Chưa có đơn hàng nào.</div>';

  // ---------- Đơn gần đây ----------
  var moi = don.slice().sort(function (a, b) { return new Date(b.ngayDat) - new Date(a.ngayDat); }).slice(0, 6);
  document.getElementById("donGanDay").innerHTML = moi.length ? '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thời gian</th><th class="num">Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>' +
    moi.map(function (d) {
      return '<tr><td><a class="font-weight-bold" href="don-hang-chi-tiet.html?id=' + d.id + '">' + SB.maDon(d.id) + "</a></td><td>" + esc(d.hoTenNguoiNhan) + '<br /><small class="text-muted">' + esc(d.soDienThoai) +
        "</small></td><td><small>" + SB.gio(d.ngayDat) + " " + SB.ngay(d.ngayDat).slice(0, 5) + '</small></td><td class="num font-weight-bold">' + SB.tien(d.tongTien) + "</td><td>" + GD.nhanTrangThai(d.trangThai) + "</td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="ad-empty">Chưa có đơn hàng nào.</div>';

  // ---------- Sắp hết hàng ----------
  document.getElementById("tieuDeSapHet").textContent = "Sắp hết hàng (≤ " + C.NGUONG_SAP_HET + " máy)";
  document.getElementById("sapHet").innerHTML = sapHet.length ? '<div class="ad-list">' + sapHet.slice(0, 6).map(function (s) {
    return '<a class="ad-item" href="san-pham-form.html?id=' + s.id + '"><img src="' + GD.anhSP(s.anh) + '" alt="" onerror="GD.anhLoi(this)" /><span class="info"><b>' + esc(s.ten) + "</b><small>Còn " + s.ton + ' máy</small></span>' +
      '<span class="sb-pill ' + (s.ton === 0 ? "bad" : "warn") + '">' + (s.ton === 0 ? "Hết hàng" : "Cần nhập") + "</span></a>";
  }).join("") + "</div>" : '<div class="ad-empty"><i class="fas fa-check-circle" style="color: var(--sb-green);"></i> Tất cả sản phẩm đều đủ hàng.</div>';

  // ---------- Khách mới ----------
  var khachMoi = khach.slice().sort(function (a, b) { return new Date(b.ngayDangKy) - new Date(a.ngayDangKy); }).slice(0, 5);
  document.getElementById("khachMoi").innerHTML = khachMoi.length ? '<div class="ad-list">' + khachMoi.map(function (t) {
    return '<div class="ad-item"><span class="icon"><i class="fas fa-user"></i></span><span class="info"><b>' + esc(t.hoTen) + "</b><small>" + esc(t.email) + " · " + SB.ngay(t.ngayDangKy) + "</small></span></div>";
  }).join("") + "</div>" : '<div class="ad-empty">Chưa có khách hàng đăng ký.</div>';

  // ---------- Việc hôm nay ----------
  document.getElementById("viecHomNay").innerHTML =
    '<a class="ad-item" href="don-hang.html?trangThai=' + encodeURIComponent(TT.CHO) + '"><span class="icon cam"><i class="fas fa-clock"></i></span><span class="info"><b>' + soCho + " đơn chờ xác nhận</b><small>Gọi xác nhận và chuyển sang “Đang giao”</small></span></a>" +
    '<a class="ad-item" href="don-hang.html?trangThai=' + encodeURIComponent(TT.GIAO) + '"><span class="icon"><i class="fas fa-truck"></i></span><span class="info"><b>' + soGiao + " đơn đang giao</b><small>Cập nhật “Hoàn thành” khi khách đã nhận</small></span></a>" +
    '<a class="ad-item" href="san-pham.html?tinhTrang=saphet"><span class="icon cam"><i class="fas fa-warehouse"></i></span><span class="info"><b>' + sapHet.length + " sản phẩm sắp hết</b><small>Nhập thêm hàng hoặc tạm ngừng bán</small></span></a>" +
    '<a class="ad-item" href="lien-he.html"><span class="icon"><i class="fas fa-envelope"></i></span><span class="info"><b>' + lh.filter(function (l) { return !l.daXuLy; }).length + " liên hệ chưa trả lời</b><small>Tin nhắn từ trang Liên hệ</small></span></a>";
})();
