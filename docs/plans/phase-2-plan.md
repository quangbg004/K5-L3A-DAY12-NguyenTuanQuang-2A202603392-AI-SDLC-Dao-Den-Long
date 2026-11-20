# Kế hoạch triển khai Phase 2 — TICKET-02: "Ba hòn đảo"

> **Đặc tả yêu cầu:** [Ticket-02.md](../specs/Ticket-02.md)  
> **Tag nộp:** `phase-2` · **Contract:** `v1.1`  
> **Nguyên tắc:** Chuẩn hóa số liệu & nâng cấp lõi mô phỏng (`src/sim/`) trước, đảm bảo Test Contract v1.1 + regression Phase 1 xanh 100%, sau đó dựng 3 Đêm 3D, UI/HUD/Audio/Palette chuẩn và đo FPS thực tế ở `1280×720`.

---

## 1. Tác động thay đổi từ Phase 1 → Phase 2 (Breaking Changes cần lưu ý)

| Hạng mục | Phase 1 (`v1.0`) | Phase 2 (`v1.1` — Chuẩn hóa) | Ghi chú xử lý hồi quy |
|---|---|---|---|
| `contract_version` | `"1.0"` | `"1.1"` | Thêm `dash_speed`, `dash_duration_s`, `dash_cooldown_s`, `night2_duration_s`, `night3_duration_s` |
| Di chuyển & Nhảy | `player_speed: 7`, gravity `-18`, clamp ở `r=36`, `fall_enabled: false` | `player_speed: 6.0` (tăng tốc/dừng `≤ 0.1s`), jump `7.0`, gravity `-20`, rơi khỏi đảo `Y < -10`, `fall_enabled: true` | Cập nhật unit test `motion.test.ts` kèm lý do chuẩn hóa |
| Đom đóm | `carry_capacity: 5`, `pickup_radius: 1.8`, cộng `+10` lúc nhặt, sinh mỗi `120` tick tối đa `20` | `carry_capacity: 10`, `pickup_radius: 1.0` & `ΔY ≤ 1.5`, cộng `+10` lúc **nạp vào đèn**, bắt đầu `20`, trần `30`, sinh `+1` ở tick `240, 480, ...` | Cập nhật `pickup.json` / `deposit.json` / `win.json` và ghi rõ lý do thay đổi công thức điểm |
| Đèn lồng | `lantern_cost: 3`, `interact_radius: 3`, `safe_radius: 5`, vị trí R=22 | `lantern_cost: 10`, `interact_radius: 2.0`, `safe_radius: 6.0` (đẩy bóng trong vùng ra trong `≤ 30` tick), vị trí chuẩn Đêm 1/2/3 | Chọn đèn gần nhất chưa sáng, tie-break `id` nhỏ hơn |
| Tỏa Sáng | `pulse_cost: 1`, `pulse_radius: 6` (XZ), `pulse_cooldown_s: 2`, `per_stun: 25`, đẩy tức thì | `pulse_cost: 3`, `pulse_radius: 5` (**3D** từ `player.pos + 0.8m`), `pulse_cooldown_s: 3`, `per_stun: 5`, choáng `120` tick, đẩy `4m` trong `15` tick đầu | Cập nhật `pulse.json` & assert `stunned` + lực đẩy 15 tick |
| Bóng Mực | `shade_speed: 4.2`, `shade_hit_radius: 1.2`, 2 trạng thái (`chase`/`stunned`), sinh 2 con lúc tick 0 | `shade_speed: 4.0` (Đêm 3: `4.5`), `shade_hit_radius: 1.0` & `ΔY ≤ 1.5`, **5 trạng thái chuẩn**: `spawning`, `wander`, `chase`, `recoil`, `stunned`; sinh 2 con tại tick `300`, sau đó mỗi `8/7/6 s` | Ghi rõ trong `docs/notes/phase-2-assumptions.md` |
| Thời lượng | Đêm 1: `180 s` | Đêm 1 / 2 / 3: `300` / `330` / `360 s` | Đọc từ `game.contract.json` |

---

## 2. Kiến trúc mô-đun Phase 2

### A. Lõi mô phỏng (`src/sim/` — thuần TypeScript, 0 phụ thuộc DOM/Three.js)

