/* Admin – Mã giảm giá: danh sách dạng thẻ (bật/tắt, sửa, xoá) và form Tạo/Sửa */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc, MG = SB.MaGiamGia;

  // ===================== DANH SÁCH =====================
  var khung = document.getElementById("dsMa");
  if (khung) {
    var ve = function () {
      var ds = KHO.lay("maGiamGia").sort(function (a, b) { return b.id - a.id; });
      document.getElementById("demMa").textContent = ds.filter(function (m) { return m.kichHoat; }).length + " mã đang bật · khách nhập mã ở bước Thanh toán.";
      if (!ds.length) { khung.innerHTML = '<div class="ad-panel ad-empty"><i class="fas fa-ticket-alt fa-2x mb-2" style="color: var(--sb-primary);"></i><br />Chưa có mã giảm giá nào.</div>'; return; }
      khung.innerHTML = '<section class="ad-vouchers">' + ds.map(function (m) {
        var nhan = !m.kichHoat ? '<span class="sb-pill">Đã tắt</span>' : MG.hetHan(m) ? '<span class="sb-pill bad">Hết hạn</span>' : MG.hetLuot(m) ? '<span class="sb-pill bad">Hết lượt</span>'
          : MG.chuaToiNgay(m) ? '<span class="sb-pill info">Sắp áp dụng</span>' : '<span class="sb-pill ok">Đang dùng được</span>';
        var pt = m.soLuong ? Math.min(100, Math.floor(m.daDung * 100 / m.soLuong)) : 0;
        return '<article class="ad-voucher' + (m.kichHoat ? "" : " tat") + '"><div class="d-flex justify-content-between align-items-start" style="gap: 8px;"><span class="ma">' + esc(m.ma) + "</span>" + nhan + "</div>" +
          '<div class="gia-tri">' + MG.moTaGiaTri(m) + "</div>" + (m.moTa ? '<div class="text-muted" style="font-size: .85rem;">' + esc(m.moTa) + "</div>" : "") +
          '<div class="meta"><span><i class="fas fa-shopping-basket"></i> Đơn từ ' + SB.tien(m.donToiThieu) + '</span><span><i class="far fa-calendar-alt"></i> ' + (m.ngayBatDau ? SB.ngay(m.ngayBatDau) : "Ngay") + " → " +
          (m.ngayKetThuc ? SB.ngay(m.ngayKetThuc) : "không giới hạn") + "</span></div>" +
          '<div class="meta"><span>Đã dùng <b>' + m.daDung + "</b>" + (m.soLuong ? " / " + m.soLuong : " lần (không giới hạn)") + "</span></div>" +
          (m.soLuong ? '<div class="ad-progress"><span style="width: ' + pt + '%;"></span></div>' : "") +
          '<div class="foot"><button type="button" class="sb-btn ' + (m.kichHoat ? "sb-btn-outline" : "sb-btn-soft") + ' sb-btn-sm" data-bat-tat="' + m.id + '"><i class="fas ' + (m.kichHoat ? "fa-pause" : "fa-play") + '"></i> ' + (m.kichHoat ? "Tắt" : "Bật") + "</button>" +
          '<div class="ad-actions"><a class="ad-icon-btn" href="ma-giam-gia-form.html?id=' + m.id + '" title="Sửa" aria-label="Sửa mã ' + esc(m.ma) + '"><i class="fas fa-pen"></i></a>' +
          '<button type="button" class="ad-icon-btn do" data-xoa="' + m.id + '" title="' + (m.daDung > 0 ? "Đã có đơn dùng: chỉ tắt" : "Xoá") + '" aria-label="Xoá mã ' + esc(m.ma) + '"><i class="fas fa-trash-alt"></i></button></div></div></article>';
      }).join("") + "</section>";
    };
    khung.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-bat-tat")) {
        var m = KHO.tim("maGiamGia", b.getAttribute("data-bat-tat"));
        KHO.sua("maGiamGia", m.id, { kichHoat: !m.kichHoat });
        GD.toast((m.kichHoat ? "Đã tắt mã " : "Đã bật mã ") + m.ma + ".");
        ve();
      } else if (b.hasAttribute("data-xoa")) {
        var x = KHO.tim("maGiamGia", b.getAttribute("data-xoa"));
        if (x.daDung > 0) {
          AD.xacNhan("Tắt mã " + x.ma + "?", "Mã đã được dùng trong đơn hàng nên chỉ có thể tắt, không xoá hẳn.", function () {
            KHO.sua("maGiamGia", x.id, { kichHoat: false }); GD.toast("Đã tắt mã " + x.ma + "."); ve();
          }, "Tắt mã");
        } else {
          AD.xacNhan("Xoá mã " + x.ma + "?", "Mã sẽ bị xoá vĩnh viễn.", function () { KHO.xoa("maGiamGia", x.id); GD.toast("Đã xoá mã " + x.ma + "."); ve(); }, "Xoá");
        }
      }
    });
    ve();
    return;
  }

  // ===================== FORM TẠO / SỬA =====================
  var f = document.getElementById("formMa");
  if (!f) return;
  var id = GD.thamSo("id"), cu = id ? KHO.tim("maGiamGia", id) : null;
  if (id && !cu) { GD.nhan("Không tìm thấy mã giảm giá.", "loi"); location.replace("ma-giam-gia.html"); return; }
  document.title = (cu ? "Sửa mã giảm giá" : "Tạo mã giảm giá") + " - Quản trị SmartBen";
  document.getElementById("tieuDeForm").textContent = cu ? "Sửa mã " + cu.ma : "Tạo mã giảm giá";
  if (cu) {
    f.ma.value = cu.ma; f.moTa.value = cu.moTa || ""; f.giaTri.value = cu.giaTri; f.giamToiDa.value = cu.giamToiDa == null ? "" : cu.giamToiDa;
    f.donToiThieu.value = cu.donToiThieu; f.soLuong.value = cu.soLuong == null ? "" : cu.soLuong; f.kichHoat.checked = cu.kichHoat;
    f.ngayBatDau.value = AD.ngayInput(cu.ngayBatDau); f.ngayKetThuc.value = AD.ngayInput(cu.ngayKetThuc);
    f.querySelector('input[name="loai"][value="' + cu.loai + '"]').checked = true;
    if (cu.daDung > 0) document.getElementById("daDung").textContent = "Đã dùng " + cu.daDung + " lượt.";
  } else { f.kichHoat.checked = true; f.donToiThieu.value = 0; }

  var r1 = document.getElementById("loaiPhanTram"), r2 = document.getElementById("loaiSoTien");
  function capNhatLoai() {
    var pt = r1.checked;
    document.getElementById("nhanGiaTri").textContent = pt ? "Phần trăm giảm (%)" : "Số tiền giảm (đ)";
    document.getElementById("oGiamToiDa").style.display = pt ? "" : "none";
    [r1, r2].forEach(function (r) { r.closest(".sb-pay-option").classList.toggle("checked", r.checked); });
  }
  r1.addEventListener("change", capNhatLoai); r2.addEventListener("change", capNhatLoai); capNhatLoai();
  f.ma.addEventListener("input", function () { f.ma.value = f.ma.value.toUpperCase(); });

  GD.ganKiemTraTrucTiep(f);
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(f)) return;
    var ma = MG.chuanHoa(f.ma.value), loai = r1.checked ? "PhanTram" : "SoTien";
    var trung = KHO.lay("maGiamGia").filter(function (m) { return m.ma === ma && (!cu || m.id !== cu.id); })[0];
    if (trung) { GD.datLoi(f, f.ma, "Mã " + ma + " đã tồn tại."); f.ma.focus(); return; }
    var giaTri = +f.giaTri.value;
    if (loai === "PhanTram" && giaTri > 100) { GD.datLoi(f, f.giaTri, "Phần trăm giảm tối đa 100%."); f.giaTri.focus(); return; }
    var bd = AD.tuNgayInput(f.ngayBatDau.value), kt = AD.tuNgayInput(f.ngayKetThuc.value);
    if (bd && kt && new Date(kt) < new Date(bd)) { GD.datLoi(f, f.ngayKetThuc, "Ngày kết thúc phải sau ngày bắt đầu."); f.ngayKetThuc.focus(); return; }
    var soLuong = f.soLuong.value === "" ? null : parseInt(f.soLuong.value, 10);
    if (cu && soLuong != null && soLuong < cu.daDung) { GD.datLoi(f, f.soLuong, "Số lượt không được nhỏ hơn số lượt đã dùng (" + cu.daDung + ")."); f.soLuong.focus(); return; }
    var duLieu = {
      ma: ma, moTa: f.moTa.value.trim(), loai: loai, giaTri: giaTri, donToiThieu: +f.donToiThieu.value || 0,
      giamToiDa: loai === "PhanTram" && f.giamToiDa.value !== "" ? +f.giamToiDa.value : null,
      soLuong: soLuong, ngayBatDau: bd, ngayKetThuc: kt, kichHoat: f.kichHoat.checked
    };
    var kq = cu ? KHO.sua("maGiamGia", cu.id, duLieu) : KHO.them("maGiamGia", Object.assign(duLieu, { daDung: 0, ngayTao: new Date().toISOString() }));
    if (!kq) return;
    GD.nhan((cu ? "Đã cập nhật mã " : "Đã tạo mã ") + ma + ".");
    location.href = "ma-giam-gia.html";
  });
})();
