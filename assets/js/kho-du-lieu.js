/* =========================================================================
   SMARTBEN – KHO DỮ LIỆU TRÊN TRÌNH DUYỆT (localStorage)
   Mỗi danh sách (sản phẩm, tài khoản, tin tức, mã giảm giá, đơn hàng, liên hệ, đánh giá) là một mảng đối tượng,
   lưu chung dưới dạng JSON trong 1 khoá localStorage.
   - Lần đầu mở web: nạp dữ liệu mẫu (assets/js/du-lieu-mau.js).
   - KHO.lay("sanPham")            -> mảng bản ghi
   - KHO.tim("sanPham", id)        -> 1 bản ghi
   - KHO.them("sanPham", doiTuong) -> tự cấp id, lưu lại
   - KHO.sua("sanPham", id, thayDoi), KHO.xoa("sanPham", id)
   - KHO.khoiPhuc()                -> xoá hết, nạp lại dữ liệu mẫu
   Tác giả: Giáp Chí Thanh
   ========================================================================= */
(function () {
  "use strict";

  var KHOA = "smartben_du_lieu_v1";
  var BANG = ["sanPham", "taiKhoan", "tinTuc", "maGiamGia", "donHang", "lienHe", "danhGia"];
  var duLieu = null;

  // Băm mật khẩu đơn giản (cyrb53) kèm "muối" là email -> không lưu mật khẩu dạng chữ thường
  function bamMatKhau(matKhau, email) {
    var str = (email || "").toLowerCase() + "|smartben|" + matKhau;
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "h$" + (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
  }

  function ngayTruoc(soNgay, gio) {
    var d = new Date();
    d.setDate(d.getDate() - (soNgay || 0));
    if (gio) {
      var p = gio.split(":");
      d.setHours(+p[0], +p[1], 0, 0);
    }
    return d.toISOString();
  }

  // ---------- Dựng dữ liệu mẫu ----------
  function taoDuLieuMau() {
    var m = window.SB_DU_LIEU_MAU;
    var db = { sanPham: [], taiKhoan: [], tinTuc: [], maGiamGia: [], donHang: [], lienHe: [], danhGia: [], tiepTheo: {} };

    m.sanPham.forEach(function (s) {
      // Loại máy: iPad -> máy tính bảng; dưới 1 triệu -> điện thoại phổ thông; còn lại -> điện thoại thông minh
      var loai = /ipad/i.test(s.ten) ? "Máy tính bảng" : (s.gia < 1000000 ? "Điện thoại phổ thông" : "Điện thoại thông minh");
      db.sanPham.push({
        id: s.id, ma: s.ma, ten: s.ten, hang: s.hang, loai: loai, gia: s.gia, giaCu: s.giaCu, khuyenMai: s.khuyenMai,
        ton: s.ton, anh: s.anh, anhPhu: [], thongSo: s.thongSo, moTa: s.moTa,
        saoGoc: s.sao, soDanhGiaGoc: s.soDanhGia, conHang: true, ngayTao: ngayTruoc(s.ngayTaoTruoc, "08:00")
      });
    });
    // Ảnh phụ mẫu (thư viện ảnh ở trang chi tiết) cho Oppo F9
    db.sanPham.forEach(function (s) { if (s.ma === "Opp0") s.anhPhu = ["oppo-f9-mau-do-1-org.jpg", "oppo-f9-mau-do-2-org.jpg", "oppo-f9-mau-do-3-org.jpg", "oppo-f9-red-2-400x460.png"]; });

    m.taiKhoan.forEach(function (t) {
      db.taiKhoan.push({
        id: t.id, hoTen: t.hoTen, email: t.email, matKhau: bamMatKhau(t.matKhau, t.email),
        soDienThoai: t.soDienThoai, vaiTro: t.vaiTro, biKhoa: false, ngayDangKy: ngayTruoc(t.ngayTruoc, "09:00")
      });
    });

    m.tinTuc.forEach(function (t) {
      db.tinTuc.push({
        id: t.id, tieuDe: t.tieuDe, tomTat: t.tomTat, noiDung: t.noiDung, anh: t.anh,
        nguoiDang: t.nguoiDang, hienThi: t.hienThi, ngayDang: ngayTruoc(t.ngayTruoc, "08:30")
      });
    });

    m.maGiamGia.forEach(function (x) {
      var homNay = new Date(); homNay.setHours(0, 0, 0, 0);
      function cong(n) { if (n == null) return null; var d = new Date(homNay); d.setDate(d.getDate() + n); return d.toISOString(); }
      db.maGiamGia.push({
        id: x.id, ma: x.ma, moTa: x.moTa, loai: x.loai, giaTri: x.giaTri, donToiThieu: x.donToiThieu,
        giamToiDa: x.giamToiDa, soLuong: x.soLuong, daDung: x.daDung,
        ngayBatDau: cong(x.batDauSau), ngayKetThuc: cong(x.ketThucSau), kichHoat: x.kichHoat, ngayTao: ngayTruoc(30)
      });
    });

    // Đơn hàng mẫu: tính tiền bằng đúng quy tắc của web (nghiep-vu.js nạp sau file này nên tự tính ở đây)
    m.donHang.forEach(function (d, i) {
      var chiTiet = d[11].map(function (x) {
        var sp = db.sanPham.filter(function (s) { return s.id === x[0]; })[0];
        return { sanPhamId: sp.id, ten: sp.ten, anh: sp.anh, hang: sp.hang, donGia: sp.gia, soLuong: x[1] };
      });
      var tamTinh = chiTiet.reduce(function (t, c) { return t + c.donGia * c.soLuong; }, 0);
      var phiShip = tamTinh >= 300000 ? 0 : (d[3].indexOf("Hồ Chí Minh") >= 0 ? 20000 : 35000);
      var giam = 0;
      if (d[10]) {
        var ma = db.maGiamGia.filter(function (x) { return x.ma === d[10]; })[0];
        giam = ma.loai === "PhanTram" ? Math.round(tamTinh * ma.giaTri / 100 / 1000) * 1000 : ma.giaTri;
        if (ma.loai === "PhanTram" && ma.giamToiDa != null) giam = Math.min(giam, ma.giamToiDa);
        if (d[8] !== "Đã hủy") ma.daDung++;
      }
      var ngay = ngayTruoc(d[6], d[7]);
      db.donHang.push({
        id: i + 1, taiKhoanId: d[0], hoTenNguoiNhan: d[1], soDienThoai: d[2], email: "",
        tinhThanh: d[3], phuongXa: d[4], diaChiGiao: d[5], ghiChu: i === 0 ? "Giao giờ hành chính, gọi trước khi giao" : "",
        ngayDat: ngay, ngayCapNhat: d[8] === "Chờ xử lý" ? null : ngay, trangThai: d[8], phuongThuc: d[9],
        daThanhToan: d[8] === "Hoàn thành" || (d[9] === "QR" && d[8] === "Đang giao"),
        tamTinh: tamTinh, phiVanChuyen: phiShip, giamGia: giam, maGiamGiaApDung: d[10], tongTien: tamTinh - giam + phiShip,
        chiTiet: chiTiet
      });
    });

    m.lienHe.forEach(function (l, i) {
      db.lienHe.push({ id: i + 1, hoTen: l.hoTen, email: l.email, soDienThoai: l.soDienThoai, chuDe: l.chuDe, tinNhan: l.tinNhan, ngayGui: ngayTruoc(l.ngayTruoc, "15:00"), daXuLy: l.daXuLy });
    });

    m.danhGia.forEach(function (g, i) {
      db.danhGia.push({ id: i + 1, sanPhamId: g[0], taiKhoanId: g[1], hoTen: g[2], sao: g[3], noiDung: g[4], ngay: ngayTruoc(g[5], "20:00"), hienThi: true });
    });

    BANG.forEach(function (b) {
      db.tiepTheo[b] = db[b].reduce(function (max, x) { return Math.max(max, x.id); }, 0) + 1;
    });
    return db;
  }

  // ---------- Đọc / ghi ----------
  function nap() {
    if (duLieu) return duLieu;
    try {
      var chuoi = localStorage.getItem(KHOA);
      if (chuoi) duLieu = JSON.parse(chuoi);
    } catch (e) { duLieu = null; }
    if (!duLieu || !duLieu.sanPham) {
      duLieu = taoDuLieuMau();
      luu();
    }
    return duLieu;
  }

  function luu() {
    try {
      localStorage.setItem(KHOA, JSON.stringify(duLieu));
      return true;
    } catch (e) {
      // Thường do ảnh tải lên quá lớn làm đầy bộ nhớ trình duyệt (~5 MB)
      alert("Không lưu được dữ liệu: bộ nhớ trình duyệt đã đầy. Hãy dùng ảnh nhỏ hơn hoặc khôi phục dữ liệu mẫu.");
      return false;
    }
  }

  function saoChep(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  window.KHO = {
    bamMatKhau: bamMatKhau,

    lay: function (bang) { return saoChep(nap()[bang]); },

    tim: function (bang, id) {
      id = Number(id);
      return saoChep(nap()[bang].filter(function (x) { return x.id === id; })[0] || null);
    },

    them: function (bang, doiTuong) {
      var db = nap();
      doiTuong.id = db.tiepTheo[bang]++;
      db[bang].push(doiTuong);
      if (!luu()) { db[bang].pop(); db.tiepTheo[bang]--; return null; }
      return saoChep(doiTuong);
    },

    sua: function (bang, id, thayDoi) {
      var db = nap(), ban = db[bang].filter(function (x) { return x.id === Number(id); })[0];
      if (!ban) return null;
      var cu = saoChep(ban);
      Object.keys(thayDoi).forEach(function (k) { ban[k] = thayDoi[k]; });
      if (!luu()) { Object.keys(cu).forEach(function (k) { ban[k] = cu[k]; }); return null; }
      return saoChep(ban);
    },

    xoa: function (bang, id) {
      var db = nap(), truoc = db[bang].length;
      db[bang] = db[bang].filter(function (x) { return x.id !== Number(id); });
      luu();
      return db[bang].length < truoc;
    },

    // Ghi nhiều thay đổi cùng lúc (giống transaction): hàm capNhat sửa trực tiếp trên bản sao,
    // trả về false để huỷ; chỉ khi thành công mới ghi đè dữ liệu thật.
    giaoDich: function (capNhat) {
      var banSao = saoChep(nap());
      var ketQua = capNhat(banSao);
      if (ketQua === false) return false;
      var cu = duLieu;
      duLieu = banSao;
      if (!luu()) { duLieu = cu; return false; }
      return ketQua === undefined ? true : ketQua;
    },

    khoiPhuc: function () {
      duLieu = taoDuLieuMau();
      luu();
      try { localStorage.removeItem("sb_gioHang"); localStorage.removeItem("sb_soSanh"); } catch (e) { }
    }
  };
})();