1. **`src/sim/maps.ts` (mới):**
   - Định nghĩa dữ liệu tĩnh chuẩn xác cho **3 bản đồ** (`night: 1 | 2 | 3`):
     - `NIGHT_MAPS[1]` (Đảo Bến): R=`40 m`, 5 đèn `L1..L5`, 24 điểm đom đóm, 12 điểm Bóng Mực, lịch sinh `8 s` (`480` tick), max `6`, không có Gió Lạc / Bùa Gió / Gió.
     - `NIGHT_MAPS[2]` (Đảo Cau): 2 đảo R=`28 m` tại `(0,0,0)` & `(70,0,0)`, cầu tre `x ∈ [26, 44], z ∈ [-2, 2]`, 2 bục nhảy `(20,0,18)` & `(50,0,-18)` (`vy=14, vh=24`), 6 đèn `L1..L6`, 24 điểm đom đóm, 16 điểm Bóng Mực (mỗi `7 s`, max `8`), Bùa Gió `C1 (35,0,0)`, Gió Lạc bật.
     - `NIGHT_MAPS[3]` (Đảo Chuông): R=`45 m`, 3 tầng (`Y=0`, `Y=3` vành khăn R `12..24` với `z > 0`, `Y=6` đĩa R=`8`), 2 dốc rộng `3 m` ở `30°` và `150°` (R `30→24`, `Y 0→3`), bục nhảy `(0,3,13)` (`vy=12, vh=8` hướng `-Z`), vật cản trụ tháp chuông R=`2 m` H=`8 m` ở `(0,6,0)`, 7 đèn `L1..L7`, 30 điểm đom đóm, 16 điểm Bóng Mực (`4.5 m/s`, mỗi `6 s`, max `10`), Bùa Gió `C1 (30,0,25)` & `C2 (-30,0,25)`, Gió Lạc bật, Gió mạnh bật (mỗi `30 s`, kéo dài `5 s`, báo trước `2 s`, đẩy `2 m/s`).
   - Cung cấp các hàm hình học thuần và tất định:
     - `getGroundHeight(map, x, z, currentY)`: trả về cao độ mặt đất hợp lệ bên dưới chân (hỗ trợ đa tầng, cầu tre, dốc 30°/150°, trả về `-Infinity` ngoài đảo để rơi).
     - `resolveHorizontalObstacles(map, prevPos, nextPos)`: chặn vách đứng (không bước thẳng lên tầng cao hơn nếu không qua dốc/nhảy) và chặn trụ tháp chuông R=`2 m` ở Đêm 3.
     - `checkJumpPad(map, pos)`: kiểm tra chân Mây chạm bục nhảy (R=`1 m` trên đúng tầng) và trả về vector phóng `[vx, vy, vz]`.

2. **`src/sim/types.ts` (cập nhật v1.1):**
   - Bổ sung kiểu cho `Controls` (`dash`, `pause`), `ShadeState` (`'spawning' | 'wander' | 'chase' | 'recoil' | 'stunned'`), `DrifterState` (`'idle' | 'chase' | 'flee' | 'removed'`), `Mote` (`kind: 'random' | 'dropped'`, `ttl_ticks`, `pickup_delay`), `Charm`, `WindState`, `Scenario` mở rộng (`player.{invuln_ticks, dash_cd_ticks, pulse_cd_ticks, charm_ticks}`, `shades[].{state, state_ticks_left}`, `drifters`, `charms`, `random_drifters`, `wind_enabled`).

