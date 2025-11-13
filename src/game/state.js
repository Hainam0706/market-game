import { clamp } from "./utils.js";

/**
 * Khởi tạo trạng thái ban đầu của game
 * @returns {object} - game state (gs)
 */
export function initGameState() {
  const gs = {
    t: 0, // Thời gian trong game (giây)
    result: null, // Trạng thái kết thúc game: "WIN" | "LOSE", null = đang chơi
    resultReason: "", // Lý do thắng/thua, dùng để hiển thị thông báo
    _strikeCount: 0, // Đếm số lần công nhân đình công

    stage: "COMPETITION", // Giai đoạn game: "COMPETITION" = cạnh tranh, "MONOPOLY" = độc quyền
    socialValue: 10, // Giá trị xã hội của sản phẩm (để tính giá thị trường)
    marketPrice: 10, // Giá thị trường hiện tại
    rawPrice: 4, // Giá nguyên liệu cơ bản
    demandMultiplier: 1, // Hệ số điều chỉnh tổng cầu (có thể thay đổi nhờ lobby hoặc policy)

    player: {
      // Thông tin người chơi
      cash: 500, // Tiền mặt hiện tại
      debt: 0, // Nợ hiện tại
      inventory: 0, // Số lượng hàng tồn kho
      individualCost: 10, // Chi phí sản xuất 1 đơn vị (công nghệ hiện tại)
      capacity: 6, // Công suất sản xuất nội địa
      foreignCapacity: 0, // Công suất sản xuất ngoài nước (xuất khẩu)
      wage: 50, // Lương trả cho công nhân
      hours: 8, // Số giờ làm việc mỗi ngày
      cartelMode: false, // Chế độ Cartel (chỉ khi giai đoạn MONOPOLY)
      ownsRawMonopoly: false, // Sở hữu độc quyền nguyên liệu
    },

    // Tạo danh sách NPC (đối thủ) mẫu
    npcs: Array.from({ length: 3 }).map((_, i) => ({
      id: i + 1, // ID duy nhất
      name: `Đối Thủ #${i + 1}`, // Tên hiển thị
      color: ["#a78bfa", "#22d3ee", "#f472b6"][i], // Màu hiển thị trên map/UI
      cost: 8 + i * 0.5, // Chi phí sản xuất cơ bản
      inventory: 0, // Hàng tồn kho ban đầu
      cash: 200, // Tiền mặt ban đầu
      capacity: 5 + i, // Công suất sản xuất
      individualCost: 8 + i * 0.5, // Chi phí sản xuất riêng
      bankrupt: false, // Trạng thái phá sản
      pos: { x: 200 + i * 260, y: 160 + 40 * i }, // Vị trí hiển thị trên map
    })),

    salesWindow: [], // Lịch sử giao dịch: {t, who, qty}, dùng để tính tổng bán hàng
    shares: { playerShare: 0, totalSold: 0 }, // Thị phần người chơi + tổng sản phẩm đã bán
    quests: [
      // Các nhiệm vụ trong game
      {
        id: "q1",
        text: "Sản xuất 100 sản phẩm", // Mục tiêu
        target: 100,
        progress: 0, // Tiến độ hiện tại
        done: false, // Hoàn thành chưa
      },
      {
        id: "q2",
        text: "Bán 100 sản phẩm ở Chợ",
        target: 100,
        progress: 0,
        done: false,
      },
      { id: "q3", text: "Nâng cấp nhà máy ít nhất 1 lần", done: false },
      { id: "q4", text: "Đạt 60% thị phần để bước vào Độc quyền", done: false },
    ],
  };
  return gs; // Trả về trạng thái game khởi tạo
}

/**
 * Tạo snapshot (bản chụp) trạng thái game để render UI
 * @param {object} gs - trạng thái game hiện tại (mutable)
 * @returns {object} - snapshot không mutable
 */
export function snapshot(gs) {
  const win = gs.shares || { playerShare: 0, totalSold: 0 }; // Tránh lỗi nếu gs.shares undefined
  return {
    stage: gs.stage, // Giai đoạn hiện tại
    socialValue: gs.socialValue, // Giá trị xã hội
    marketPrice: gs.marketPrice, // Giá thị trường
    rawPrice: gs.rawPrice, // Giá nguyên liệu
    player: { ...gs.player }, // Sao chép dữ liệu player
    npcs: gs.npcs.map((n) => ({
      // Sao chép danh sách NPC
      id: n.id,
      name: n.name,
      color: n.color,
      cost: n.individualCost ?? n.cost, // Lấy chi phí riêng nếu có
      inv: n.inventory, // Tồn kho
      cash: n.cash,
      bankrupt: n.bankrupt,
      pos: { ...n.pos }, // Vị trí snapshot
    })),
    shares: win, // Thị phần
    quests: gs.quests.map((q) => ({ ...q })), // Sao chép danh sách quests
    result: gs.result, // Trạng thái thắng/thua
    resultReason: gs.resultReason, // Lý do thắng/thua
    t: gs.t, // Thời gian game hiện tại
    _strikeCount: gs.gs_strikeCount, // Số lần đình công (cần sửa: đúng là gs._strikeCount)
  };
}
