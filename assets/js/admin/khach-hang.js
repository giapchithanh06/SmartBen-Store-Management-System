/* Admin – Khách hàng: tìm theo tên/email/sđt, lọc đang hoạt động / bị khoá, sắp xếp mới đăng ký / chi tiêu / số đơn,
   khoá – mở khoá tài khoản (khách bị khoá không đăng nhập được), xoá tài khoản chưa có đơn nào */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc;
  var q = new URLSearchParams(location.search), tuKhoa = (q.get("tuKhoa") || "").trim(), sapXep = q.get("sapXep") || "", tinhTrang = q.get("tinhTrang") || "";
  var form = document.getElementById("formTimKhach");
  form.tuKhoa.value = tuKhoa; form.sapXep.value = sapXep; form.tinhTrang.value = tinhTrang;
  form.sapXep.addEventListener("change", function () { form.submit(); });
  form.tinhTrang.addEventListener("change", function () { form.submit(); });
  var bang = document.getElementById("bangKhach");

  function ve() {
    var don = KHO.lay("donHang");
    var ds = KHO.lay("taiKhoan").filter(function (t) { return t.vaiTro !== "Admin"; }).map(function (t) {
      var cua = don.filter(function (d) { return d.taiKhoanId === t.id; });
      var hopLe = cua.filter(function (d) { return d.trangThai !== SB.TRANG_THAI.HUY; });
      return {
        tk: t, soDon: cua.length, chiTieu: hopLe.reduce(function (s, d) { return s + d.tongTien; }, 0),
        ganNhat: cua.reduce(function (m, d) { return !m || new Date(d.ngayDat) > new Date(m) ? d.ngayDat : m; }, null)
      };
    });
    var soKhoa = ds.filter(function (x) { return x.tk.biKhoa; }).length;
    if (tinhTrang === "khoa") ds = ds.filter(function (x) { return x.tk.biKhoa; });
    if (tinhTrang === "hoatdong") ds = ds.filter(function (x) { return !x.tk.biKhoa; });
    if (tuKhoa) {
      var k = SB.boDau(tuKhoa);
      ds = ds.filter(function (x) { return SB.boDau(x.tk.hoTen + " " + x.tk.email + " " + (x.tk.soDienThoai || "")).indexOf(k) >= 0; });
    }
    ds.sort(sapXep === "chitieu" ? function (a, b) { return b.chiTieu - a.chiTieu; } : sapXep === "sodon" ? function (a, b) { return b.soDon - a.soDon; }
      : function (a, b) { return new Date(b.tk.ngayDangKy) - new Date(a.tk.ngayDangKy); });

    document.getElementById("demKhach").textContent = ds.length + " tài khoản đang hiển thị · " + soKhoa + " tài khoản bị khoá · chi tiêu không tính đơn đã huỷ.";
    bang.innerHTML = !ds.length ? '<div class="ad-empty">Không có khách hàng nào phù hợp.</div>' :
      '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Ngày đăng ký</th><th class="num">Số đơn</th><th class="num">Tổng chi tiêu</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
      ds.map(function (x) {
        var t = x.tk;
        return '<tr' + (t.biKhoa ? ' style="opacity: .7;"' : "") + '><td><div class="ad-sp" style="min-width: 220px;"><span class="sb-avatar" style="width: 42px; height: 42px; font-size: 1rem; margin: 0;' + (t.biKhoa ? " background: #98A2B3;" : "") + '">' +
          esc(t.hoTen.trim().split(/\s+/).pop().charAt(0).toUpperCase()) + "</span><div><b>" + esc(t.hoTen) + "</b><small>" + esc(t.email) + "</small></div></div></td><td>" +
          (t.soDienThoai ? esc(t.soDienThoai) : "—") + "</td><td>" + SB.ngay(t.ngayDangKy) +
          '</td><td class="num">' + x.soDon + '</td><td class="num font-weight-bold">' + SB.tien(x.chiTieu) + "</td><td>" +
          (t.biKhoa ? '<span class="sb-pill bad"><i class="fas fa-lock"></i> Đã khoá</span>' : '<span class="sb-pill ok">Hoạt động</span>') +
          (x.ganNhat ? '<br /><small class="text-muted">Đơn gần nhất ' + SB.ngay(x.ganNhat) + "</small>" : "") + '</td><td><div class="ad-actions">' +
          (x.soDon ? '<a class="ad-icon-btn" href="don-hang.html?taiKhoanId=' + t.id + '" title="Xem đơn" aria-label="Xem đơn của ' + esc(t.hoTen) + '"><i class="fas fa-receipt"></i></a>' : "") +
          (t.biKhoa
            ? '<button type="button" class="ad-icon-btn" data-mo-khoa="' + t.id + '" title="Mở khoá" aria-label="Mở khoá ' + esc(t.hoTen) + '"><i class="fas fa-lock-open"></i></button>'
            : '<button type="button" class="ad-icon-btn do" data-khoa="' + t.id + '" title="Khoá tài khoản" aria-label="Khoá ' + esc(t.hoTen) + '"><i class="fas fa-lock"></i></button>') +
          (x.soDon ? "" : '<button type="button" class="ad-icon-btn do" data-xoa="' + t.id + '" title="Xoá tài khoản" aria-label="Xoá ' + esc(t.hoTen) + '"><i class="fas fa-trash-alt"></i></button>') +
          "</div></td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  bang.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var id = +(b.getAttribute("data-khoa") || b.getAttribute("data-mo-khoa") || b.getAttribute("data-xoa")), t = KHO.tim("taiKhoan", id);
    if (!t) return;
    if (b.hasAttribute("data-khoa")) {
      AD.xacNhan("Khoá tài khoản?", t.hoTen + " (" + t.email + ") sẽ không đăng nhập được nữa. Đơn hàng cũ vẫn được giữ nguyên.", function () {
        KHO.sua("taiKhoan", id, { biKhoa: true }); GD.toast("Đã khoá tài khoản " + t.hoTen + "."); ve();
      }, "Khoá");
    } else if (b.hasAttribute("data-mo-khoa")) {
      KHO.sua("taiKhoan", id, { biKhoa: false }); GD.toast("Đã mở khoá tài khoản " + t.hoTen + "."); ve();
    } else {
      AD.xacNhan("Xoá tài khoản?", "Xoá vĩnh viễn tài khoản " + t.email + " (chưa có đơn hàng nào). Đánh giá của khách này cũng bị xoá.", function () {
        KHO.giaoDich(function (db) {
          db.taiKhoan = db.taiKhoan.filter(function (x) { return x.id !== id; });
          db.danhGia = db.danhGia.filter(function (g) { return g.taiKhoanId !== id; });
        });
        GD.toast("Đã xoá tài khoản " + t.email + "."); ve();
      }, "Xoá");
    }
  });
  ve();
})();
