# ⚙️ Cơ Chế Sản Xuất Tự Động Trong Game

## 📋 Tổng Quan

Sản xuất trong game hoạt động **hoàn toàn tự động** theo chu kỳ kinh tế. Người chơi không cần nhấn nút "Sản xuất", mà chỉ cần quản lý các thông số để tối ưu hóa.

---

## 🔄 Luồng Hoạt Động Tổng Thể

### 1. Game Loop (Vòng Lặp Chính)

```javascript
// Trong App.jsx - useEffect()
const loop = (now) => {
  const dt = (now - last) / 1000; // Delta time (giây)
  last = now;

  step(gsRef.current, dt); // ← Gọi hàm step mỗi frame

  acc += dt;
  if (acc >= 0.25) {
    setSnap(snapshot(gsRef.current)); // Cập nhật UI mỗi 0.25s
    acc = 0;
  }

  rafRef.current = requestAnimationFrame(loop);
};
```

**Tần suất**:

- Game loop chạy ~60 FPS (60 lần/giây)
- UI cập nhật mỗi 0.25 giây (4 lần/giây)

---

### 2. Hàm step() - Trái Tim Của Game

```javascript
function step(gs, dt) {
  if (showTutorialRef.current) return; // Dừng khi đang xem hướng dẫn
  if (gs.result) return; // Dừng khi game kết thúc

  gs.t += dt; // Tăng thời gian game
  updateCrisis(gs, dt); // Cập nhật chu kỳ kinh tế
  gs.socialValue = computeSocialValue(gs); // Tính giá trị xã hội

  gs._econAcc = (gs._econAcc || 0) + dt; // Tích lũy thời gian

  // ← QUAN TRỌNG: Chỉ sản xuất mỗi 1 giây thực
  if (gs._econAcc >= 1) {
    const steps = Math.floor(gs._econAcc);
    gs._econAcc -= steps;

    for (let i = 0; i < steps; i++) {
      // ========== SẢN XUẤT TỰ ĐỘNG ==========
      produceUnits(gs, "player"); // Player sản xuất
      gs.npcs.forEach(
        (n) => produceUnits(gs, `npc-${n.id}`) // NPC sản xuất
      );

      // ========== BÁN HÀNG TỰ ĐỘNG (CHỈ NPC) ==========
      // ... (code bán hàng NPC)

      // ========== KIỂM TRA ĐÌNH CÔNG ==========
      // ... (code kiểm tra exploitation index)

      // ========== CÁC CẬP NHẬT KHÁC ==========
      updateLoans(gs, 1);
      updateNPCs(gs, 1);
      cleanRollingWindow(gs);
      maybeEnterMonopoly(gs);
      checkWinLose(gs, 1);
    }
  }
}
```

**Chu kỳ kinh tế**: Mỗi 1 giây thực = 1 "tick" kinh tế

---

## 🏭 Hàm produceUnits() - Chi Tiết Sản Xuất

### Code Đầy Đủ

```javascript
export function produceUnits(gs, who) {
  // 1. Xác định ai đang sản xuất
  const actor =
    who === "player" ? gs.player : gs.npcs.find((n) => `npc-${n.id}` === who);

  if (!actor || actor.bankrupt) return; // Không sản xuất nếu phá sản

  // 2. Kiểm tra đình công (chỉ áp dụng cho player)
  if (who === "player" && gs._strike > 0) return;

  // 3. Tính sản lượng dựa trên công suất
  const perTick = (actor.capacity ?? 5) * 0.5;

  // 4. Tính nguyên liệu cần thiết
  const rawNeed = perTick * 0.3;

  // 5. Lấy giá nguyên liệu
  const rawPrice = gs.rawPriceOverride ?? gs.rawPrice;

  // 6. Kiểm tra đủ tiền mua nguyên liệu
  if (actor.cash >= rawNeed * rawPrice) {
    actor.cash -= rawNeed * rawPrice; // Trừ tiền
    actor.inventory += perTick; // Thêm hàng tồn kho

    // 7. Cập nhật tiến trình nhiệm vụ (chỉ player)
    if (who === "player") progress(gs, "q1", Math.floor(perTick));
  }
}
```

---

## 📊 Phân Tích Từng Bước

### Bước 1: Xác Định Tác Nhân

```javascript
const actor =
  who === "player" ? gs.player : gs.npcs.find((n) => `npc-${n.id}` === who);
```

**Giải thích**:

- `who = "player"` → Lấy `gs.player`
- `who = "npc-1"` → Tìm NPC có `id = 1`

