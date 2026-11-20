# TICKET-02 — "Ba hòn đảo" (Phase 2 — Đặc tả yêu cầu chi tiết)

> **Nguồn:** Đảo Đèn Lồng Lab — Day 12 · AI SDLC Lab · Phase 2 (`https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW`)  
> **Loại:** Feature + chuẩn hóa · **Ưu tiên:** Cao · **Tag nộp:** `phase-2` · **Contract:** `v1.1`  
> **Kế hoạch triển khai tương ứng:** [phase-2-plan.md](../plans/phase-2-plan.md)

---

## Bối cảnh

Đêm 1 đã chạy được. Nhà sản xuất chơi thử bản của các bạn và thấy mỗi bản cho cảm giác điều khiển rất khác nhau. Ticket này có hai việc:
1. **Đồng bộ số liệu chuẩn** để mọi bản cho cảm giác giống nhau.
2. **Mở rộng game thành 3 Đêm** cùng các tính năng mới.

**Về sáng tạo:** Những gì đã sáng tạo thêm ở Phase 1 vẫn được giữ và vẫn được thêm ý riêng, kể cả nhân vật mới và kẻ địch mới (ngoài Bóng Mực và Gió Lạc), miễn là **số liệu chuẩn, bản đồ chuẩn và Test Contract v1.1 không bị đổi** và phần thêm **không làm đổi đầu ra headless** (ví dụ tắt khi chạy headless).

---

## Phần 1 — Số liệu chuẩn (bắt buộc, thay mọi giá trị tự chọn ở Phase 1)

Logic chạy **60 tick/giây** cố định. Đơn vị: **mét**, **giây**. Trục **Y hướng lên**.

| Nhóm | Hằng số | Giá trị chuẩn |
|---|---|---|
| **Di chuyển** | Tốc độ chạy | `6.0 m/s`; tăng tốc/dừng trong `≤ 0.1 s`; điều khiển trên không đầy đủ |
| | Nhảy | Vận tốc `7.0 m/s`, trọng lực `−20 m/s²`, chỉ nhảy khi chạm đất |
| **Lướt (mới)** | Tốc độ / thời gian / hồi chiêu | `14 m/s` / `0.2 s` (`12` tick) / `1.5 s` (`90` tick, tính từ lúc bắt đầu lướt) |
| | Hướng | Hướng đang di chuyển; nếu đứng yên thì hướng nhân vật đang quay mặt. Lướt trên không giữ nguyên độ cao. Không bất tử khi lướt |
| **Đom đóm** | Sức chứa | `10` |
| | Nhặt | Tự động khi khoảng cách XZ `≤ 1.0 m` và chênh cao giữa chân Mây và mặt đất nơi đặt đom đóm `≤ 1.5 m` |
| | Số lượng | `20` lúc bắt đầu tại 20 điểm khác nhau; trần `30`; tại các tick `240, 480, …` sinh thêm `1` ở một điểm trống nếu dưới `30`; hết điểm trống thì bỏ lượt |
| **Đèn lồng** | Chi phí thắp | `10` đom đóm, nạp nhiều lần được, đèn nhớ tiến độ |
| | Tương tác | Trong bán kính `2.0 m`; mỗi lần bấm nạp `min(đang mang, còn thiếu)` vào một đèn. Chỉ xét đèn chưa sáng; chọn đèn gần nhất, bằng nhau thì `id` nhỏ hơn |
| | Vùng an toàn | Đèn đã sáng tạo vùng bán kính `6 m`: Bóng Mực ở ngoài bị chặn ở mép `6 m`. Bóng đang ở trong lúc đèn vừa thắp bị đẩy ra mép trong tối đa `30` tick và không gây sát thương trong lúc đó |
| **Tỏa Sáng** | Chi phí / bán kính / hồi chiêu | `3` đom đóm / `5 m` / `3 s` (`180` tick) |
| | Hiệu ứng | Tâm = chân Mây `+ 0.8 m`. Mục tiêu chốt ngay tick kích hoạt (khoảng cách **3D** tới tâm Bóng Mực `≤ 5 m`). Bóng Mực choáng `120` tick, trong `15` tick đầu bị đẩy lùi tổng `4 m` theo phương ngang (dừng nếu gặp vật cản; trùng vị trí thì đẩy theo `+X`). Pulse lại làm mới choáng và đẩy lùi. Không chết. Không đủ `3` đom đóm thì không kích hoạt |
| **Bóng Mực** | Tốc độ | `4.0 m/s` (Đêm 3: `4.5 m/s`) |
| | Phát hiện / bỏ đuổi | `12 m` / `18 m` |
| | Chạm | Khoảng cách XZ `≤ 1.0 m` và chênh cao `≤ 1.5 m`. Tối đa `1` lần mất Ngọn Lửa mỗi tick. Bóng gây hit lùi `2 m` trong `60` tick (`recoil`); bóng chạm lúc Mây bất tử không làm gì |
| | Lịch sinh | `2` con tại tick `300`, sau đó `1` con mỗi khoảng sinh (tick `300 + 480k` ở Đêm 1); hết điểm hợp lệ thì bỏ lượt. `id`: `S1, S2, …` theo thứ tự sinh |
| **Bị đánh** | Hậu quả | `−1` Ngọn Lửa; rơi `floor(đang mang / 2)` đom đóm ra vành `1.5–2.5 m` quanh Mây (tồn tại `480` tick, nhặt lại được từ tick sau); bất tử `90` tick |
| | Rơi khỏi đảo (`Y < −10`) | Xảy ra đúng `1` lần, bỏ qua bất tử: `−1` Ngọn Lửa, mất toàn bộ đom đóm. Chờ `60` tick (không nhặt, không bị chạm), rồi hồi sinh ở điểm xuất phát, vận tốc `0`, bất tử `90` tick. Hết Ngọn Lửa thì thua ngay, không hồi sinh |
| **Máu** | Ngọn Lửa | `3`, hồi đầy đầu mỗi Đêm |
| **Thời gian** | Đêm 1 / 2 / 3 | `300` / `330` / `360 s` |
| **Thắng / thua** | Điều kiện | Sau mỗi tick: hết Ngọn Lửa → luôn thua (`no_flames`); còn sống và tất cả đèn sáng → thắng (kể cả đúng tick hết giờ); còn lại mà hết giờ → thua (`dawn`) |