3. **`src/sim/engine.ts` (nâng cấp tuân thủ chặt 12 bước tick):**
   - Chấp nhận `night: 1 | 2 | 3` trong constructor, phát sự kiện `night_start { night }` khi khởi tạo (nếu chạy bình thường; chú ý không làm hỏng quy tắc dựng scenario không cộng điểm — kiểm tra kỹ quy ước `night_start` ở tick 0 hoặc tick 1 và ghi rõ giả định).
   - Cài đặt chính xác **12 bước trong `step()`**:
     1. **Input & Pause:** xử lý `pause` (rising edge) trước → toggle `playing ↔ paused`, phát `paused {}` / `resumed {}`. Khi đang `paused`, chỉ tăng `tick` (giữ nguyên `sim_tick`, timers, spawns, TTL) và dừng bước.
     2. **Giảm bộ đếm:** `sim_tick++`, giảm `invuln`, `dash_cd`, `pulse_cd`, `charm`, `fall_wait`, `wind_timer`, `stun`/`recoil`/`safe_push` của Bóng Mực, `flee_timer` của Gió Lạc, `ttl` đom đóm rơi (xóa khi hết 480 tick), `respawn` của Bùa Gió.
     3. **Di chuyển Mây:**
        - Nếu đang chờ hồi sinh sau khi rơi (`fall_wait > 0`): bỏ qua di chuyển; khi về `0` hồi sinh tại spawn `(0,0,0)`, vận tốc `0`, bất tử `90` tick.
        - Xử lý tăng/giảm tốc mượt trong `≤ 0.1 s` (`≤ 6` tick) về vận tốc mục tiêu (`6.0` hoặc `7.2 m/s` khi có Bùa Gió).
        - Nhảy (`vy = 7.0` khi `grounded`), Lướt (`dash`: `14 m/s`, `12` tick, giữ nguyên `y`, phát `dash {}`), Bục nhảy (khóa ghi đè phím ngang tới khi chạm đất, vẫn cho phép lướt), Gió Đêm 3 (`2 m/s` theo `dir_deg`), Trọng lực (`-20 m/s²`), va chạm mặt đất / vách đứng / tháp chuông.
        - Kiểm tra rơi khỏi đảo (`Y < -10`): chỉ xảy ra 1 lần mỗi cú ngã, bỏ qua bất tử, `flames -= 1`, `lost = carried`, `carried = 0`, phát `player_hit { by: 'fall', flames, dropped: 0, lost }`; nếu `flames > 0` đặt `fall_wait = 60`.
     4. **Nhặt đom đóm & Bùa Gió:** bỏ qua nếu `fall_wait > 0`. Đom đóm: `XZ ≤ 1.0 m`, `|player.y - mote.y| ≤ 1.5 m`, `pickup_delay === 0`, `carried < 10` → `mote_picked { carried }`. Bùa Gió: `available === true`, cùng điều kiện khoảng cách → `charm_ticks = 600`, `respawn_ticks = 2700`, phát `charm_picked { charm_id, charm_ticks: 600 }`.
     5. **Tương tác đèn (`interact` rising edge):** lọc đèn chưa sáng trong `XZ ≤ 2.0 m` (và cùng tầng hợp lý), sắp xếp theo khoảng cách tăng dần → tie-break theo `id` nhỏ hơn. Nạp `amount = min(carried, 10 - deposited)`, cộng `score += amount * 10`, phát `deposit`. Nếu đạt `10`: `lit = true`, `score += 100`, phát `lantern_lit`, đánh dấu Bóng Mực đang trong vùng `6 m` bị đẩy ra trong tối đa `30` tick.
     6. **Cập nhật vùng an toàn (`6 m` quanh đèn sáng):** đẩy Bóng Mực đang ở trong ra mép `6 m` (tối đa `30` tick, không gây sát thương trong lúc bị đẩy) và chặn Bóng Mực bên ngoài không vượt mép `6 m`.
     7. **Tỏa Sáng (`pulse` rising edge):** cần `pulse_cd === 0` và `carried >= 3`. Trừ `3` đom đóm, đặt `pulse_cd = 180`. Tâm xung = `[p.x, p.y + 0.8, p.z]`. Chốt tất cả Bóng Mực có khoảng cách **3D** tới tâm Bóng Mực `≤ 5.0 m`: choáng `120` tick (`stunned`), đẩy lùi tổng `4 m` trong `15` tick đầu (trùng vị trí đẩy theo `+X`, dừng nếu gặp vật cản), cộng `+5` điểm mỗi con (kể cả đang choáng). Đồng thời xử lý Gió Lạc trong phạm vi `5 m`: đang `chase` → `flee` không cướp; đang `flee` có đồ → thả toàn bộ thành đom đóm rơi (`drifter_drop`), đặt `flee_timer = 120`. Phát `pulse { stunned_ids }`.
     8. **Di chuyển Bóng Mực & Gió Lạc:**
        - Bóng Mực: `spawning` (chờ kết thúc spawn) → `wander` / `chase` (phát hiện `≤ 12 m`, bỏ đuổi `> 18 m`, tốc độ `4.0` hoặc `4.5 m/s` ở Đêm 3) / `recoil` (lùi `2 m` trong `60` tick sau khi đánh) / `stunned` (đẩy trong `15` tick đầu, đứng yên phần còn lại).
        - Gió Lạc: `idle` (`2 m/s` lượn quanh), chuyển `chase` (`7 m/s`) khi `carried >= 5` & `d ≤ 15 m` (mất điều kiện về `idle`), `flee` (`7 m/s` bay ra xa Mây trong `240` tick hoặc `120` tick sau khi bị Pulse đánh rơi đồ) → `removed`.
     9. **Chạm (theo `id` tăng dần):** bỏ qua nếu `fall_wait > 0`.
        - **Gió Lạc trước:** nếu `state !== 'flee' && state !== 'removed'` và chưa từng cướp và `XZ ≤ 1.2 m` và `carried > 0` → cướp `amount = min(3, carried)`, `carried -= amount`, chuyển `flee` (`240` tick), phát `drifter_steal { drifter_id, amount, carried }`.
        - **Bóng Mực sau:** nếu `invuln === 0`, Bóng Mực không ở trạng thái `stunned`/`spawning`/`recoil` và không đang bị đẩy khỏi vùng an toàn, `XZ ≤ 1.0 m` & `ΔY ≤ 1.5 m` → tối đa `1` lần mất Ngọn Lửa/tick: `flames -= 1`, `dropped = floor(carried / 2)`, sinh `dropped` đom đóm rơi (`kind: 'dropped'`, `ttl = 480`, `pickup_delay = 1`) trên vành `1.5–2.5 m`, `invuln = 90`, Bóng gây hit chuyển `recoil` (`2 m` trong `60` tick), phát `player_hit { by: 'shade', flames, dropped }`.
     10. **Sinh thực thể theo lịch:** đom đóm tại `sim_tick % 240 === 0` (nếu `< 30` và còn điểm trống); Bóng Mực `2` con tại `sim_tick === 300`, sau đó `1` con mỗi `480/420/360` tick (cách Mây `≥ 15 m`, chưa đạt trần `6/8/10`); Gió Lạc ở Đêm 2 & 3 tại `sim_tick = 1200, 2400, ...` (tối đa `2`, id `D1, D2, ...`). Thực thể mới không tương tác trong chính tick sinh ra.
     11. **Xét thắng/thua:** `flames <= 0` → `lost (no_flames)`; else tất cả đèn sáng → `won (all_lit)` + cộng thưởng `floor(time_left_s) * 2 + 50 * flames`; else `time_left_s <= 0` → `lost (dawn)`.
     12. **Snapshot:** trả về đúng cấu trúc **Test Contract v1.1** (tọa độ làm tròn 3 chữ số thập phân).

