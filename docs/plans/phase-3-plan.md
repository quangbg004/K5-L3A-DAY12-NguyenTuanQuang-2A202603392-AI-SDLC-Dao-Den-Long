# Kế hoạch triển khai Phase 3 — TICKET-03: "Đèn cạn dầu" (Change Request)

> **Đặc tả yêu cầu:** [Ticket-03.md](../specs/Ticket-03.md)  
> **Tag nộp:** `phase-3` · **Contract:** `v1.2` · **Khung thời gian:** ~30 phút  
> **Nguyên tắc:** Ghi ADR & Changelog rõ ràng → nâng cấp lõi mô phỏng (`src/sim/`) dùng số nguyên `1/60` cho nhiên liệu để không sai số thực → cập nhật có lý do các test Phase 1–2 bị thay thế + bổ sung test Phase 3 → cập nhật 3D/HUD/Chế độ mù màu → kiểm chứng & gắn tag `phase-3`.

---

## 1. Ma trận thay đổi & Tác động lên mã nguồn / Test cũ (Breaking Changes)

| Luật cũ (Phase 1–2) | Luật mới (Phase 3 — `[THAY THẾ]`) | Ảnh hưởng lên code & test hiện tại |
|---|---|---|
| Đèn sáng không nhận đom đóm, sáng vĩnh viễn | Đèn sáng có `fuel` (`max 100`), hao `1/s`, châm dầu `10/mote`, hết dầu tắt (`lantern_out`, `ever_lit = true`), thắp lại tốn `5` | `src/sim/engine.ts`, `src/sim/types.ts`, `src/client/scene.ts`, `src/client/ui.ts` |
| Bóng Mực không bao giờ vào vùng an toàn đèn sáng | Đèn `fuel < 30` mất vùng an toàn; Bóng `wander` nhắm đèn yếu, vào `≤ 2 m` chuyển `drain` hút `5/s` (cộng dồn), phát `fuel_drain` mỗi `60` tick; châm dầu lên `≥ 30` đẩy Bóng ra trong `≤ 30` tick | `src/sim/engine.ts` (`ShadeState` thêm `'drain'`), `tests/scenarios/safe.json` (xác nhận `fuel ≥ 30` vẫn giữ vùng an toàn) |
| Thắng ngay khi tất cả đèn sáng (`all_lit`), thời lượng `300/330/360 s` | Không thắng sớm; thắng khi hết giờ còn sống & `lit ≥ ceil(0.6 × total)` (`dawn_survived`, `3/5`, `4/6`, `5/7`), thời lượng `240/270/300 s` | **Thay thế test `win`** trong `tests/contract.test.ts` (bỏ kỳ vọng `all_lit`, thay bằng test "không thắng sớm khi thắp đủ" + `dawn_survived`) |
| Điểm: `+10`/mote, `+100`/đèn, `+5`/stun, `+2`/giây dư, `+50`/lửa | Điểm: `+5`/mote (thắp/thắp lại/châm dầu), `+100` lần đầu, `+40` thắp lại, `+5` stun thường / `+15` stun từ `drain`, bình minh (chỉ khi thắng) `+50 + floor(fuel)` mỗi đèn sáng + `+50`/lửa, **bỏ thưởng thời gian** | **Cập nhật kỳ vọng điểm** của `deposit` (`200 → 150`) trong `tests/contract.test.ts` kèm giải thích rõ |
| Sức chứa cố định `10` | `capacity = min(20, 10 + 2 × successful_lights)`, reset về `10` đầu Đêm | `src/sim/engine.ts`, HUD `carried / capacity` |
| Thời lượng Đêm 3 `360 s` (`21.600` tick) | Đêm 3 chuẩn `300 s` (`18.000` tick) | Cập nhật `perf` test trong `tests/phase2.test.ts` (chạy đủ Đêm 3 mới `18.000` tick hoặc đặt `time_left_s: 360` nếu muốn giữ benchmark `21.600` tick — ghi rõ lý do) |

---

## 2. Tài liệu quyết định thiết kế & Breaking Changes (DoD bắt buộc)

1. **`docs/adr/ADR-001-lantern-fuel-and-dawn-win.md` (mới):**
   - Mô tả ngắn gọn, rõ ràng: bối cảnh (playtest kết thúc sớm), quyết định mô hình hóa nhiên liệu bằng **số nguyên `fuel60` (`0..6000`, đơn vị `1/60`)** thay vì float, máy trạng thái đèn (`unlit (never_lit)` → `lit (fuel ≥ 30, safe)` ↔ `lit (0 < fuel < 30, vulnerable)` → `unlit (ever_lit, cost 5)`), máy trạng thái Bóng Mực mở rộng thêm `drain`, và chuyển luật thắng từ `all_lit` sang `dawn_survived` cùng thứ tự xử lý bước 2 / bước 11.