### Điểm số (chuẩn hóa)

- `+10` mỗi đom đóm **nạp vào đèn** (`deposit`).
- `+100` mỗi đèn thắp (`lantern_lit`).
- `+5` mỗi Bóng Mực trúng Tỏa Sáng (mỗi con mỗi lần, kể cả con đang choáng).
- Khi thắng: `+ floor(giây còn lại) × 2 + 50 × Ngọn Lửa còn lại`.
- Tổng điểm game là tổng điểm các Đêm đã thắng.

### Thứ tự xử lý trong một tick (bắt buộc)

1. Đọc input (xử lý `pause` trước; nếu vừa tạm dừng thì dừng bước ở đây).
2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi, hồi bùa.
3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo.
4. Nhặt đom đóm và bùa.
5. Tương tác với đèn.
6. Cập nhật vùng an toàn.
7. Tỏa Sáng.
8. Di chuyển Bóng Mực và Gió Lạc.
9. Chạm: Gió Lạc cướp trước, rồi Bóng Mực gây hit (xét theo `id` tăng dần).
10. Sinh đom đóm, Bóng Mực, Gió Lạc theo lịch (thực thể mới chỉ tương tác được từ tick sau).
11. Xét thắng/thua.
12. Ghi snapshot nếu tới lượt.

**Khi đang tạm dừng (`paused`):** `tick` vẫn tăng nhưng `sim_tick`, thời gian, hồi chiêu, spawn, TTL đều đứng yên; snapshot ghi `state: "paused"`.

---

## Phần 2 — Bản đồ chuẩn

