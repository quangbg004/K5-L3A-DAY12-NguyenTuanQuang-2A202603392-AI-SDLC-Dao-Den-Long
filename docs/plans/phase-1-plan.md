# Kế hoạch triển khai Phase 1 — PRD-0: Đảo Đèn Lồng

> **Mục tiêu:** Xây dựng hoàn chỉnh **Đêm 1 – Đảo Bến** theo đúng **PRD-0** và **Test Contract v1.0**, đạt điểm tối đa trên các tiêu chí Rubric (A–F), chạy được đa nền tảng (macOS / Linux / Windows) và sẵn sàng mở rộng cho Phase 2–4.

---

## 1. Kiến trúc & Lựa chọn công nghệ

| Thành phần | Công nghệ đề xuất | Lý do |
|---|---|---|
| **Lõi mô phỏng (Simulation Core)** | **TypeScript thuần** (`src/sim/`), biên dịch ra Node.js ESM (`dist-sim/`) | Tách hoàn toàn khỏi đồ họa/DOM; chạy **60 ticks/giây cố định** không cần cửa sổ hay GPU, cực nhanh (<50ms cho 5.000 ticks), dùng chung 100% logic giữa bản chơi 3D và chế độ headless. |
| **Game 3D & UI** | **Three.js + Vite** (`src/client/`) + Web Audio API | Chạy trên trình duyệt ở mọi hệ điều hành (macOS, Linux, Windows) chỉ với Node.js (không cần cài engine nặng hay Docker). Đồ họa 3D low-poly cổ tích + âm thanh tổng hợp hoàn toàn tự tạo (không lo bản quyền asset). |
| **Nguồn cấu hình duy nhất** | `game.contract.json` ở gốc repo | Cả `src/sim/` và `src/client/` đọc trực tiếp thông số `tuning` từ `game.contract.json` → **không bao giờ lệch thông số** giữa game và contract. |
| **Kiểm thử tự động** | **Vitest** + script kiểm chứng Contract CLI + GitHub Actions CI | Chạy toàn bộ unit test, scenario headless và kiểm tra tính tất định chỉ bằng 1 lệnh (`npm run verify:all`). |

### Cấu trúc thư mục dự kiến

```text
.
├── game.contract.json              # Khai báo Test Contract v1.0 (single source of truth)
├── package.json                    # Scripts: build, dev, test, headless, verify:all
├── tsconfig.json / tsconfig.sim.json / vite.config.ts
├── AGENTS.md                       # AI Harness: hướng dẫn ngắn gọn, lệnh, quy ước, luật bất biến
├── .agents/skills/verify-phase/    # AI Harness: skill chạy kiểm chứng & xuất bằng chứng
├── .github/workflows/ci.yml        # CI tự động chạy test + contract check khi push
├── LICENSE                         # MIT
├── CREDITS.md                      # Ghi nguồn thư viện, đồ họa/âm thanh tự tạo, công cụ AI
├── README.md                       # Cài & chạy (<=3 lệnh), điều khiển, tính điểm, "Sáng tạo của tôi"
├── src/
│   ├── sim/                        # Logic thuần (KHÔNG import Three.js hay DOM)
│   │   ├── types.ts                # Kiểu dữ liệu Contract, Snapshot, Event, Scenario, Input
│   │   ├── rng.ts                  # PRNG tất định (Mulberry32) theo --seed
│   │   ├── engine.ts               # Vòng lặp 60 tick/s, vật lý XZ/Y, AI Bóng Mực, điểm số
│   │   ├── validators.ts           # Validate inputs/scenario (lỗi -> exit code 2)
│   │   └── headless.ts             # CLI headless chuẩn Test Contract v1.0
│   └── client/                     # Giao diện 3D Three.js (đọc state từ src/sim/engine.ts)
│       ├── main.ts                 # Vòng lặp fixed-timestep 60Hz, điều khiển, restart
│       ├── scene.ts                # Đảo Bến tròn, biển mây, Mây (nón lá + đèn nhỏ), 5 Đèn Lồng, Đom Đóm, Bóng Mực
│       ├── audio.ts                # Web Audio procedural (chuông ngũ cung, xung sáng, đèn bật)
│       ├── hud.ts                  # HUD: đèn đã thắp, đom đóm mang theo, máu (flames), thời gian, điểm, màn thắng/thua
│       └── style.css               # Phong cách đêm cổ tích (vàng cam ấm / tím đen)
├── tests/
│   ├── unit/                       # Unit test cho từng cơ chế (RNG, move/yaw, pickup, deposit, pulse, hit, win/lose)
│   ├── scenarios/                  # Các file scenario & inputs mẫu theo Test Contract v1.0
│   └── contract.test.ts            # Chạy CLI headless thật, kiểm tra JSONL schema, exit code 2, tính tất định
└── docs/
    ├── plans/
    │   └── phase-1-plan.md         # Kế hoạch triển khai Phase 1
    ├── notes/
    │   ├── phase-1-assumptions.md  # Giả định cho các chỗ mơ hồ trong PRD-0 + bảng tiêu chí nghiệm thu
    │   └── ai-log.md               # Nhật ký dùng AI, lỗi AI (nếu có), ước tính token & cách tiết kiệm
    └── proof/
        └── phase-1.md              # Bảng truy vết Yêu cầu -> Bằng chứng thật (output headless, ảnh chụp 3D)
```