2. **`CHANGELOG.md` (mới, ở gốc repo theo gợi ý `SUBMISSION.md`):**
   - Liệt kê tường minh mọi **Breaking Changes** của Phase 3 (Contract `v1.1 → v1.2`), danh sách luật bị `[THAY THẾ]`, và danh sách test cũ được cập nhật kèm lý do.

---

## 3. Kế hoạch nâng cấp mã nguồn chi tiết

### A. Contract & Kiểu dữ liệu (`game.contract.json`, `src/sim/types.ts`, `src/sim/validators.ts`)
- **`game.contract.json`:**
  - `contract_version: "1.2"`.
  - Cập nhật `night1_duration_s: 240`, `night2_duration_s: 270`, `night3_duration_s: 300`.
  - Thêm `fuel_max: 100`, `fuel_decay_per_s: 1.0`, `fuel_per_mote: 10`, `relight_cost: 5`, `win_ratio: 0.6`, `drain_per_s: 5`, `low_fuel_threshold: 30`, `capacity_max: 20`.
  - Cập nhật `score` khớp công thức mới (`per_mote: 5`, `per_lantern: 100`, `per_relight: 40`, `per_stun: 5`, `per_drain_stun: 15`, `per_lit_dawn: 50`, `per_second_left: 0`, `per_flame_left: 50`).
- **`src/sim/types.ts`:**
  - `ShadeState`: thêm `'drain'`.
  - `Lantern`: thêm `fuel: number`, `ever_lit: boolean`, `relit_count: number` (nội bộ engine lưu `fuel60: number`).
  - `Player`: thêm `capacity: number`.
  - `Scenario`: mở rộng `lanterns[]` (`lit`, `fuel`, `ever_lit`), `player.successful_lights`, `shades[].target_lantern_id`.
- **`src/sim/validators.ts`:**
  - Chấp nhận `state: 'drain'`, `target_lantern_id`, `fuel`, `ever_lit`, `successful_lights`; báo lỗi exit code `2` nếu sai kiểu/giá trị âm bất hợp lệ.

### B. Lõi mô phỏng (`src/sim/engine.ts`)
Tuân thủ tuyệt đối **thứ tự 12 bước của Ticket-02** kèm bổ sung chính xác của Ticket-03:

1. **Khởi tạo Scenario:**
   - Nếu đèn có `lit: true` và không truyền `fuel` → `fuel60 = 6000` (`fuel = 100`). Nếu truyền `fuel` → `fuel60 = Math.round(fuel * 60)`. Đèn đặt `lit: true` có `ever_lit = l.ever_lit ?? true`. Đèn tắt có `fuel60 = 0`, `ever_lit = l.ever_lit ?? false`.
   - `successful_lights = scenario.player?.successful_lights ?? 0` (đèn đặt sẵn `lit: true` không cộng vào `successful_lights`).
   - `capacity = Math.min(20, 10 + 2 * successful_lights)`.
   - Nếu `scenario.shades[]` có `state: 'drain'` và `target_lantern_id`, khởi tạo đúng mục tiêu và bộ đếm `drain_ticks = 0`.
2. **Bước 2 (Giảm bộ đếm & Trừ dầu) + Bước 2b (Tắt đèn cạn dầu):**
   - Với mỗi đèn đang sáng (`lit`): trừ `1` khỏi `fuel60` (hao hụt thụ động `1/60`).
   - Với mỗi Bóng Mực đang ở trạng thái `drain` nhắm vào đèn `L` đang sáng (theo `id` tăng dần): trừ `5` khỏi `L.fuel60` (cộng dồn), tăng `shade.drainTicks++`; nếu `shade.drainTicks % 60 === 0` thì phát `fuel_drain { lantern_id: L.id, shade_id: shade.id, fuel: round1(Math.max(0, L.fuel60) / 60) }`.
   - **Ngay sau bước 2:** với mỗi đèn đang sáng có `fuel60 <= 0`: đặt `lit = false`, `fuel60 = 0`, `deposited = 0`, `ever_lit = true`, phát `lantern_out { lantern_id }`. Bóng đang `drain` đèn này chuyển về `wander` (`target_lantern_id = null`, `drainTicks = 0`).