Góc đo từ trục `+X`, ngược chiều kim đồng hồ khi nhìn từ trên xuống, trên mặt phẳng XZ (`x = r·cos(θ), z = r·sin(θ)` — lưu ý kiểm chứng theo tọa độ đèn chuẩn L2 `(23.8, 0, 7.7)` ở góc 18° và L1 `(0, 0, 25)` ở góc 90°).

### Đêm 1 — Đảo Bến (chuẩn hóa lại)
- Đảo tròn tâm `(0, 0, 0)`, bán kính `40 m`. Ngoài `40 m` là biển mây (rơi).
- Xuất phát `(0, 0, 0)`, quay mặt về `+Z`.
- Đèn (`L1`..`L5`): `L1 (0, 0, 25)` · `L2 (23.8, 0, 7.7)` · `L3 (14.7, 0, −20.2)` · `L4 (−14.7, 0, −20.2)` · `L5 (−23.8, 0, 7.7)`.
- Điểm sinh đom đóm (24): `8` điểm trên bán kính `12 m` (mỗi `45°`) và `16` điểm trên bán kính `33 m` (mỗi `22.5°`).
- Bóng Mực sinh trên `12` điểm bán kính `37 m` (`15°, 45°, …`), cách người chơi `≥ 15 m`; `2` con lúc giây thứ `5` (tick `300`), sau đó mỗi `8 s` (`480` tick); tối đa `6`.

### Đêm 2 — Đảo Cau (mới)
- Hai đảo tròn bán kính `28 m`, tâm A `(0, 0, 0)` và B `(70, 0, 0)`, nối bằng cầu tre `x ∈ [26, 44], z ∈ [−2, 2]`, không lan can.
- Xuất phát `(0, 0, 0)`, quay mặt về `+Z`.
- Bục nhảy hình tròn bán kính `1 m` tại `(20, 0, 18)` và `(50, 0, −18)`: chân Mây chạm bục thì được bắn lên với vận tốc `Y = 14 m/s` và vận tốc ngang `24 m/s` hướng về tâm đảo kia. Vận tốc phóng giữ nguyên tới khi chạm đất (phím di chuyển không ghi đè; vẫn được lướt). Bay khoảng `1.4 s`, đáp trong đảo đích.
- Điểm sinh đom đóm mỗi đảo (tổng 24): `4` điểm trên bán kính `10 m` (`0°, 90°, 180°, 270°`) và `8` điểm trên bán kính `22 m` (mỗi `45°`).
- Bóng Mực sinh trên `8` điểm bán kính `26 m` mỗi đảo (`22.5°, 67.5°, …`, tổng 16 điểm); sinh mỗi `7 s` (`420` tick), tối đa `8`.
- Đèn (`L1`..`L6` theo thứ tự): `(0, 0, 20)`, `(17, 0, −10)`, `(−17, 0, −10)`, `(70, 0, 20)`, `(87, 0, −10)`, `(53, 0, −10)`.
- Bùa Gió: `C1` tại `(35, 0, 0)`.

### Đêm 3 — Đảo Chuông (mới)
- Đảo tròn bán kính `45 m`, có **3 tầng**:
  - Tầng 0 (`Y = 0`): toàn đảo (`r ≤ 45`).
  - Tầng 1 (`Y = 3`): vành khăn bán kính `12–24 m` ở nửa có `z > 0`.
  - Tầng 2 (`Y = 6`): đĩa bán kính `8 m` ở tâm (`r ≤ 8`).
- Mép các tầng là **vách đứng** (không đi lên được; bước ra thì rơi xuống tầng dưới).
- **2 dốc thẳng** rộng `3 m` dọc theo bán kính ở góc `30°` và `150°`: chân dốc ở bán kính `30 m` (`Y = 0`), đỉnh dốc ở bán kính `24 m` (`Y = 3`).
- **Bục nhảy** bán kính `1 m` tại `(0, 3, 13)`: vận tốc `Y = 12 m/s` và vận tốc ngang `8 m/s` hướng `−Z`, giữ tới khi chạm đất → đáp lên tầng 2.
- **Tháp chuông** cao `8 m` ở tâm tầng 2, hình trụ bán kính `2 m`, không leo được (vật cản).
- Điểm sinh đom đóm (30):
  - Tầng 0: `18` điểm bán kính `34 m` (mỗi `20°` từ `0°`).
  - Tầng 1: `8` điểm bán kính `18 m` (`20°, 40°, …, 160°`).
  - Tầng 2: `4` điểm bán kính `5 m` (`45°, 135°, 225°, 315°`).