---

## 2. Giả định & Thông số Tuning (`game.contract.json`)

Các chỗ PRD-0 cố ý để mở sẽ được chốt bằng giả định hợp lý, ghi rõ trong `docs/notes/phase-1-assumptions.md` và khai báo chính xác trong `game.contract.json`:

- **Team:** `"2A202603392-NguyenTuanQuang"`
- **Lệnh contract:**
  - `build_cmd`: `"npm install && npm run build"`
  - `run_cmd`: `"npm run start"` (mở server web tĩnh `vite preview` trên macOS/Linux/Windows)
  - `headless_cmd`: `"node dist-sim/headless.js"`
- **Bản đồ Đêm 1 – Đảo Bến:**
  - Hình tròn tâm `(0, 0, 0)`, bán kính đảo `R = 36 m`, mặt đất `Y = 0`.
  - `fall_enabled: false` (người chơi bị giữ mềm trong bán kính đảo, không rơi chết ở Phase 1).
  - 5 Đèn Lồng Lớn (`L1`..`L5`) bố trí đều quanh đảo ở bán kính `22 m` (góc `0°, 72°, 144°, 216°, 288°`).
- **Thông số `tuning`:**

| Tham số | Giá trị | Ghi chú |
|---|---:|---|
| `player_speed` | `7.0` | m/s trên mặt phẳng XZ |
| `carry_capacity` | `5` | Số đom đóm tối đa Mây mang cùng lúc |
| `lantern_cost` | `3` | Số đom đóm cần nạp để thắp 1 Đèn Lồng Lớn (tổng 15 cho 5 đèn) |
| `lantern_count_night1` | `5` | Bắt buộc theo PRD-0 |
| `pickup_radius` | `1.8` | m (đo XZ, `<=`) — tự động nhặt khi chạy lại gần nếu chưa đầy `carry_capacity` |
| `interact_radius` | `3.0` | m (đo XZ, `<=`) — nhấn `interact` (phím `E`) để nạp tối đa lượng đom đóm đang mang vào đèn gần nhất chưa sáng |
| `pulse_cost` | `1` | Tốn 1 đom đóm đang mang để tỏa xung ánh sáng (`pulse`, phím `Q` / chuột phải) |
| `pulse_radius` | `6.0` | m (đo XZ, `<=`) — làm choáng và đẩy lùi tất cả Bóng Mực trong bán kính |
| `night1_duration_s` | `180` | 3 phút cho Đêm 1 (hết giờ chưa thắp đủ đèn → thua với `reason: "dawn"`) |
| `flames` | `3` | Máu của Mây (3 ngọn lửa; về 0 → thua với `reason: "no_flames"`) |
| `invuln_s` | `1.5` | Thời gian bất tử sau khi bị Bóng Mực chạm |
| `hit_drop_ratio` | `0.5` | Rơi `Math.floor(carried * 0.5)` đom đóm khi bị chạm |
| `pulse_stun_s` | `3.0` | Thời gian Bóng Mực bị choáng (`state: "stunned"`) |
| `pulse_push_m` | `4.0` | Khoảng cách đẩy lùi Bóng Mực ra xa Mây trên mặt phẳng XZ |
| `pulse_cooldown_s` | `2.0` | Thời gian hồi chiêu tỏa sáng |
| `safe_radius` | `5.0` | Bán kính quanh mỗi đèn **đã thắp** mà Bóng Mực không được đi vào (đẩy ra ngoài rìa nếu nằm trong) |
| `shade_speed` | `4.2` | m/s (chậm hơn Mây để có thể né/dẫn dụ) |
| `shade_hit_radius` | `1.2` | m (đo XZ, `<=`) |
| `fall_enabled` | `false` | Không rơi khỏi đảo ở Phase 1 |
| `score` | `per_mote: 10`, `per_lantern: 100`, `per_stun: 25`, `per_second_left: 2`, `per_flame_left: 50` | Khi thắng (`all_lit`), cộng thưởng `Math.floor(time_left_s) * per_second_left + flames * per_flame_left` |

