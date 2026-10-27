/* Trang chủ: sân khấu sản phẩm nổi bật, mua theo nhu cầu, sản phẩm nổi bật, mã khuyến mãi,
   các dải sản phẩm theo khuyến mãi (mới ra mắt, giá rẻ online, trả góp 0%, giảm giá, giá rẻ), số liệu, tin mới */
(function () {
  "use strict";
  var dangBan = SB.SanPham.dangBan();
  var conHang = dangBan.filter(function (s) { return s.ton > 0; });
  var dsDanhGia = KHO.lay("danhGia");
  var esc = GD.esc;
  function the(sp) { return GD.theSanPham(sp, dsDanhGia); }
  function diem(sp) { return SB.SanPham.diemDanhGia(sp, dsDanhGia); }

  // Điền số cấu hình (phí ship, hotline)
  GD.$all("[data-cau-hinh]").forEach(function (el) {
    var v = SB.CAU_HINH[el.getAttribute("data-cau-hinh")];
    el.textContent = typeof v === "number" && v >= 1000 ? SB.tien(v) : v;
  });

  // ---------- 1. Sân khấu: các máy nổi bật có ảnh trong máy (không phụ thuộc mạng) ----------
  var sanKhau = conHang.filter(function (s) { return s.anh && !/^https?:/.test(s.anh) && s.gia >= 3000000; })
    .sort(function (a, b) { return diem(b).so - diem(a).so; }).slice(0, 5);
  var khung = document.getElementById("sanKhau");
  if (sanKhau.length) {
    khung.insertAdjacentHTML("afterbegin", sanKhau.map(function (s, i) {
      return '<div class="sb-slide' + (i === 0 ? " active" : "") + '" data-id="' + s.id + '"><a href="' + GD.link("san-pham.html", { id: s.id }) + '" tabindex="-1">' +
        '<img src="' + GD.anhSP(s.anh) + '" alt="' + esc(s.ten) + '" onerror="GD.anhLoi(this)" /></a></div>';
    }).join(""));
    var the1 = document.getElementById("sanKhauThe"), nhan = document.getElementById("sanKhauGiam");
    var capNhatThe = function () {
      var dang = khung.querySelector(".sb-slide.active");
      var sp = sanKhau.filter(function (s) { return String(s.id) === (dang && dang.getAttribute("data-id")); })[0] || sanKhau[0];
      the1.href = GD.link("san-pham.html", { id: sp.id });
      the1.querySelector("b").textContent = sp.ten;
      the1.querySelector(".sb-price").textContent = SB.tien(sp.gia);
      var km = SB.SanPham.nhanKhuyenMai(sp);
      nhan.hidden = !km;
      if (km) nhan.innerHTML = SB.SanPham.dangGiam(sp) ? "Giảm<b>" + SB.SanPham.phanTramGiam(sp) + "%</b>" : esc(km.chu);
    };
    capNhatThe();
    new MutationObserver(capNhatThe).observe(khung, { subtree: true, attributes: true, attributeFilter: ["class"] });
  } else {
    document.querySelector(".sb-stage").remove();
  }

  // ---------- 2. Đếm số máy theo nhu cầu ----------
  function dem(id, so) { document.getElementById(id).textContent = so + " sản phẩm →"; }
  dem("demSinhVien", dangBan.filter(function (s) { return s.gia <= 5000000; }).length);
  dem("demTraGop", dangBan.filter(SB.SanPham.traGop0).length);
  dem("demCauHinh", dangBan.filter(function (s) { return SB.SanPham.ramGB(s) >= 4; }).length);
  dem("demPhoThong", dangBan.filter(function (s) { return s.loai === "Điện thoại phổ thông"; }).length);

  // ---------- 3. Nổi bật: điện thoại thông minh / máy tính bảng còn hàng, xếp theo điểm đánh giá × số lượt ----------
  var noiBat = conHang.filter(function (s) { return s.loai !== "Điện thoại phổ thông"; }).sort(function (a, b) {
    var x = diem(a), y = diem(b);
    return y.sao * Math.log(1 + y.so) - x.sao * Math.log(1 + x.so) || a.id - b.id;
  }).slice(0, 8);
  document.getElementById("dsNoiBat").innerHTML = noiBat.length ? noiBat.map(the).join("")
    : GD.theRong("fa-mobile-alt", "Chưa có sản phẩm", "Cửa hàng đang cập nhật hàng mới.");

  // ---------- 4. Băng khuyến mãi lấy từ mã giảm giá đang dùng được ----------
  var ma = SB.MaGiamGia.goiY()[0];
  var khuMa = document.getElementById("khuKhuyenMai");
  if (ma) {
    khuMa.querySelector("h2").textContent = SB.MaGiamGia.moTaGiaTri(ma) + (ma.donToiThieu > 0 ? " cho đơn từ " + SB.tien(ma.donToiThieu) : "");
    khuMa.querySelector("p").textContent = "Nhập mã ở bước thanh toán, áp dụng cho mọi sản phẩm" + (ma.ngayKetThuc ? ", hạn dùng đến " + SB.ngay(ma.ngayKetThuc) : "") + ".";
    khuMa.querySelector(".sb-voucher-chip span").textContent = ma.ma;
  } else khuMa.remove();

  // ---------- 5. Các dải sản phẩm theo nhóm (giống các khu của web gốc, bỏ banner quảng cáo) ----------
  var nhom = [
    { id: "MoiRaMat", eyebrow: '<i class="fas fa-rocket"></i> Vừa lên kệ', tieuDe: "Mới ra mắt", loc: function (s) { return s.khuyenMai === "moiramat"; }, link: { khuyenMai: "moiramat" } },
    { id: "Online", eyebrow: '<i class="fas fa-bolt"></i> Chỉ bán online', tieuDe: "Giá sốc online", loc: function (s) { return s.khuyenMai === "giareonline"; }, link: { khuyenMai: "giareonline" } },
    { id: "TraGop", eyebrow: '<i class="fas fa-percent"></i> Lãi suất 0%', tieuDe: "Trả góp 0%", loc: SB.SanPham.traGop0, link: { khuyenMai: "tragop" } },
    { id: "GiamGia", eyebrow: '<i class="fas fa-fire"></i> Giá tốt', tieuDe: "Đang giảm giá", loc: function (s) { return s.khuyenMai === "giamgia" && SB.SanPham.dangGiam(s); }, link: { khuyenMai: "giamgia" } },
    { id: "GiaRe", eyebrow: '<i class="fas fa-wallet"></i> Dưới 3 triệu', tieuDe: "Giá rẻ cho mọi nhà", loc: function (s) { return s.gia < 3000000; }, link: { giaDen: 3000000, sapXep: "giatang" } }
  ];
  document.getElementById("khuTheoNhom").outerHTML = nhom.map(function (n) {
    var ds = dangBan.filter(n.loc).sort(function (a, b) { return (b.ton > 0) - (a.ton > 0) || a.gia - b.gia; }).slice(0, 10);
    if (!ds.length) return "";
    return '<section class="sb-section reveal"><div class="sb-section-head"><div><span class="sb-eyebrow">' + n.eyebrow + '</span><h2>' + n.tieuDe + '</h2></div>' +
      '<div class="sb-strip-btns"><button type="button" data-strip-target="ds' + n.id + '" data-dir="-1" aria-label="Cuộn trái"><i class="fas fa-chevron-left"></i></button>' +
      '<a class="sb-btn sb-btn-soft sb-btn-sm" href="' + GD.link("cua-hang.html", n.link) + '">Xem tất cả</a>' +
      '<button type="button" data-strip-target="ds' + n.id + '" data-dir="1" aria-label="Cuộn phải"><i class="fas fa-chevron-right"></i></button></div></div>' +
      '<div class="sb-strip" id="ds' + n.id + '">' + ds.map(the).join("") + '</div></section>';
  }).join("");

  // ---------- 6. Số liệu ----------
  document.getElementById("tkSanPham").textContent = dangBan.length;
  document.getElementById("tkHang").textContent = SB.SanPham.danhSachHang().length;
  document.getElementById("tkKhach").textContent = KHO.lay("taiKhoan").filter(function (t) { return t.vaiTro !== "Admin"; }).length;

  // ---------- 7. Tin mới ----------
  var tin = KHO.lay("tinTuc").filter(function (t) { return t.hienThi; }).sort(function (a, b) { return new Date(b.ngayDang) - new Date(a.ngayDang); }).slice(0, 3);
  if (tin.length) document.getElementById("dsTinMoi").innerHTML = tin.map(GD.theTinTuc).join("");
  else document.getElementById("khuTinTuc").remove();
})();
