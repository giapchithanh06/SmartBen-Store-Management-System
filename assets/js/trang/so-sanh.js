/* So sánh tối đa 3 sản phẩm: bảng thông số đặt cạnh nhau, tô xanh ô tốt nhất (giá thấp nhất, RAM/ROM/pin/camera cao nhất, điểm đánh giá cao nhất) */
(function () {
  "use strict";
  var esc = GD.esc;

  // Lấy số đầu tiên trong chuỗi thông số ("4 GB" -> 4, "3500 mAh" -> 3500, "16 MP và 2 MP" -> 16)
  function soDau(chuoi) { var m = String(chuoi || "").replace(",", ".").match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
  function doiGB(chuoi) { var v = soDau(chuoi); return /MB/i.test(chuoi || "") ? v / 1024 : v; }

  var HANG = [
    ["Giá bán", function (s) { return '<span class="sb-price">' + SB.tien(s.gia) + "</span>"; }, function (s) { return -s.gia; }],
    ["Đánh giá", function (s) { var d = SB.SanPham.diemDanhGia(s); return d.so ? GD.sao(d.sao, d.so) : '<span class="text-muted">Chưa có</span>'; }, function (s) { return SB.SanPham.diemDanhGia(s).sao; }],
    ["Ưu đãi", function (s) { var k = SB.SanPham.nhanKhuyenMai(s); return k ? esc(k.chu) : "–"; }],
    ["Tình trạng", function (s) { return s.ton > 0 ? '<span class="sb-pill ok">Còn ' + s.ton + " máy</span>" : '<span class="sb-pill bad">Hết hàng</span>'; }],
    ["Màn hình", function (s) { return esc(s.thongSo.manHinh); }, function (s) { var m = String(s.thongSo.manHinh || "").match(/(\d+(?:\.\d+)?)\s*(?:'|"|p|inch)/); return m ? parseFloat(m[1]) : 0; }],
    ["Hệ điều hành", function (s) { return esc(s.thongSo.heDieuHanh); }],
    ["Chip xử lý", function (s) { return esc(s.thongSo.chip); }],
    ["RAM", function (s) { return esc(s.thongSo.ram); }, function (s) { return doiGB(s.thongSo.ram); }],
    ["Bộ nhớ trong", function (s) { return esc(s.thongSo.rom); }, function (s) { return doiGB(s.thongSo.rom); }],
    ["Camera sau", function (s) { return esc(s.thongSo.cameraSau); }, function (s) { return soDau(s.thongSo.cameraSau); }],
    ["Camera trước", function (s) { return esc(s.thongSo.cameraTruoc); }, function (s) { return soDau(s.thongSo.cameraTruoc); }],
    ["Thẻ nhớ", function (s) { return esc(s.thongSo.theNho); }],
    ["Pin", function (s) { return esc(s.thongSo.pin); }, function (s) { return soDau(s.thongSo.pin); }]
  ];

  var chon = document.getElementById("themMay");

  function ve() {
    var ds = SB.SoSanh.lay().map(function (id) { return KHO.tim("sanPham", id); }).filter(Boolean);
    ds.forEach(function (s) { s.thongSo = s.thongSo || {}; });
    var conLai = SB.SanPham.dangBan().filter(function (s) { return ds.every(function (x) { return x.id !== s.id; }); })
      .sort(function (a, b) { return a.hang.localeCompare(b.hang) || a.gia - b.gia; });
    chon.innerHTML = '<option value="">' + (ds.length >= SB.CAU_HINH.TOI_DA_SO_SANH ? "Đã đủ " + SB.CAU_HINH.TOI_DA_SO_SANH + " máy" : "+ Thêm máy để so sánh...") + "</option>" +
      conLai.map(function (s) { return '<option value="' + s.id + '">' + esc(s.hang + " · " + s.ten + " – " + SB.tien(s.gia)) + "</option>"; }).join("");
    chon.disabled = ds.length >= SB.CAU_HINH.TOI_DA_SO_SANH;
    document.getElementById("xoaHetSoSanh").hidden = !ds.length;

    var khung = document.getElementById("bangSoSanh");
    if (!ds.length) {
      khung.innerHTML = GD.theRong("fa-balance-scale", "Chưa có máy nào để so sánh", "Bấm biểu tượng cân trên thẻ sản phẩm hoặc chọn máy ở ô phía trên.",
        '<a class="sb-btn sb-btn-grad mt-2" href="cua-hang.html">Chọn sản phẩm</a>');
      khung.firstChild.style.boxShadow = "none";
      return;
    }
    var html = '<table class="sb-cmp-table"><tr class="sb-cmp-head"><th>Sản phẩm</th>' + ds.map(function (s) {
      return '<td><a href="' + GD.link("san-pham.html", { id: s.id }) + '"><img src="' + GD.anhSP(s.anh) + '" alt="' + esc(s.ten) + '" onerror="GD.anhLoi(this)" /></a>' +
        '<a class="ten" href="' + GD.link("san-pham.html", { id: s.id }) + '">' + esc(s.ten) + '</a>' +
        '<div class="d-flex justify-content-center flex-wrap" style="gap: 6px;"><button type="button" class="sb-btn sb-btn-grad sb-btn-sm" data-them-gio="' + s.id + '"' + (s.ton > 0 ? "" : " disabled") + '><i class="fas fa-cart-plus"></i> Thêm vào giỏ</button>' +
        '<button type="button" class="sb-btn sb-btn-outline sb-btn-sm" data-bo="' + s.id + '"><i class="fas fa-times"></i> Bỏ</button></div></td>';
    }).join("") + "</tr>";
    HANG.forEach(function (h) {
      var tot = null;
      if (h[2] && ds.length > 1) {
        var gt = ds.map(h[2]), max = Math.max.apply(null, gt);
        if (gt.some(function (v) { return v !== max; })) tot = max;   // chỉ tô khi các máy khác nhau
        h.gt = gt;
      }
      html += "<tr><th>" + h[0] + "</th>" + ds.map(function (s, i) {
        return '<td class="' + (tot !== null && h.gt[i] === tot ? "tot" : "") + '">' + (h[1](s) || "–") + "</td>";
      }).join("") + "</tr>";
    });
    khung.innerHTML = html + "</table>";
  }

  chon.addEventListener("change", function () {
    if (!chon.value) return;
    var kq = SB.SoSanh.batTat(chon.value);
    if (!kq.ok) GD.toast(kq.thongBao, "loi");
    ve(); GD.veThanhSoSanh();
  });
  document.getElementById("bangSoSanh").addEventListener("click", function (e) {
    var bo = e.target.closest("[data-bo]");
    if (!bo) return;
    SB.SoSanh.batTat(bo.getAttribute("data-bo"));
    ve(); GD.veThanhSoSanh();
  });
  document.getElementById("xoaHetSoSanh").addEventListener("click", function () { SB.SoSanh.ghi([]); ve(); GD.veThanhSoSanh(); });

  // Mở trang với ?id=1,2,3 (chia sẻ link so sánh)
  var tuLink = (GD.thamSo("id") || "").split(",").map(Number).filter(function (x) { return x && KHO.tim("sanPham", x); });
  if (tuLink.length) SB.SoSanh.ghi(tuLink.slice(0, SB.CAU_HINH.TOI_DA_SO_SANH));
  ve();
})();
