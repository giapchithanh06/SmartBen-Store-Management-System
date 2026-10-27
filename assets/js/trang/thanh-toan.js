/* Thanh toán: thông tin người nhận, tỉnh/phường (diachi-vn.js), phương thức COD/QR,
   mã giảm giá, tính phí ship + tổng tiền ngay khi đổi, đặt hàng (trừ kho, lưu đơn) */
(function () {
  "use strict";
  var esc = GD.esc, C = SB.CAU_HINH;

  var loi = SB.GioHang.kiemTra();
  if (loi) { GD.nhan(loi, "loi"); location.replace("gio-hang.html"); return; }

  var dong = SB.GioHang.lay(), tamTinh = SB.GioHang.tamTinh(dong);
  var form = document.getElementById("formThanhToan");
  var tinh = form.tinhThanh, phuong = form.phuongXa, oMa = form.maGiamGia;
  var data = window.DIA_CHI_VN || [];

  document.getElementById("buocGio").textContent = "Đã chọn " + dong.length + " sản phẩm";
  document.getElementById("phiNoiThanh").textContent = SB.tien(C.PHI_NOI_THANH);
  document.getElementById("phiTinhKhac").textContent = SB.tien(C.PHI_TINH_KHAC);
  document.getElementById("mienPhiTu").textContent = SB.tien(C.MIEN_PHI_TU);

  document.getElementById("dsDongDon").innerHTML = dong.map(function (x) {
    return '<div class="sb-order-line"><img src="' + GD.anhSP(x.anh) + '" alt="" onerror="GD.anhLoi(this)" /><div><b>' + esc(x.ten) + "</b><small>" + x.soLuong + " × " + SB.tien(x.gia) +
      '</small></div><span class="font-weight-bold sb-num">' + SB.tien(x.thanhTien) + "</span></div>";
  }).join("");

  var goiY = SB.MaGiamGia.goiY();
  document.getElementById("dsMaGoiY").innerHTML = goiY.map(function (m) {
    return '<button type="button" data-ma="' + esc(m.ma) + '" title="' + esc(SB.MaGiamGia.moTaGiaTri(m)) + ", đơn từ " + SB.tien(m.donToiThieu) + '">' + esc(m.ma) + "</button>";
  }).join("");

  // ---------- Tự điền thông tin của khách đã đăng nhập ----------
  var tk = SB.TaiKhoan.hienTai();
  if (tk) {
    form.hoTenNguoiNhan.value = tk.hoTen;
    form.soDienThoai.value = tk.soDienThoai || "";
    form.email.value = tk.email;
    var donCu = SB.DonHang.cuaToi(tk.id).filter(function (d) { return d.tinhThanh; })[0];
    if (donCu) {
      form.soDienThoai.value = donCu.soDienThoai;
      form.diaChiGiao.value = donCu.diaChiGiao;
      tinh.setAttribute("data-chon", donCu.tinhThanh);
      phuong.setAttribute("data-chon", donCu.phuongXa);
    }
  }

  // ---------- Tỉnh / phường ----------
  function napTinh() {
    var chon = tinh.getAttribute("data-chon") || "";
    tinh.innerHTML = '<option value="">Chọn tỉnh / thành phố</option>' + data.map(function (t) {
      return '<option' + (t.t === chon ? " selected" : "") + ">" + esc(t.t) + "</option>";
    }).join("");
    napPhuong(phuong.getAttribute("data-chon") || "");
  }
  function napPhuong(chon) {
    var t = data.filter(function (x) { return x.t === tinh.value; })[0];
    phuong.innerHTML = '<option value="">' + (t ? "Chọn phường / xã" : "Chọn tỉnh trước") + "</option>" + (t ? t.p.map(function (p) {
      return "<option" + (p === chon ? " selected" : "") + ">" + esc(p) + "</option>";
    }).join("") : "");
    phuong.disabled = !t;
  }

  // ---------- Tính tiền ----------
  function capNhatTien(baoMa) {
    var kq = SB.tinhTien(tamTinh, tinh.value, oMa.value);
    document.getElementById("tamTinh").textContent = SB.tien(kq.tamTinh);
    document.getElementById("phiShip").textContent = kq.chuaChonTinh && kq.phiVanChuyen === 0 && kq.conThieuMienPhiShip > 0
      ? "Chọn tỉnh để tính" : (kq.phiVanChuyen === 0 ? "Miễn phí" : SB.tien(kq.phiVanChuyen));
    document.getElementById("giamGia").textContent = kq.giamGia > 0 ? "-" + SB.tien(kq.giamGia) : "0đ";
    document.getElementById("tongTien").textContent = SB.tien(kq.tongTien);
    document.getElementById("conThieu").textContent = SB.tien(kq.conThieuMienPhiShip);
    document.getElementById("hopFreeship").hidden = kq.conThieuMienPhiShip <= 0;
    if (baoMa) {
      GD.datLoi(form, oMa, "");
      var tb = document.getElementById("thongBaoMa");
      tb.textContent = kq.coNhapMa ? kq.thongBaoMa : "";
      tb.className = "sb-coupon-msg " + (kq.maApDung ? "ok" : "loi");
    }
    return kq;
  }

  tinh.addEventListener("change", function () { napPhuong(""); capNhatTien(false); });
  document.getElementById("btnApMa").addEventListener("click", function () { oMa.value = SB.MaGiamGia.chuanHoa(oMa.value); capNhatTien(true); });
  oMa.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("btnApMa").click(); } });
  document.getElementById("dsMaGoiY").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ma]");
    if (b) { oMa.value = b.getAttribute("data-ma"); capNhatTien(true); }
  });
  GD.$all('input[name="phuongThuc"]', form).forEach(function (r) {
    r.addEventListener("change", function () {
      GD.$all(".sb-pay-option", form).forEach(function (o) { o.classList.remove("checked"); });
      r.closest(".sb-pay-option").classList.add("checked");
    });
  });

  // ---------- Đặt hàng ----------
  GD.ganKiemTraTrucTiep(form);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(form)) return;
    var kq = capNhatTien(true);
    if (kq.coNhapMa && !kq.maApDung) { GD.datLoi(form, oMa, kq.thongBaoMa); oMa.focus(); return; }
    var nut = document.getElementById("btnDatHang");
    nut.disabled = true;
    nut.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đặt hàng...';

    var ketQua = SB.DonHang.datHang({
      hoTenNguoiNhan: form.hoTenNguoiNhan.value, soDienThoai: form.soDienThoai.value, email: form.email.value,
      tinhThanh: tinh.value, phuongXa: phuong.value, diaChiGiao: form.diaChiGiao.value, ghiChu: form.ghiChu.value,
      phuongThuc: form.querySelector('input[name="phuongThuc"]:checked').value, maGiamGia: oMa.value
    });
    if (ketQua.ok) { location.href = "dat-hang-thanh-cong.html?id=" + ketQua.donHang.id; return; }
    if (ketQua.veGio) { GD.nhan(ketQua.thongBao, "loi"); location.href = "gio-hang.html"; return; }
    nut.disabled = false;
    nut.innerHTML = 'Đặt hàng <i class="fas fa-arrow-right"></i>';
    if (ketQua.truong === "maGiamGia") { GD.datLoi(form, oMa, ketQua.thongBao); oMa.focus(); }
    else GD.toast(ketQua.thongBao, "loi");
  });

  napTinh();
  capNhatTien(false);
})();