4. **`src/sim/validators.ts` & `src/sim/headless.ts` (cập nhật v1.1):**
   - Cho phép `--night 1 | 2 | 3` (khác → exit code `2`).
   - Validate đầy đủ trường mới của `inputs` (`dash`, `pause`) và `scenario` (`drifters`, `charms`, `random_drifters`, `wind_enabled`, `shades[].state`, `player.*_ticks`).
   - Kiểm tra hiệu năng chạy đủ `21.600` tick trong `≤ 30 s` (mục tiêu thực tế `< 0.5 s` trên Node.js).

---

### B. Game 3D, UI, Âm thanh & Bảng màu chuẩn (`src/client/`)

1. **`src/client/palette.ts` (mới):** Khai báo tập trung toàn bộ mã Hex chuẩn từ Phần 3 để dùng thống nhất trong `scene.ts` và `style.css` (đảm bảo sai lệch `0%`, nằm gọn trong ngưỡng `≤ 10%`).
2. **`src/client/scene.ts` (nâng cấp 3 Đêm):**
   - Render đúng hình học của cả 3 bản đồ:
     - Đêm 1: Đảo Bến tròn R=`40 m`, bãi cát viền, cây/đèn cổ tích.
     - Đêm 2: Hai đảo tròn R=`28 m` nối bằng **cầu tre** không lan can (`#6B4A2F`), **2 bục nhảy** phát sáng vòng tròn.
     - Đêm 3: Đảo Chuông R=`45 m` với **3 tầng**, **2 dốc thẳng** ở `30°` & `150°`, **bục nhảy** tầng 1→2, **tháp chuông** cao `8 m` ở đỉnh, hiệu ứng **lá bay** báo trước 2s và trong 5s gió mạnh.
   - Render thực thể mới: **Gió Lạc** (dải lụa xám xanh `#8FA3B8` uốn lượn), **Bùa Gió** (lá bùa đỏ `#C8102E` viền vàng `#F2C14E` xoay nhẹ), hiệu ứng **Lướt (Dash)** của Mây.
   - Ánh sáng môi trường chính xác: `ambientLight.intensity = 0.15 + 0.55 * (lit / total)`.
   - Giữ phần sáng tạo Phase 1 (đèn trời bay lên khi thắp đèn, biển mây trôi) chỉ chạy trên client, tối ưu draw call & geometry pooling để đạt **≥ 30 FPS ở 1280×720**.
