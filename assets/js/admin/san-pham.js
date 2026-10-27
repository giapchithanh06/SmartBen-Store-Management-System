/* Admin – Sản phẩm: danh sách (lọc tình trạng/hãng/từ khoá, ngừng bán/mở bán, xoá) và form Thêm/Sửa (hãng, loại, nhãn khuyến mãi, thông số kỹ thuật, ảnh) */
(function () {
  "use strict";
  if (!window.AD) return; // chưa đăng nhập admin
  var esc = GD.esc, C = SB.CAU_HINH;

  // ===================== DANH SÁCH =====================
  var bang = document.getElementById("bangSanPham");
  if (bang) {
    var q = new URLSearchParams(location.search);
    var tinhTrang = q.get("tinhTrang") || "", hang = q.get("hang") || "", tuKhoa = q.get("tuKhoa") || "";
    var daBan = SB.SanPham.daBan();

    function ve() {
      var tatCa = KHO.lay("sanPham");
      var dem = {
        dangban: tatCa.filter(function (s) { return s.conHang; }).length,
        saphet: tatCa.filter(function (s) { return s.conHang && s.ton <= C.NGUONG_SAP_HET; }).length,
        giamgia: tatCa.filter(SB.SanPham.dangGiam).length,
        ngung: tatCa.filter(function (s) { return !s.conHang; }).length
      };
      var tab = function (k, ten) {
        return '<a class="sb-chip' + (tinhTrang === k ? " active" : "") + '" href="' + GD.link("admin/san-pham.html", { tinhTrang: k, hang: hang, tuKhoa: tuKhoa }) + '">' + ten +
          (k ? ' <span class="sb-chip-count">' + dem[k] + "</span>" : "") + "</a>";
      };
      document.getElementById("tabTinhTrang").innerHTML = tab("", "Tất cả") + tab("dangban", "Đang bán") + tab("saphet", "Sắp hết") + tab("giamgia", "Đang giảm giá") + tab("ngung", "Ngừng bán");

      var ds = tatCa;
      if (tinhTrang === "dangban") ds = ds.filter(function (s) { return s.conHang; });
      if (tinhTrang === "saphet") ds = ds.filter(function (s) { return s.conHang && s.ton <= C.NGUONG_SAP_HET; });
      if (tinhTrang === "giamgia") ds = ds.filter(SB.SanPham.dangGiam);
      if (tinhTrang === "ngung") ds = ds.filter(function (s) { return !s.conHang; });
      if (hang) ds = ds.filter(function (s) { return s.hang === hang; });
      if (tuKhoa) ds = SB.SanPham.timKiem(ds, tuKhoa);
      ds.sort(tinhTrang === "saphet" ? function (a, b) { return a.ton - b.ton; } : function (a, b) { return b.id - a.id; });

      document.getElementById("demSP").textContent = ds.length + " sản phẩm đang hiển thị.";
      bang.innerHTML = !ds.length ? '<div class="ad-empty">Không có sản phẩm nào phù hợp.</div>' :
        '<div class="ad-table-wrap"><table class="ad-table"><thead><tr><th>Sản phẩm</th><th>Hãng / Loại</th><th class="num">Giá bán</th><th class="num">Tồn kho</th><th class="num">Đã bán</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        ds.map(function (s) {
          var tt = !s.conHang ? '<span class="sb-pill">Ngừng bán</span>' : s.ton === 0 ? '<span class="sb-pill bad">Hết hàng</span>'
            : s.ton <= C.NGUONG_SAP_HET ? '<span class="sb-pill warn">Cần nhập</span>' : '<span class="sb-pill ok">Đang bán</span>';
          return "<tr><td><div class=\"ad-sp\"><img src=\"" + GD.anhSP(s.anh) + '" alt="' + esc(s.ten) + '" loading="lazy" onerror="GD.anhLoi(this)" /><div><b>' + esc(s.ten) + "</b><small>" + esc(s.ma || SB.maSanPham(s.id)) + " · thêm " + SB.ngay(s.ngayTao) + "</small></div></div></td>" +
            '<td><b>' + esc(s.hang) + '</b><br /><small class="text-muted">' + esc(s.loai) + "</small></td>" +
            '<td class="num"><b class="sb-price">' + SB.tien(s.gia) + "</b>" + (SB.SanPham.dangGiam(s) ? '<br /><span class="sb-old-price">' + SB.tien(s.giaCu) + '</span> <span class="sb-sale-pill" style="font-size: .7rem;">-' + SB.SanPham.phanTramGiam(s) + "%</span>" : "") + "</td>" +
            '<td class="num"><b style="color: ' + (s.ton <= C.NGUONG_SAP_HET ? "var(--sb-red)" : "inherit") + ';">' + s.ton + " máy</b></td>" +
            '<td class="num">' + (daBan[s.id] || 0) + "</td><td>" + tt + "</td>" +
            '<td><div class="ad-actions"><a class="ad-icon-btn" href="../san-pham.html?id=' + s.id + '" target="_blank" title="Xem trên cửa hàng" aria-label="Xem ' + esc(s.ten) + '"><i class="fas fa-eye"></i></a>' +
            '<a class="ad-icon-btn" href="san-pham-form.html?id=' + s.id + '" title="Sửa" aria-label="Sửa ' + esc(s.ten) + '"><i class="fas fa-pen"></i></a>' +
            (s.conHang
              ? '<button type="button" class="ad-icon-btn do" data-ngung="' + s.id + '" title="Ngừng kinh doanh" aria-label="Ngừng kinh doanh ' + esc(s.ten) + '"><i class="fas fa-ban"></i></button>'
              : '<button type="button" class="ad-icon-btn" data-mo="' + s.id + '" title="Mở bán lại" aria-label="Mở bán lại ' + esc(s.ten) + '"><i class="fas fa-undo-alt"></i></button>' +
                (daBan[s.id] ? "" : '<button type="button" class="ad-icon-btn do" data-xoa="' + s.id + '" title="Xoá hẳn" aria-label="Xoá hẳn ' + esc(s.ten) + '"><i class="fas fa-trash-alt"></i></button>')) +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    var form = document.getElementById("formLocSP");
    form.tuKhoa.value = tuKhoa;
    form.tinhTrang.value = tinhTrang;
    form.hang.innerHTML = '<option value="">Tất cả hãng</option>' + SB.SanPham.danhSachHang().map(function (h) { return "<option" + (h === hang ? " selected" : "") + ">" + esc(h) + "</option>"; }).join("");
    form.hang.addEventListener("change", function () { form.submit(); });

    bang.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var id = +(b.getAttribute("data-ngung") || b.getAttribute("data-mo") || b.getAttribute("data-xoa")), s = KHO.tim("sanPham", id);
      if (b.hasAttribute("data-ngung")) {
        AD.xacNhan("Ngừng kinh doanh?", s.ten + " sẽ bị ẩn khỏi cửa hàng (đơn hàng cũ vẫn giữ nguyên). Bạn có thể mở bán lại bất cứ lúc nào.", function () {
          KHO.sua("sanPham", id, { conHang: false }); GD.toast("Đã ngừng kinh doanh " + s.ten + "."); ve();
        }, "Ngừng bán");
      } else if (b.hasAttribute("data-mo")) {
        KHO.sua("sanPham", id, { conHang: true }); GD.toast("Đã mở bán lại " + s.ten + "."); ve();
      } else {
        AD.xacNhan("Xoá hẳn sản phẩm?", "Xoá vĩnh viễn " + s.ten + " (sản phẩm chưa từng được bán). Không thể hoàn tác.", function () {
          KHO.xoa("sanPham", id); GD.toast("Đã xoá " + s.ten + "."); ve();
        }, "Xoá");
      }
    });
    ve();
    return;
  }

  // ===================== FORM THÊM / SỬA =====================
  var f = document.getElementById("formSanPham");
  if (!f) return;
  var id = GD.thamSo("id"), cu = id ? KHO.tim("sanPham", id) : null;
  if (id && !cu) { GD.nhan("Không tìm thấy sản phẩm.", "loi"); location.replace("san-pham.html"); return; }
  var anhChinh = cu ? cu.anh : "", anhPhu = cu ? (cu.anhPhu || []).slice() : [];

  document.title = (cu ? "Sửa sản phẩm" : "Thêm sản phẩm") + " - Quản trị SmartBen";
  document.getElementById("tieuDeForm").textContent = cu ? "Sửa sản phẩm " + SB.maSanPham(cu.id) : "Thêm sản phẩm mới";
  document.getElementById("moTaForm").textContent = cu ? "Đổi giá chỉ áp dụng cho đơn mới; đơn cũ giữ đúng giá lúc khách đặt." : "Sản phẩm mới hiện nhãn “Mới” trên cửa hàng trong " + C.SO_NGAY_HANG_MOI + " ngày.";
  if (cu) document.getElementById("xemTrenCuaHang").href = "../san-pham.html?id=" + cu.id; else document.getElementById("xemTrenCuaHang").remove();

  // Ô nhập thông số kỹ thuật
  var THONG_SO = [["manHinh", "Màn hình", "IPS LCD, 6.2', HD+"], ["heDieuHanh", "Hệ điều hành", "Android 9 (Pie)"], ["chip", "Chip xử lý", "Snapdragon 660 8 nhân"],
                  ["ram", "RAM", "4 GB"], ["rom", "Bộ nhớ trong", "64 GB"], ["theNho", "Thẻ nhớ", "MicroSD, tối đa 256 GB"],
                  ["cameraSau", "Camera sau", "16 MP và 5 MP"], ["cameraTruoc", "Camera trước", "13 MP"], ["pin", "Pin", "4000 mAh"]];
  document.getElementById("oThongSo").innerHTML = THONG_SO.map(function (t) {
    return '<div class="col-md-4 sb-field"><label for="ts_' + t[0] + '">' + t[1] + '</label><input class="sb-control" id="ts_' + t[0] + '" name="ts_' + t[0] + '" placeholder="' + esc(t[2]) + '" data-nhieu-nhat="120" /><span class="sb-error" data-loi-cho="ts_' + t[0] + '"></span></div>';
  }).join("");
  document.getElementById("dsHang").innerHTML = SB.SanPham.danhSachHang().map(function (h) { return '<option value="' + esc(h) + '"></option>'; }).join("");
  if (cu) {
    f.ten.value = cu.ten; f.hang.value = cu.hang || ""; f.ma.value = cu.ma || ""; f.loai.value = cu.loai; f.khuyenMai.value = cu.khuyenMai || "";
    f.gia.value = cu.gia; f.giaCu.value = cu.giaCu == null ? "" : cu.giaCu;
    THONG_SO.forEach(function (t) { f["ts_" + t[0]].value = (cu.thongSo || {})[t[0]] || ""; });
    f.ton.value = cu.ton; f.moTa.value = cu.moTa || ""; f.conHang.checked = cu.conHang;
    f.tenFileAnh.value = /^data:/.test(cu.anh) ? "" : cu.anh;
  } else { f.conHang.checked = true; f.ton.value = 0; }

  function veAnhChinh() {
    var img = document.getElementById("anhXemTruoc"), icon = document.getElementById("iconTrong");
    img.hidden = !anhChinh; icon.hidden = !!anhChinh;
    img.onerror = function () { GD.anhLoi(img); };
    if (anhChinh) img.src = GD.anhSP(anhChinh);
  }
  function veAnhPhu() {
    document.getElementById("dsAnhPhu").innerHTML = anhPhu.map(function (a, i) {
      return '<div class="ad-thumb"><img src="' + GD.anhSP(a) + '" alt="Ảnh phụ" onerror="GD.anhLoi(this)" /><label><input type="checkbox" data-xoa-anh="' + i + '" hidden /> <i class="fas fa-times"></i> Xoá</label></div>';
    }).join("");
  }
  document.getElementById("dsAnhPhu").addEventListener("change", function (e) {
    var i = e.target.getAttribute("data-xoa-anh");
    if (i != null) { anhPhu.splice(+i, 1); veAnhPhu(); }
  });
  f.fileAnh.addEventListener("change", function () {
    AD.docAnh(f.fileAnh.files[0], 800, function (url) { if (url) { anhChinh = url; f.tenFileAnh.value = ""; veAnhChinh(); } });
  });
  f.tenFileAnh.addEventListener("change", function () { if (f.tenFileAnh.value.trim()) { anhChinh = f.tenFileAnh.value.trim(); veAnhChinh(); } });
  f.fileAnhPhu.addEventListener("change", function () {
    var files = Array.prototype.slice.call(f.fileAnhPhu.files, 0, 6);
    (function tiep(i) {
      if (i >= files.length) { veAnhPhu(); f.fileAnhPhu.value = ""; return; }
      AD.docAnh(files[i], 800, function (url) { if (url) anhPhu.push(url); tiep(i + 1); });
    })(0);
  });

  function tinhGiam() {
    var g = parseFloat(f.gia.value), c = parseFloat(f.giaCu.value), ok = g > 0 && c > g;
    document.getElementById("xemGiam").hidden = !ok;
    if (ok) document.getElementById("phanTramGiam").textContent = Math.round((c - g) * 100 / c) + "%";
  }
  f.gia.addEventListener("input", tinhGiam); f.giaCu.addEventListener("input", tinhGiam);
  veAnhChinh(); veAnhPhu(); tinhGiam();

  GD.ganKiemTraTrucTiep(f);
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(f)) return;
    var ten = f.ten.value.trim();
    var trung = KHO.lay("sanPham").filter(function (s) { return s.ten.toLowerCase() === ten.toLowerCase() && (!cu || s.id !== cu.id); })[0];
    if (trung) { GD.datLoi(f, f.ten, "Đã có sản phẩm cùng tên (" + SB.maSanPham(trung.id) + ")."); f.ten.focus(); return; }
    var gia = Math.round(+f.gia.value), giaCu = f.giaCu.value === "" ? null : Math.round(+f.giaCu.value);
    if (giaCu != null && giaCu <= gia) { GD.datLoi(f, f.giaCu, "Giá cũ phải lớn hơn giá bán (để trống nếu không giảm giá)."); f.giaCu.focus(); return; }
    var km = f.khuyenMai.value;
    if ((km === "giamgia" || km === "giareonline") && giaCu == null) { GD.datLoi(f, f.giaCu, "Nhãn này cần giá niêm yết cũ để hiện mức giảm."); f.giaCu.focus(); return; }
    if (!anhChinh) { GD.toast("Vui lòng chọn ảnh chính cho sản phẩm.", "loi"); return; }
    var thongSo = {};
    THONG_SO.forEach(function (t) { var v = f["ts_" + t[0]].value.trim(); if (v) thongSo[t[0]] = v; });
    var hangNhap = f.hang.value.trim();
    var hangCo = SB.SanPham.danhSachHang().filter(function (h) { return h.toLowerCase() === hangNhap.toLowerCase(); })[0];   // viết hoa/thường khác vẫn gộp chung 1 hãng
    var duLieu = { ten: ten, hang: hangCo || hangNhap, ma: f.ma.value.trim() || (cu && cu.ma) || ("SB" + Date.now().toString(36).slice(-5).toUpperCase()), loai: f.loai.value,
                   khuyenMai: km, gia: gia, giaCu: giaCu, ton: parseInt(f.ton.value, 10), anh: anhChinh, anhPhu: anhPhu, thongSo: thongSo, moTa: f.moTa.value.trim(), conHang: f.conHang.checked };
    if (!cu) { duLieu.saoGoc = 0; duLieu.soDanhGiaGoc = 0; }
    var kq;
    if (cu) kq = KHO.sua("sanPham", cu.id, duLieu);
    else { duLieu.ngayTao = new Date().toISOString(); kq = KHO.them("sanPham", duLieu); }
    if (!kq) return;
    GD.nhan((cu ? "Đã cập nhật " : "Đã thêm ") + ten + ".");
    location.href = "san-pham.html";
  });
})();
