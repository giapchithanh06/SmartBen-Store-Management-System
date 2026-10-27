/* Chi tiết sản phẩm: ảnh + thư viện ảnh, khuyến mãi, thông số nhanh, chọn số lượng, Mua ngay / Thêm vào giỏ,
   Yêu thích, So sánh, tab thông số / mô tả / đánh giá (khách đã nhận máy mới được viết), sản phẩm cùng tầm giá */
(function () {
  "use strict";
  var sp = KHO.tim("sanPham", GD.thamSo("id"));
  if (!sp) { location.replace("404.html"); return; }

  var esc = GD.esc, C = SB.CAU_HINH;
  document.title = sp.ten + " - SmartBen";
  GD.$all("[data-cau-hinh]").forEach(function (el) { var v = C[el.getAttribute("data-cau-hinh")]; el.textContent = typeof v === "number" && v >= 1000 ? SB.tien(v) : v; });

  var daBan = SB.SanPham.daBan()[sp.id] || 0;
  var conHang = sp.conHang && sp.ton > 0;
  var toiDa = Math.min(sp.ton, C.TOI_DA_MOI_LAN);
  var dsAnh = [sp.anh].concat(sp.anhPhu || []).filter(Boolean);
  var giam = SB.SanPham.dangGiam(sp);
  var km = SB.SanPham.nhanKhuyenMai(sp);
  var ts = sp.thongSo || {};

  document.getElementById("duongDan").innerHTML =
    '<a href="index.html">Trang chủ</a> <i class="fas fa-chevron-right"></i> <a href="cua-hang.html">Sản phẩm</a> <i class="fas fa-chevron-right"></i> ' +
    '<a href="' + GD.link("cua-hang.html", { hang: sp.hang }) + '">' + esc(sp.hang) + '</a> <i class="fas fa-chevron-right"></i> <span class="hien-tai">' + esc(sp.ten) + "</span>";

  // ---------- Ảnh ----------
  var anhChinh = document.getElementById("anhChinh");
  anhChinh.alt = sp.ten;
  anhChinh.onerror = function () { GD.anhLoi(anhChinh); };
  anhChinh.src = GD.anhSP(dsAnh[0]);
  document.getElementById("nhanAnh").outerHTML = !conHang ? '<span class="sb-tag het">Hết hàng</span>' : (km ? '<span class="sb-tag ' + km.lop + '">' + esc(km.chu) + '</span>' : "");
  var thumbs = document.getElementById("thuVienAnh");
  if (dsAnh.length > 1) {
    thumbs.innerHTML = dsAnh.map(function (a, i) {
      return '<button type="button" class="' + (i === 0 ? "active" : "") + '" data-src="' + GD.anhSP(a) + '" aria-label="Xem ảnh ' + (i + 1) + '"><img src="' + GD.anhSP(a) + '" alt="' + esc(sp.ten) + '" loading="lazy" onerror="GD.anhLoi(this)" /></button>';
    }).join("");
    GD.$all("button", thumbs).forEach(function (b) {
      b.addEventListener("click", function () {
        anhChinh.onerror = function () { GD.anhLoi(anhChinh); };
        anhChinh.src = b.getAttribute("data-src");
        GD.$all("button", thumbs).forEach(function (x) { x.classList.toggle("active", x === b); });
      });
    });
  } else thumbs.remove();

  // ---------- Thông tin chính ----------
  var tinhTrang = !sp.conHang ? '<span class="sb-pill bad"><i class="fas fa-ban"></i> Ngừng kinh doanh</span>'
    : sp.ton <= 0 ? '<span class="sb-pill bad"><i class="fas fa-times-circle"></i> Hết hàng</span>'
    : sp.ton <= C.NGUONG_SAP_HET ? '<span class="sb-pill warn"><i class="fas fa-exclamation-circle"></i> Chỉ còn ' + sp.ton + ' máy</span>'
    : '<span class="sb-pill ok"><i class="fas fa-check-circle"></i> Còn hàng</span>';
  document.getElementById("dauThongTin").innerHTML = '<a class="sb-pill" href="' + GD.link("cua-hang.html", { hang: sp.hang }) + '">' + esc(sp.hang) + '</a>' +
    '<span class="sb-pill">' + esc(sp.loai) + '</span>' + tinhTrang;
  document.getElementById("tenSP").textContent = sp.ten;

  var dsDanhGia = SB.DanhGia.cuaSanPham(sp.id);
  var dg = SB.SanPham.diemDanhGia(sp);
  document.getElementById("dongDanhGia").innerHTML = (dg.so ? GD.sao(dg.sao) + ' <b>' + dg.sao.toFixed(1).replace(".", ",") + '</b> <a href="#khuTab" id="denDanhGia">' + SB.so(dg.so) + ' đánh giá</a>' : '<span class="text-muted">Chưa có đánh giá</span>') +
    '<span class="text-muted">· Đã bán ' + daBan + ' · Mã ' + esc(sp.ma || SB.maSanPham(sp.id)) + '</span>';
  var den = document.getElementById("denDanhGia");
  if (den) den.addEventListener("click", function () { $("#linkDanhGia").tab("show"); });

  document.getElementById("giaSP").innerHTML = '<span class="sb-price" style="font-size: 2rem;">' + SB.tien(sp.gia) + '</span>' +
    (giam ? '<span class="sb-old-price" style="font-size: 1.05rem;">' + SB.tien(sp.giaCu) + '</span><span class="sb-sale-pill" style="background: var(--sb-accent);">-' + SB.SanPham.phanTramGiam(sp) + "%</span>" : "");

  var nhanh = [["fa-mobile-alt", "Màn hình", ts.manHinh], ["fa-microchip", "Chip", ts.chip], ["fa-memory", "RAM / Bộ nhớ", [ts.ram, ts.rom].filter(Boolean).join(" / ")],
               ["fa-camera", "Camera sau", ts.cameraSau], ["fa-battery-three-quarters", "Pin", ts.pin], ["fa-cog", "Hệ điều hành", ts.heDieuHanh]]
    .filter(function (x) { return x[2]; });
  var khungNhanh = document.getElementById("thongSoNhanh");
  if (nhanh.length) khungNhanh.innerHTML = nhanh.map(function (x) { return '<div><i class="fas ' + x[0] + '"></i><span><b>' + x[1] + '</b>' + esc(x[2]) + '</span></div>'; }).join("");
  else khungNhanh.remove();

  // Hộp khuyến mãi: chỉ ghi những gì có thật, không quảng cáo
  var uuDai = [];
  if (sp.khuyenMai === "giamgia" && giam) uuDai.push("Giảm ngay " + SB.tien(sp.giaCu - sp.gia) + " so với giá niêm yết.");
  if (sp.khuyenMai === "giareonline") uuDai.push("Giá rẻ khi đặt online, tiết kiệm " + SB.tien((sp.giaCu || sp.gia) - sp.gia) + ".");
  if (sp.khuyenMai === "tragop") uuDai.push("Trả góp 0% qua công ty tài chính, trả trước từ 30%.");
  if (sp.khuyenMai === "moiramat") uuDai.push("Mẫu mới ra mắt, hàng chính hãng nguyên seal.");
  var maSV = SB.MaGiamGia.tim("SINHVIEN");
  if (maSV && SB.MaGiamGia.dungDuoc(maSV) && sp.gia >= maSV.donToiThieu) uuDai.push('Sinh viên nhập mã <b>SINHVIEN</b>: ' + esc(SB.MaGiamGia.moTaGiaTri(maSV).toLowerCase()) + '.');
  if (sp.gia >= C.MIEN_PHI_TU) uuDai.push("Miễn phí giao hàng toàn quốc.");
  var hopKM = document.getElementById("hopKhuyenMai");
  if (uuDai.length) hopKM.innerHTML = '<strong><i class="fas fa-gift"></i> Ưu đãi khi mua</strong><ul>' + uuDai.map(function (u) { return "<li>" + u + "</li>"; }).join("") + "</ul>";
  else hopKM.remove();

  // ---------- Mua ----------
  var o = document.getElementById("soLuong");
  o.max = conHang ? toiDa : 1;
  o.disabled = !conHang;
  document.getElementById("ghiChuSoLuong").textContent = conHang ? "Tối đa " + toiDa + " máy mỗi đơn" : "Tạm thời chưa thể đặt";
  GD.$all("#formMua button[type=submit]").forEach(function (b) { b.disabled = !conHang; });
  GD.initQty(document.getElementById("formMua"));

  var nutVuaBam = null;
  GD.$all("#formMua button[type=submit]").forEach(function (b) { b.addEventListener("click", function () { nutVuaBam = b; }); });
  document.getElementById("formMua").addEventListener("submit", function (e) {
    e.preventDefault();
    var nut = e.submitter || nutVuaBam;
    var kq = SB.GioHang.them(sp.id, o.value);
    if (!kq.ok) { GD.toast(kq.thongBao, "loi"); return; }
    if (nut && nut.name === "muaNgay") { location.href = "thanh-toan.html"; return; }
    GD.toast(kq.thongBao, "ok", true);
    GD.capNhatSoGio();
  });

  // Yêu thích / So sánh (nút lớn ở trang chi tiết)
  var nutThich = document.getElementById("nutYeuThich"), nutSS = document.getElementById("nutSoSanh");
  nutThich.setAttribute("data-yeu-thich", sp.id);
  nutSS.setAttribute("data-so-sanh", sp.id);
  function veNut() {
    var thich = SB.YeuThich.co(sp.id), ss = SB.SoSanh.co(sp.id);
    nutThich.innerHTML = '<i class="' + (thich ? "fas" : "far") + ' fa-heart"></i> ' + (thich ? "Đã yêu thích" : "Yêu thích");
    nutThich.classList.toggle("on", thich);
    nutSS.innerHTML = '<i class="fas fa-balance-scale"></i> ' + (ss ? "Đang so sánh" : "So sánh");
  }
  document.addEventListener("sb-yeu-thich", veNut);
  document.addEventListener("sb-so-sanh", veNut);
  veNut();

  // ---------- Tab thông số ----------
  var bang = [["Hãng", sp.hang], ["Loại máy", sp.loai], ["Màn hình", ts.manHinh], ["Hệ điều hành", ts.heDieuHanh], ["Camera sau", ts.cameraSau],
              ["Camera trước", ts.cameraTruoc], ["Chip xử lý (CPU)", ts.chip], ["RAM", ts.ram], ["Bộ nhớ trong", ts.rom], ["Thẻ nhớ", ts.theNho], ["Dung lượng pin", ts.pin]];
  document.getElementById("bangThongSo").innerHTML = bang.filter(function (x) { return x[1]; })
    .map(function (x) { return "<tr><th>" + x[0] + "</th><td>" + esc(x[1]) + "</td></tr>"; }).join("");
  document.getElementById("tabMoTaNoiDung").textContent = sp.moTa || "Sản phẩm đang được cập nhật mô tả.";

  // ---------- Tab đánh giá ----------
  function veDanhGia() {
    dsDanhGia = SB.DanhGia.cuaSanPham(sp.id);
    dg = SB.SanPham.diemDanhGia(sp);
    document.getElementById("linkDanhGia").textContent = "Đánh giá (" + dg.so + ")";
    // Phân bố số sao: đánh giá gốc phân bổ theo điểm trung bình (ước lượng), cộng đánh giá thật trên web
    var dem = [0, 0, 0, 0, 0, 0];
    var goc = sp.soDanhGiaGoc || 0, tb = sp.saoGoc || 0;
    if (goc) {
      var tren = Math.round(goc * Math.max(0, tb - Math.floor(tb)));
      dem[Math.min(5, Math.ceil(tb))] += tren; dem[Math.max(1, Math.floor(tb))] += goc - tren;
    }
    dsDanhGia.forEach(function (g) { dem[g.sao]++; });
    var tong = dem.reduce(function (a, b) { return a + b; }, 0) || 1;
    document.getElementById("tongDanhGia").innerHTML = '<div class="sb-review-score"><b>' + (dg.so ? dg.sao.toFixed(1).replace(".", ",") : "–") + '</b>' + GD.sao(dg.sao) +
      '<div class="text-muted" style="font-size: .82rem;">' + SB.so(dg.so) + ' lượt đánh giá</div></div><div class="sb-review-bars">' +
      [5, 4, 3, 2, 1].map(function (s) {
        return '<div><span>' + s + ' <i class="fas fa-star" style="color: var(--sb-yellow);"></i></span><span class="bar"><i style="width: ' + Math.round(dem[s] * 100 / tong) + '%;"></i></span><span>' + dem[s] + '</span></div>';
      }).join("") + "</div>";
    document.getElementById("dsDanhGia").innerHTML = dsDanhGia.length ? dsDanhGia.map(function (g) {
      var chu = g.hoTen.trim().split(/\s+/).pop().charAt(0).toUpperCase();
      return '<div class="sb-review"><div class="sb-review-head"><span class="sb-av">' + esc(chu) + '</span><div><b>' + esc(g.hoTen) + '</b> <span class="sb-pill ok" style="font-size: .68rem;"><i class="fas fa-check"></i> Đã mua tại SmartBen</span>' +
        '<div>' + GD.sao(g.sao) + ' <small class="text-muted">' + SB.ngay(g.ngay) + '</small></div></div></div><p>' + esc(g.noiDung) + '</p></div>';
    }).join("") : '<p class="text-muted my-3">Chưa có nhận xét nào trên SmartBen. Hãy là người đầu tiên chia sẻ cảm nhận!</p>';

    var loi = SB.DanhGia.kiemTraQuyen(sp.id), ghiChu = document.getElementById("ghiChuDanhGia"), formDG = document.getElementById("formDanhGia");
    formDG.hidden = !!loi;
    ghiChu.hidden = !loi;
    if (loi) {
      ghiChu.innerHTML = '<i class="fas fa-info-circle"></i> ' + esc(loi) + (SB.TaiKhoan.hienTai() ? "" : ' <a href="' + GD.link("dang-nhap.html", { quayVe: "san-pham.html?id=" + sp.id }) + '">Đăng nhập</a>');
    }
  }
  var formDG = document.getElementById("formDanhGia");
  GD.ganKiemTraTrucTiep(formDG);
  formDG.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!GD.kiemTraForm(formDG)) return;
    var kq = SB.DanhGia.them(sp.id, formDG.querySelector('input[name="sao"]:checked').value, formDG.noiDung.value);
    if (!kq.ok) { GD.toast(kq.thongBao, "loi"); return; }
    formDG.reset();
    GD.toast("Cảm ơn bạn đã đánh giá " + sp.ten + "!");
    veDanhGia();
  });
  veDanhGia();
  if (location.hash === "#danhGia") $("#linkDanhGia").tab("show");

  // ---------- Cùng tầm giá (±30%), ưu tiên cùng loại máy ----------
  var lienQuan = SB.SanPham.dangBan().filter(function (x) { return x.id !== sp.id && x.ton > 0 && Math.abs(x.gia - sp.gia) <= sp.gia * 0.3; })
    .sort(function (a, b) { return (a.loai === sp.loai ? 0 : 1) - (b.loai === sp.loai ? 0 : 1) || Math.abs(a.gia - sp.gia) - Math.abs(b.gia - sp.gia); })
    .slice(0, 4);
  document.getElementById("xemCungHang").href = GD.link("cua-hang.html", { hang: sp.hang });
  document.getElementById("xemCungHang").textContent = "Xem thêm " + sp.hang;
  if (lienQuan.length) document.getElementById("dsLienQuan").innerHTML = lienQuan.map(function (x) { return GD.theSanPham(x); }).join("");
  else document.getElementById("khuLienQuan").remove();
})();
