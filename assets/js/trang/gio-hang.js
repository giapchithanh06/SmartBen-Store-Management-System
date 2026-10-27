/* Giỏ hàng: đổi số lượng (tối đa 5 máy / sản phẩm, kiểm tra tồn kho), xoá, tạm tính, tiến độ miễn phí ship */
(function () {
  "use strict";
  var esc = GD.esc, C = SB.CAU_HINH;
  var khung = document.getElementById("noiDungGio");

  if (SB.TaiKhoan.hienTai()) document.getElementById("nutXemDon").hidden = false;

  function ve() {
    var dong = SB.GioHang.lay();
    GD.capNhatSoGio();
    if (!dong.length) {
      khung.innerHTML = GD.theRong("fa-shopping-cart", "Giỏ hàng đang trống", "Chọn chiếc điện thoại phù hợp với bạn nhé.",
        '<a class="sb-btn sb-btn-grad mt-2" href="cua-hang.html">Đi tới cửa hàng</a>');
      return;
    }
    var tamTinh = SB.GioHang.tamTinh(dong);
    var tongMay = dong.reduce(function (t, x) { return t + x.soLuong; }, 0);
    var tietKiem = dong.reduce(function (t, x) { return t + (x.giaCu ? (x.giaCu - x.gia) * x.soLuong : 0); }, 0);
    var conThieu = Math.max(0, C.MIEN_PHI_TU - tamTinh);
    var phanTram = Math.min(100, Math.floor(tamTinh * 100 / C.MIEN_PHI_TU));

    var htmlDong = dong.map(function (x) {
      var url = "san-pham.html?id=" + x.sanPhamId;
      return '<div class="sb-cart-item" data-id="' + x.sanPhamId + '">' +
        '<a class="sb-cart-thumb" href="' + url + '"><img src="' + GD.anhSP(x.anh) + '" alt="' + esc(x.ten) + '" onerror="GD.anhLoi(this)" /></a>' +
        '<div class="sb-cart-info"><h4><a href="' + url + '" style="color: inherit;">' + esc(x.ten) + '</a></h4>' +
        '<div class="meta">' + esc(x.hang) + " · " + SB.tien(x.gia) + " " + (x.giaCu ? '<span class="sb-old-price">' + SB.tien(x.giaCu) + "</span>" : "") + "</div>" +
        '<div class="sb-price mt-1">' + SB.tien(x.thanhTien) + "</div></div>" +
        '<div class="sb-cart-side"><div class="sb-qty" data-qty><button type="button" data-step="-1" aria-label="Giảm 1">−</button>' +
        '<input type="number" value="' + x.soLuong + '" min="0" max="' + SB.CAU_HINH.TOI_DA_MOI_LAN + '" aria-label="Số lượng ' + esc(x.ten) + '" />' +
        '<button type="button" data-step="1" aria-label="Tăng 1">+</button></div>' +
        '<button type="button" class="sb-btn sb-btn-danger sb-btn-sm" data-xoa="' + x.sanPhamId + '"><i class="fas fa-trash-alt"></i> Xoá</button></div></div>';
    }).join("");

    khung.innerHTML =
      '<div class="sb-checkout"><section class="sb-card sb-card-pad"><div class="sb-box-head"><h3>' + dong.length + " sản phẩm · " + tongMay + ' máy</h3>' +
      '<span class="sb-pill ok"><i class="fas fa-shipping-fast"></i> Miễn phí ship từ ' + SB.tien(C.MIEN_PHI_TU) + "</span></div>" + htmlDong + "</section>" +
      '<aside class="sb-card sb-card-pad sb-sticky"><div class="sb-box-head"><h3>Tổng đơn hàng</h3><span class="sb-box-icon"><i class="fas fa-receipt"></i></span></div>' +
      '<div class="sb-sum-row"><span>Tạm tính (' + tongMay + ' máy)</span><span>' + SB.tien(tamTinh) + "</span></div>" +
      (tietKiem > 0 ? '<div class="sb-sum-row giam"><span>Đã tiết kiệm nhờ giá sale</span><span>-' + SB.tien(tietKiem) + "</span></div>" : "") +
      '<div class="sb-sum-total"><span class="font-weight-bold">Tổng tạm tính</span><strong>' + SB.tien(tamTinh) + "</strong></div>" +
      '<div class="sb-freeship mt-3">' + (conThieu > 0
        ? '<span><i class="fas fa-truck"></i> Mua thêm <b>' + SB.tien(conThieu) + "</b> để được miễn phí giao hàng</span>"
        : '<span><i class="fas fa-check-circle"></i> Đơn của bạn được <b>miễn phí giao hàng</b></span>') +
      '<div class="bar"><span style="width: ' + phanTram + '%;"></span></div></div>' +
      '<div class="sb-note-box mt-3"><i class="fas fa-info-circle"></i> Phí vận chuyển và mã giảm giá được tính ở bước thanh toán.</div>' +
      '<a class="sb-btn sb-btn-grad sb-btn-lg sb-btn-block mt-3" href="thanh-toan.html">Thanh toán ngay <i class="fas fa-arrow-right"></i></a>' +
      '<a class="sb-btn sb-btn-soft sb-btn-block mt-2" href="cua-hang.html"><i class="fas fa-plus"></i> Mua thêm sản phẩm</a></aside></div>';

    GD.initQty(khung, function (box, soLuong) {
      var id = +box.closest(".sb-cart-item").getAttribute("data-id");
      if (soLuong <= 0 && !confirm("Xoá sản phẩm này khỏi giỏ hàng?")) { ve(); return; }
      var kq = SB.GioHang.capNhat(id, soLuong);
      if (kq.thongBao) GD.toast(kq.thongBao, "loi");
      ve();
    });
    GD.$all("[data-xoa]", khung).forEach(function (b) {
      b.addEventListener("click", function () {
        var ten = b.closest(".sb-cart-item").querySelector("h4").textContent;
        if (!confirm("Xoá " + ten + " khỏi giỏ hàng?")) return;
        SB.GioHang.xoa(+b.getAttribute("data-xoa"));
        ve();
      });
    });
  }
  ve();
})();