3. **Bước 4 (Nhặt đom đóm):** Dùng `this.capacity` động thay cho `t.carry_capacity` cố định.
4. **Bước 5 (Tương tác đèn — `interact`):**
   - Lọc ứng viên trong `XZ ≤ 2.0 m` (và `ΔY ≤ 1.5 m` cùng tầng): chỉ chọn đèn `!lit` HOẶC `(lit && fuel60 < 6000)`. Đèn đầy dầu (`fuel60 >= 6000`) **bị bỏ qua**.
   - Sắp xếp theo khoảng cách XZ tăng dần, bằng nhau thì `id` tăng dần.
   - **Nhánh đèn tắt:** `cost = lamp.ever_lit ? 5 : 10`; `amount = Math.min(carried, cost - lamp.deposited)`; `carried -= amount`; `lamp.deposited += amount`; `score += amount * 5`; phát `deposit { lantern_id, amount, deposited }`. Khi `lamp.deposited === cost`:
     - `const relight = lamp.ever_lit;`
     - `lamp.lit = true; lamp.fuel60 = 6000; lamp.ever_lit = true; if (relight) lamp.relit_count++;`
     - `successful_lights++;` (cập nhật `capacity = min(20, 10 + 2 * successful_lights)`).
     - `score += relight ? 40 : 100;`
     - Phát `lantern_lit { lantern_id, relight }`.
     - Kích hoạt đẩy Bóng Mực trong vùng an toàn `6 m` (`≤ 30` tick, không gây sát thương).
   - **Nhánh đèn sáng chưa đầy dầu:**
     - `const used = Math.min(carried, Math.ceil((6000 - lamp.fuel60) / 600));`
     - Nếu `used > 0`: `const wasLow = lamp.fuel60 < 1800;` `carried -= used;` `lamp.fuel60 = Math.min(6000, lamp.fuel60 + used * 600);` `score += used * 5;` phát `refuel { lantern_id, amount: used, fuel: round1(lamp.fuel60 / 60) }`.
     - Nếu `wasLow && lamp.fuel60 >= 1800`: kích hoạt đẩy Bóng Mực trong vùng `6 m` ra mép trong `≤ 30` tick không gây sát thương.
5. **Bước 6 (Vùng an toàn):** Chỉ áp dụng cho đèn `lit && fuel60 >= 1800` (`fuel ≥ 30`). Đèn `fuel60 < 1800` không chặn và không đẩy Bóng Mực.
6. **Bước 7 (Tỏa Sáng):** Chốt `wasDraining = (s.state === 'drain')` trước khi chuyển sang `stunned`; cộng `+15` nếu `wasDraining`, ngược lại `+5`; reset `s.targetLanternId = null; s.drainTicks = 0`.
7. **Bước 8 (Di chuyển Bóng Mực):**
   - Hết `stunned` → chuyển `wander` (xác minh rõ theo spec).
   - `wander`: nếu Mây cách `≤ 12 m` → `chase`. Ngược lại, tìm đèn sáng có `fuel60 < 1800` gần nhất (tie-break `id` nhỏ hơn); nếu không có thì tìm đèn tắt gần nhất (tie-break `id` nhỏ hơn). Di chuyển tới mục tiêu; nếu mục tiêu là đèn yếu (`lit && fuel60 < 1800`) và khoảng cách XZ `≤ 2.0 m` → chuyển `drain` (`targetLanternId = target.id`, `drainTicks = 0`).
   - `drain`: nếu Mây cách `≤ 6 m` → `chase`; else nếu đèn mục tiêu tắt hoặc `fuel60 >= 1800` hoặc khoảng cách XZ `> 2.0 m` → `wander`; else đứng yên.
   - `chase`: không đổi sang đèn yếu; bỏ đuổi khi `> 18 m` → `wander`.
8. **Bước 11 (Xét thắng/thua — sau mọi cập nhật của tick):**
   - `if (p.flames <= 0)` → `lost`, `reason: 'no_flames'` (ưu tiên tuyệt đối, kể cả ở tick bình minh).
   - `else if (this.timeLeft <= 0)`:
     - `litCount = lanterns.filter(l => l.lit).length`, `need = Math.ceil(0.6 * lanterns.length)`.
     - Nếu `litCount >= need` → `won`, `reason: 'dawn_survived'`, cộng thưởng bình minh: `lanterns.filter(l => l.lit).reduce((sum, l) => sum + 50 + Math.floor(l.fuel60 / 60), 0) + p.flames * 50`.
     - Ngược lại → `lost`, `reason: 'dawn'`.
