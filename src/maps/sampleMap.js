// Map tile nâng cấp cho mô phỏng trực quan
// 1 = cỏ, 2 = vật cản/nhà, 3 = đường, 4 = nước
export function buildSampleMap() {
  // Kích thước ô (pixel) và kích thước lưới (số ô)
  const tileSize = 32; // mỗi ô có kích thước 32x32 pixel
  const width = 80; // số ô theo chiều ngang
  const height = 48; // số ô theo chiều dọc

  // Các layer lưu map theo dạng 1D array (row-major): index = y * width + x
  // ground: loại ô hiển thị dưới cùng (cỏ, đường, nước, ...)
  // collision: thông tin va chạm (0 = đi được, 2 = vật cản)
  // decor: đồ trang trí nằm trên ground nhưng dưới nhân vật (ví dụ hoa, bụi cỏ)
  // above: layer hiển thị trên nhân vật (ví dụ cây cao che khuất)
  const ground = new Array(width * height).fill(1); // mặc định là 'cỏ' (1)
  const collision = new Array(width * height).fill(0); // mặc định không va chạm (0)
  const decor = new Array(width * height).fill(0);
  const above = new Array(width * height).fill(0);

  // Helper để chuyển tọa độ 2D (tx, ty) -> chỉ số 1D trong mảng
  const idx = (tx, ty) => ty * width + tx;

  // Hàm clamp để giới hạn giá trị vào trong khoảng [lo, hi]
  // Lưu ý: trong code gốc hi = width/height (không phải width-1)
  // điều đó có nghĩa ex/ey được dùng như exclusive bound (vòng for dùng < ey)
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // Hàm tiện: điền một hình chữ nhật lên layer nào đó
  // layer: mảng 1D (ground/collision/...)
  // tx, ty: toạ độ ô bắt đầu (topleft)
  // tw, th: chiều rộng/chiều cao theo ô (số ô)
  // val: giá trị gán cho từng ô trong vùng
  function fillRect(layer, tx, ty, tw, th, val) {
    // chuyển tọa độ & kích thước sang biên an toàn (không vượt ra ngoài map)
    // sx, sy là toạ độ bắt đầu đã clamp; ex, ey là bound exclusive (đừng gán khi == ex)
    const sx = clamp(tx, 0, width);
    const sy = clamp(ty, 0, height);
    const ex = clamp(tx + tw, 0, width);
    const ey = clamp(ty + th, 0, height);

    // Gán từng ô trong vùng [sx, ex) x [sy, ey)
    for (let y = sy; y < ey; y++)
      for (let x = sx; x < ex; x++) layer[idx(x, y)] = val;
  }

  // -------------------------
  // TẠO BIÊN (viền bản đồ)
  // -------------------------
  // Dùng layer collision để đặt rào biên quanh map (vật cản không đi qua được)
  // Giá trị 2 được dùng cho vật cản trong layer collision.
  fillRect(collision, 0, 0, width, 1, 2); // hàng trên cùng
  fillRect(collision, 0, height - 1, width, 1, 2); // hàng dưới cùng
  fillRect(collision, 0, 0, 1, height, 2); // cột trái
  fillRect(collision, width - 1, 0, 1, height, 2); // cột phải

  // -------------------------
  // TẠO ĐƯỜNG CHỮ THẬP (trục chính)
  // -------------------------
  // crossY và crossX là hàng / cột ở giữa map
  const crossY = Math.floor(height / 2);
  const crossX = Math.floor(width / 2);

  // Vẽ một dải đường ngang dày 4 ô cắt ngang bản đồ
  fillRect(ground, 0, crossY - 2, width, 4, 3);

  // Vẽ một dải đường dọc dày 4 ô cắt dọc bản đồ
  fillRect(ground, crossX - 2, 0, 4, height, 3);

  // Vẽ một quảng trường nhỏ (kết hợp 2 dải đường mở rộng)
  fillRect(ground, crossX - 5, crossY - 4, 10, 8, 3); // quảng trường (giá trị 3 = đường)

  // -------------------------
  // AO (nước)
  // -------------------------
  // Vẽ một hồ ở góc trên trái (giá trị 4 = nước)
  fillRect(ground, 6, 4, 10, 7, 4);

  // -------------------------
  // ĐỊNH NGUYÊN VÙNG (zones) CHỨC NĂNG
  // -------------------------
  // Z chứa các khu chức năng: industrial, marketplace, raw, bank, bulletin, hq
  // Mỗi vùng có tọa độ theo ô: x,y,w,h (tính bằng số ô)
  const Z = {
    industrial: { x: 6, y: 10, w: 18, h: 10 },
    marketplace: { x: 30, y: 8, w: 16, h: 9 },
    raw: { x: 54, y: 10, w: 18, h: 10 },
    bank: { x: 8, y: 31, w: 16, h: 9 },
    hq: { x: 54, y: 31, w: 18, h: 10 },
  };

  // -------------------------
  // VẼ NHÀ (vật cản) CHO CÁC ZONE
  // -------------------------
  // Đối với mỗi zone: đánh dấu region là vật cản trên layer collision.
  // Đồng thời vẽ "mái chìa" (một hàng trên cùng) bằng cách fill một hàng nằm ngay trên z.y
  // (ý tưởng: tạo mép mái nhô ra ra một ô phía trên).
  //
  // Ghi chú: cả fillRect cho collision và "mái" đều dùng cùng giá trị 2 (vật cản).
  Object.values(Z).forEach((z) => {
    fillRect(collision, z.x, z.y, z.w, z.h, 2); // phần chính của tòa nhà
    fillRect(collision, z.x, z.y - 1, z.w, 1, 2); // mái chìa (một hàng trên)
  });

  // -------------------------
  // TẠO LỐI VÀO TỪ ĐƯỜNG CHÍNH (doorToRoad)
  // -------------------------
  // Ý tưởng: cho mỗi zone, mở một "hành lang" đường đi nối từ cạnh giữa zone đến đường chéo (crossY).
  // Nếu zone nằm phía trên trục ngang (z.y + z.h < crossY) thì vẽ đường từ đáy zone tới crossY.
  // Nếu zone nằm phía dưới, vẽ đường từ crossY tới đỉnh zone.
  //
  // Hàm doorToRoad dùng center x của zone (doorX) và vẽ dải đường 2 ô rộng dọc theo hướng đúng.
  function doorToRoad(z) {
    const doorX = Math.floor(z.x + z.w / 2); // lấy cột giữa của zone
    if (z.y + z.h < crossY)
      // zone nằm trên trục => vẽ đường từ đáy zone xuống crossY
      fillRect(ground, doorX - 1, z.y + z.h, 2, crossY - (z.y + z.h), 3);
    // zone nằm dưới trục => vẽ đường từ crossY lên đến đỉnh zone
    else fillRect(ground, doorX - 1, crossY, 2, z.y - crossY, 3);
  }
  Object.values(Z).forEach(doorToRoad);

  // -------------------------
  // TIỂU CẢNH PHỤ (decor/góc)
  // -------------------------
  // Thêm hai cụm vật cản ở góc dưới trái và góc dưới phải (có thể là cây, bụi, nhà nhỏ...)
  fillRect(collision, 2, height - 8, 10, 6, 2);
  fillRect(collision, width - 14, height - 8, 12, 6, 2);

  // -------------------------
  // CHUYỂN ZONE SANG PIXEL COORDS (dùng cho UI/proximity checks)
  // -------------------------
  // zones dùng để lưu khu vực dưới dạng px (dễ tổng hợp cho hiển thị hoặc phát hiện chạm)
  const zones = Object.entries(Z).map(([key, t]) => ({
    key,
    x: t.x * tileSize, // toạ độ pixel
    y: t.y * tileSize,
    w: t.w * tileSize,
    h: t.h * tileSize,
  }));

  // -------------------------
  // PORTALS (cửa ra/đi sang map khác)
  // -------------------------
  // Mảng portals định nghĩa các vùng khi player chạm sẽ chuyển target map
  const portals = [
    {
      target: "newland",
      x: (width - 3) * tileSize, // đặt portal sát bên phải bản đồ
      y: (crossY - 2) * tileSize,
      w: 2 * tileSize,
      h: 4 * tileSize,
    },
  ];

  // -------------------------
  // SPAWN POINTS (vị trí xuất hiện player)
  // -------------------------
  // spawn.player dùng pixel coords (ở giữa giao lộ trung tâm)
  const spawn = { player: { x: crossX * tileSize, y: crossY * tileSize } };

  // Trả về đối tượng map hoàn chỉnh
  return {
    width,
    height,
    tileSize,
    layers: { ground, collision, decor, above },
    zones,
    portals,
    spawn,
  };
}
