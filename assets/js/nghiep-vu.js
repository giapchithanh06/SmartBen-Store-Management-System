/* =========================================================================
   SMARTBEN – NGHIỆP VỤ (sản phẩm, giỏ hàng, phí ship, mã giảm giá, đơn hàng, tài khoản,
   đánh giá, yêu thích, so sánh)
   Mọi trang khách và trang quản trị đều gọi các hàm ở đây để dùng chung một quy tắc.
   Tác giả: Giáp Chí Thanh
   ========================================================================= */
(function () {
  "use strict";

  // ===================== CẤU HÌNH =====================
  var CAU_HINH = {
    MIEN_PHI_TU: 300000,        // đơn từ 300.000đ miễn phí giao hàng toàn quốc
    PHI_NOI_THANH: 20000,       // giao trong TP. Hồ Chí Minh
    PHI_TINH_KHAC: 35000,       // các tỉnh/thành khác
    TINH_NOI_THANH: "Hồ Chí Minh",
    SO_NGAY_HANG_MOI: 30,       // sản phẩm thêm trong 30 ngày có nhãn "Mới"
    NGUONG_SAP_HET: 5,          // tồn kho <= 5 máy là sắp hết
    TOI_DA_MOI_LAN: 5,          // mỗi sản phẩm tối đa 5 máy / đơn
    TOI_DA_SO_SANH: 3,          // so sánh tối đa 3 sản phẩm
    HOTLINE: "1800 6868",
    QR_MA_NGAN_HANG: "970422",
    QR_TEN_NGAN_HANG: "MB Bank",
    QR_SO_TAI_KHOAN: "0123456789",
    QR_TEN_TAI_KHOAN: "SMARTBEN SHOP",
    QR_SO_PHUT: 15,             // giữ đơn chờ chuyển khoản 15 phút
    TAC_GIA: "Giáp Chí Thanh"
  };

  var TRANG_THAI = { CHO: "Chờ xử lý", GIAO: "Đang giao", XONG: "Hoàn thành", HUY: "Đã hủy" };
  TRANG_THAI.TAT_CA = [TRANG_THAI.CHO, TRANG_THAI.GIAO, TRANG_THAI.XONG, TRANG_THAI.HUY];

  // ===================== ĐỊNH DẠNG =====================
  function tien(v) { return Math.round(Number(v) || 0).toLocaleString("vi-VN") + "đ"; }
  function so(v) { return Math.round(Number(v) || 0).toLocaleString("vi-VN"); }
  function hai(n) { return String(n).padStart(2, "0"); }
  function ngay(iso) { if (!iso) return ""; var d = new Date(iso); return hai(d.getDate()) + "/" + hai(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function gio(iso) { if (!iso) return ""; var d = new Date(iso); return hai(d.getHours()) + ":" + hai(d.getMinutes()); }
  function ngayGio(iso) { return iso ? gio(iso) + " " + ngay(iso) : ""; }
  function maDon(id) { return "SB" + String(id).padStart(5, "0"); }
  function maSanPham(id) { return "SP" + String(id).padStart(4, "0"); }
  function boDau(s) { return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }

  // ===================== SẢN PHẨM =====================
  var SanPham = {
    dangGiam: function (sp) { return sp.giaCu != null && sp.giaCu > sp.gia; },
    phanTramGiam: function (sp) { return SanPham.dangGiam(sp) ? Math.round((sp.giaCu - sp.gia) * 100 / sp.giaCu) : 0; },
    laHangMoi: function (sp) { return sp.khuyenMai === "moiramat" || (Date.now() - new Date(sp.ngayTao).getTime()) / 86400000 <= CAU_HINH.SO_NGAY_HANG_MOI; },
    traGop0: function (sp) { return sp.khuyenMai === "tragop"; },
    // Nhãn khuyến mãi hiện trên thẻ sản phẩm
    nhanKhuyenMai: function (sp) {
      switch (sp.khuyenMai) {
        case "giamgia": return SanPham.dangGiam(sp) ? { lop: "giam", chu: "Giảm " + tien(sp.giaCu - sp.gia) } : null;
        case "giareonline": return { lop: "online", chu: "Giá rẻ online" };
        case "tragop": return { lop: "tragop", chu: "Trả góp 0%" };
        case "moiramat": return { lop: "moi", chu: "Mới ra mắt" };
        default: return null;
      }
    },
    TEN_KHUYEN_MAI: { giamgia: "Đang giảm giá", giareonline: "Giá rẻ online", tragop: "Trả góp 0%", moiramat: "Mới ra mắt" },
    // Điểm đánh giá = điểm gốc + các đánh giá khách viết trên web (chỉ tính đánh giá đang hiện)
    diemDanhGia: function (sp, dsDanhGia) {
      var ds = (Array.isArray(dsDanhGia) ? dsDanhGia : KHO.lay("danhGia")).filter(function (g) { return g.sanPhamId === sp.id && g.hienThi; });
      var tong = (sp.saoGoc || 0) * (sp.soDanhGiaGoc || 0) + ds.reduce(function (t, g) { return t + g.sao; }, 0);
      var so = (sp.soDanhGiaGoc || 0) + ds.length;
      return { sao: so ? tong / so : 0, so: so };
    },
    dangBan: function () { return KHO.lay("sanPham").filter(function (s) { return s.conHang; }); },
    // Số máy đã bán (không tính đơn đã huỷ)
    daBan: function () {
      var kq = {};
      KHO.lay("donHang").forEach(function (d) {
        if (d.trangThai === TRANG_THAI.HUY) return;
        d.chiTiet.forEach(function (c) { kq[c.sanPhamId] = (kq[c.sanPhamId] || 0) + c.soLuong; });
      });
      return kq;
    },
    timKiem: function (ds, tuKhoa) {
      var k = boDau(tuKhoa).trim();
      if (!k) return ds;
      return ds.filter(function (s) { return boDau(s.ten + " " + s.hang + " " + s.loai + " " + (s.ma || "")).indexOf(k) >= 0; });
    },
    danhSachLoai: function () {
      var loai = {};
      KHO.lay("sanPham").forEach(function (s) { loai[s.loai] = true; });
      return Object.keys(loai).sort();
    },
    danhSachHang: function () {
      var hang = {};
      KHO.lay("sanPham").forEach(function (s) { hang[s.hang] = true; });
      return Object.keys(hang).sort();
    },
    // RAM dạng số (GB) để lọc; máy phổ thông ghi MB thì coi là 0
    ramGB: function (sp) { var r = (sp.thongSo && sp.thongSo.ram) || ""; var m = r.match(/([\d.]+)\s*GB/i); return m ? parseFloat(m[1]) : 0; }
  };

  // ===================== GIỎ HÀNG (localStorage) =====================
  var KHOA_GIO = "sb_gioHang";
  var GioHang = {
    docTho: function () {
      try { return JSON.parse(localStorage.getItem(KHOA_GIO)) || []; } catch (e) { return []; }
    },
    ghi: function (ds) { try { localStorage.setItem(KHOA_GIO, JSON.stringify(ds)); } catch (e) { } },
    // Giỏ đầy đủ: ghép thông tin sản phẩm mới nhất (giá, ảnh) vào từng dòng
    lay: function () {
      var dong = [];
      GioHang.docTho().forEach(function (x) {
        var sp = KHO.tim("sanPham", x.sanPhamId);
        if (sp) dong.push({ sanPhamId: sp.id, ten: sp.ten, anh: sp.anh, hang: sp.hang, gia: sp.gia, giaCu: SanPham.dangGiam(sp) ? sp.giaCu : null, soLuong: x.soLuong, thanhTien: sp.gia * x.soLuong, sanPham: sp });
      });
      return dong;
    },
    tongSoLuong: function () { return GioHang.docTho().reduce(function (t, x) { return t + x.soLuong; }, 0); },
    tamTinh: function (dong) { return (dong || GioHang.lay()).reduce(function (t, x) { return t + x.thanhTien; }, 0); },

    // Trả về { ok, thongBao }
    them: function (sanPhamId, soLuong) {
      soLuong = parseInt(soLuong, 10);
      if (!(soLuong >= 1)) return { ok: false, thongBao: "Số lượng phải lớn hơn 0." };
      var sp = KHO.tim("sanPham", sanPhamId);
      if (!sp || !sp.conHang) return { ok: false, thongBao: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh." };
      var ds = GioHang.docTho(), dong = ds.filter(function (x) { return x.sanPhamId === sp.id; })[0];
      var daCo = dong ? dong.soLuong : 0;
      if (soLuong + daCo > CAU_HINH.TOI_DA_MOI_LAN) {
        return { ok: false, thongBao: "Mỗi đơn mua tối đa " + CAU_HINH.TOI_DA_MOI_LAN + " máy " + sp.ten + (daCo > 0 ? " (giỏ hàng của bạn đã có " + daCo + ")." : ".") };
      }
      if (sp.ton < soLuong + daCo) {
        return { ok: false, thongBao: "Rất tiếc, " + sp.ten + " chỉ còn " + sp.ton + " máy trong kho" + (daCo > 0 ? " (giỏ hàng của bạn đã có " + daCo + ")." : ".") };
      }
      if (dong) dong.soLuong += soLuong; else ds.push({ sanPhamId: sp.id, soLuong: soLuong });
      GioHang.ghi(ds);
      return { ok: true, thongBao: "Đã thêm " + soLuong + " × " + sp.ten + " vào giỏ hàng!" };
    },

    capNhat: function (sanPhamId, soLuong) {
      soLuong = parseInt(soLuong, 10) || 0;
      var ds = GioHang.docTho(), thongBao = null;
      if (soLuong > 0) {
        var sp = KHO.tim("sanPham", sanPhamId);
        if (!sp || !sp.conHang || sp.ton === 0) {
          GioHang.ghi(ds.filter(function (x) { return x.sanPhamId !== Number(sanPhamId); }));
          return { ok: false, thongBao: "Sản phẩm đã hết hàng hoặc ngừng kinh doanh nên đã được xoá khỏi giỏ." };
        }
        if (soLuong > CAU_HINH.TOI_DA_MOI_LAN) {
          thongBao = "Mỗi đơn mua tối đa " + CAU_HINH.TOI_DA_MOI_LAN + " máy " + sp.ten + ".";
          soLuong = CAU_HINH.TOI_DA_MOI_LAN;
        }
        if (soLuong > sp.ton) {
          thongBao = sp.ten + " chỉ còn " + sp.ton + " máy, số lượng đã được điều chỉnh về " + sp.ton + ".";
          soLuong = sp.ton;
        }
      }
      ds = ds.map(function (x) { if (x.sanPhamId === Number(sanPhamId)) x.soLuong = soLuong; return x; })
             .filter(function (x) { return x.soLuong > 0; });
      GioHang.ghi(ds);
      return { ok: !thongBao, thongBao: thongBao };
    },

    xoa: function (sanPhamId) { GioHang.ghi(GioHang.docTho().filter(function (x) { return x.sanPhamId !== Number(sanPhamId); })); },
    xoaHet: function () { GioHang.ghi([]); },

    // Kiểm tra lại giỏ trước khi thanh toán: trả về thông báo lỗi hoặc null
    kiemTra: function () {
      var dong = GioHang.lay();
      if (!dong.length) return "Giỏ hàng của bạn đang trống.";
      for (var i = 0; i < dong.length; i++) {
        var sp = dong[i].sanPham;
        if (!sp.conHang || sp.ton < dong[i].soLuong) {
          return "Sản phẩm " + sp.ten + " không còn đủ hàng (còn " + sp.ton + " máy). Vui lòng cập nhật giỏ hàng.";
        }
      }
      return null;
    }
  };

  // ===================== PHÍ VẬN CHUYỂN =====================
  function laNoiThanh(tinh) { return !!tinh && tinh.toLowerCase().indexOf(CAU_HINH.TINH_NOI_THANH.toLowerCase()) >= 0; }
  function tinhPhiShip(tamTinh, tinh) {
    if (tamTinh >= CAU_HINH.MIEN_PHI_TU) return 0;
    return laNoiThanh(tinh) ? CAU_HINH.PHI_NOI_THANH : CAU_HINH.PHI_TINH_KHAC;
  }

  // ===================== MÃ GIẢM GIÁ =====================
  var MaGiamGia = {
    chuanHoa: function (ma) { return (ma || "").trim().toUpperCase(); },
    tim: function (ma) {
      ma = MaGiamGia.chuanHoa(ma);
      return ma ? (KHO.lay("maGiamGia").filter(function (x) { return x.ma === ma; })[0] || null) : null;
    },
    hetLuot: function (m) { return m.soLuong != null && m.daDung >= m.soLuong; },
    hetHan: function (m) { if (!m.ngayKetThuc) return false; var h = new Date(); h.setHours(0, 0, 0, 0); return new Date(m.ngayKetThuc) < h; },
    chuaToiNgay: function (m) { if (!m.ngayBatDau) return false; var h = new Date(); h.setHours(0, 0, 0, 0); return new Date(m.ngayBatDau) > h; },
    dungDuoc: function (m) { return m.kichHoat && !MaGiamGia.hetLuot(m) && !MaGiamGia.hetHan(m) && !MaGiamGia.chuaToiNgay(m); },
    moTaGiaTri: function (m) {
      return m.loai === "PhanTram"
        ? "Giảm " + m.giaTri + "%" + (m.giamToiDa != null ? " (tối đa " + tien(m.giamToiDa) + ")" : "")
        : "Giảm " + tien(m.giaTri);
    },
    // Lý do không dùng được, hoặc null nếu dùng được
    kiemTra: function (m, tamTinh) {
      if (!m) return "Mã giảm giá không tồn tại.";
      if (!m.kichHoat) return "Mã giảm giá đã ngừng áp dụng.";
      if (MaGiamGia.chuaToiNgay(m)) return "Mã giảm giá áp dụng từ ngày " + ngay(m.ngayBatDau) + ".";
      if (MaGiamGia.hetHan(m)) return "Mã giảm giá đã hết hạn.";
      if (MaGiamGia.hetLuot(m)) return "Mã giảm giá đã hết lượt sử dụng.";
      if (tamTinh < m.donToiThieu) return "Đơn hàng cần tối thiểu " + tien(m.donToiThieu) + " để dùng mã này (còn thiếu " + tien(m.donToiThieu - tamTinh) + ").";
      return null;
    },
    soTienGiam: function (m, tamTinh) {
      var giam = m.loai === "PhanTram" ? Math.round(tamTinh * m.giaTri / 100 / 1000) * 1000 : m.giaTri; // làm tròn nghìn đồng
      if (m.loai === "PhanTram" && m.giamToiDa != null && giam > m.giamToiDa) giam = m.giamToiDa;
      return Math.min(giam, tamTinh);
    },
    goiY: function () {
      return KHO.lay("maGiamGia").filter(MaGiamGia.dungDuoc).sort(function (a, b) { return a.donToiThieu - b.donToiThieu; });
    }
  };

  // ===================== TÍNH TIỀN 1 ĐƠN =====================
  function tinhTien(tamTinh, tinh, maNhap) {
    var kq = { tamTinh: tamTinh, chuaChonTinh: !tinh, coNhapMa: MaGiamGia.chuanHoa(maNhap).length > 0, giamGia: 0, maApDung: null, thongBaoMa: "" };
    kq.phiVanChuyen = kq.chuaChonTinh && tamTinh < CAU_HINH.MIEN_PHI_TU ? 0 : tinhPhiShip(tamTinh, tinh);
    kq.conThieuMienPhiShip = Math.max(0, CAU_HINH.MIEN_PHI_TU - tamTinh);
    if (kq.coNhapMa) {
      var m = MaGiamGia.tim(maNhap), loi = MaGiamGia.kiemTra(m, tamTinh);
      if (!loi) {
        kq.maApDung = m;
        kq.giamGia = MaGiamGia.soTienGiam(m, tamTinh);
        kq.thongBaoMa = "Đã áp dụng mã " + m.ma + ": " + MaGiamGia.moTaGiaTri(m) + ".";
      } else {
        kq.thongBaoMa = loi;
      }
    }
    kq.tongTien = Math.max(0, kq.tamTinh - kq.giamGia + kq.phiVanChuyen);
    return kq;
  }

  // ===================== TÀI KHOẢN & PHIÊN ĐĂNG NHẬP =====================
  var KHOA_PHIEN = "sb_phien", KHOA_GHI_NHO = "sb_ghiNho";
  var TaiKhoan = {
    hienTai: function () {
      var id = null;
      try {
        var p = JSON.parse(sessionStorage.getItem(KHOA_PHIEN) || "null");
        if (p) id = p.id;
        if (!id) {
          var g = JSON.parse(localStorage.getItem(KHOA_GHI_NHO) || "null");
          if (g && g.hetHan > Date.now()) { id = g.id; sessionStorage.setItem(KHOA_PHIEN, JSON.stringify({ id: id })); }
          else if (g) localStorage.removeItem(KHOA_GHI_NHO);
        }
      } catch (e) { }
      if (!id) return null;
      var tk = KHO.tim("taiKhoan", id);
      if (tk && tk.biKhoa) { TaiKhoan.dangXuat(); return null; }   // tài khoản bị khoá thì tự đăng xuất
      if (tk) delete tk.matKhau;
      return tk;
    },
    laAdmin: function () { var tk = TaiKhoan.hienTai(); return !!tk && tk.vaiTro === "Admin"; },
    timTheoEmail: function (email) {
      email = (email || "").trim().toLowerCase();
      return KHO.lay("taiKhoan").filter(function (t) { return t.email.toLowerCase() === email; })[0] || null;
    },
    dangNhap: function (email, matKhau, ghiNho) {
      var tk = TaiKhoan.timTheoEmail(email);
      if (!tk || tk.matKhau !== KHO.bamMatKhau(matKhau, tk.email)) return { ok: false, thongBao: "Email hoặc mật khẩu không đúng." };
      if (tk.biKhoa) return { ok: false, thongBao: "Tài khoản đã bị khoá. Vui lòng liên hệ SmartBen để được hỗ trợ." };
      try {
        sessionStorage.setItem(KHOA_PHIEN, JSON.stringify({ id: tk.id }));
        if (ghiNho) localStorage.setItem(KHOA_GHI_NHO, JSON.stringify({ id: tk.id, hetHan: Date.now() + 30 * 86400000 }));
      } catch (e) { }
      return { ok: true, taiKhoan: tk };
    },
    dangKy: function (duLieu) {
      if (TaiKhoan.timTheoEmail(duLieu.email)) return { ok: false, truong: "email", thongBao: "Email này đã được đăng ký." };
      var email = duLieu.email.trim();
      var tk = KHO.them("taiKhoan", {
        hoTen: duLieu.hoTen.trim(), email: email, matKhau: KHO.bamMatKhau(duLieu.matKhau, email),
        soDienThoai: (duLieu.soDienThoai || "").trim(), vaiTro: "KhachHang", biKhoa: false, ngayDangKy: new Date().toISOString()
      });
      if (!tk) return { ok: false, thongBao: "Không lưu được tài khoản." };
      TaiKhoan.dangNhap(email, duLieu.matKhau, false);
      return { ok: true, taiKhoan: tk };
    },
    dangXuat: function () {
      try { sessionStorage.removeItem(KHOA_PHIEN); localStorage.removeItem(KHOA_GHI_NHO); } catch (e) { }
      GioHang.xoaHet();
    },
    capNhatThongTin: function (id, hoTen, soDienThoai) {
      return KHO.sua("taiKhoan", id, { hoTen: hoTen.trim(), soDienThoai: (soDienThoai || "").trim() });
    },
    // Đổi mật khẩu: trả về thông báo lỗi hoặc null
    doiMatKhau: function (id, matKhauCu, matKhauMoi) {
      var tk = KHO.tim("taiKhoan", id);
      if (!tk || tk.matKhau !== KHO.bamMatKhau(matKhauCu, tk.email)) return "Mật khẩu hiện tại không đúng.";
      if (matKhauCu === matKhauMoi) return "Mật khẩu mới phải khác mật khẩu cũ.";
      KHO.sua("taiKhoan", id, { matKhau: KHO.bamMatKhau(matKhauMoi, tk.email) });
      return null;
    }
  };

  // ===================== ĐÁNH GIÁ SẢN PHẨM =====================
  var DanhGia = {
    cuaSanPham: function (sanPhamId) {
      return KHO.lay("danhGia").filter(function (g) { return g.sanPhamId === Number(sanPhamId) && g.hienThi; })
        .sort(function (a, b) { return new Date(b.ngay) - new Date(a.ngay); });
    },
    // Khách đã mua và nhận máy (đơn Hoàn thành) mới được đánh giá; mỗi người 1 lần / sản phẩm
    kiemTraQuyen: function (sanPhamId) {
      var tk = TaiKhoan.hienTai();
      if (!tk) return "Vui lòng đăng nhập để viết đánh giá.";
      var daMua = KHO.lay("donHang").some(function (d) {
        return d.taiKhoanId === tk.id && d.trangThai === TRANG_THAI.XONG && d.chiTiet.some(function (c) { return c.sanPhamId === Number(sanPhamId); });
      });
      if (!daMua && tk.vaiTro !== "Admin") return "Chỉ khách đã mua và nhận sản phẩm này mới viết được đánh giá.";
      if (KHO.lay("danhGia").some(function (g) { return g.sanPhamId === Number(sanPhamId) && g.taiKhoanId === tk.id; })) return "Bạn đã đánh giá sản phẩm này rồi.";
      return null;
    },
    them: function (sanPhamId, sao, noiDung) {
      var loi = DanhGia.kiemTraQuyen(sanPhamId);
      if (loi) return { ok: false, thongBao: loi };
      var tk = TaiKhoan.hienTai();
      var g = KHO.them("danhGia", { sanPhamId: Number(sanPhamId), taiKhoanId: tk.id, hoTen: tk.hoTen, sao: Number(sao), noiDung: noiDung.trim(), ngay: new Date().toISOString(), hienThi: true });
      return g ? { ok: true } : { ok: false, thongBao: "Không lưu được đánh giá." };
    }
  };

  // ===================== YÊU THÍCH & SO SÁNH (lưu trên trình duyệt) =====================
  function danhSachLuu(khoa) {
    return {
      lay: function () { try { return JSON.parse(localStorage.getItem(khoa)) || []; } catch (e) { return []; } },
      ghi: function (ds) { try { localStorage.setItem(khoa, JSON.stringify(ds)); } catch (e) { } },
      co: function (id) { return this.lay().indexOf(Number(id)) >= 0; }
    };
  }
  var YeuThich = danhSachLuu("sb_yeuThich");
  YeuThich.batTat = function (id) {
    var ds = YeuThich.lay(), i = ds.indexOf(Number(id));
    if (i >= 0) ds.splice(i, 1); else ds.push(Number(id));
    YeuThich.ghi(ds);
    return i < 0; // true = vừa thêm
  };
  var SoSanh = danhSachLuu("sb_soSanh");
  SoSanh.batTat = function (id) {
    var ds = SoSanh.lay(), i = ds.indexOf(Number(id));
    if (i >= 0) { ds.splice(i, 1); SoSanh.ghi(ds); return { ok: true, them: false }; }
    if (ds.length >= CAU_HINH.TOI_DA_SO_SANH) return { ok: false, thongBao: "Chỉ so sánh tối đa " + CAU_HINH.TOI_DA_SO_SANH + " sản phẩm. Bỏ bớt một máy rồi thêm lại nhé." };
    ds.push(Number(id)); SoSanh.ghi(ds);
    return { ok: true, them: true };
  };

  // ===================== ĐƠN HÀNG =====================
  var DonHang = {
    tiepTheo: function (hienTai) {
      if (hienTai === TRANG_THAI.CHO) return [TRANG_THAI.GIAO, TRANG_THAI.HUY];
      if (hienTai === TRANG_THAI.GIAO) return [TRANG_THAI.XONG, TRANG_THAI.HUY];
      return [];
    },
    diaChiDayDu: function (d) { return [d.diaChiGiao, d.phuongXa, d.tinhThanh].filter(Boolean).join(", "); },
    noiDungChuyenKhoan: function (d) { return "SMARTBEN " + maDon(d.id); },
    tenPhuongThuc: function (d) { return d.phuongThuc === "QR" ? "Chuyển khoản QR" : "Thanh toán khi nhận hàng (COD)"; },
    linkQR: function (d) {
      return "https://img.vietqr.io/image/" + CAU_HINH.QR_MA_NGAN_HANG + "-" + CAU_HINH.QR_SO_TAI_KHOAN + "-compact2.png?amount=" +
        Math.round(d.tongTien) + "&addInfo=" + encodeURIComponent(DonHang.noiDungChuyenKhoan(d)) + "&accountName=" + encodeURIComponent(CAU_HINH.QR_TEN_TAI_KHOAN);
    },
    cuaToi: function (taiKhoanId) {
      return KHO.lay("donHang").filter(function (d) { return d.taiKhoanId === taiKhoanId; })
        .sort(function (a, b) { return new Date(b.ngayDat) - new Date(a.ngayDat); });
    },

    // Đặt hàng: trừ kho, tăng lượt mã, lưu đơn trong 1 giao dịch. Trả về { ok, donHang | thongBao, truong }
    datHang: function (form) {
      var loiGio = GioHang.kiemTra();
      if (loiGio) return { ok: false, veGio: true, thongBao: loiGio };
      var dong = GioHang.lay(), tamTinh = GioHang.tamTinh(dong);
      var kq = tinhTien(tamTinh, form.tinhThanh, form.maGiamGia);
      if (kq.coNhapMa && !kq.maApDung) return { ok: false, truong: "maGiamGia", thongBao: kq.thongBaoMa };
      var tk = TaiKhoan.hienTai();
      var donMoi = null;

      var ok = KHO.giaoDich(function (db) {
        for (var i = 0; i < dong.length; i++) {
          var sp = db.sanPham.filter(function (s) { return s.id === dong[i].sanPhamId; })[0];
          if (!sp || !sp.conHang || sp.ton < dong[i].soLuong) { donMoi = { loi: "Rất tiếc, sản phẩm " + dong[i].ten + " vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng." }; return false; }
          sp.ton -= dong[i].soLuong;
        }
        if (kq.maApDung) {
          var m = db.maGiamGia.filter(function (x) { return x.id === kq.maApDung.id; })[0];
          if (!m || !MaGiamGia.dungDuoc(m)) { donMoi = { loi: "Mã giảm giá vừa hết lượt sử dụng.", truong: "maGiamGia" }; return false; }
          m.daDung++;
        }
        donMoi = {
          id: db.tiepTheo.donHang++, taiKhoanId: tk ? tk.id : null,
          hoTenNguoiNhan: form.hoTenNguoiNhan.trim(), soDienThoai: form.soDienThoai.trim(), email: (form.email || "").trim(),
          tinhThanh: form.tinhThanh, phuongXa: form.phuongXa, diaChiGiao: form.diaChiGiao.trim(), ghiChu: (form.ghiChu || "").trim(),
          ngayDat: new Date().toISOString(), ngayCapNhat: null, trangThai: TRANG_THAI.CHO,
          phuongThuc: form.phuongThuc === "QR" ? "QR" : "COD", daThanhToan: false,
          tamTinh: kq.tamTinh, phiVanChuyen: kq.phiVanChuyen, giamGia: kq.giamGia,
          maGiamGiaApDung: kq.maApDung ? kq.maApDung.ma : null, tongTien: kq.tongTien,
          chiTiet: dong.map(function (x) { return { sanPhamId: x.sanPhamId, ten: x.ten, anh: x.anh, hang: x.hang, donGia: x.gia, soLuong: x.soLuong }; })
        };
        db.donHang.push(donMoi);
      });
      if (!ok) return { ok: false, veGio: !donMoi || !donMoi.truong, truong: donMoi && donMoi.truong, thongBao: (donMoi && donMoi.loi) || "Không lưu được đơn hàng." };
      GioHang.xoaHet();
      // Đơn của khách vãng lai: nhớ id để xem lại trang thành công / chi tiết trên máy này
      try {
        var cuaKhach = JSON.parse(localStorage.getItem("sb_donVangLai") || "[]");
        cuaKhach.push(donMoi.id);
        localStorage.setItem("sb_donVangLai", JSON.stringify(cuaKhach.slice(-20)));
      } catch (e) { }
      return { ok: true, donHang: donMoi };
    },

    // Người đang xem có quyền xem đơn này không (chủ đơn, admin, hoặc khách vãng lai vừa đặt trên máy này)
    coQuyenXem: function (d) {
      var tk = TaiKhoan.hienTai();
      if (tk && (tk.vaiTro === "Admin" || d.taiKhoanId === tk.id)) return true;
      if (d.taiKhoanId == null) {
        try { return JSON.parse(localStorage.getItem("sb_donVangLai") || "[]").indexOf(d.id) >= 0; } catch (e) { }
      }
      return false;
    },

    // Huỷ đơn: cộng lại kho, hoàn lượt mã. Trả về thông báo lỗi hoặc null
    huy: function (id) {
      var loi = null;
      KHO.giaoDich(function (db) {
        var d = db.donHang.filter(function (x) { return x.id === Number(id); })[0];
        if (!d) { loi = "Không tìm thấy đơn hàng."; return false; }
        if (d.trangThai !== TRANG_THAI.CHO && d.trangThai !== TRANG_THAI.GIAO) { loi = "Đơn đang ở trạng thái \"" + d.trangThai + "\" nên không huỷ được."; return false; }
        d.chiTiet.forEach(function (c) {
          var sp = db.sanPham.filter(function (s) { return s.id === c.sanPhamId; })[0];
          if (sp) sp.ton += c.soLuong;
        });
        if (d.maGiamGiaApDung) {
          var m = db.maGiamGia.filter(function (x) { return x.ma === d.maGiamGiaApDung; })[0];
          if (m && m.daDung > 0) m.daDung--;
        }
        d.trangThai = TRANG_THAI.HUY;
        d.ngayCapNhat = new Date().toISOString();
      });
      return loi;
    },

    // Admin đổi trạng thái theo quy trình Chờ xử lý -> Đang giao -> Hoàn thành
    doiTrangThai: function (id, moi) {
      var d = KHO.tim("donHang", id);
      if (!d) return "Không tìm thấy đơn hàng.";
      if (DonHang.tiepTheo(d.trangThai).indexOf(moi) < 0) return "Không thể chuyển đơn từ \"" + d.trangThai + "\" sang \"" + moi + "\".";
      if (moi === TRANG_THAI.HUY) return DonHang.huy(id);
      var thayDoi = { trangThai: moi, ngayCapNhat: new Date().toISOString() };
      if (moi === TRANG_THAI.XONG && d.phuongThuc === "COD") thayDoi.daThanhToan = true; // shipper đã thu tiền
      KHO.sua("donHang", id, thayDoi);
      return null;
    }
  };

  window.SB = {
    CAU_HINH: CAU_HINH, TRANG_THAI: TRANG_THAI,
    tien: tien, so: so, ngay: ngay, gio: gio, ngayGio: ngayGio, maDon: maDon, maSanPham: maSanPham, boDau: boDau,
    SanPham: SanPham, GioHang: GioHang, MaGiamGia: MaGiamGia, TaiKhoan: TaiKhoan, DonHang: DonHang,
    DanhGia: DanhGia, YeuThich: YeuThich, SoSanh: SoSanh,
    tinhPhiShip: tinhPhiShip, tinhTien: tinhTien
  };
})();