- Bóng Mực sinh trên `16` điểm bán kính `43 m` (mỗi `22.5°`); tốc độ `4.5 m/s`, sinh mỗi `6 s` (`360` tick), tối đa `10`.
- Đèn (`L1`..`L7`): `(0, 6, 6)`, `(18, 3, 10)`, `(−18, 3, 10)`, `(35, 0, −10)`, `(−35, 0, −10)`, `(20, 0, −35)`, `(−20, 0, −35)`.
- Bùa Gió: `C1 (30, 0, 25)` và `C2 (−30, 0, 25)`.
- **Gió mạnh:** mỗi `30 s` (`1800` tick) có một cơn gió kéo dài `5 s` (`300` tick) theo hướng ngẫu nhiên, đẩy người chơi `2 m/s`; báo trước `2 s` (`120` tick) bằng lá bay và âm thanh.

---

## Phần 3 — Tính năng mới & Tiêu chí nghiệm thu (Acceptance Criteria)

| # | Tính năng | Yêu cầu chi tiết | Tiêu chí nghiệm thu (Acceptance Criteria) |
|---|---|---|---|
| **F1** | **Lướt (Dash)** | `14 m/s`, `0.2 s` (`12` tick), hồi chiêu `1.5 s` (`90` tick) từ lúc bắt đầu. Theo hướng đang đi hoặc hướng mặt khi đứng yên; trên không giữ nguyên độ cao; không bất tử. | - AC1.1: Kích hoạt `dash` (rising edge) phát event `dash {}`, di chuyển `14 m/s` trong đúng `12` tick (`2.8 m`), sau đó không kích hoạt lại được trong `90` tick (trừ khi có Bùa Gió).<br>- AC1.2: Lướt trên không giữ nguyên `player.pos[1]` trong suốt `12` tick; vẫn bị Bóng Mực đánh nếu chạm. |
| **F2** | **Gió Lạc (Đêm 2 & 3)** | Dải lụa xám xanh (`#8FA3B8`), bay nhanh `7 m/s`, tối đa `2` con, sinh tại tick `1200, 2400, …` trên điểm sương ngẫu nhiên, id `D1, D2, …`. Trạng thái `idle` (lượn chậm `2 m/s`) → `chase` → `flee` → `removed`. | - AC2.1: Chuyển `idle → chase` khi `carried ≥ 5` và khoảng cách `≤ 15 m`; mất điều kiện thì về `idle`.<br>- AC2.2: Chạm (`XZ ≤ 1.2 m`) cướp `min(3, carried)` đom đóm, phát `drifter_steal`, chuyển `flee` bay xa Mây `7 m/s` trong `240` tick rồi `removed` cùng số đã cướp. Mỗi con chỉ cướp `1` lần.<br>- AC2.3: Tỏa Sáng trúng lúc `chase` → `flee` không cướp; trúng lúc `flee` có đồ → thả lại toàn bộ thành đom đóm rơi (`drifter_drop`), biến mất sau `120` tick.<br>- AC2.4: Không gây mất Ngọn Lửa; không bị chặn bởi vùng an toàn đèn; bỏ qua bất tử của Mây. |
| **F3** | **Bùa Gió (Đêm 2 & 3)** | Lá bùa đỏ viền vàng (`#C8102E` / `#F2C14E`), id `C1, C2`. Nhặt theo luật đom đóm. Hiệu lực `600` tick (nhặt lại thì làm mới): chạy `7.2 m/s` + Lướt không hồi chiêu (vẫn cần nhấn lại nút, nhấn khi đang lướt bị bỏ qua, lướt vẫn `14 m/s` trong `12` tick). Hồi lại sau `2700` tick. | - AC3.1: Chạm bùa khả dụng phát `charm_picked {charm_id, charm_ticks: 600}`, `available` thành `false`, `respawn_s` đếm ngược `45 s` (`2700` tick).<br>- AC3.2: Trong `600` tick hiệu lực, tốc độ chạy đạt `7.2 m/s` và `dash` không có cooldown giữa các lần lướt; hết `600` tick trở về `6.0 m/s` và cooldown `1.5 s`. |
| **F4** | **Chuỗi 3 Đêm** | Menu chính → giới thiệu Đêm (tên đảo, lời Ông Đăng) → chơi → kết quả → Đêm kế tiếp. Thắng Đêm 3 hiện màn hình Bình Minh với tổng điểm. Thua được chơi lại Đêm đó. | - AC4.1: Có thể đi trọn luồng Menu → Intro Đêm 1 → Chơi → Thắng → Intro Đêm 2 → … → Màn hình Bình Minh có tổng điểm 3 Đêm.<br>- AC4.2: Khi thua ở bất kỳ Đêm nào, nút "Chơi lại Đêm" khởi động lại đúng Đêm đó với 3 Ngọn Lửa đầy. |
| **F5** | **Tạm dừng (`Esc`/`P`)** | Logic dừng hoàn toàn. Có Tiếp tục / Chơi lại Đêm / Cài đặt / Về menu. | - AC5.1: Nhấn `Esc` hoặc `P` (hoặc input `pause` rising edge) phát `paused {}`, chuyển `state: "paused"`, đóng băng `sim_tick`, thời gian, hồi chiêu, spawn, TTL.<br>- AC5.2: Nhấn tiếp tục phát `resumed {}` và chạy tiếp đúng trạng thái trước đó; UI có đủ 4 nút chức năng. |
| **F6** | **Cài đặt lưu bền vững** | Âm lượng và độ nhạy chuột lưu giữa các lần mở game. | - AC6.1: Chỉnh âm lượng / độ nhạy chuột trong menu Cài đặt sẽ lưu vào `localStorage` và tự động khôi phục sau khi reload trình duyệt. |
| **F7** | **Âm thanh đầy đủ** | Nhạc nền đêm + SFX cho: nhặt, thắp đèn, tỏa sáng, bị đánh, nhảy, lướt, thắng, thua, Bóng Mực xuất hiện, đếm ngược 10 s cuối. | - AC7.1: Tất cả 10 loại SFX + nhạc nền đêm (tôn trọng mức âm lượng trong Cài đặt) kích hoạt đúng sự kiện tương ứng khi chơi trên trình duyệt. |
| **F8** | **HUD đầy đủ** | Ngọn Lửa (trên trái), đồng hồ `mm:ss` (trên giữa, đỏ + nhấp nháy khi `≤ 30 s`), đèn `k/n` và điểm (trên phải), thanh đom đóm 10 ô (dưới giữa), biểu tượng hồi chiêu Lướt & Tỏa Sáng (dưới phải), nhắc `"E — Nạp ánh sáng (x/10)"` gần đèn, mũi tên chỉ tới đèn chưa sáng gần nhất khi ngoài màn hình. | - AC8.1: Kiểm tra trực quan bằng ảnh chụp màn hình đủ mọi thành phần HUD đúng vị trí, đồng hồ đổi đỏ nhấp nháy khi `≤ 30 s`, hiện prompt `E` khi đứng trong `2.0 m` gần đèn chưa sáng, và hiện mũi tên chỉ hướng khi đèn gần nhất nằm ngoài khung hình. |
| **F9** | **Bảng màu & Ánh sáng chuẩn** | Bảng màu chuẩn (sai lệch `≤ 10%` mỗi kênh RGB). Ánh sáng môi trường = `0.15 + 0.55 × (đèn sáng / tổng đèn)`. | - AC9.1: Dùng đúng mã Hex chuẩn trong bảng bên dưới cho mọi vật liệu/UI tương ứng.<br>- AC9.2: Cường độ ambient light cập nhật chính xác theo `0.15 + 0.55 * (lit / total)` mỗi khi đèn được thắp. |

