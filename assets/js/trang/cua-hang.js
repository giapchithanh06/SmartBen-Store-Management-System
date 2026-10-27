/* Cửa hàng: lọc theo hãng, loại máy, mức giá, ưu đãi, RAM, số sao, còn hàng; tìm kiếm; sắp xếp; phân trang 12 máy/trang.
   Mọi bộ lọc nằm trên địa chỉ trang (?hang=Apple&giaDen=5000000...) nên có thể gửi link cho bạn bè. */
(function () {
  "use strict";
  var MOI_TRANG = 12;
  var CACH_SAP_XEP = { macdinh: "Mặc định", moinhat: "Mới nhất", banchay: "Bán chạy", danhgia: "Đánh giá cao", giatang: "Giá thấp → cao", giagiam: "Giá cao → thấp", giamnhieu: "Giảm nhiều nhất" };
  var MUC_GIA = [["", "", "Tất cả"], ["", 2000000, "Dưới 2 triệu"], [2000000, 4000000, "2 – 4 triệu"], [4000000, 7000000, "4 – 7 triệu"],
                 [7000000, 13000000, "7 – 13 triệu"], [13000000, "", "Trên 13 triệu"]];
  var esc = GD.esc;

  var q = new URLSearchParams(location.search);
  function so(ten) { var v = q.get(ten); return v === null || v === "" || isNaN(Number(v)) ? "" : Number(v); }
  var loc = {
    tuKhoa: (q.get("tuKhoa") || "").trim(), hang: q.get("hang") || "", loai: q.get("loai") || "",
    giaTu: so("giaTu"), giaDen: so("giaDen"), khuyenMai: q.get("khuyenMai") || "", ram: so("ram"), sao: so("sao"),
    conHang: q.get("conHang") === "true", sapXep: CACH_SAP_XEP[q.get("sapXep")] ? q.get("sapXep") : "macdinh",
    trang: Math.max(1, parseInt(q.get("trang"), 10) || 1)
  };
  var dangLoc = !!(loc.tuKhoa || loc.hang || loc.loai || loc.giaTu !== "" || loc.giaDen !== "" || loc.khuyenMai || loc.ram || loc.sao || loc.conHang);

  function url(thayDoi) {
    var x = { tuKhoa: loc.tuKhoa, hang: loc.hang, loai: loc.loai, giaTu: loc.giaTu, giaDen: loc.giaDen, khuyenMai: loc.khuyenMai, ram: loc.ram, sao: loc.sao,
              conHang: loc.conHang ? "true" : "", sapXep: loc.sapXep === "macdinh" ? "" : loc.sapXep, trang: "" };
    Object.keys(thayDoi || {}).forEach(function (k) { x[k] = thayDoi[k]; });
    return GD.link("cua-hang.html", x) + "#danhSach";
  }

  // ---------- Lọc ----------
  var dsDanhGia = KHO.lay("danhGia"), daBan = SB.SanPham.daBan();
  var diem = {};
  var ds = SB.SanPham.dangBan();
  ds.forEach(function (s) { diem[s.id] = SB.SanPham.diemDanhGia(s, dsDanhGia); });
  if (loc.tuKhoa) ds = SB.SanPham.timKiem(ds, loc.tuKhoa);
  if (loc.hang) ds = ds.filter(function (s) { return s.hang.toLowerCase() === loc.hang.toLowerCase(); });
  if (loc.loai) ds = ds.filter(function (s) { return s.loai.toLowerCase() === loc.loai.toLowerCase(); });
  if (loc.giaTu !== "") ds = ds.filter(function (s) { return s.gia >= loc.giaTu; });
  if (loc.giaDen !== "") ds = ds.filter(function (s) { return s.gia < loc.giaDen || (loc.giaTu === "" && s.gia <= loc.giaDen); });
  if (loc.khuyenMai) ds = ds.filter(function (s) { return s.khuyenMai === loc.khuyenMai; });
  if (loc.ram) ds = ds.filter(function (s) { return SB.SanPham.ramGB(s) >= loc.ram; });
  if (loc.sao) ds = ds.filter(function (s) { return diem[s.id].sao >= loc.sao; });
  if (loc.conHang) ds = ds.filter(function (s) { return s.ton > 0; });

  var sx = {
    moinhat: function (a, b) { return new Date(b.ngayTao) - new Date(a.ngayTao) || b.id - a.id; },
    banchay: function (a, b) { return (daBan[b.id] || 0) - (daBan[a.id] || 0) || diem[b.id].so - diem[a.id].so; },
    danhgia: function (a, b) { return diem[b.id].sao - diem[a.id].sao || diem[b.id].so - diem[a.id].so; },
    giatang: function (a, b) { return a.gia - b.gia; },
    giagiam: function (a, b) { return b.gia - a.gia; },
    giamnhieu: function (a, b) { return SB.SanPham.phanTramGiam(b) - SB.SanPham.phanTramGiam(a) || b.gia - a.gia; }
  }[loc.sapXep];
  // Mặc định: máy còn hàng lên trước, rồi theo thứ tự nhập
  ds = ds.slice().sort(sx || function (a, b) { return (b.ton > 0) - (a.ton > 0) || a.id - b.id; });

  var tongSo = ds.length, tongTrang = Math.ceil(tongSo / MOI_TRANG);
  if (tongTrang > 0 && loc.trang > tongTrang) loc.trang = tongTrang;
  var trangNay = ds.slice((loc.trang - 1) * MOI_TRANG, loc.trang * MOI_TRANG);

  // ---------- Tiêu đề ----------
  var mucGiaChon = MUC_GIA.slice(1).filter(function (m) { return m[0] === loc.giaTu && m[1] === loc.giaDen; })[0];
  var nhanGia = mucGiaChon ? mucGiaChon[2] : (loc.giaTu !== "" && loc.giaDen !== "" ? SB.tien(loc.giaTu) + " – " + SB.tien(loc.giaDen)
    : loc.giaDen !== "" ? "Dưới " + SB.tien(loc.giaDen) : loc.giaTu !== "" ? "Từ " + SB.tien(loc.giaTu) : "");
  var tieuDe = loc.tuKhoa ? "Kết quả cho “" + loc.tuKhoa + "”"
    : loc.hang ? "Điện thoại " + loc.hang
    : loc.khuyenMai ? SB.SanPham.TEN_KHUYEN_MAI[loc.khuyenMai] || "Ưu đãi"
    : loc.loai || (loc.giaDen === 5000000 && loc.giaTu === "" ? "Góc sinh viên – dưới 5 triệu" : nhanGia || "Tất cả sản phẩm");
  document.title = tieuDe + " - SmartBen";
  document.getElementById("nhanDanhSach").textContent = loc.tuKhoa ? "Tìm kiếm" : "Danh sách sản phẩm";
  document.getElementById("tieuDeDanhSach").textContent = tieuDe;
  document.getElementById("tongSo").textContent = tongSo;

  // ---------- Bộ lọc (form bên trái) ----------
  var form = document.getElementById("formLoc");
  form.tuKhoa.value = loc.tuKhoa;
  var nutMo = document.getElementById("moBoLoc");
  nutMo.addEventListener("click", function () { var mo = form.classList.toggle("mo"); nutMo.setAttribute("aria-expanded", mo); });
  if (dangLoc) document.getElementById("xoaLoc").hidden = false;

  form.hang.innerHTML = '<option value="">Tất cả hãng</option>' + SB.SanPham.danhSachHang().map(function (h) {
    var n = SB.SanPham.dangBan().filter(function (s) { return s.hang === h; }).length;
    return '<option value="' + esc(h) + '"' + (h.toLowerCase() === loc.hang.toLowerCase() ? " selected" : "") + '>' + esc(h) + ' (' + n + ')</option>';
  }).join("");

  function chip(ten, giaTri, nhan, chon) {
    return '<label class="sb-chip' + (chon ? " active" : "") + '"><input type="radio" name="' + ten + '" value="' + esc(giaTri) + '" class="d-none" data-tu-ap-dung' + (chon ? " checked" : "") + ' /> ' + esc(nhan) + '</label>';
  }
  document.getElementById("chipLoai").innerHTML = chip("loai", "", "Tất cả", !loc.loai) +
    SB.SanPham.danhSachLoai().map(function (l) { return chip("loai", l, l, l.toLowerCase() === loc.loai.toLowerCase()); }).join("");
  document.getElementById("chipGia").innerHTML = MUC_GIA.map(function (m, i) {
    return chip("mucGia", i, m[2], i === 0 ? (loc.giaTu === "" && loc.giaDen === "") : mucGiaChon === m);
  }).join("");
  document.getElementById("chipKhuyenMai").innerHTML = chip("khuyenMai", "", "Tất cả", !loc.khuyenMai) +
    Object.keys(SB.SanPham.TEN_KHUYEN_MAI).map(function (k) { return chip("khuyenMai", k, SB.SanPham.TEN_KHUYEN_MAI[k], k === loc.khuyenMai); }).join("");
  form.ram.value = loc.ram === "" ? "" : String(loc.ram);
  form.sao.value = loc.sao === "" ? "" : String(loc.sao);
  form.conHang.checked = loc.conHang;

  var chonSapXep = document.getElementById("sapXep");
  chonSapXep.innerHTML = Object.keys(CACH_SAP_XEP).map(function (k) { return '<option value="' + k + '"' + (k === loc.sapXep ? " selected" : "") + '>Sắp xếp: ' + CACH_SAP_XEP[k] + '</option>'; }).join("");
  chonSapXep.addEventListener("change", function () { location.href = url({ sapXep: chonSapXep.value === "macdinh" ? "" : chonSapXep.value }); });

  function apDung() {
    var giaChon = form.querySelector('input[name="mucGia"]:checked');
    var m = giaChon ? MUC_GIA[+giaChon.value] : null;
    location.href = url({
      hang: form.hang.value, loai: (form.querySelector('input[name="loai"]:checked') || {}).value || "",
      giaTu: m ? m[0] : loc.giaTu, giaDen: m ? m[1] : loc.giaDen,   // khoảng giá tự nhập trên link (không khớp mức nào) thì giữ nguyên
      khuyenMai: (form.querySelector('input[name="khuyenMai"]:checked') || {}).value || "",
      ram: form.ram.value, sao: form.sao.value, conHang: form.conHang.checked ? "true" : ""
    });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); apDung(); });
  form.addEventListener("change", function (e) { if (e.target.hasAttribute("data-tu-ap-dung")) apDung(); });

  // ---------- Bộ lọc đang dùng (bấm × để bỏ) ----------
  var dangDung = "";
  function the(nhan, bo) { dangDung += '<a href="' + url(bo) + '">' + esc(nhan) + ' <i class="fas fa-times"></i></a>'; }
  if (loc.tuKhoa) the("Từ khoá: " + loc.tuKhoa, { tuKhoa: "" });
  if (loc.hang) the("Hãng: " + loc.hang, { hang: "" });
  if (loc.loai) the(loc.loai, { loai: "" });
  if (nhanGia) the("Giá: " + nhanGia, { giaTu: "", giaDen: "" });
  if (loc.khuyenMai) the(SB.SanPham.TEN_KHUYEN_MAI[loc.khuyenMai] || loc.khuyenMai, { khuyenMai: "" });
  if (loc.ram) the("RAM từ " + loc.ram + " GB", { ram: "" });
  if (loc.sao) the("Từ " + String(loc.sao).replace(".", ",") + " sao", { sao: "" });
  if (loc.conHang) the("Còn hàng", { conHang: "" });
  var khuLoc = document.getElementById("locDangDung");
  if (dangDung) khuLoc.innerHTML = dangDung; else khuLoc.remove();

  // ---------- Danh sách + phân trang ----------
  document.getElementById("dsSanPham").outerHTML = trangNay.length
    ? '<div class="sb-products cot-3">' + trangNay.map(function (s) { return GD.theSanPham(s, dsDanhGia); }).join("") + "</div>"
    : GD.theRong("fa-search", "Không tìm thấy sản phẩm phù hợp", "Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác, ví dụ “Samsung”, “iPhone”, “Redmi”.",
        '<a class="sb-btn sb-btn-grad mt-2" href="cua-hang.html">Xem tất cả sản phẩm</a>');

  if (tongTrang > 1) {
    var pt = '<li class="' + (loc.trang <= 1 ? "disabled" : "") + '">' + (loc.trang > 1 ? '<a href="' + url({ trang: loc.trang - 1 }) + '" aria-label="Trang trước"><i class="fas fa-chevron-left"></i></a>' : '<span><i class="fas fa-chevron-left"></i></span>') + "</li>";
    for (var i = 1; i <= tongTrang; i++) {
      pt += '<li class="' + (i === loc.trang ? "active" : "") + '">' + (i === loc.trang ? '<span aria-current="page">' + i + "</span>" : '<a href="' + url({ trang: i }) + '">' + i + "</a>") + "</li>";
    }
    pt += '<li class="' + (loc.trang >= tongTrang ? "disabled" : "") + '">' + (loc.trang < tongTrang ? '<a href="' + url({ trang: loc.trang + 1 }) + '" aria-label="Trang sau"><i class="fas fa-chevron-right"></i></a>' : '<span><i class="fas fa-chevron-right"></i></span>') + "</li>";
    document.getElementById("phanTrang").innerHTML = pt;
  } else {
    document.getElementById("phanTrang").remove();
  }
})();
