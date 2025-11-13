# 📚 Lý Thuyết Kinh Tế Chính Trị Marxist Trong Game

## Mục Lục

1. [Lý thuyết Giá trị Lao động](#1-lý-thuyết-giá-trị-lao-động)
2. [Giá trị Thặng dư và Bóc lột](#2-giá-trị-thặng-dư-và-bóc-lột)
3. [Giá trị Xã hội và Giá cả](#3-giá-trị-xã-hội-và-giá-cả)
4. [Tích tụ Tư bản](#4-tích-tụ-tư-bản)
5. [Cạnh tranh và Độc quyền](#5-cạnh-tranh-và-độc-quyền)
6. [Khủng hoảng Kinh tế](#6-khủng-hoảng-kinh-tế)
7. [Xuất khẩu Tư bản và Đế quốc](#7-xuất-khẩu-tư-bản-và-đế-quốc)

---

## 1. Lý thuyết Giá trị Lao động

### 📖 Lý thuyết Marx

Theo Marx, **giá trị của hàng hóa được quyết định bởi lượng lao động xã hội cần thiết** để sản xuất ra nó.

**Công thức cơ bản**:

```
Giá trị hàng hóa = Lao động sống + Lao động vật hóa
                 = (c + v) + m
```

Trong đó:

- **c (constant capital)**: Tư bản bất biến - giá trị tư liệu sản xuất, nguyên liệu
- **v (variable capital)**: Tư bản khả biến - tiền lương công nhân
- **m (surplus value)**: Giá trị thặng dư - phần giá trị công nhân tạo ra nhưng không được trả

### 🎮 Ứng dụng trong Game

#### Chi phí Cá biệt (Individual Cost)

```javascript
// Trong code: gs.player.individualCost
```

**Ý nghĩa**: Chi phí sản xuất 1 đơn vị của từng nhà tư bản riêng lẻ.

**Công thức mô phỏng**:

```
Chi phí cá biệt = Chi phí nguyên liệu + Chi phí lao động + Khấu hao máy móc
                ≈ Giá nguyên liệu × 0.3 + Lương + Overhead
```

**Trong game**:

- Ban đầu: 10đ (công nghệ lạc hậu)
- Sau nâng cấp: Giảm dần về 5đ (công nghệ tiên tiến)
- Phản ánh **năng suất lao động cá biệt**

**Ví dụ thực tế**:

- Nhà máy A dùng máy cũ: Chi phí 10đ/sp
- Nhà máy B dùng máy mới: Chi phí 6đ/sp
- Nhà máy B có lợi thế cạnh tranh

---

## 2. Giá trị Thặng dư và Bóc lột

### 📖 Lý thuyết Marx

**Giá trị thặng dư** là nguồn gốc của lợi nhuận tư bản chủ nghĩa. Nó được tạo ra từ việc công nhân làm việc nhiều hơn thời gian cần thiết để tái sản xuất sức lao động của mình.

#### Phân chia Ngày làm việc

```
Ngày làm việc = Thời gian lao động tất yếu + Thời gian lao động thặng dư
```

- **Thời gian lao động tất yếu**: Thời gian cần để tạo ra giá trị = lương công nhân nhận
- **Thời gian lao động thặng dư**: Thời gian tạo ra giá trị cho tư bản gia

#### Tỷ suất Giá trị Thặng dư (m')

```
m' = m/v = Giá trị thặng dư / Tư bản khả biến
   = Thời gian lao động thặng dư / Thời gian lao động tất yếu
```

### 🎮 Ứng dụng trong Game

#### Chỉ số Bóc lột (Exploitation Index)

```javascript
// Trong system.js
export function computeExploitationIndex(hours, essentialHours) {
  const surplusHours = Math.max(0, hours - essentialHours);
  const necessaryHours = Math.min(hours, essentialHours);
  const m = surplusHours; // Giá trị thặng dư
  const v = necessaryHours; // Tư bản khả biến
  return v > 0 ? m / v : 0; // m' = m/v
}
```

**Các thành phần**:

1. **essentialHours (Giờ lao động tất yếu)**:

   - Số giờ cần để tạo ra giá trị = lương
   - Điều chỉnh được: 1-8 giờ
   - Tương đương với **v** trong công thức Marx

2. **hours (Tổng giờ làm việc)**:

   - Tổng số giờ công nhân làm mỗi ngày
   - Điều chỉnh được: 1-12 giờ

3. **surplusHours (Giờ thặng dư)**:
   - = hours - essentialHours
   - Tương đương với **m** trong công thức Marx

**Ví dụ cụ thể**:

```
Trường hợp 1: Bóc lột thấp
- Giờ tất yếu: 6 giờ
- Tổng giờ làm: 8 giờ
- Giờ thặng dư: 2 giờ
- Chỉ số bóc lột: 2/6 = 0.33 (33%)
→ Công nhân hài lòng

Trường hợp 2: Bóc lột cao
- Giờ tất yếu: 4 giờ
- Tổng giờ làm: 12 giờ
- Giờ thặng dư: 8 giờ
- Chỉ số bóc lột: 8/4 = 2.0 (200%)
→ Công nhân căng thẳng

Trường hợp 3: Bóc lột cực đoan
- Giờ tất yếu: 3 giờ
- Tổng giờ làm: 12 giờ
- Giờ thặng dư: 9 giờ
- Chỉ số bóc lột: 9/3 = 3.0 (300%)
→ ĐÌNH CÔNG!
```

#### Cơ chế Đình công

```javascript
// Trong App.jsx - step()
const ex = computeExploitationIndex(gs.player.hours, gs.player.essentialHours);

if (ex > 3 && (!gs._strike || gs._strike <= 0)) {
  gs._strike = 10; // Bật đình công
  gs._strikeCount = (gs._strikeCount || 0) + 1;
}
```

**Ngưỡng đình công**: m' > 3.0 (300%)

**Hậu quả**:

- Sản xuất dừng hoàn toàn
- Đình công 2 lần → Thua cuộc
- Phản ánh **đấu tranh giai cấp** trong thực tế

### 📊 Hai phương pháp tăng Giá trị Thặng dư

#### 1. Giá trị Thặng dư Tuyệt đối (Absolute Surplus Value)

**Định nghĩa**: Tăng giá trị thặng dư bằng cách **kéo dài ngày làm việc**.

**Trong game**:

```
Tăng hours từ 8 → 12 giờ (giữ nguyên essentialHours = 6)
→ Giờ thặng dư tăng từ 2 → 6 giờ
→ m' tăng từ 0.33 → 1.0
```

**Hạn chế**:

- Giới hạn sinh lý (12 giờ/ngày)
- Gây đình công nếu quá cao

#### 2. Giá trị Thặng dư Tương đối (Relative Surplus Value)

**Định nghĩa**: Tăng giá trị thặng dư bằng cách **tăng năng suất lao động**, giảm thời gian lao động tất yếu.

**Trong game**:

```
Nâng cấp nhà máy → Giảm individualCost
→ Cùng 1 giờ lao động tạo ra nhiều giá trị hơn
→ essentialHours giảm (ví dụ: 6 → 4 giờ)
→ Với hours = 8, m' tăng từ 0.33 → 1.0
```

**Lợi ích**:

- Không gây đình công
- Tăng cạnh tranh
- Phản ánh **cách mạng công nghệ**

---

## 3. Giá trị Xã hội và Giá cả

### 📖 Lý thuyết Marx

**Giá trị xã hội** là lượng lao động xã hội cần thiết trung bình để sản xuất một hàng hóa.

**Quy luật Giá trị**:

```
Giá cả dao động quanh Giá trị xã hội
```

Các nhà tư bản có **chi phí cá biệt thấp hơn giá trị xã hội** sẽ thu được **siêu ngạch lợi nhuận**.

### 🎮 Ứng dụng trong Game

#### Tính Giá trị Xã hội

```javascript
// Trong system.js
export function computeSocialValue(gs) {
  const actors = [
    {
      cost: gs.player.individualCost,
      cap: gs.player.capacity + gs.player.foreignCapacity,
    },
    ...gs.npcs
      .filter((n) => !n.bankrupt)
      .map((n) => ({
        cost: n.individualCost ?? 9,
        cap: n.capacity ?? 5,
      })),
  ];

  const totalCap = actors.reduce((s, a) => s + a.cap, 0) || 1;
  const avg = actors.reduce((s, a) => s + a.cost * (a.cap / totalCap), 0);

  return clamp(+avg.toFixed(2), 2, 30);
}
```

**Công thức**:

```
Giá trị xã hội = Σ(Chi phí cá biệt × Công suất) / Σ(Công suất)
```

**Ví dụ chi tiết**:

```
Thị trường có 4 nhà sản xuất:

Player:     Chi phí 6đ,  Công suất 20  → Trọng số: 20/40 = 50%
Đối thủ A:  Chi phí 8đ,  Công suất 10  → Trọng số: 10/40 = 25%
Đối thủ B:  Chi phí 9đ,  Công suất 5   → Trọng số: 5/40 = 12.5%
Đối thủ C:  Chi phí 10đ, Công suất 5   → Trọng số: 5/40 = 12.5%

Giá trị xã hội = 6×0.5 + 8×0.25 + 9×0.125 + 10×0.125
               = 3 + 2 + 1.125 + 1.25
               = 7.375đ
```

#### Siêu ngạch Lợi nhuận

**Định nghĩa**: Lợi nhuận thêm do chi phí cá biệt < giá trị xã hội.

**Trong game**:

```
Giá trị xã hội: 7.375đ
Giá thị trường: ~7.0đ (dao động quanh giá trị xã hội)

Player (chi phí 6đ):
- Lợi nhuận/sp: 7.0 - 6.0 = 1.0đ
- Lợi nhuận bình thường: 7.0 - 7.375 = -0.375đ
- Siêu ngạch lợi nhuận: 1.0 - (-0.375) = 1.375đ

Đối thủ C (chi phí 10đ):
- Lợi nhuận/sp: 7.0 - 10.0 = -3.0đ
- BỊ LỖ → Dần phá sản
```

**Cơ chế cạnh tranh**:

1. Nhà tư bản có công nghệ tốt → Chi phí thấp → Siêu ngạch lợi nhuận
2. Tích lũy vốn → Nâng cấp thêm → Mở rộng công suất
3. Đối thủ yếu → Lỗ → Phá sản
4. Giá trị xã hội giảm dần theo công nghệ tiên tiến nhất

#### Giá Thị trường

```javascript
// Trong system.js - updateCrisis()
const target = gs.marketPriceOverride ?? gs.socialValue;
gs.marketPrice += (target - gs.marketPrice) * 0.05 * (dt * 60);
```

**Cơ chế**:

- Giá dao động quanh giá trị xã hội
- Có yếu tố ngẫu nhiên (cung cầu ngắn hạn)
- Dài hạn: Giá = Giá trị xã hội

---

## 4. Tích tụ Tư bản

### 📖 Lý thuyết Marx

**Tích tụ tư bản** là quá trình chuyển hóa giá trị thặng dư thành tư bản mới.

**Công thức**:

```
Tư bản mới = Tư bản cũ + Giá trị thặng dư tái đầu tư
C' = C + ΔC
```

**Quy luật tích tụ**:

- Tư bản lớn → Công nghệ tốt → Lợi nhuận cao → Tích tụ nhanh
- Tư bản nhỏ → Công nghệ kém → Lợi nhuận thấp → Tích tụ chậm → Phá sản

### 🎮 Ứng dụng trong Game

#### Chu trình Tích tụ

```
1. Sản xuất
   → Tạo ra hàng hóa (inventory)

2. Bán hàng
   → Thu tiền (cash)
   → Lợi nhuận = Doanh thu - Chi phí

3. Tái đầu tư
   → Nâng cấp nhà máy (400đ)
   → Giảm chi phí (-0.5đ)
   → Tăng công suất (+10)

4. Mở rộng sản xuất
   → Sản lượng tăng
   → Thị phần tăng
   → Lợi nhuận tăng

5. Quay lại bước 1 (chu trình lặp lại)
```

#### Nâng cấp Nhà máy

```javascript
// Trong App.jsx
function upgradeFactory() {
  if (!spend(400, "nâng cấp nhà máy")) return;

  gs.player.individualCost = Math.max(5, gs.player.individualCost - 0.5);
  gs.player.capacity += 10;
}
```

**Ý nghĩa kinh tế**:

- Đầu tư 400đ = Mua máy móc mới
- Giảm chi phí = Tăng năng suất lao động
- Tăng công suất = Mở rộng quy mô sản xuất

**Lợi thế tích lũy**:

```
Vòng 1:
- Vốn: 500đ
- Chi phí: 10đ/sp
- Sản lượng: 6sp/tick
- Lợi nhuận: ~30đ/tick

Vòng 2 (sau nâng cấp):
- Vốn: 100đ (500-400)
- Chi phí: 9.5đ/sp
- Sản lượng: 16sp/tick
- Lợi nhuận: ~80đ/tick

Vòng 3 (sau 2 lần nâng cấp):
- Chi phí: 9đ/sp
- Sản lượng: 26sp/tick
- Lợi nhuận: ~150đ/tick
→ Tích lũy tăng tốc theo cấp số nhân
```

#### Tập trung và Trung tâm hóa Tư bản

**Tập trung** (Concentration): Tích lũy từ lợi nhuận của chính mình.

**Trung tâm hóa** (Centralization): Sáp nhập, thôn tính đối thủ.

**Trong game**:

```javascript
// Trust Takeover - Thôn tính đối thủ
function trustTakeover() {
  const alive = gs.npcs.filter((n) => !n.bankrupt);
  const cost = alive.reduce((s, n) => s + Math.max(150, n.capacity * 30), 0);

  if (spend(cost, "thôn tính đối thủ")) {
    alive.forEach((n) => (n.bankrupt = true));
    // Độc quyền hoàn toàn
  }
}
```

**Kết quả**:

- Loại bỏ cạnh tranh
- Kiểm soát 100% thị trường
- Đặt giá độc quyền

---

## 5. Cạnh tranh và Độc quyền

### 📖 Lý thuyết Marx & Lenin

#### Giai đoạn Cạnh tranh Tự do

**Đặc điểm**:

- Nhiều nhà tư bản nhỏ
- Cạnh tranh khốc liệt
- Giá = Giá trị xã hội
- Lợi nhuận bình quân

#### Giai đoạn Độc quyền (Monopoly)

**Đặc điểm**:

- Vài tập đoàn lớn kiểm soát thị trường
- Hạn chế cạnh tranh
- Giá > Giá trị xã hội (giá độc quyền)
- Siêu lợi nhuận độc quyền

**Các hình thức độc quyền**:

1. **Cartel**: Liên minh giá
2. **Trust**: Sáp nhập hoàn toàn
3. **Concern**: Tập đoàn đa ngành

### 🎮 Ứng dụng trong Game

#### Chuyển giai đoạn

```javascript
// Trong system.js
function computeShares(gs) {
  const pSold = win
    .filter((r) => r.who === "player")
    .reduce((s, r) => s + r.qty, 0);
  const totalMarket = win.reduce((s, r) => s + r.qty, 0);

  gs.shares = {
    playerShare: totalMarket ? pSold / totalMarket : 0,
    totalSold: pSold,
  };

  // Chuyển sang MONOPOLY khi thị phần ≥60%
  if (gs.stage !== "MONOPOLY" && gs.shares.playerShare >= 0.6) {
    gs.stage = "MONOPOLY";
  }
}
```

**Ngưỡng độc quyền**: 60% thị phần

**Ý nghĩa**:

- Phản ánh thực tế: Vài công ty lớn kiểm soát thị trường
- Ví dụ: Google (tìm kiếm), Microsoft (OS), Amazon (thương mại điện tử)

#### Công cụ Độc quyền

##### 1. Cartel (Liên minh giá)

```javascript
function cartelToggle() {
  gs.player.cartelMode = !gs.player.cartelMode;
  gs.marketPriceOverride = gs.player.cartelMode
    ? Math.max(gs.socialValue * 1.3, gs.socialValue + 2)
    : null;
}
```

**Cơ chế**:

- Đẩy giá lên 130% giá trị xã hội
- Tất cả bán cùng giá cao
- Chia nhau thị trường

**Ví dụ thực tế**: OPEC (dầu mỏ)

##### 2. Trust (Thôn tính)

```javascript
function trustTakeover() {
  const cost = alive.reduce((s, n) => s + Math.max(150, n.capacity * 30), 0);

  if (spend(cost)) {
    alive.forEach((n) => (n.bankrupt = true));
    gs.marketPriceOverride = Math.max(gs.socialValue * 1.6, gs.socialValue + 4);
  }
}
```

**Cơ chế**:

- Mua lại tất cả đối thủ
- Độc quyền hoàn toàn
- Giá lên 160% giá trị xã hội

**Ví dụ thực tế**: Standard Oil (Rockefeller)

##### 3. Vận động Hành lang

```javascript
function lobbyGovernment() {
  if (spend(200)) {
    gs.demandMultiplier *= 1.1;
    gs.marketPriceOverride = Math.max(
      gs.marketPriceOverride ?? gs.socialValue,
      gs.socialValue * 1.25
    );
    // Hiệu lực 60s
  }
}
```

**Cơ chế**:

- Mua chuộc chính phủ
- Ban hành luật có lợi
- Tăng nhu cầu, giá cao

**Ví dụ thực tế**: Lobbying ở Mỹ

---

## 6. Khủng hoảng Kinh tế

### 📖 Lý thuyết Marx

**Khủng hoảng thừa sản xuất**: Sản xuất vượt quá khả năng tiêu thụ.

**Nguyên nhân**:

1. **Mâu thuẫn cơ bản**: Sản xuất xã hội hóa vs. chiếm hữu tư nhân
2. **Xu hướng lợi nhuận giảm**: Tỷ suất lợi nhuận giảm theo thời gian
3. **Thiếu tiêu dùng**: Công nhân bị bóc lột → Thu nhập thấp → Không mua được hàng

**Chu kỳ kinh tế**:

```
Phồn vinh → Khủng hoảng → Suy thoái → Phục hồi → Phồn vinh
```

### 🎮 Ứng dụng trong Game

#### Mô phỏng Chu kỳ

```javascript
// Trong system.js
export function updateCrisis(gs, dt) {
  // Dao động sin theo thời gian
  const phase = Math.sin((gs.t / 40) * Math.PI * 2);

  // Nhu cầu dao động 0.75 - 1.25
  const demandMul = 1 + phase * 0.25;
  gs.demandMultiplier = clamp(demandMul, 0.6, 1.4);
}
```

**Chu kỳ**: 40 giây = 1 vòng

**Giai đoạn**:

```
t=0s:   phase=0    → demand=1.0   (Bình thường)
t=10s:  phase=1    → demand=1.25  (Phồn vinh)
t=20s:  phase=0    → demand=1.0   (Bình thường)
t=30s:  phase=-1   → demand=0.75  (Khủng hoảng)
t=40s:  phase=0    → demand=1.0   (Phục hồi)
```

#### Ảnh hưởng Khủng hoảng

**Khi khủng hoảng (demand = 0.75)**:

- Nhu cầu giảm 25%
- Hàng tồn kho tăng
- Giá giảm
- Lợi nhuận giảm
- Đối thủ yếu phá sản

**Chiến lược**:

- Giảm sản xuất tạm thời
- Tích trữ tiền mặt
- Chờ đối thủ phá sản
- Mua lại với giá rẻ

---

## 7. Xuất khẩu Tư bản và Đế quốc

### 📖 Lý thuyết Lenin

**Đế quốc chủ nghĩa** là giai đoạn cao nhất của chủ nghĩa tư bản.

**5 đặc trưng**:

1. Tập trung sản xuất và độc quyền
2. Tư bản tài chính (ngân hàng + công nghiệp)
3. **Xuất khẩu tư bản** (thay vì xuất khẩu hàng hóa)
4. Chia nhau thế giới giữa các tập đoàn
5. Chia nhau thế giới giữa các cường quốc

**Xuất khẩu tư bản**:

- Đầu tư ra nước ngoài
- Khai thác lao động rẻ
- Nguyên liệu rẻ
- Lợi nhuận cao hơn

### 🎮 Ứng dụng trong Game

#### Xuất khẩu Tư bản

```javascript
function exportCapital() {
  if (spend(250, "đầu tư ra Vùng Đất Mới")) {
    gs.player.foreignCapacity += 10;
  }
}
```

**Cơ chế**:

- Đầu tư 250đ → +10 công suất nước ngoài
- Sản xuất ở "Vùng Đất Mới"
- Chi phí thấp hơn (nguyên liệu rẻ, lao động rẻ)

**Lợi ích**:

```
Trong nước:
- Nguyên liệu: 4đ
- Lao động: Đình công nếu bóc lột cao

Nước ngoài:
- Nguyên liệu: 2đ (rẻ hơn 50%)
- Lao động: Không đình công (chưa tổ chức)
- Lợi nhuận: Cao hơn 30-50%
```

#### Độc quyền Nguyên liệu

```javascript
// Trong updateCrisis()
gs.rawPrice +=
  ((gs.player.ownsRawMonopoly ? Math.max(1.2, gs.rawPrice * 0.5) : 4) -
    gs.rawPrice) *
  0.02 *
  (dt * 60);
```

**Cơ chế**:

- Kiểm soát nguồn nguyên liệu
- Ép giá xuống 50%
- Đối thủ phải mua giá cao
- Lợi thế cạnh tranh tuyệt đối

**Ví dụ thực tế**:

- Dầu mỏ: Các công ty dầu khí lớn
- Kim loại hiếm: Trung Quốc kiểm soát 90%
- Chip: TSMC, Samsung

---

## 📈 Tổng kết: Vận động của Hệ thống

### Chu trình Tổng quát

```
1. Cạnh tranh ban đầu
   ↓
2. Tích tụ tư bản (nâng cấp công nghệ)
   ↓
3. Tập trung tư bản (công ty lớn thắng)
   ↓
4. Độc quyền hình thành (60% thị phần)
   ↓
5. Giá độc quyền (Cartel, Trust)
   ↓
6. Xuất khẩu tư bản (đầu tư nước ngoài)
   ↓
7. Đế quốc (kiểm soát toàn cầu)
   ↓
8. Khủng hoảng chu kỳ (mâu thuẫn tích lũy)
```

### Mâu thuẫn Cơ bản

**Trong game**:

1. **Bóc lột vs. Đình công**:

   - Muốn lợi nhuận cao → Tăng giờ làm
   - Nhưng → Đình công → Sản xuất dừng

2. **Tích tụ vs. Tiêu dùng**:

   - Tích lũy vốn → Ít tiêu dùng
   - Công nhân nghèo → Không mua được hàng
   - → Khủng hoảng thừa sản xuất

3. **Cạnh tranh vs. Độc quyền**:
   - Cạnh tranh → Giá giảm → Lợi nhuận giảm
   - Độc quyền → Giá cao → Nhưng nhu cầu giảm

### Bài học Kinh tế Chính trị

1. **Giá trị do lao động tạo ra**: Không có lao động, không có giá trị
2. **Bóc lột là nguồn lợi nhuận**: Lợi nhuận = Giá trị thặng dư
3. **Cạnh tranh dẫn đến độc quyền**: Tất yếu khách quan
4. **Khủng hoảng là chu kỳ**: Không thể tránh trong CNTB
5. **Đế quốc là giai đoạn cao nhất**: Xuất khẩu tư bản thống trị

---

**Game này không chỉ là giải trí, mà còn là công cụ học tập lý thuyết kinh tế chính trị Marxist một cách trực quan và sinh động!** 🎓