### Bảng màu chuẩn (sai lệch tối đa 10% mỗi kênh RGB)

| Dùng cho | Hex chuẩn |
|---|---|
| Trời đêm / sương | `#0E1430` / `#1B2350` |
| Cỏ / cát / gỗ / biển mây | `#2F5D50` / `#C9B48A` / `#6B4A2F` / `#12384A` |
| Đèn sáng / lõi / đèn tắt | `#FFB347` / `#FFE9B0` / `#5B5F6E` |
| Đom đóm lõi / quầng | `#FFF6C2` / `#FFE58A` |
| Bóng Mực thân / viền / bị choáng | `#120A1A` / `#7A3CFF` / `#3A3450` |
| Áo Mây / khăn Mây và Bùa Gió | `#E8E2D0` / `#C8102E` |
| Viền vàng, điểm số / Gió Lạc | `#F2C14E` / `#8FA3B8` |
| UI nguy hiểm / chữ UI | `#FF5A5F` / `#F5F1E6` |

---

## Phần 4 — Test Contract v1.1 (thay đổi so với v1.0)

1. **`game.contract.json`:**
   - `contract_version: "1.1"`.
   - `tuning` khớp chính xác số chuẩn Phần 1, bổ sung thêm các khóa:
     - `dash_speed: 14`, `dash_duration_s: 0.2`, `dash_cooldown_s: 1.5`
     - `night2_duration_s: 330`, `night3_duration_s: 360`