**Ví dụ**:

```javascript
// Gọi từ step()
produceUnits(gs, "player"); // Player sản xuất
produceUnits(gs, "npc-1"); // Đối thủ #1 sản xuất
produceUnits(gs, "npc-2"); // Đối thủ #2 sản xuất
```

---

### Bước 2: Kiểm Tra Điều Kiện

```javascript
if (!actor || actor.bankrupt) return;
if (who === "player" && gs._strike > 0) return;
```

**Điều kiện dừng sản xuất**:

1. Tác nhân không tồn tại
2. Tác nhân đã phá sản
3. Player đang bị đình công (`gs._strike > 0`)

**Lưu ý**: NPC không bị đình công!

---

### Bước 3: Tính Sản Lượng

```javascript
const perTick = (actor.capacity ?? 5) * 0.5;
```

**Công thức**:

```
Sản lượng mỗi tick = Công suất × 0.5
```

**Ví dụ**:

| Công suất | Sản lượng/tick | Sản lượng/10s |
| --------- | -------------- | ------------- |
| 6         | 3 sp           | 30 sp         |
| 10        | 5 sp           | 50 sp         |
| 20        | 10 sp          | 100 sp        |
| 30        | 15 sp          | 150 sp        |

**Giải thích hệ số 0.5**:

- Mô phỏng hiệu suất sản xuất thực tế
- Không phải lúc nào máy móc cũng chạy 100%
- Có thời gian chết, bảo trì, chuyển đổi sản phẩm

---

### Bước 4: Tính Nguyên Liệu

```javascript
const rawNeed = perTick * 0.3;
```

**Công thức**:

```
Nguyên liệu cần = Sản lượng × 0.3
```

**Ví dụ**:

```
Sản lượng: 10 sp
→ Nguyên liệu: 10 × 0.3 = 3 đơn vị

Giá nguyên liệu: 4đ/đơn vị
→ Chi phí nguyên liệu: 3 × 4 = 12đ
```

**Ý nghĩa hệ số 0.3**:

- Mỗi sản phẩm cần 30% trọng lượng nguyên liệu
- Phản ánh tỷ lệ đầu vào/đầu ra trong sản xuất
- Ví dụ thực tế:
  - Sản xuất thép: Cần quặng sắt, than cốc
  - Sản xuất bánh mì: Cần bột mì, nước, men

---

### Bước 5: Lấy Giá Nguyên Liệu

```javascript
const rawPrice = gs.rawPriceOverride ?? gs.rawPrice;
```

**Giá nguyên liệu**:

- **Bình thường**: `gs.rawPrice = 4đ` (dao động theo khủng hoảng)
- **Độc quyền**: `gs.rawPriceOverride` (nếu player kiểm soát nguồn nguyên liệu)

**Ví dụ**:

```javascript
// Trường hợp bình thường
gs.rawPrice = 4;
gs.rawPriceOverride = null;
→ rawPrice = 4đ

// Trường hợp độc quyền nguyên liệu
gs.player.ownsRawMonopoly = true;
gs.rawPriceOverride = 2; // Giảm 50%
→ rawPrice = 2đ (player mua rẻ)
→ Đối thủ vẫn phải mua 4đ (bị ép giá)
```

---

### Bước 6: Sản Xuất (Nếu Đủ Tiền)

```javascript
if (actor.cash >= rawNeed * rawPrice) {
  actor.cash -= rawNeed * rawPrice; // Trừ tiền
  actor.inventory += perTick; // Thêm hàng

  if (who === "player") progress(gs, "q1", Math.floor(perTick));
}
```

**Điều kiện**: Phải có đủ tiền mua nguyên liệu

**Ví dụ chi tiết**:

```
=== TICK 1 ===
Trước sản xuất:
- Cash: 500đ
- Inventory: 0 sp
- Capacity: 10

Tính toán:
- Sản lượng: 10 × 0.5 = 5 sp
- Nguyên liệu: 5 × 0.3 = 1.5 đơn vị
- Chi phí: 1.5 × 4đ = 6đ

Kiểm tra: 500đ >= 6đ ✓

Sau sản xuất:
- Cash: 500 - 6 = 494đ
- Inventory: 0 + 5 = 5 sp

=== TICK 2 ===
Trước sản xuất:
- Cash: 494đ
- Inventory: 5 sp

Sau sản xuất:
- Cash: 494 - 6 = 488đ
- Inventory: 5 + 5 = 10 sp

=== TICK 3 ===
- Cash: 488 - 6 = 482đ
- Inventory: 10 + 5 = 15 sp

... (cứ thế tiếp tục mỗi giây)
```

