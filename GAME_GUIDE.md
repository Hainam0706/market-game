# 📖 Hướng Dẫn Chơi Game - Mô Phỏng Kinh Tế Marxist

## 🎯 Mục Tiêu Game

**Chiến thắng**: Đạt 100% thị phần và loại bỏ tất cả đối thủ cạnh tranh.

**Thua cuộc**:

- Bị đình công quá 2 lần
- Phá sản (tiền mặt âm quá mức)

---

## 🎮 Điều Khiển

- **Di chuyển**: W/A/S/D hoặc phím mũi tên
- **Tương tác**: Click vào các khu vực trên bản đồ
- **Đóng panel**: ESC

---

## 📊 Các Chỉ Số Quan Trọng

### 1. **Giá Trị Xã Hội (Social Value)**

**Công thức**:

```
Giá trị xã hội = Σ (Chi phí cá biệt × Công suất) / Tổng công suất
```

**Giải thích**:

- Đây là chi phí sản xuất trung bình có trọng số của toàn bộ thị trường
- Bao gồm cả bạn và tất cả đối thủ chưa phá sản
- Công suất càng lớn thì ảnh hưởng đến giá trị xã hội càng nhiều
- Giá trị này quyết định giá thị trường cơ bản

**Ví dụ**:

- Bạn: Chi phí 8đ, Công suất 10
- Đối thủ A: Chi phí 10đ, Công suất 5
- Giá trị xã hội = (8×10 + 10×5) / (10+5) = 8.67đ

---

### 2. **Giá Thị Trường (Market Price)**

**Công thức**:

```
Giá thị trường = Giá trị xã hội × 0.95 + dao động ngẫu nhiên [0, 0.2]
```

**Giải thích**:

- Giá bán sản phẩm trên thị trường
- Dao động quanh giá trị xã hội
- Có thể bị override khi bạn vào giai đoạn Độc quyền (Monopoly)

**Ảnh hưởng**:

- Giá cao → Lợi nhuận cao khi bán hàng
- Giá thấp → Cạnh tranh khốc liệt

---

### 3. **Chi Phí Cá Biệt (Individual Cost)**

**Giải thích**:

- Chi phí sản xuất 1 đơn vị sản phẩm của riêng bạn
- Phụ thuộc vào công nghệ và hiệu suất nhà máy
- Giảm chi phí này giúp bạn cạnh tranh tốt hơn

**Cách giảm**:

- Nâng cấp nhà máy (400đ): -0.5 chi phí, +10 công suất
- Tối thiểu: 5đ (giới hạn công nghệ hiện tại)

---

### 4. **Công Suất (Capacity)**

**Công thức sản xuất**:

```
Sản lượng mỗi tick = Công suất × 0.5
```

**Giải thích**:

- Số lượng sản phẩm tối đa có thể sản xuất trong 1 chu kỳ (10 giây)
- Gồm 2 loại:
  - **Công suất trong nước**: Sản xuất tại nhà máy chính
  - **Công suất nước ngoài**: Đầu tư ra "Vùng Đất Mới" (250đ/10 công suất)

---

### 5. **Chỉ Số Bóc Lột (Exploitation Index)**

**Công thức Marxist**:

```
m' = (Giờ thặng dư) / (Giờ tất yếu)
   = (Tổng giờ làm - Giờ lao động tất yếu) / Giờ lao động tất yếu
```

**Giải thích**:

- **Giờ lao động tất yếu**: Số giờ cần thiết để tạo ra giá trị bằng lương công nhân nhận được
- **Giờ thặng dư**: Số giờ làm thêm tạo ra giá trị thặng dư cho chủ nhà máy
- **Tỷ suất giá trị thặng dư (m')**: Mức độ bóc lột lao động

**Ví dụ**:

- Giờ tất yếu: 6 giờ
- Tổng giờ làm: 12 giờ
- Giờ thặng dư: 12 - 6 = 6 giờ
- Chỉ số bóc lột: 6/6 = 1.0 (100%)

**Nguy hiểm**:

- Chỉ số > 3.0 → Công nhân đình công!
- Đình công 2 lần → Thua cuộc

**Cách giảm**:

- Giảm giờ làm việc
- Tăng giờ lao động tất yếu (tăng lương gián tiếp)
- Đàm phán khi đình công

---

### 6. **Thị Phần (Market Share)**

**Công thức**:

```
Thị phần = (Sản phẩm bạn bán trong 60s) / (Tổng sản phẩm bán ra trong 60s)
```

**Giải thích**:

- Tính dựa trên cửa sổ trượt 60 giây
- Đạt ≥60% → Chuyển sang giai đoạn **MONOPOLY**
- Đạt 100% + loại bỏ đối thủ → **THẮNG**

---

### 7. **Nhu Cầu Thị Trường (Market Demand)**

**Công thức**:

```
Nhu cầu = 100 × Hệ số nhu cầu
Hệ số nhu cầu = 1 + sin(t/40 × 2π) × 0.25
```

**Giải thích**:

- Dao động theo chu kỳ kinh tế (khủng hoảng)
- Dao động từ 0.75 đến 1.25
- Ảnh hưởng đến khả năng tiêu thụ sản phẩm

---

## 🏭 Cơ Chế Sản Xuất

### Quy Trình Sản Xuất

1. **Mua nguyên liệu**:

   ```
   Nguyên liệu cần = Sản lượng × 0.3
   Chi phí = Nguyên liệu cần × Giá nguyên liệu
   ```

2. **Sản xuất**:

   ```
   Sản lượng = Công suất × 0.5 (mỗi tick)
   ```

3. **Điều kiện**:
   - Đủ tiền mua nguyên liệu
   - Không bị đình công

---

## 💰 Hệ Thống Tài Chính

### Vay Nợ

**Lãi suất**: 12%/năm

**Công thức**:

```
Lãi mỗi giây = Nợ × (0.12 / 3600) × 60
```

**Lưu ý**: 1 phút thực = 1 năm trong game

### Phá Sản

- Tiền mặt < -200đ → Phá sản (cho NPC)
- Player không tự động phá sản nhưng nợ tăng nhanh

---

## 🎮 Giai Đoạn Game

### 1. Giai Đoạn Cạnh Tranh (COMPETITION)

**Mục tiêu**: Đạt 60% thị phần

**Chiến lược**:

- Nâng cấp nhà máy để giảm chi phí
- Sản xuất nhiều và bán nhanh
- Quản lý tiền mặt cẩn thận
- Tránh đình công

### 2. Giai Đoạn Độc Quyền (MONOPOLY)

**Điều kiện**: Thị phần ≥60%

**Công cụ mới**:

1. **Cartel (Liên minh giá)**:

   - Đẩy giá lên 130% giá trị xã hội
   - Tăng lợi nhuận nhưng giảm nhu cầu

2. **Trust (Thôn tính)**:

   - Mua lại tất cả đối thủ
   - Chi phí: Σ(150đ hoặc Công suất × 30đ)
   - Đẩy giá lên 160% giá trị xã hội

3. **Xuất khẩu tư bản**:

   - 250đ → +10 công suất nước ngoài
   - Mở rộng sản xuất

4. **Vận động hành lang**:

   - 200đ → +10% nhu cầu thị trường (60s)
   - Tăng giá thị trường 25%

5. **Đặt giá độc quyền**:
   - Tự do điều chỉnh giá bán
   - Giới hạn: 105% - 500% giá trị xã hội

---

## 🗺️ Các Khu Vực Trên Map

### ⚙️ Khu Sản Xuất (Industrial)

- Nâng cấp nhà máy
- Điều chỉnh giờ làm việc
- Quản lý chỉ số bóc lột
- Đàm phán đình công

### 🛒 Khu Chợ (Marketplace)

- Bán sản phẩm
- Xem giá thị trường
- Theo dõi đối thủ

### 🧱 Khu Nguyên Liệu (Raw Materials)

- Xem giá nguyên liệu
- Mua tự động khi sản xuất

### 🏦 Ngân Hàng (Bank)

- Vay tiền (200đ, 500đ)
- Trả nợ
- Theo dõi lãi suất

### 🏛️ Trụ Sở / Chính Phủ (HQ)

- Chỉ mở khi MONOPOLY
- Các công cụ độc quyền

---

## 📋 Nhiệm Vụ (Quests)

1. ✅ Sản xuất 100 sản phẩm
2. ✅ Bán 100 sản phẩm ở Chợ
3. ✅ Nâng cấp nhà máy ít nhất 1 lần
4. ✅ Đạt 60% thị phần để bước vào Độc quyền

---

## 💡 Chiến Thuật Thắng

### Giai đoạn đầu (0-5 phút)

1. **Sản xuất tối đa**:

   - Giữ giờ làm ở mức an toàn (8-9 giờ)
   - Đảm bảo chỉ số bóc lột < 3.0

2. **Bán hàng liên tục**:

   - Dùng nút "Bán nhanh" để thanh lý tồn kho
   - Tích lũy tiền mặt

3. **Nâng cấp sớm**:
   - Nâng cấp nhà máy ngay khi có 400đ
   - Giảm chi phí → Tăng lợi nhuận

### Giai đoạn giữa (5-10 phút)

1. **Mở rộng công suất**:

   - Tiếp tục nâng cấp nhà máy
   - Đạt chi phí tối thiểu 5đ

2. **Quản lý nợ**:

   - Vay khi cần thiết
   - Trả nợ khi có thặng dư

3. **Theo dõi thị phần**:
   - Mục tiêu: 60% để vào MONOPOLY

### Giai đoạn cuối (10+ phút)

1. **Thiết lập Cartel**:

   - Đẩy giá lên để tối đa hóa lợi nhuận

2. **Thôn tính đối thủ**:

   - Dùng Trust để loại bỏ cạnh tranh

3. **Xuất khẩu tư bản**:

   - Tăng công suất nước ngoài
   - Sản xuất khổng lồ

4. **Đạt 100% thị phần**:
   - Loại bỏ tất cả đối thủ → THẮNG!

---

## ⚠️ Lưu Ý Quan Trọng

### Tránh Đình Công

- **Luôn theo dõi chỉ số bóc lột**
- Giữ chỉ số < 3.0
- Nếu đình công:
  1. Giảm giờ làm ngay lập tức
  2. Nhấn "Đàm phán đình công"
  3. Tăng giờ lao động tất yếu

### Quản Lý Tiền Mặt

- Không để tiền âm quá lâu
- Lãi suất nợ tăng rất nhanh
- Cân đối giữa đầu tư và thanh khoản

### Cạnh Tranh Với NPC

- NPC tự động giảm chi phí theo thời gian
- NPC phá sản khi tiền < -200đ
- Giảm chi phí nhanh hơn NPC để thắng

---

## 🎓 Kiến Thức Kinh Tế Marxist

Game này mô phỏng các khái niệm:

1. **Giá trị xã hội**: Chi phí sản xuất trung bình xã hội
2. **Giá trị thặng dư**: Phần giá trị công nhân tạo ra nhưng không được trả lương
3. **Tỷ suất giá trị thặng dư**: Mức độ bóc lột lao động
4. **Tích tụ tư bản**: Tái đầu tư lợi nhuận để mở rộng
5. **Độc quyền**: Kiểm soát thị trường và đặt giá
6. **Xuất khẩu tư bản**: Đầu tư ra nước ngoài để tăng lợi nhuận

---

## 🏆 Thành Tích

- **Thời gian thắng nhanh nhất**: < 10 phút
- **Không vay nợ**: Thắng mà không vay tiền
- **Không đình công**: Thắng mà không bị đình công lần nào
- **Độc tài**: Đạt 100% thị phần

---

**Chúc bạn chơi vui vẻ và chinh phục thị trường! 🚀**
