import React, { useEffect, useRef, useState } from "react";
import Panel from "./components/Panel.jsx";
import Row from "./components/widgets/Row.jsx";
import Gauge from "./components/widgets/Gauge.jsx";
import TileWorld from "./components/TileWorld.jsx";

import { initGameState, snapshot } from "./game/state.js";
import { clamp } from "./game/utils.js";
import {
  computeSocialValue,
  marketDemandBase,
  sellAtMarket,
  produceUnits,
  updateLoans,
  updateCrisis,
  updateNPCs,
  cleanRollingWindow,
  maybeEnterMonopoly,
  computeExploitationIndex,
} from "./game/system.js";
import MiniExploitationGauge from "./components/MiniExploitationGauge.jsx";

export default function App() {
  const gsRef = useRef(initGameState());
  const [ui, setUI] = useState({ openPanel: null });
  const [snap, setSnap] = useState(() => snapshot(gsRef.current));
  const rafRef = useRef(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const showTutorialRef = useRef(showTutorial);

  // ===== Game loop =====
  // useEffect chạy 1 lần khi component mount -> khởi động game loop bằng requestAnimationFrame
  useEffect(() => {
    let last = performance.now(); // thời điểm frame trước đó (ms)
    let acc = 0; // accumulator để gom dt thành nhịp "kinh tế" mỗi 1s (hoặc ở code là 0.25s cho snapshot)

    const loop = (now) => {
      const dt = (now - last) / 1000; // delta time tính bằng giây
      last = now;

      step(gsRef.current, dt); // cập nhật trạng thái game theo dt

      acc += dt;
      // mỗi 0.25s lưu snapshot lên React để render UI (giảm số lần setState mỗi frame)
      if (acc >= 0.25) {
        setSnap(snapshot(gsRef.current));
        acc = 0;
      }
      rafRef.current = requestAnimationFrame(loop); // tiếp tục vòng lặp
    };

    rafRef.current = requestAnimationFrame(loop); // khởi động lần đầu
    return () => cancelAnimationFrame(rafRef.current); // cleanup khi unmount
  }, []);

  // ESC để đóng panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setUI((u) => ({ ...u, openPanel: null }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    showTutorialRef.current = showTutorial;
  }, [showTutorial]);

  // ===== Win/Lose checker (chỉ thắng khi 100% thị phần + không còn đối thủ) =====
  // Tính toán net worth (giá trị ròng) của player — dùng để kiểm tra / debug / hiển thị
  function netWorth(gs) {
    return (
      gs.player.cash + gs.player.inventory * gs.socialValue - gs.player.debt
    );
  }

  // checkWinLose: cập nhật gs.result nếu thỏa điều kiện WIN/LOSE
  // gs: game state (mutable object), dt: delta time (không dùng nhiều ở đây nhưng truyền vào để mở rộng)
  function checkWinLose(gs, dt) {
    // WIN: khi player kiểm soát >=99.9% + tất cả NPC bị bankrupt
    const fullShare = gs.shares.playerShare >= 0.999; // ~100%
    const noCompetitors = gs.npcs.every((n) => n.bankrupt);

    if ((!gs.result && fullShare) || noCompetitors) {
      gs.result = "WIN";
      gs.resultReason = "Bạn đã thâu tóm 100% thị trường.";
    }

    // LOSE: phá sản hoặc quá nhiều lần đình công
    if (!gs.result) {
      const strikeLose = (gs._strikeCount || 0) >= 2;
      if (strikeLose) {
        gs.result = "LOSE";
        gs.resultReason = "Khủng hoảng lao động.";
      }
    }
  }

  // step: một tick cập nhật trạng thái (cả continuous và discrete logic)
  // ==================== step() ====================
  function step(gs, dt) {
    if (showTutorialRef.current) return;
    if (gs.result) return;

    gs.t += dt;
    updateCrisis(gs, dt);
    gs.socialValue = computeSocialValue(gs);

    gs._econAcc = (gs._econAcc || 0) + dt;

    if (gs._econAcc >= 1) {
      const steps = Math.floor(gs._econAcc);
      gs._econAcc -= steps;

      for (let i = 0; i < steps; i++) {
        produceUnits(gs, "player");
        gs.npcs.forEach((n) => produceUnits(gs, `npc-${n.id}`));

        // Bán hàng cho NPC
        const demand = marketDemandBase(gs) / 10;
        const sellers = gs.npcs
          .filter((n) => !n.bankrupt)
          .map((n) => ({
            key: `npc-${n.id}`,
            inv: n.inventory,
            score: 1 / (n.individualCost + 0.001),
          }));
        const totalScore =
          sellers.reduce((s, sll) => s + (sll.inv > 0 ? sll.score : 0), 0) || 1;

        for (const sll of sellers) {
          if (sll.inv <= 0) continue;
          const share = sll.score / totalScore;
          const qty = Math.min(sll.inv, demand * share);
          sellAtMarket(gs, sll.key, qty);
        }

        // Đình công nếu chỉ số bóc lột cao
        const ex = computeExploitationIndex(
          gs.player.hours,
          gs.player.essentialHours
        );

        if (ex > 3 && (!gs._strike || gs._strike <= 0)) {
          gs._strike = 10; // bật strike
          gs._strikeCount = (gs._strikeCount || 0) + 1;
          gs.toast =
            "Công nhân đình công! Hãy tăng lương/giảm giờ hoặc đàm phán.";

          // Cập nhật snapshot để React render nút và toast
          setSnap(snapshot(gs));
        }

        // Giảm strike từng tick, không giảm ngay khi mới set
        if (gs._strike && gs._strike > 0 && ex <= 3) {
          gs._strike -= 1;
          setSnap(snapshot(gs));
        }

        updateLoans(gs, 1);
        updateNPCs(gs, 1);
        cleanRollingWindow(gs);
        maybeEnterMonopoly(gs);

        if (gs.toast && Math.random() < 0.15) gs.toast = null;

        checkWinLose(gs, 1);
        if (gs.result) break;
      }
    } else {
      checkWinLose(gs, dt);
    }
  }

  // ===== Actions =====
  // Một số hàm hành động do người chơi gọi (mutates gsRef.current rồi set snapshot)

  // guardEnded: trả về true nếu game đã kết thúc, dùng để chặn hành động thêm
  function guardEnded() {
    return !!gsRef.current.result;
  }

  // spend: cố gắng chi tiền — nếu đủ tiền thì trừ và trả true, ngược lại show toast và trả false
  function spend(cost, label = "") {
    const gs = gsRef.current;
    if (guardEnded()) return false;
    if (gs.player.cash >= cost) {
      gs.player.cash -= cost;
      if (label) gs.toast = `Đã chi ${cost} đ cho ${label}`;
      setSnap(snapshot(gs));
      return true;
    }
    gs.toast = "Không đủ tiền!";
    setSnap(snapshot(gs));
    return false;
  }

  // upgradeFactory: nếu chưa tối ưu, tiêu tiền nâng cấp giảm individualCost và tăng capacity
  function upgradeFactory() {
    const gs = gsRef.current;
    if (guardEnded()) return;

    // Nếu đã đạt tối ưu
    if ((gs.player.essentialHours ?? 6) <= 2) {
      gs.toast = "Đã đạt mức tối ưu của công nghệ hiện tại.";
      setSnap(snapshot(gs));
      return;
    }

    if (!spend(400, "nâng cấp nhà máy")) return;

    // Nâng cấp
    const newCost = Math.max(5, gs.player.individualCost - 0.5);
    const newEssential = Math.max(2, (gs.player.essentialHours ?? 6) - 0.5);
    const didUpgrade =
      newCost < gs.player.individualCost ||
      newEssential < (gs.player.essentialHours ?? 6);

    gs.player.individualCost = newCost;
    gs.player.capacity += 10;
    gs.player.essentialHours = newEssential;

    if (!didUpgrade) {
      gs.toast = "Đã đạt mức tối ưu của công nghệ hiện tại.";
    } else {
      gs.toast = `Nâng cấp thành công! Công suất +10, chi phí giảm 0.5, thời gian tất yếu giảm 0.5 giờ.`;
    }

    const q3 = gs.quests.find((q) => q.id === "q3");
    if (q3 && !q3.done) q3.done = true;

    setSnap(snapshot(gs));
  }

  // borrow: vay tiền (tăng cash và debt)
  function borrow(amount) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    gs.player.cash += amount;
    gs.player.debt += amount;
    gs.toast = `Vay thêm ${amount} đ từ Ngân hàng`;
    setSnap(snapshot(gs));
  }

  // repay: trả nợ (giảm cash và debt), giới hạn bằng cash và debt hiện tại
  function repay(amount) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    amount = Math.min(amount, gs.player.cash, gs.player.debt);
    if (amount <= 0) return;
    gs.player.cash -= amount;
    gs.player.debt -= amount;
    gs.toast = `Đã trả nợ ${amount} đ`;
    setSnap(snapshot(gs));
  }

  // negotiateStrike: đàm phán để giảm độ nghiêm trọng đình công
  function negotiateStrike() {
    const gs = gsRef.current;
    if (guardEnded()) return;

    if (gs._strike && gs._strike > 0) {
      gs._strike = Math.max(0, gs._strike - 5);

      // Tự động điều chỉnh giờ làm để chỉ số bóc lột ≤ 3
      const maxEx = 3;
      if (gs.player.hours / gs.player.essentialHours > maxEx) {
        gs.player.hours = maxEx * gs.player.essentialHours;
      }

      // Toast riêng để không bị step ghi đè
      gs.toastNegotiate =
        "Đã đàm phán, đình công hạ nhiệt. Giờ làm đã được điều chỉnh!";

      setSnap(snapshot(gs));
    }
  }

  function changeEssentialHours(val) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    gs.player.essentialHours = clamp(val, 1, 8); // giới hạn hợp lý
    setSnap(snapshot(gs));
  }

  // changeHours: thay đổi giờ làm việc (clamp 4..16)
  function changeHours(val) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    gs.player.hours = clamp(val, 1, 12);
    setSnap(snapshot(gs));
  }

  // cartelToggle: bật/tắt chế độ cartel khi đang ở stage MONOPOLY
  // sẽ override marketPrice để đẩy giá lên khi cartel bật
  function cartelToggle() {
    const gs = gsRef.current;
    if (guardEnded()) return;
    if (gs.stage !== "MONOPOLY") return;
    gs.player.cartelMode = !gs.player.cartelMode;
    gs.marketPriceOverride = gs.player.cartelMode
      ? Math.max(gs.socialValue * 1.3, gs.socialValue + 2)
      : null;
    gs.toast = gs.player.cartelMode
      ? "Thiết lập Cartel: giá bị đẩy lên!"
      : "Rời Cartel: giá về mức xã hội.";
    setSnap(snapshot(gs));
  }

  // trustTakeover: mua chặn, biến tất cả đối thủ thành bankrupt nếu đủ tiền
  function trustTakeover() {
    const gs = gsRef.current;
    if (guardEnded()) return;
    if (gs.stage !== "MONOPOLY") return;
    const alive = gs.npcs.filter((n) => !n.bankrupt);
    const cost = alive.reduce((s, n) => s + Math.max(150, n.capacity * 30), 0);
    if (spend(cost, "thôn tính đối thủ (Trust)")) {
      alive.forEach((n) => (n.bankrupt = true));
      gs.marketPriceOverride = Math.max(
        gs.socialValue * 1.6,
        gs.socialValue + 4
      );
      gs.toast = "Bạn đã trở thành Trust!";
      setSnap(snapshot(gs));
    }
  }

  // exportCapital: đầu tư ra nước ngoài tăng foreignCapacity
  function exportCapital() {
    const gs = gsRef.current;
    if (guardEnded()) return;
    if (gs.stage !== "MONOPOLY") return;
    if (spend(250, "đầu tư ra Vùng Đất Mới")) {
      gs.player.foreignCapacity += 10;
      gs.toast = "Đầu tư ra nước ngoài thành công!";
      setSnap(snapshot(gs));
    }
  }

  // lobbyGovernment: vận động hành lang tạm thời tăng demandMultiplier và marketPrice
  // sau 60s revert lại (setTimeout)
  function lobbyGovernment() {
    const gs = gsRef.current;
    if (guardEnded()) return;
    if (gs.stage !== "MONOPOLY") return;
    if (spend(200, "vận động hành lang")) {
      gs.demandMultiplier *= 1.1;
      gs.marketPriceOverride = Math.max(
        gs.marketPriceOverride ?? gs.socialValue,
        gs.socialValue * 1.25
      );
      gs.toast = "Chính phủ ban hành luật có lợi! (tạm thời)";
      setTimeout(() => {
        const gs2 = gsRef.current;
        gs2.demandMultiplier /= 1.1;
        if (gs2.stage === "MONOPOLY") gs2.marketPriceOverride = null;
      }, 60000); // 60s
      setSnap(snapshot(gs));
    }
  }

  // sellInventory: player bán inventory ra thị trường
  function sellInventory(amount) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    const amt = Math.min(amount, gs.player.inventory);
    sellAtMarket(gs, "player", amt);
    setSnap(snapshot(gs));
  }

  // setMonopolyPrice: thiết lập giá khi ở MONOPOLY (bảo đảm nằm trong bounds)
  function setMonopolyPrice(p) {
    const gs = gsRef.current;
    if (guardEnded()) return;
    if (gs.stage !== "MONOPOLY") return;
    gs.marketPriceOverride = clamp(p, gs.socialValue * 1.05, 50);
    setSnap(snapshot(gs));
  }

  // restartGame: khởi tạo lại toàn bộ trạng thái game
  function restartGame() {
    gsRef.current = initGameState();
    setUI({ openPanel: null });
    setSnap(snapshot(gsRef.current));
  }

  // Utility UI helpers
  const isEnded = !!gsRef.current.result;
  const disStyle = (cond) =>
    cond ? { opacity: 0.5, cursor: "not-allowed" } : undefined;

  function TutorialPopup({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn">
        <div className="bg-slate-800 text-slate-100 rounded-xl p-6 w-96 shadow-2xl border-2 border-slate-600 relative">
          {/* Header với biểu tượng */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
              🎮
            </div>
            <h2 className="text-2xl font-bold">Hướng dẫn chơi</h2>
          </div>

          {/* Nội dung hướng dẫn */}
          <ul className="list-disc ml-6 space-y-2 text-sm">
            <li>
              Di chuyển: <span className="text-blue-400">W/A/S/D</span> hoặc
              phím mũi tên
            </li>
            <li>
              Nhấp vào các khu vực trên bản đồ để xem thông tin và tương tác
            </li>
            <li>
              Quản lý <span className="text-yellow-400">giờ làm</span> và{" "}
              <span className="text-green-400">lương</span> để tránh đình công
            </li>
            <li>
              Mở rộng nhà máy, đầu tư, và thâu tóm thị trường để{" "}
              <span className="text-red-400">chiếm lĩnh</span> thị phần
            </li>
          </ul>

          {/* Button đóng popup */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-white shadow-md transition-colors"
          >
            Bắt đầu chơi
          </button>

          {/* Hiệu ứng trang trí */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/20 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none animate-pulse"></div>
        </div>
      </div>
    );
  }

  // ===== Render =====
  return (
    <>
      {showTutorial && <TutorialPopup onClose={() => setShowTutorial(false)} />}
      <div className="min-h-screen grid grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
        {/* Cột trái (map + panels) */}
        <div className="col-span-12 lg:col-span-9 min-w-0 flex flex-col">
          {/* HUD Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3 z-10">
            <span className="hud-chip">
              Giá trị xã hội: {snap.socialValue.toFixed(2)} đ
            </span>
            <span className="hud-chip">
              Giá thị trường: {snap.marketPrice.toFixed(2)} đ
            </span>
            <span className="hud-chip">
              Giá nguyên liệu: {snap.rawPrice.toFixed(2)} đ
            </span>
            {gsRef.current._strike > 0 && (
              <span className="hud-chip hud-chip-danger">⛔ Đình công</span>
            )}
            {/* Thị phần hiện tại (mục tiêu: 100%) */}
            <span className="hud-chip">
              Thị phần (60s):{" "}
              {(gsRef.current.shares.playerShare * 100).toFixed(1)}%
            </span>
          </div>

          {/* Canvas (responsive) */}
          <div className="relative overflow-hidden rounded-2xl">
            <TileWorld
              gsRef={gsRef}
              onInteract={(name) => setUI({ ...ui, openPanel: name })}
              onPortal={(id) => {
                if (isEnded) return;
                gsRef.current.toast = `Đã vào cổng: ${id} (demo)`;
                setTimeout(() => {
                  gsRef.current.toast = null;
                }, 2000);
              }}
            />
          </div>

          {/* Panels phía dưới canvas */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
            {ui.openPanel === "industrial" && (
              <Panel
                title="Khu Sản Xuất — Nâng cấp & Lao động"
                onClose={() => setUI({ ...ui, openPanel: null })}
              >
                <Row label="Giờ lao động tất yếu">
                  <span className="ml-2 w-16 inline-block">
                    {(snap.player.essentialHours ?? 6).toFixed(1)}
                  </span>
                </Row>
                <Row label="Năng suất lao động trong nước">
                  {(snap.player.currentCapacity ?? 0).toFixed(1)}/s
                </Row>
                <div className="flex gap-2 mt-2">
                  {(() => {
                    const cantUpgrade =
                      isEnded ||
                      snap.player.individualCost <= 5 ||
                      snap.player.cash < 200;
                    return (
                      <button
                        className="btn"
                        onClick={upgradeFactory}
                        disabled={cantUpgrade}
                        style={disStyle(cantUpgrade)}
                      >
                        Nâng cấp tư liệu sản xuất: 400 đ
                      </button>
                    );
                  })()}
                </div>
                <hr className="my-3 border-slate-700" />

                <Row label="Giờ làm / ngày">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={snap.player.hours}
                    onChange={(e) => changeHours(parseFloat(e.target.value))}
                    disabled={isEnded}
                  />
                  <span className="ml-2 w-16 inline-block">
                    {snap.player.hours.toFixed(0)}
                  </span>
                </Row>

                <Row label="Lương / công nhân">
                  <span
                    value={snap.player.wage ?? 50} // Dùng ?? 5 để dự phòng
                    disabled={isEnded}
                  />
                  <span className="ml-2 w-16 inline-block">
                    {(snap.player.wage ?? 5).toFixed(1)}
                  </span>
                </Row>

                <Row label="Tỷ suất giá trị thăng dư">
                  <MiniExploitationGauge
                    value={computeExploitationIndex(
                      snap.player.hours,
                      snap.player.essentialHours ?? 6
                    )}
                    max={5}
                  />
                </Row>
                {snap.stage === "MONOPOLY" && (
                  <>
                    <hr className="my-3 border-slate-700" />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="btn"
                        onClick={trustTakeover}
                        disabled={isEnded}
                        style={disStyle(isEnded)}
                      >
                        Thôn tính đối thủ
                      </button>
                    </div>
                  </>
                )}
                <div className="mt-2">
                  <button
                    className="btn-outline"
                    onClick={negotiateStrike}
                    disabled={!gsRef.current._strike || isEnded}
                    style={disStyle(!gsRef.current._strike || isEnded)}
                  >
                    Đàm phán
                  </button>

                  {/* Hiển thị toast */}
                  {snap.player.toast && (
                    <div className="toast">{snap.player.toast}</div>
                  )}
                  {snap.player.toastNegotiate && (
                    <div className="toast">{snap.player.toastNegotiate}</div>
                  )}
                </div>
              </Panel>
            )}

            {ui.openPanel === "marketplace" && (
              <Panel
                title="Khu Chợ — Bán hàng & Giá"
                onClose={() => setUI({ ...ui, openPanel: null })}
              >
                <Row label="Giá thị trường hiện tại">
                  {snap.marketPrice.toFixed(2)} đ
                </Row>
                <Row label="Tồn kho của bạn">
                  {snap.player.inventory.toFixed(0)} sp
                </Row>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn"
                    onClick={() => sellInventory(10)}
                    disabled={isEnded || snap.player.inventory < 10}
                    style={disStyle(isEnded || snap.player.inventory < 10)}
                  >
                    Bán nhanh 10sp
                  </button>
                  <button
                    className="btn"
                    onClick={() => sellInventory(50)}
                    disabled={isEnded || snap.player.inventory < 50}
                    style={disStyle(isEnded || snap.player.inventory < 50)}
                  >
                    Bán nhanh 50sp
                  </button>
                </div>
                {snap.stage === "MONOPOLY" && (
                  <>
                    <hr className="my-3 border-slate-700" />
                  </>
                )}
                <hr className="my-3 border-slate-700" />
                <div>
                  <h4 className="font-semibold mb-2">
                    Giá bán của đối thủ (tham khảo)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {snap.npcs
                      .filter((n) => !n.bankrupt)
                      .map((n) => (
                        <div
                          key={n.id}
                          className="p-2 rounded border border-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: n.color }}
                            />
                            <div className="font-medium">{n.name}</div>
                          </div>
                          <div className="text-sm">
                            Giá niêm yết: {snap.marketPrice.toFixed(2)} đ
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Panel>
            )}

            {ui.openPanel === "raw" && (
              <Panel
                title="Khu Nguyên Liệu — Mua đầu vào"
                onClose={() => setUI({ ...ui, openPanel: null })}
              >
                <Row label="Giá nguyên liệu hiện tại">
                  {snap.rawPrice.toFixed(2)} đ
                </Row>
                {snap.stage === "MONOPOLY" && snap.player.ownsRawMonopoly && (
                  <Row label="Giá mua bị bạn ép xuống">
                    {snap.rawPrice.toFixed(2)} đ
                  </Row>
                )}
                <p className="opacity-80 text-sm">
                  Nguyên liệu được mua tự động khi sản xuất, dựa trên tiền mặt
                  sẵn có.
                </p>
              </Panel>
            )}

            {ui.openPanel === "bank" && (
              <Panel
                title="Ngân Hàng — Vay & Trả"
                onClose={() => setUI({ ...ui, openPanel: null })}
              >
                <Row label="Tiền mặt">{snap.player.cash.toFixed(0)} đ</Row>
                <Row label="Dư nợ">{snap.player.debt.toFixed(0)} đ</Row>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn"
                    onClick={() => borrow(200)}
                    disabled={isEnded}
                    style={disStyle(isEnded)}
                  >
                    Vay 200 đ
                  </button>
                  <button
                    className="btn"
                    onClick={() => borrow(500)}
                    disabled={isEnded}
                    style={disStyle(isEnded)}
                  >
                    Vay 500 đ
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => repay(200)}
                    disabled={
                      isEnded || snap.player.debt <= 0 || snap.player.cash < 200
                    }
                    style={disStyle(
                      isEnded || snap.player.debt <= 0 || snap.player.cash < 200
                    )}
                  >
                    Trả 200 đ
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => repay(999999)}
                    disabled={isEnded || snap.player.debt <= 0}
                    style={disStyle(isEnded || snap.player.debt <= 0)}
                  >
                    Trả hết
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                  Lãi suất: 12%/năm (tính theo phút thực).
                </p>
              </Panel>
            )}

            {/* {ui.openPanel === "hq" && snap.stage === "MONOPOLY" && (
              <Panel
                title="Trụ Sở / Chính Phủ — Công cụ độc quyền"
                onClose={() => setUI({ ...ui, openPanel: null })}
              >
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn"
                    onClick={() =>
                      setMonopolyPrice(
                        (snap.marketPrice || snap.socialValue) + 1
                      )
                    }
                    disabled={isEnded}
                    style={disStyle(isEnded)}
                  >
                    Tăng giá độc quyền +1
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      gsRef.current.marketPriceOverride = null;
                      setSnap(snapshot(gsRef.current));
                    }}
                    disabled={isEnded || !gsRef.current.marketPriceOverride}
                    style={disStyle(
                      isEnded || !gsRef.current.marketPriceOverride
                    )}
                  >
                    Bỏ áp đặt giá
                  </button>
                </div>
              </Panel>
            )} */}
          </div>
        </div>

        {/* Cột phải (sidebar) */}
        <div className="col-span-12 lg:col-span-3 min-w-0">
          <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/40 space-y-2">
            <h3 className="text-xl font-semibold">Bảng Điều Khiển</h3>
            <Row label="Giai đoạn">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/50">
                {snap.stage === "COMPETITION" ? "Cạnh tranh" : "Độc quyền"}
              </span>
            </Row>
            <Row label="Tiền mặt">{snap.player.cash.toFixed(0)} đ</Row>
            <Row label="Dư nợ">{snap.player.debt.toFixed(0)} đ</Row>
            <Row label="Tồn kho">{snap.player.inventory.toFixed(0)} sp</Row>
            <Row label="Thị phần (60s)">
              {(snap.shares.playerShare * 100).toFixed(1)}%
            </Row>
            <Row label="Đã bán (60s)">
              {snap.shares.totalSold.toFixed(0)} sp
            </Row>

            <div className="mt-2">
              <h4 className="font-semibold">Nhiệm vụ</h4>
              <ul className="mt-1 space-y-1 text-sm">
                {snap.quests.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className={q.done ? "line-through opacity-70" : ""}>
                      {q.text}
                    </span>
                    {q.target && (
                      <span className="text-xs opacity-80">
                        {q.progress ?? 0}/{q.target}
                      </span>
                    )}
                    {q.done && (
                      <span className="text-emerald-400 text-xs">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                className="btn"
                onClick={() => setUI({ ...ui, openPanel: "industrial" })}
                disabled={isEnded}
                style={disStyle(isEnded)}
              >
                ⚙️ Sản xuất
              </button>
              <button
                className="btn"
                onClick={() => setUI({ ...ui, openPanel: "marketplace" })}
                disabled={isEnded}
                style={disStyle(isEnded)}
              >
                🛒 Chợ
              </button>
              <button
                className="btn"
                onClick={() => setUI({ ...ui, openPanel: "raw" })}
                disabled={isEnded}
                style={disStyle(isEnded)}
              >
                🧱 Nguyên liệu
              </button>
              <button
                className="btn"
                onClick={() => setUI({ ...ui, openPanel: "bank" })}
                disabled={isEnded}
                style={disStyle(isEnded)}
              >
                🏦 Ngân hàng
              </button>
            </div>
          </div>
        </div>

        {/* Toast thông báo */}
        {gsRef.current.toast && !isEnded && (
          <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/90 text-slate-100 shadow">
            {gsRef.current.toast}
          </div>
        )}

        {/* Overlay kết thúc ván */}
        {isEnded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-6 text-slate-100 shadow-xl">
              <h2
                className={`text-2xl font-bold mb-2 ${
                  gsRef.current.result === "WIN"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {gsRef.current.result === "WIN"
                  ? "🎉 Bạn THẮNG!"
                  : "💥 Bạn THUA"}
              </h2>
              <p className="mb-4 opacity-90">{gsRef.current.resultReason}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Thời gian chơi</span>
                  <span>{gsRef.current.t.toFixed(1)} s</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá trị ròng</span>
                  <span>{netWorth(gsRef.current).toFixed(0)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Thị phần (60s)</span>
                  <span>
                    {(gsRef.current.shares.playerShare * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số lần đình công</span>
                  <span>{gsRef.current._strikeCount || 0}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="btn" onClick={restartGame}>
                  🔁 Chơi lại
                </button>
                <button
                  className="btn-outline"
                  onClick={() => setUI({ openPanel: null })}
                >
                  Xem lại màn hình
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