---

## 🔢 Tính Toán Chi Phí Sản Xuất

### Chi Phí Nguyên Liệu

```
Chi phí nguyên liệu/sp = (Sản lượng × 0.3 × Giá nguyên liệu) / Sản lượng
                       = 0.3 × Giá nguyên liệu
                       = 0.3 × 4đ
                       = 1.2đ/sp
```

### Chi Phí Cá Biệt (Individual Cost)

**Lưu ý**: `gs.player.individualCost` KHÔNG được trừ trực tiếp trong `produceUnits()`!

**Giải thích**:

- `individualCost` là **chỉ số ước tính** tổng chi phí sản xuất
- Bao gồm: Nguyên liệu + Lao động + Khấu hao máy móc + Chi phí chung
- Dùng để tính **Giá trị xã hội** và so sánh cạnh tranh

**Công thức ước tính**:

```
individualCost ≈ Chi phí nguyên liệu + Chi phí lao động + Overhead
               ≈ 1.2đ + (Lương × Giờ làm / Sản lượng) + Khấu hao
```

**Ví dụ**:

```
Player:
- Công suất: 10
- Sản lượng/tick: 5 sp
- Chi phí nguyên liệu: 1.2đ/sp
- individualCost hiển thị: 8đ/sp

Đối thủ A:
- Công suất: 5
- Sản lượng/tick: 2.5 sp
- Chi phí nguyên liệu: 1.2đ/sp
- individualCost hiển thị: 10đ/sp

→ Player có lợi thế cạnh tranh (chi phí thấp hơn)
```

---

## 🤖 Sản Xuất Của NPC

### Cơ Chế Tương Tự Player

```javascript
// Trong step()
gs.npcs.forEach((n) => produceUnits(gs, `npc-${n.id}`));
```

**Đặc điểm**:

1. Sản xuất tự động mỗi tick
2. Không bị đình công
3. Chi phí giảm dần theo thời gian (cải tiến công nghệ)
4. Phá sản nếu hết tiền

### Cải Tiến Công Nghệ NPC

```javascript
// Trong updateNPCs()
n.individualCost = clamp((n.individualCost ?? 9) - 0.002, 5, 12);
```

**Tốc độ cải tiến**:

```
Mỗi tick: -0.002đ
Mỗi phút: -0.002 × 60 = -0.12đ
Từ 10đ → 5đ: (10-5) / 0.002 = 2500 tick = ~42 phút
```

**Ý nghĩa**:

- NPC tự động nâng cấp công nghệ
- Player phải nâng cấp nhanh hơn để duy trì lợi thế
- Phản ánh cạnh tranh công nghệ trong thực tế

---

## 🚫 Các Trường Hợp Dừng Sản Xuất

### 1. Đình Công (Chỉ Player)

```javascript
if (who === "player" && gs._strike > 0) return;
```

**Kích hoạt**:

```javascript
const ex = computeExploitationIndex(gs.player.hours, gs.player.essentialHours);

if (ex > 3 && (!gs._strike || gs._strike <= 0)) {
  gs._strike = 10; // Đình công 10 tick
}
```

**Hậu quả**:

- Sản xuất dừng hoàn toàn
- Tồn kho không tăng
- Vẫn phải trả lãi nợ
- Đối thủ tiếp tục sản xuất → Mất thị phần

### 2. Hết Tiền Mua Nguyên Liệu

```javascript
if (actor.cash >= rawNeed * rawPrice) {
  // Sản xuất
} else {
  // KHÔNG sản xuất
}
```

**Ví dụ**:

```
Cash: 5đ
Chi phí nguyên liệu: 6đ
→ Không đủ tiền
→ Không sản xuất tick này
→ Inventory không tăng
```

**Giải pháp**:

- Bán hàng tồn kho để có tiền
- Vay ngân hàng
- Giảm công suất tạm thời

### 3. Phá Sản

```javascript
if (!actor || actor.bankrupt) return;
```

**Điều kiện phá sản** (cho NPC):

```javascript
if ((n.cash ?? 0) < -200) n.bankrupt = true;
```

**Hậu quả**:

- Dừng sản xuất vĩnh viễn
- Không tham gia thị trường
- Giảm cạnh tranh
- Giá trị xã hội thay đổi

---

## 📈 Tối Ưu Hóa Sản Xuất

### 1. Tăng Công Suất