3. **`src/client/audio.ts` (nâng cấp):**
   - Nhạc nền đêm nhẹ nhàng (procedural Web Audio pad/pentatonic loop) + đủ 10 SFX: `pickup`, `lantern_lit`, `pulse`, `hit`, `jump`, `dash`, `win`, `lose`, `shade_spawn`, `countdown_10s` (tick nhẹ mỗi giây trong 10s cuối) + âm thanh gió Đêm 3.
   - Tôn trọng mức âm lượng tổng từ Cài đặt.
4. **`src/client/ui.ts` & `src/client/style.css` (nâng cấp toàn diện):**
   - **Luồng 3 Đêm:**
     - **Menu chính** (Bắt đầu hành trình, Chọn Đêm để test/chơi lại, Cài đặt).
     - **Màn hình giới thiệu Đêm** (tên đảo + lời Ông Đăng cho Đêm 1, 2, 3).
     - **Màn hình Kết quả Đêm** (điểm Đêm, nút sang Đêm tiếp theo / Chơi lại Đêm).
     - **Màn hình Bình Minh** khi thắng Đêm 3 (tổng điểm cả 3 Đêm, nút chơi lại từ đầu).
   - **Menu Tạm dừng (`Esc` / `P`):** Tiếp tục / Chơi lại Đêm / Cài đặt / Về menu.
   - **Cài đặt (`localStorage`):** Thanh trượt Âm lượng (`0–100%`) và Độ nhạy chuột (`0.2–2.0x`), lưu bền vững giữa các lần mở lại trình duyệt.
   - **HUD đầy đủ đúng vị trí:**
     - Trên trái: **Ngọn Lửa** (3 biểu tượng).
     - Trên giữa: **Đồng hồ `mm:ss`** (đổi màu `#FF5A5F` và nhấp nháy khi `≤ 30 s`).
     - Trên phải: **Đèn `k/n`** và **Điểm số** (`#F2C14E`).
     - Dưới giữa: **Thanh đom đóm 10 ô** (`#FFE58A`).
     - Dưới phải: **Biểu tượng hồi chiêu Lướt (`Shift`) & Tỏa Sáng (`Q`)** + chỉ báo Bùa Gió khi đang có buff.
     - Giữa dưới: **Nhắc `"E — Nạp ánh sáng (x/10)"`** khi đứng trong `2.0 m` gần đèn chưa sáng.
     - Viền màn hình: **Mũi tên chỉ hướng** tới đèn chưa sáng gần nhất khi đèn đó nằm ngoài frustum camera 3D.

---

## 3. Kế hoạch kiểm chứng & Hồi quy (Rubric A, B, E)

1. **Cập nhật bộ test Phase 1 (Regression):**
   - Cập nhật các scenario cũ (`pickup`, `deposit`, `pulse`, `hit`, `safe`, `win`, `loss`, `dawn`) sang số liệu chuẩn v1.1 và ghi rõ lý do từng thay đổi trong `docs/notes/phase-2-assumptions.md`.
