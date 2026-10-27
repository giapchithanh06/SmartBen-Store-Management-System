/* Tài khoản của tôi: thông tin cá nhân (sửa họ tên, số điện thoại), đổi mật khẩu, danh sách yêu thích */
(function () {
  "use strict";
  var tk = SB.TaiKhoan.hienTai();
  if (!tk) {
    GD.nhan("Vui lòng đăng nhập để xem tài khoản.", "loi");
    location.replace(GD.link("dang-nhap.html", { quayVe: "tai-khoan.html" + location.hash }));
    return;
  }
  // ---------- Chuyển tab theo #hash ----------
  function moTab(ten) {
    if (!document.getElementById(ten)) ten = "thongTin";
    GD.$all(".sb-account-pane").forEach(function (p) { p.classList.toggle("active", p.id === ten); });
    GD.$all(".sb-account-nav a[data-tab]").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-tab") === ten); });
  }
  GD.$all(".sb-account-nav a[data-tab]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); history.replaceState(null, "", "#" + a.getAttribute("data-tab")); moTab(a.getAttribute("data-tab")); });
  });
  window.addEventListener("hashchange", function () { moTab(location.hash.slice(1)); });
  moTab(location.hash.slice(1) || "thongTin");

  // ---------- Đầu thẻ + số liệu ----------
  function veDau() {
    tk = SB.TaiKhoan.hienTai();
    document.getElementById("tenNguoiDung").textContent = tk.hoTen;
    document.getElementById("emailNguoiDung").textContent = tk.email;
    document.getElementById("chuCaiDau").textContent = tk.hoTen.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
    GD.$all(".sb-user-name").forEach(function (el) { el.textContent = tk.hoTen; });
  }
  veDau();
  var don = SB.DonHang.cuaToi(tk.id);
  var xong = don.filter(function (d) { return d.trangThai === SB.TRANG_THAI.XONG; });
  document.getElementById("tkSoDon").textContent = don.length;
  document.getElementById("tkDaMua").textContent = xong.reduce(function (t, d) { return t + d.chiTiet.reduce(function (a, c) { return a + c.soLuong; }, 0); }, 0);
  document.getElementById("tkChiTieu").textContent = SB.tien(xong.reduce(function (t, d) { return t + d.tongTien; }, 0));

  // ---------- Thông tin cá nhân ----------
  var f1 = document.getElementById("formThongTin");
  f1.hoTen.value = tk.hoTen;
  f1.soDienThoai.value = tk.soDienThoai || "";
  document.getElementById("emailTK").value = tk.email;
  GD.ganKiemTraTrucTiep(f1);
  f1.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(f1)) return;
    if (SB.TaiKhoan.capNhatThongTin(tk.id, f1.hoTen.value, f1.soDienThoai.value)) { veDau(); GD.toast("Đã lưu thông tin cá nhân."); }
  });

  // ---------- Đổi mật khẩu ----------
  var f2 = document.getElementById("formMatKhau");
  GD.ganKiemTraTrucTiep(f2);
  f2.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(f2)) return;
    var loi = SB.TaiKhoan.doiMatKhau(tk.id, f2.matKhauCu.value, f2.matKhauMoi.value);
    if (loi) {
      var o = loi.indexOf("hiện tại") >= 0 ? f2.matKhauCu : f2.matKhauMoi;
      GD.datLoi(f2, o, loi); o.focus();
      return;
    }
    f2.reset();
    document.getElementById("doManh").className = "sb-strength";
    GD.toast("Đổi mật khẩu thành công. Lần sau hãy đăng nhập bằng mật khẩu mới.");
  });

  // ---------- Yêu thích ----------
  function veYeuThich() {
    var ds = SB.YeuThich.lay().map(function (id) { return KHO.tim("sanPham", id); }).filter(function (s) { return s && s.conHang; });
    document.getElementById("soYeuThich").textContent = ds.length;
    document.getElementById("dsYeuThich").innerHTML = ds.length
      ? '<div class="sb-products cot-3">' + ds.map(function (s) { return GD.theSanPham(s); }).join("") + "</div>"
      : GD.theRong("fa-heart", "Chưa có sản phẩm yêu thích", "Bấm biểu tượng trái tim trên thẻ sản phẩm để lưu lại những máy bạn quan tâm.",
          '<a class="sb-btn sb-btn-grad mt-2" href="cua-hang.html">Khám phá sản phẩm</a>');
  }
  document.addEventListener("sb-yeu-thich", veYeuThich);
  veYeuThich();
})();