---

## 3. Chi tiết tuân thủ Test Contract v1.0 (Bắt buộc chính xác)

1. **Mô hình tick & thời gian:**
   - Cố định `60 ticks/giây` (`dt = 1/60`).
   - Dựng scenario xong → phát `snapshot` ở `tick: 0` (trước khi đọc input). Dựng scenario **không** phát event, **không** cộng điểm.
   - Bước `k` (`0 .. N-1`) đọc input của tick `k` → cập nhật trạng thái thành `k+1`; mọi event trong bước này ghi `tick: k + 1`.
   - `time_left_s = Math.max(0, round3(initial_time_left_s - steps_run / 60))`.
2. **Input & Chuyển động:**
   - Đọc `frames` theo `tick` tăng nghiêm ngặt; nếu trùng/giảm hoặc sai schema/giá trị → ghi lỗi ra `stderr`, thoát mã `2`.
   - Công thức xoay theo `cam_yaw_deg` (θ rad): `x' = x*cos(θ) + z*sin(θ)`, `z' = -x*sin(θ) + z*cos(θ)`. Chuẩn hóa vector nếu độ dài > 1.
   - `jump`, `interact`, `pulse`: kích hoạt theo **cạnh lên (`false -> true`)**.
3. **Scenario & Sinh thực thể ngẫu nhiên:**
   - Hỗ trợ đầy đủ `player`, `random_motes`, `random_shades`, `motes`, `shades`, `lanterns` (`L1`..`L5`), `time_left_s`.
   - Khi `random_motes: true` (mặc định): khởi tạo 20 đom đóm bằng PRNG và tự hồi sinh định kỳ khi số lượng giảm thấp.
   - Khi `random_shades: true` (mặc định): sinh Bóng Mực theo lịch cố định (2 con ban đầu + sinh thêm mỗi 25s tối đa 5 con), phát `shade_spawned` với `id` tất định (`S1`, `S2`, ...).
4. **Output JSONL & Tính tất định:**
   - Dòng `snapshot` mỗi `--snapshot-every` tick (mặc định 10), kèm mảng `motes: [{ id, pos }]`.
   - Đầy đủ 7 loại `event`: `mote_picked`, `deposit`, `lantern_lit`, `pulse`, `player_hit`, `shade_spawned`, `game_over`.
   - Dòng cuối bắt buộc `{"type":"end","ticks":...,"state":...,"score":...}`.
   - Mọi tọa độ làm tròn **3 chữ số thập phân** (`Math.round(v * 1000) / 1000`, tránh `-0`).
   - Cùng `--seed`, `--scenario`, `--inputs` → output **giống hệt từng byte** giữa 2 lần chạy.

---

## 4. Phần "Sáng tạo của tôi" (Rubric F — 4 điểm, không phá Contract)