```javascript
// Nâng cấp nhà máy
gs.player.capacity += 10; // +10 công suất
→ Sản lượng tăng từ 5 sp/tick → 10 sp/tick
```

### 2. Giảm Chi Phí

```javascript
// Nâng cấp công nghệ
gs.player.individualCost -= 0.5;
→ Lợi nhuận/sp tăng 0.5đ
```

### 3. Xuất Khẩu Tư Bản

```javascript
gs.player.foreignCapacity += 10;
→ Tổng công suất = capacity + foreignCapacity
→ Sản lượng tăng mà không tăng chi phí trong nước
```

### 4. Độc Quyền Nguyên Liệu

```javascript
gs.player.ownsRawMonopoly = true;
→ rawPrice giảm 50%
→ Chi phí sản xuất giảm 0.6đ/sp
→ Lợi nhuận tăng đáng kể
```

---

## 🎯 So Sánh: Player vs NPC

| Đặc điểm             | Player                   | NPC                       |
| -------------------- | ------------------------ | ------------------------- |
| **Sản xuất tự động** | ✅ Mỗi 1s                | ✅ Mỗi 1s                 |
| **Bán hàng**         | ❌ Thủ công              | ✅ Tự động                |
| **Đình công**        | ✅ Có (nếu ex > 3)       | ❌ Không                  |
| **Nâng cấp**         | 🎮 Người chơi quyết định | 🤖 Tự động (-0.002đ/tick) |
| **Phá sản**          | ❌ Không tự động         | ✅ Nếu cash < -200đ       |
| **Vay nợ**           | 🎮 Người chơi quyết định | ❌ Không vay              |

---

## 💡 Chiến Lược Sản Xuất

### Giai Đoạn Đầu (0-3 phút)

1. **Để sản xuất tự động chạy**
2. **Bán hàng thường xuyên** để có tiền mua nguyên liệu
3. **Tránh đình công**: Giữ exploitation index < 3.0
4. **Tích lũy 400đ** để nâng cấp lần đầu

### Giai Đoạn Giữa (3-10 phút)

1. **Nâng cấp liên tục** khi có tiền
2. **Tăng công suất** để vượt đối thủ
3. **Quản lý tiền mặt**: Luôn đủ tiền mua nguyên liệu
4. **Bán hàng chiến lược**: Bán nhiều khi giá cao

### Giai Đoạn Độc Quyền (10+ phút)

1. **Xuất khẩu tư bản**: Tăng công suất nước ngoài
2. **Độc quyền nguyên liệu**: Giảm chi phí
3. **Sản xuất khổng lồ**: Capacity 30-50+
4. **Áp đảo thị trường**: Chiếm 100% thị phần

---

## 🔍 Debug & Kiểm Tra

### Xem Sản Lượng Thực Tế

```javascript
// Trong console
console.log("Capacity:", gs.player.capacity);
console.log("Sản lượng/tick:", gs.player.capacity * 0.5);
console.log("Inventory hiện tại:", gs.player.inventory);
```

### Kiểm Tra Tại Sao Không Sản Xuất

```javascript
// Kiểm tra điều kiện
console.log("Đình công?", gs._strike > 0);
console.log("Tiền mặt:", gs.player.cash);
console.log(
  "Chi phí nguyên liệu:",
  gs.player.capacity * 0.5 * 0.3 * gs.rawPrice
);
console.log(
  "Đủ tiền?",
  gs.player.cash >= gs.player.capacity * 0.5 * 0.3 * gs.rawPrice
);
```

---

## 📚 Tóm Tắt

**Sản xuất tự động hoạt động như sau**:

1. ⏰ **Mỗi 1 giây thực** = 1 tick kinh tế
2. 🏭 **Tự động gọi** `produceUnits()` cho player và tất cả NPC
3. 📦 **Tính sản lượng** = Công suất × 0.5
4. 🧱 **Tính nguyên liệu** = Sản lượng × 0.3
5. 💰 **Kiểm tra tiền** = Đủ tiền mua nguyên liệu?
6. ✅ **Nếu đủ**: Trừ tiền, thêm hàng tồn kho
7. ❌ **Nếu không đủ**: Bỏ qua tick này
8. 🔄 **Lặp lại** mỗi giây

**Người chơi chỉ cần**:

- Quản lý tiền mặt (bán hàng, vay nợ)
- Nâng cấp công nghệ
- Tránh đình công
- Mở rộng công suất

**Hệ thống lo phần còn lại!** 🎮
