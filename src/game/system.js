import { clamp } from "./utils.js";

/**
 * Tính "Giá trị xã hội" (Social Value)
 * Đây là trung bình chi phí sản xuất cá biệt có trọng số theo công suất.
 * Giá trị này phản ánh chi phí trung bình trong toàn bộ nền kinh tế.
 */
export function computeSocialValue(gs) {
  // Tập hợp các tác nhân kinh tế: người chơi + NPC chưa phá sản
  const actors = [
    {
      cost: gs.player.individualCost, // chi phí cá biệt của người chơi
      cap: gs.player.capacity + gs.player.foreignCapacity, // tổng công suất (trong nước + nước ngoài)
    },
    ...gs.npcs
      .filter((n) => !n.bankrupt)
      .map((n) => ({
        cost: n.individualCost ?? 9, // chi phí cá biệt của NPC
        cap: n.capacity ?? 5, // công suất sản xuất của NPC
      })),
  ];

  // Tổng công suất toàn hệ thống
  const totalCap = actors.reduce((s, a) => s + a.cap, 0) || 1;

  // Trung bình chi phí có trọng số công suất
  const avg = actors.reduce((s, a) => s + a.cost * (a.cap / totalCap), 0);

  // Trả về giá trị xã hội (làm tròn 2 chữ số), nằm trong khoảng [2, 30]
  return clamp(+avg.toFixed(2), 2, 30);
}

/**
 * Xác định "Nhu cầu cơ sở" của thị trường
 * Đơn vị: sản phẩm / chu kỳ
 * Phụ thuộc vào biến gs.demandMultiplier (dao động theo khủng hoảng)
 */
export function marketDemandBase(gs) {
  const base = 100 * gs.demandMultiplier;
  return base;
}

/**
 * Bán hàng ra thị trường
 * - Cho phép người chơi hoặc NPC bán hàng
 * - Giá bán có dao động ngẫu nhiên dựa trên giá trị xã hội
 */
export function sellAtMarket(gs, who, qty) {
  if (qty <= 0) return;

  // Giá bán thị trường: nếu có override thì dùng giá đó, nếu không:
  // Giá xã hội * 0.95 + dao động ngẫu nhiên trong khoảng [0, 0.2]
  const price =
    gs.marketPriceOverride ?? gs.socialValue * 0.95 + 0.1 * Math.random() * 2;

  // Lấy đối tượng người bán
  const p =
    who === "player" ? gs.player : gs.npcs.find((n) => `npc-${n.id}` === who);

  if (!p) return;

  // Lượng hàng thực tế có thể bán = min(yêu cầu, tồn kho)
  const amount = Math.min(qty, p.inventory);

  if (amount <= 0) return;

  // Cập nhật tồn kho và tiền mặt
  p.inventory -= amount;
  p.cash = (p.cash || 0) + amount * price;

  // Ghi lại lịch sử bán hàng để tính thị phần
  gs.salesWindow.push({ t: gs.t, who, qty: amount });

  // Tiến trình nhiệm vụ "Bán 100 sản phẩm ở chợ" (q2)
  if (who === "player") progress(gs, "q2", Math.floor(amount));
}

/**
 * Hàm thủ công cho player bán hàng
 */
export function manualSellPlayer(gs, amount) {
  // Chỉ bán tối đa lượng tồn kho
  const amt = Math.min(amount, gs.player.inventory);

  // Gọi sellAtMarket để cập nhật tiền, inventory và tiến trình nhiệm vụ
  sellAtMarket(gs, "player", amt);
}

/**
 * Auto-sell cho NPC
 * - NPC tự động bán dựa trên inventory và sellQty hoặc capacity
 */
export function autoSellNPCs(gs) {
  gs.npcs.forEach((npc) => {
    if (!npc.bankrupt && npc.inventory > 0) {
      const amount = Math.min(npc.inventory, npc.sellQty ?? npc.capacity ?? 5);
      sellAtMarket(gs, `npc-${npc.id}`, amount);
    }
  });
}

/**
 * Hàm mô phỏng sản xuất hàng hóa.
 * - Người chơi hoặc NPC sản xuất dựa vào công suất
 * - Cần nguyên liệu thô (raw materials)
 * - Có thể đình công (strike)
 */
export function produceUnits(gs, who) {
  const actor =
    who === "player" ? gs.player : gs.npcs.find((n) => `npc-${n.id}` === who);

  if (!actor || actor.bankrupt) return;

  if (who === "player" && gs._strike > 0) {
    actor.currentCapacity = 0;
    return;
  }

  const baseCapacity = actor.baseCapacity ?? actor.capacity ?? 5;
  const perTick = baseCapacity * 0.5;
  const rawNeed = perTick * 0.3;
  const rawPrice = gs.rawPriceOverride ?? gs.rawPrice;

  // Tính xem có đủ tiền nguyên liệu không
  const canAffordRatio = Math.min(1, actor.cash / (rawNeed * rawPrice));
  const realOutput = perTick * canAffordRatio;

  // **Cập nhật năng suất thực = số sản phẩm thực tế sản xuất trong tick này**
  actor.currentCapacity = realOutput;

  if (actor.cash >= rawNeed * rawPrice) {
    actor.cash -= rawNeed * rawPrice;
    actor.inventory += realOutput;
    if (who === "player") progress(gs, "q1", Math.floor(realOutput));
  }
}

