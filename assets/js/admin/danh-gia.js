/* Admin – Đánh giá sản phẩm: lọc theo số sao / trạng thái / từ khoá, ẩn – hiện (đánh giá ẩn không tính vào điểm), xoá */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc;
  var q = new URLSearchParams(location.search);
  var tuKhoa = (q.get("tuKhoa") || "").trim(), sao = q.get("sao") || "", hienThi = q.get("hienThi") || "";
  var form = document.getElementById("formLocDanhGia");
  form.tuKhoa.value = tuKhoa; form.sao.value = sao; form.hienThi.value = hienThi;
  form.sao.addEventListener("change", function () { form.submit(); });
  form.hienThi.addEventListener("change", function () { form.submit(); });
  var bang = document.getElementById("bangDanhGia");

  function ve() {
    var tatCa = KHO.lay("danhGia");
    var ds = tatCa.map(function (g) { g.sp = KHO.tim("sanPham", g.sanPhamId); return g; });
    if (sao) ds = ds.filter(function (g) { return g.sao === +sao; });
    if (hienThi === "hien") ds = ds.filter(function (g) { return g.hienThi; });
    if (hienThi === "an") ds = ds.filter(function (g) { return !g.hienThi; });
    if (tuKhoa) {
      var k = SB.boDau(tuKhoa);
      ds = ds.filter(function (g) { return SB.boDau(g.hoTen + " " + g.noiDung + " " + (g.sp ? g.sp.ten : "")).indexOf(k) >= 0; });
    }
    ds.sort(function (a, b) { return new Date(b.ngay) - new Date(a.ngay); });
    var tb = tatCa.length ? tatCa.reduce(function (t, g) { return t + g.sao; }, 0) / tatCa.length : 0;
    document.getElementById("demDanhGia").textContent = tatCa.length + " đánh giá từ khách đã mua · trung bình " + tb.toFixed(1).replace(".", ",") + " sao · " +
      tatCa.filter(function (g) { return !g.hienThi; }).length + " đang ẩn.";

    bang.innerHTML = !ds.length ? '<div class="ad-empty"><i class="far fa-star fa-2x mb-2" style="color: var(--sb-primary);"></i><br />Không có đánh giá nào phù hợp.</div>' :
      '<div class="ad-list">' + ds.map(function (g) {
        return '<div class="ad-item" style="align-items: flex-start;' + (g.hienThi ? "" : " opacity: .6;") + '">' +
          (g.sp ? '<img src="' + GD.anhSP(g.sp.anh) + '" alt="' + esc(g.sp.ten) + '" onerror="GD.anhLoi(this)" />' : '<span class="icon"><i class="fas fa-mobile-alt"></i></span>') +
          '<span class="info"><b style="white-space: normal;">' + (g.sp ? '<a href="../san-pham.html?id=' + g.sp.id + '#danhGia" target="_blank">' + esc(g.sp.ten) + "</a>" : "Sản phẩm đã xoá") + "</b>" +
          "<small>" + esc(g.hoTen) + " · " + SB.ngayGio(g.ngay) + (g.hienThi ? "" : ' · <b style="color: var(--sb-red);">Đang ẩn</b>') + "</small>" +
          '<span class="d-block mt-1">' + GD.sao(g.sao) + '</span><span class="d-block mt-1" style="white-space: pre-line; font-size: .9rem;">' + esc(g.noiDung) + "</span></span>" +
          '<span class="ad-actions" style="flex: none;"><button type="button" class="ad-icon-btn" data-an-hien="' + g.id + '" title="' + (g.hienThi ? "Ẩn đánh giá" : "Hiện lại") + '" aria-label="' + (g.hienThi ? "Ẩn" : "Hiện") + ' đánh giá"><i class="fas ' + (g.hienThi ? "fa-eye-slash" : "fa-eye") + '"></i></button>' +
          '<button type="button" class="ad-icon-btn do" data-xoa="' + g.id + '" title="Xoá" aria-label="Xoá đánh giá"><i class="fas fa-trash-alt"></i></button></span></div>';
      }).join("") + "</div>";
  }

  bang.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-an-hien")) {
      var g = KHO.tim("danhGia", b.getAttribute("data-an-hien"));
      KHO.sua("danhGia", g.id, { hienThi: !g.hienThi });
      GD.toast(g.hienThi ? "Đã ẩn đánh giá của " + g.hoTen + "." : "Đã hiện lại đánh giá của " + g.hoTen + ".");
      ve();
    } else {
      var id = b.getAttribute("data-xoa");
      AD.xacNhan("Xoá đánh giá?", "Đánh giá sẽ bị xoá vĩnh viễn và khách có thể viết lại đánh giá mới.", function () { KHO.xoa("danhGia", id); GD.toast("Đã xoá đánh giá."); ve(); }, "Xoá");
    }
  });
  ve();
})();