9. **Bước 12 (Snapshot v1.2):**
   - Đèn xuất `fuel: l.lit ? round1(l.fuel60 / 60) : 0`, `ever_lit: l.ever_lit`, `relit_count: l.relit_count`.
   - `player` xuất `capacity: this.capacity`.

### C. Hình ảnh 3D, HUD & Chế độ mù màu (`src/client/`)
1. **`src/client/palette.ts` & `src/client/ui.ts` (Chế độ mù màu):**
   - Thêm cài đặt `"Bảng màu dễ phân biệt"` (`colorblind: boolean`) lưu trong `localStorage` cùng âm lượng & độ nhạy chuột.
   - Khi bật:
     - Viền & mắt Bóng Mực đổi từ `#7A3CFF` → **`#00B3FF`**.
     - Màu cảnh báo UI đổi từ `#FF5A5F` → **`#FFFFFF`** kèm tiền tố/biểu tượng **`⚠`** (áp dụng cho đồng hồ `≤ 30 s`, cảnh báo đèn yếu/mất máu).
2. **`src/client/scene.ts` (Đèn cạn dầu, Hình dáng không phụ thuộc màu & Bóng hút dầu):**
   - **Đèn tắt (mọi chế độ):** xẹp `20%` chiều cao (`scale.y = 0.8`) + vẽ họa tiết **vết rách** rõ ràng trên thân giấy đèn để phân biệt ngay cả khi không dùng màu.
   - **Đèn sáng:** dựng lại đủ kích thước `100%`, hiển thị **thanh dầu (fuel bar)** phía trên đèn; khi `fuel < 30`, cả ánh sáng đèn và thanh dầu **nhấp nháy chậm `1 Hz`** (chu kỳ `1 s`).
   - **Ánh sáng môi trường:** tự động tăng/giảm theo `0.15 + 0.55 * (lit / total)` mỗi khi đèn thắp hoặc tắt vì cạn dầu.
   - **Bóng Mực trạng thái `drain`:** hiệu ứng luồng mực hút từ đèn và cập nhật màu mắt/viền theo chế độ mù màu.
3. **`src/client/ui.ts` (HUD cập nhật Phase 3):**
   - Thanh đom đóm hiển thị động `carried / capacity` (mở rộng tối đa 20 ô hoặc hiển thị số `x / cap` rõ ràng kèm thanh tiến độ).
   - Nhắc tương tác thích ứng ngữ cảnh:
     - Đèn tắt chưa từng sáng: `"E — Nạp ánh sáng (x/10)"`
     - Đèn tắt đã từng sáng (`ever_lit`): `"E — Thắp lại (x/5)"`
     - Đèn sáng chưa đầy dầu: `"E — Châm dầu (fuel%)"`
   - Hiển thị ngưỡng giữ sáng tới bình minh ở HUD đèn (ví dụ `Đèn 3/5 · Cần ≥3 tới bình minh`) và giữ `≥ 30 FPS` ở `1280×720`.

---

## 4. Kế hoạch kiểm chứng & Cập nhật Harness

1. **Cập nhật test cũ có lý do rõ ràng:**
   - `tests/contract.test.ts`:
     - `deposit`: cập nhật điểm kỳ vọng `200 → 150` (công thức điểm mới `+5`/mote).
     - `win`: đổi thành test xác nhận **không thắng sớm khi thắp đủ đèn** + scenario `dawn-survived` xác nhận thắng bình minh với `reason: 'dawn_survived'` và điểm thưởng mới.
     - `pulse`: xác nhận hết choáng về `wander` (hoặc `chase` nếu trong tầm `12 m` sau khi qua bước `wander`).
   - `tests/phase2.test.ts`: cập nhật `perf` cho thời lượng Đêm 3 mới (`300 s` = `18.000` tick) và xác nhận toàn bộ test không bị thay thế (`dash`, `air-dash`, `fall`, `pause`, `night2-bridge`, `night2-pad`, `night2-drifter-charm`, `night3-ramp`, `night3-pad`, `night3-wind`) vẫn xanh 100%.