/**
 * Cập nhật tiền nợ của người chơi
 * - Lãi suất 12%/năm
 * - Tỉ lệ thời gian mô phỏng: 1 phút = 1 năm
 */
export function updateLoans(gs, dt) {
  if (gs.player.debt > 0) {
    const yearly = 0.12; // 12%/năm
    const perSec = yearly / (60 * 60); // quy đổi sang giây
    const interest = gs.player.debt * perSec * (dt * 60);
    gs.player.debt += interest;
  }
}

/**
 * Cập nhật khủng hoảng kinh tế (Economic Cycle)
 * - Dựa trên hàm sin dao động theo thời gian
 * - Ảnh hưởng đến nhu cầu, giá thị trường và giá nguyên liệu
 */
export function updateCrisis(gs, dt) {
  // Dao động tuần hoàn
  const phase = Math.sin((gs.t / 40) * Math.PI * 2);

  // Nhu cầu thị trường dao động 0.75 .. 1.25 lần
  const demandMul = 1 + phase * 0.25;
  gs.demandMultiplier = clamp(demandMul, 0.6, 1.4);

  // Giá thị trường tiến dần về giá trị xã hội
  const target = gs.marketPriceOverride ?? gs.socialValue;
  gs.marketPrice += (target - gs.marketPrice) * 0.05 * (dt * 60);

  // Giá nguyên liệu
  gs.rawPrice +=
    ((gs.player.ownsRawMonopoly ? Math.max(1.2, gs.rawPrice * 0.5) : 4) -
      gs.rawPrice) *
    0.02 *
    (dt * 60);
}

/**
 * Cập nhật NPC
 * - Giảm chi phí cá biệt theo thời gian
 * - Phá sản nếu âm tiền quá mức
 * - Tự sản xuất và tự bán
 */
export function updateNPCs(gs, dt) {
  for (const n of gs.npcs) {
    if (n.bankrupt) continue;

    // Giảm chi phí cá biệt (cải tiến công nghệ)
    n.individualCost = clamp((n.individualCost ?? 9) - 0.002, 5, 12);

    // NPC tự sản xuất
    produceUnits(gs, `npc-${n.id}`);

    // NPC tự bán
    autoSellNPCs(gs);

    // Kiểm tra phá sản
    if ((n.cash ?? 0) < -200) n.bankrupt = true;
  }

  // Tính lại thị phần
  computeShares(gs);
}

/**
 * Dọn dẹp dữ liệu bán hàng cũ hơn 60 giây
 */
export function cleanRollingWindow(gs) {
  const horizon = 60;
  gs.salesWindow = gs.salesWindow.filter((s) => gs.t - s.t <= horizon);
  computeShares(gs);
}

/**
 * Tính thị phần của người chơi
 * - Tổng sản lượng bán của player / tổng sản lượng bán toàn thị trường
 * - >=60% → MONOPOLY
 */
function computeShares(gs) {
  const win = gs.salesWindow;

  // Tổng sản lượng bán của player trong window 60s
  const pSold = win
    .filter((r) => r.who === "player")
    .reduce((s, r) => s + r.qty, 0);

  // Tổng sản lượng bán toàn thị trường (có thể dùng nếu muốn hiển thị thị phần)
  const totalMarket = win.reduce((s, r) => s + r.qty, 0);

  gs.shares = {
    playerShare: totalMarket ? pSold / totalMarket : 0, // % thị phần
    totalSold: pSold, // Chỉ số lượng player bán
  };

  // MONOPOLY nếu player chiếm >=60% thị phần
  if (gs.stage !== "MONOPOLY" && gs.shares.playerShare >= 0.6) {
    gs.stage = "MONOPOLY";
    const q = gs.quests.find((q) => q.id === "q4");
    if (q) q.done = true;
  }
}

// Hàm rỗng để tương thích
export function maybeEnterMonopoly() {}

/**
 * Tính chỉ số bóc lột dựa trên lý thuyết Marxist
 * @param {number} wage - lương trả cho 1 giờ lao động
 * @param {number} hours - tổng giờ làm việc mỗi ngày
 * @param {number} essentialHours - giờ lao động tất yếu (tối thiểu để trả lương)
 * @returns {number} - tỷ suất giá trị thặng dư (m')
 */
export function computeExploitationIndex(hours, essentialHours) {
  const surplusHours = Math.max(0, hours - essentialHours); // giờ thặng dư
  const necessaryHours = Math.min(hours, essentialHours); // giờ tất yếu

  // Tỷ suất giá trị thặng dư
  return necessaryHours > 0 ? surplusHours / necessaryHours : 0;
}

/**
 * Cập nhật tiến trình nhiệm vụ (Quest Progress)
 */
function progress(gs, id, delta) {
  const q = gs.quests.find((q) => q.id === id);
  if (!q || q.done) return;
  q.progress = (q.progress || 0) + delta;
  if (q.target && q.progress >= q.target) q.done = true;
}