2. **Viết mới ≥ 1 scenario headless cho MỖI tính năng mới (DoD bắt buộc):**
   - `dash.json` + `dash-inputs.json`: kiểm tra `dash` mặt đất, `dash` trên không giữ độ cao, cooldown `1.5 s`, event `dash`.
   - `fall.json` + `fall-inputs.json`: chạy ra khỏi đảo `r > 40`, rơi `Y < -10`, mất 1 Ngọn Lửa + toàn bộ đom đóm (`lost`), chờ `60` tick hồi sinh `(0,0,0)` + bất tử `90` tick.
   - `pause.json` + `pause-inputs.json`: bấm `pause` → `paused {}`, `sim_tick` & `time_left_s` đóng băng, bấm lại → `resumed {}`.
   - `night2-bridge-pad.json`: Đêm 2 qua cầu tre & kích hoạt bục nhảy `(20,0,18)` bay sang đảo B.
   - `night2-drifter-charm.json`: Đêm 2 nhặt Bùa Gió `C1` (`7.2 m/s`, dash không cooldown), Gió Lạc `D1` đuổi & cướp (`drifter_steal`), Pulse đánh rơi lại (`drifter_drop`).
   - `night3-tiers-wind.json`: Đêm 3 leo dốc `30°`, bục nhảy tầng 1→2, va chạm tháp chuông, gió đẩy `2 m/s`.
   - `determinism-v1.1` & `perf-21600`: chạy 2 lần cùng seed giống từng byte; chạy 1 Đêm đầy đủ `21.600` tick xác nhận `≤ 30 s`.
3. **Kiểm chứng trình duyệt & Đo FPS (`tests/browser-proof.mjs`):**
   - Chạy Playwright ở viewport **`1280×720`**, chụp ảnh bằng chứng: Menu chính, Intro Ông Đăng, Đêm 1/2/3 gameplay với HUD đầy đủ (gồm prompt `E`, mũi tên ngoài màn hình, đồng hồ đỏ `≤ 30s`), Menu Pause, Cài đặt (reload kiểm tra persistence), Màn hình Bình Minh.
   - Đo FPS trung bình trong 5 giây chơi thực tế tại `1280×720` (mục tiêu `≥ 30 FPS`), lưu log vào `docs/proof/phase-2.md`.

---

## 4. Cập nhật AI Harness & Tài liệu

- **`AGENTS.md`:** Cập nhật lên Contract `v1.1`, thêm luật 12 bước tick, `src/sim/maps.ts`, 3 Đêm, trạng thái Bóng Mực chuẩn (`spawning/wander/chase/recoil/stunned`), và lệnh kiểm chứng mới.
- **`.agents/skills/verify-phase/SKILL.md`:** Mở rộng quy trình kiểm chứng cho Phase 2 (regression Phase 1 + scenario Phase 2 + benchmark `21.600` tick + đo FPS `1280×720`).
- **`docs/notes/phase-2-assumptions.md`**, **`docs/proof/phase-2.md`**, **`docs/notes/ai-log.md`**, **`docs/TIEN-DO.md`**, **`README.md`**.

---

## 5. Lộ trình thực hiện theo commit nhỏ

1. **Commit 1 — Spec, Contract v1.1 & Harness:** Cập nhật `game.contract.json` (`v1.1`), `AGENTS.md`, `.agents/skills/verify-phase/SKILL.md`, `docs/notes/phase-2-assumptions.md`.
2. **Commit 2 — Bản đồ chuẩn & Lõi mô phỏng 12 bước (`src/sim/`):** Thêm `maps.ts`, nâng cấp `types.ts`, `engine.ts`, `validators.ts`, `headless.ts`.
3. **Commit 3 — Regression Phase 1 + Scenario & Benchmark Phase 2 (`tests/`):** Chạy `npm run verify:all` xanh 100%, đo tốc độ `21.600` tick.
4. **Commit 4 — Game 3D 3 Đêm, Palette chuẩn, Audio, UI/HUD & Pause (`src/client/`):** Hoàn thiện toàn bộ luồng 3 Đêm + sáng tạo giữ nguyên.
5. **Commit 5 — Bằng chứng trình duyệt (`1280×720` FPS + screenshots) & Tài liệu:** Cập nhật `docs/proof/phase-2.md`, `docs/TIEN-DO.md`, `docs/notes/ai-log.md`, `README.md`, gắn tag `phase-2`.