2. **CLI:** `--night` nhận `1`, `2`, `3`.
3. **Snapshot:**
   - Gốc thêm: `night`, `wind: { active, dir_deg }`.
   - `player` thêm: `vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`.
   - Mảng **bắt buộc** trong snapshot:
     - `motes`: `[{ id, pos, kind: "random" | "dropped", ttl_s }]`
     - `drifters`: `[{ id, pos, state, stolen }]`
     - `charms`: `[{ id, available, respawn_s }]`
4. **Scenario:**
   - Thêm `player.{ invuln_ticks, dash_cd_ticks, pulse_cd_ticks, charm_ticks }`.
   - Thêm `shades[].{ state, state_ticks_left }`.
   - Thêm `drifters`, `charms`, cờ `random_drifters`, `wind_enabled` (mảng `drifters`, `charms` thay thế danh sách mặc định).
5. **Input:**
   - Thêm `dash` và `pause` (đều kích hoạt theo rising edge `false → true`).
6. **Sự kiện mới (JSONL):**
   - `dash`: `{}`
   - `charm_picked`: `{ "charm_id": "C1", "charm_ticks": 600 }`
   - `drifter_steal`: `{ "drifter_id": "D1", "amount": n, "carried": n }`
   - `drifter_drop`: `{ "drifter_id": "D1", "amount": n }`
   - `night_start`: `{ "night": 1 | 2 | 3 }`
   - `paused`: `{}`
   - `resumed`: `{}`
   - `player_hit` do rơi khỏi đảo (`by: "fall"`) thêm trường `lost` (số đom đóm bị mất).
7. **Tên trạng thái Bóng Mực (bắt buộc chính xác):** `spawning`, `wander`, `chase`, `recoil`, `stunned`.
8. **Hiệu năng headless:** Chạy một Đêm đầy đủ (tối đa `21.600` tick) phải xong trong **`≤ 30 giây`**.

---

## Định nghĩa hoàn thành (DoD)

- [ ] Có bằng chứng game chạy đúng các yêu cầu của Phase 2.
- [ ] Mọi test ẩn Phase 1 vẫn đạt khi chạy với số chuẩn (**regression**).
- [ ] Tài liệu spec có **acceptance criteria** cho từng mục ở Phần 3 (đã có ở bảng trên).
- [ ] File hướng dẫn agent (`AGENTS.md`) và các skill được cập nhật cho phạm vi mới (thể hiện trong lịch sử git).
- [ ] Bộ test có **ít nhất 1 scenario headless cho mỗi tính năng mới**.
- [ ] Bản thường đạt **`≥ 30 FPS`** trung bình ở độ phân giải **`1280×720`**.