Chỉ chạy ở lớp hiển thị 3D/âm thanh (`src/client/`), **tắt hoàn toàn trong chế độ headless**:
1. **Đèn trời (Sky Lanterns) & chuyển sắc không gian:** Mỗi khi thắp xong 1 Đèn Lồng Lớn, một chiếc đèn trời vàng ấm bay dần lên bầu trời đêm, đồng thời sương mù tím đen trên đảo lùi dần và ánh sáng ấm lan tỏa rõ rệt hơn.
2. **Âm thanh cổ tích ngũ cung (Web Audio API):** Nhặt đom đóm phát nốt ngũ cung tăng dần theo số lượng đang mang; thắp đèn phát hợp âm ấm áp; tỏa xung sáng có tiếng ngân vang.
3. **Biển mây trôi & dải sáng nón lá:** Đảo Bến nổi trên vòng mây trôi chậm, nhân vật Mây đội nón lá có đèn nhỏ đung đưa tỏa ánh sáng vàng cam xung quanh.

---

## 5. Kế hoạch kiểm chứng (Viết trước khi code — Rubric B)

| Yêu cầu | Cách kiểm chứng | Bằng chứng lưu lại |
|---|---|---|
| Test Contract v1.0 CLI & Schema | Unit test + chạy `node dist-sim/headless.js` với 6+ scenario (nhặt đom đóm, nạp & thắp đèn, xung đẩy lùi/choáng, bị Bóng Mực chạm + vùng an toàn `safe_radius`, thắng `all_lit`, thua `no_flames` & `dawn`, input/scenario lỗi trả exit code `2`) | Kết quả `vitest` + file JSONL thực tế trong `docs/proof/` |
| Tính tất định (Determinism) | Chạy 2 lần liên tiếp cùng `--seed 42` và so sánh hash SHA-256 / diff từng byte | Log so sánh 2 lần chạy giống nhau 100% |
| Gameplay 3D, HUD, Chơi lại | Mở bản web 3D bằng trình duyệt, chơi thử di chuyển/nhảy/camera/nhặt/thắp đèn/xung/thắng-thua/chơi lại | Ảnh chụp màn hình thực tế các trạng thái trong `docs/proof/` |
| Cài & chạy sạch (≤ 3 lệnh) | Kiểm tra quy trình build + start + headless đúng theo `README.md` | Log terminal thực tế |

---

## 6. Lộ trình thực hiện từng bước (Commit nhỏ, rõ ràng)

1. **Bước 1 — Khởi tạo dự án & AI Harness:** Tạo `package.json`, `tsconfig`, `game.contract.json`, `AGENTS.md`, `.agents/skills/verify-phase/SKILL.md`, `.github/workflows/ci.yml`, `LICENSE`, `CREDITS.md`, `docs/notes/phase-1-assumptions.md`.
2. **Bước 2 — Lõi mô phỏng & Headless CLI (`src/sim/`):** Viết PRNG tất định, engine 60 ticks/s, validator exit code 2, CLI `headless.ts`.
3. **Bước 3 — Bộ test & Kiểm chứng Contract (`tests/`):** Viết unit test, các scenario headless, kiểm tra tính tất định và chạy xanh 100%.
4. **Bước 4 — Game 3D & Sáng tạo (`src/client/`):** Dựng Đảo Bến 3D bằng Three.js (Mây đội nón lá, 5 Đèn Lồng Lớn, Đom Đóm, Bóng Mực, xung sáng, HUD, chơi lại, đèn trời & âm thanh ngũ cung).
5. **Bước 5 — Kiểm chứng thực tế, Bằng chứng & Tài liệu:** Chạy game 3D trên trình duyệt để chụp ảnh bằng chứng, chạy `npm run verify:all`, hoàn thiện `README.md`, `docs/proof/phase-1.md`, `docs/notes/ai-log.md`.
6. **Bước 6 — Rà soát & Gắn tag `phase-1`:** Kiểm tra sạch không có `.env`/secret, commit gọn gàng và gắn tag `phase-1`.
