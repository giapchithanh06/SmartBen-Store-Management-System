/* Admin – QUẢN LÝ TIN TỨC (chức năng mới)
   - Danh sách: tìm theo tiêu đề, lọc Đang hiện / Đang ẩn, ẩn/hiện nhanh, sửa, xoá (có hộp xác nhận)
   - Form Thêm/Sửa: tiêu đề, tóm tắt, nội dung, ảnh (chọn file từ máy hoặc ảnh có sẵn), ngày đăng, hiện trên web */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc;
  var ANH_CO_SAN = ["news-bg.jpg", "news-bg-1.jpg", "news-bg-2.jpg", "news-bg-3.jpg", "news-bg-4.jpg", "news-bg-5.jpg"];

  // ===================== DANH SÁCH =====================
  var bang = document.getElementById("bangTin");
  if (bang) {
    var q = new URLSearchParams(location.search), tuKhoa = (q.get("tuKhoa") || "").trim(), loc = q.get("loc") || "";
    var form = document.getElementById("formTimTin");
    form.tuKhoa.value = tuKhoa; form.loc.value = loc;
    form.loc.addEventListener("change", function () { form.submit(); });

    var ve = function () {
      var tatCa = KHO.lay("tinTuc").sort(function (a, b) { return new Date(b.ngayDang) - new Date(a.ngayDang); });
      var hien = tatCa.filter(function (t) { return t.hienThi; }).length;
      document.getElementById("demTin").textContent = tatCa.length + " bài viết · " + hien + " đang hiện trên website · " + (tatCa.length - hien) + " đang ẩn.";
      var ds = tatCa;
      if (loc === "hien") ds = ds.filter(function (t) { return t.hienThi; });
      if (loc === "an") ds = ds.filter(function (t) { return !t.hienThi; });
      if (tuKhoa) { var k = SB.boDau(tuKhoa); ds = ds.filter(function (t) { return SB.boDau(t.tieuDe + " " + t.tomTat).indexOf(k) >= 0; }); }

      bang.innerHTML = !ds.length ? '<div class="ad-empty"><i class="far fa-newspaper fa-2x mb-2" style="color: var(--sb-primary);"></i><br />Không có bài viết nào phù hợp.</div>' :
        '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Bài viết</th><th>Ngày đăng</th><th>Người đăng</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        ds.map(function (t) {
          return '<tr><td><div class="ad-sp" style="min-width: 320px;">' + (t.anh ? '<img src="' + GD.anhTin(t.anh) + '" alt="" style="width: 72px;" />' : '<span class="ad-thumb-trong"><i class="fas fa-mobile-alt"></i></span>') +
            "<div><b>" + esc(t.tieuDe) + '</b><small class="d-block" style="max-width: 46ch;">' + esc(t.tomTat || "") + "</small></div></div></td>" +
            "<td><small>" + SB.gio(t.ngayDang) + "<br />" + SB.ngay(t.ngayDang) + "</small></td><td>" + esc(t.nguoiDang) + "</td>" +
            "<td>" + (t.hienThi ? '<span class="sb-pill ok"><i class="fas fa-eye"></i> Đang hiện</span>' : '<span class="sb-pill"><i class="fas fa-eye-slash"></i> Đang ẩn</span>') + "</td>" +
            '<td><div class="ad-actions">' +
            '<a class="ad-icon-btn" href="../tin-tuc-chi-tiet.html?id=' + t.id + '" target="_blank" title="Xem trên website" aria-label="Xem bài ' + esc(t.tieuDe) + '"><i class="fas fa-external-link-alt"></i></a>' +
            '<button type="button" class="ad-icon-btn" data-an-hien="' + t.id + '" title="' + (t.hienThi ? "Ẩn khỏi website" : "Hiện trên website") + '" aria-label="' + (t.hienThi ? "Ẩn" : "Hiện") + ' bài viết"><i class="fas ' + (t.hienThi ? "fa-eye-slash" : "fa-eye") + '"></i></button>' +
            '<a class="ad-icon-btn" href="tin-tuc-form.html?id=' + t.id + '" title="Sửa" aria-label="Sửa bài ' + esc(t.tieuDe) + '"><i class="fas fa-pen"></i></a>' +
            '<button type="button" class="ad-icon-btn do" data-xoa="' + t.id + '" title="Xoá" aria-label="Xoá bài ' + esc(t.tieuDe) + '"><i class="fas fa-trash-alt"></i></button></div></td></tr>';
        }).join("") + "</tbody></table></div>";
    };

    bang.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var t = KHO.tim("tinTuc", b.getAttribute("data-an-hien") || b.getAttribute("data-xoa"));
      if (b.hasAttribute("data-an-hien")) {
        KHO.sua("tinTuc", t.id, { hienThi: !t.hienThi });
        GD.toast(t.hienThi ? "Đã ẩn bài viết khỏi website." : "Bài viết đã hiện trên website.");
        ve();
      } else {
        AD.xacNhan("Xoá bài viết?", "“" + t.tieuDe + "” sẽ bị xoá vĩnh viễn. Nếu chỉ muốn tạm gỡ, hãy dùng nút Ẩn.", function () {
          KHO.xoa("tinTuc", t.id); GD.toast("Đã xoá bài viết."); ve();
        }, "Xoá");
      }
    });
    ve();
    return;
  }

  // ===================== FORM THÊM / SỬA =====================
  var f = document.getElementById("formTin");
  if (!f) return;
  var id = GD.thamSo("id"), cu = id ? KHO.tim("tinTuc", id) : null;
  if (id && !cu) { GD.nhan("Không tìm thấy bài viết.", "loi"); location.replace("tin-tuc.html"); return; }
  var anh = cu ? cu.anh : "";

  document.title = (cu ? "Sửa tin tức" : "Viết tin mới") + " - Quản trị SmartBen";
  document.getElementById("tieuDeForm").textContent = cu ? "Sửa bài viết" : "Viết tin mới";
  f.anhCoSan.innerHTML = '<option value="">-- Chọn ảnh có sẵn --</option>' + ANH_CO_SAN.map(function (a) { return "<option>" + a + "</option>"; }).join("");

  function ngayGioInput(iso) {
    var d = iso ? new Date(iso) : new Date();
    return AD.ngayInput(d.toISOString()) + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  if (cu) {
    f.tieuDe.value = cu.tieuDe; f.tomTat.value = cu.tomTat || ""; f.noiDung.value = cu.noiDung; f.hienThi.checked = cu.hienThi;
    if (ANH_CO_SAN.indexOf(cu.anh) >= 0) f.anhCoSan.value = cu.anh;
  } else f.hienThi.checked = true;
  f.ngayDang.value = ngayGioInput(cu ? cu.ngayDang : null);
  document.getElementById("nguoiDang").textContent = cu ? cu.nguoiDang : AD.taiKhoan.hoTen;

  function veAnh() {
    var img = document.getElementById("anhTinXemTruoc"), icon = document.getElementById("iconTinTrong");
    img.hidden = !anh; icon.hidden = !!anh;
    if (anh) img.src = GD.anhTin(anh);
    document.getElementById("boAnh").hidden = !anh;
  }
  f.fileAnh.addEventListener("change", function () {
    AD.docAnh(f.fileAnh.files[0], 1200, function (url) { if (url) { anh = url; f.anhCoSan.value = ""; veAnh(); } });
  });
  f.anhCoSan.addEventListener("change", function () { if (f.anhCoSan.value) { anh = f.anhCoSan.value; f.fileAnh.value = ""; veAnh(); } });
  document.getElementById("boAnh").addEventListener("click", function () { anh = ""; f.anhCoSan.value = ""; f.fileAnh.value = ""; veAnh(); });

  // Xem trước số ký tự tóm tắt
  var demTT = document.getElementById("demTomTat");
  function dem() { demTT.textContent = f.tomTat.value.length + "/300"; }
  f.tomTat.addEventListener("input", dem); dem();
  veAnh();

  GD.ganKiemTraTrucTiep(f);
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(f)) return;
    var ngay = f.ngayDang.value ? new Date(f.ngayDang.value).toISOString() : new Date().toISOString();
    var duLieu = { tieuDe: f.tieuDe.value.trim(), tomTat: f.tomTat.value.trim(), noiDung: f.noiDung.value.trim(), anh: anh, hienThi: f.hienThi.checked, ngayDang: ngay };
    var kq = cu ? KHO.sua("tinTuc", cu.id, duLieu) : KHO.them("tinTuc", Object.assign(duLieu, { nguoiDang: AD.taiKhoan.hoTen }));
    if (!kq) return;
    GD.nhan(cu ? "Đã cập nhật bài viết." : "Đã đăng bài viết mới" + (duLieu.hienThi ? "." : " (đang ẩn)."));
    location.href = "tin-tuc.html";
  });
})();
