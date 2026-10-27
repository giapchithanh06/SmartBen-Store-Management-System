/* Đăng nhập / Đăng ký (dựa vào data-trang trên thẻ <body>) */
(function () {
  "use strict";
  var trang = document.body.getAttribute("data-trang");
  var quayVe = GD.thamSo("quayVe");
  // Chỉ cho quay về trang trong web (chặn chuyển hướng ra ngoài)
  if (quayVe && (/^[a-z]+:/i.test(quayVe) || quayVe.indexOf("//") === 0)) quayVe = null;

  function diTiep(tk) {
    if (tk.vaiTro === "Admin" && !quayVe) { location.href = "admin/index.html"; return; }
    // Trang admin chỉ dành cho tài khoản Admin
    if (quayVe && quayVe.indexOf("admin/") === 0 && tk.vaiTro !== "Admin") { location.href = "index.html"; return; }
    location.href = quayVe || "index.html";
  }

  if (SB.TaiKhoan.hienTai()) { diTiep(SB.TaiKhoan.hienTai()); return; }

  if (trang === "dang-nhap") {
    var form = document.getElementById("formDangNhap");
    if (quayVe) document.getElementById("linkDangKy").href = "dang-ky.html?quayVe=" + encodeURIComponent(quayVe);
    GD.ganKiemTraTrucTiep(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hop = document.getElementById("loiChung");
      hop.hidden = true;
      if (!GD.kiemTraForm(form)) return;
      var kq = SB.TaiKhoan.dangNhap(form.email.value, form.matKhau.value, form.ghiNho.checked);
      if (!kq.ok) { hop.textContent = kq.thongBao; hop.hidden = false; form.matKhau.value = ""; form.matKhau.focus(); return; }
      GD.nhan("Đăng nhập thành công. Chào " + kq.taiKhoan.hoTen + "!");
      diTiep(kq.taiKhoan);
    });
  }

  if (trang === "dang-ky") {
    var f = document.getElementById("formDangKy");
    GD.ganKiemTraTrucTiep(f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!GD.kiemTraForm(f)) return;
      var kq = SB.TaiKhoan.dangKy({ hoTen: f.hoTen.value, email: f.email.value, soDienThoai: f.soDienThoai.value, matKhau: f.matKhau.value });
      if (!kq.ok) {
        if (kq.truong) GD.datLoi(f, f[kq.truong], kq.thongBao); else GD.toast(kq.thongBao, "loi");
        return;
      }
      GD.nhan("Đăng ký thành công! Chào mừng " + kq.taiKhoan.hoTen + " đến với SmartBen.");
      location.href = quayVe || "index.html";
    });
  }
})();