2. **Thêm bộ test mới `tests/phase3.test.ts` + Scenarios (`tests/scenarios/`):**
   - `fuel-decay-out-relight`: đèn hao `1/60` chính xác, tắt ở `fuel <= 0` (`lantern_out`), thắp lại tốn `5` (`lantern_lit { relight: true }`, `+40` điểm, `relit_count: 1`, `capacity` tăng `10 → 12`).
   - `refuel-and-safe-push`: châm dầu đèn chưa đầy (`used = ceil((100-fuel)/10)`, `+5*used`, `refuel`), đèn đầy bị bỏ qua, châm từ `< 30` lên `≥ 30` đẩy Bóng trong `6 m` ra mép không gây sát thương.
   - `shade-drain-and-pulse`: đèn `fuel == 30` còn vùng an toàn; `fuel < 30` mất vùng an toàn; Bóng `wander` đi tới đèn yếu, vào `≤ 2 m` chuyển `drain`, 2 con hút cộng dồn `10/s + 1/s`, phát `fuel_drain` mỗi `60` tick; Pulse trúng Bóng đang `drain` cộng `+15` điểm; Mây vào `6 m` chuyển `drain → chase`.
   - `dawn-win-lose-priority`: không thắng sớm khi `5/5` sáng; thắng `dawn_survived` khi `3/5` (Đêm 1) / `4/6` (Đêm 2) / `5/7` (Đêm 3) kèm đúng điểm thưởng bình minh; thua `dawn` khi `2/5`; chết đúng tick cuối vẫn thua `no_flames`.
   - `capacity-cap`: tăng dần `10 → 12 → ... → 20` và không vượt `20`, đèn đặt sẵn trong scenario không tăng `capacity`.
3. **Kiểm chứng trình duyệt (`tests/phase3-proof.mjs` ở `1280×720`):**
   - Chụp ảnh bằng chứng: đèn tắt xẹp `20%` có vết rách, đèn sáng có thanh dầu & nhấp nháy `1 Hz` khi `< 30`, Bóng Mực đang `drain`, HUD `carried / capacity`, bật `"Bảng màu dễ phân biệt"` (viền Bóng Mực `#00B3FF`, cảnh báo `#FFFFFF` + `⚠`) và reload kiểm tra lưu cài đặt, màn thắng `dawn_survived` + đo FPS `≥ 30`.
4. **Cập nhật Harness AI:**
   - Cập nhật `AGENTS.md` (Contract `v1.2`, luật trừ dầu bước 2 & tắt đèn ngay sau bước 2, 6 trạng thái Bóng Mực gồm `drain`, luật thắng `dawn_survived`, lưu ý `Ticket-03.md`).
   - Cập nhật `.agents/skills/verify-phase/SKILL.md` bổ sung bước chạy `tests/phase3.test.ts` và `tests/phase3-proof.mjs`.

---

## 5. Lộ trình thực hiện (tối ưu trong ~30 phút, commit nhỏ gọn)

1. **Commit 1 — ADR, Changelog, Contract v1.2 & Harness:** Tạo `docs/adr/ADR-001-lantern-fuel-and-dawn-win.md`, `CHANGELOG.md`, cập nhật `game.contract.json` (`v1.2`), `AGENTS.md`, `.agents/skills/verify-phase/SKILL.md`.
2. **Commit 2 — Lõi mô phỏng v1.2 (`src/sim/`):** Cập nhật `types.ts`, `validators.ts`, `engine.ts` (nhiên liệu `1/60`, `refuel`, `lantern_out`, `relight`, `drain` & `fuel_drain`, `capacity` động, luật thắng `dawn_survived`, điểm mới).
3. **Commit 3 — Test Phase 3 & Cập nhật Regression Phase 1–2 (`tests/`):** Cập nhật `contract.test.ts` & `phase2.test.ts` có lý do rõ ràng, thêm `tests/phase3.test.ts` + các scenario v1.2, chạy `npm run verify:all` xanh 100%.
4. **Commit 4 — 3D Visuals, HUD & Chế độ mù màu (`src/client/`):** Thanh dầu + nhấp nháy `1 Hz`, đèn tắt xẹp `20%` có vết rách, chế độ `"Bảng màu dễ phân biệt"` (`#00B3FF`, `#FFFFFF` + `⚠`) lưu `localStorage`, HUD `carried / capacity` & prompt ngữ cảnh.
5. **Commit 5 — Bằng chứng Phase 3 & Gắn tag `phase-3`:** Chạy `tests/phase3-proof.mjs` (`1280×720`), lưu `docs/proof/phase-3.md`, cập nhật `docs/TIEN-DO.md`, `docs/notes/ai-log.md`, `README.md`, gắn tag `phase-3`.
