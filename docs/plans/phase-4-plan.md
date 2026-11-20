# Kế hoạch triển khai Phase 4 — TICKET-04: "Bình minh: phát hành v1.0.0"

> **Đặc tả yêu cầu:** [Ticket-04.md](../specs/Ticket-04.md)  
> **Tag nộp:** `phase-4` + **GitHub Release `v1.0.0`** · **Contract:** `v1.3` · **Khung thời gian:** ~90 phút (dành 15 phút cuối cho Release, kiểm tra clone sạch & video demo)  
> **Nguyên tắc:** Tối ưu đồ họa bằng `InstancedMesh` để benchmark 200 Bóng Mực + 100 đom đóm vượt xa ngưỡng 60 FPS → hoàn thiện CLI `bench`, `soak`, `launcher` (`--export-leaderboard`) → bổ sung Bảng xếp hạng cục bộ & Accessibility → dọn repo, viết Retro, quay/đóng gói Release `v1.0.0`.

---

## 1. Dọn dẹp tồn đọng & Nâng cấp Contract v1.3

1. **Dọn file rác ở gốc repo:** Kiểm tra và xóa các file/thư mục bị cắt tên ngoài ý muốn đang nằm ở gốc repo (`AGENTS.m`, `CHANGELOG.m`, `game.contract.jso`, `README.m` nếu không thuộc repo). Đảm bảo không có `.env`, API key hay token nào trong repo và lịch sử git.
2. **Cập nhật `game.contract.json` → `v1.3`:**
   - `"contract_version": "1.3"`
   - `"build_cmd": "npm install && npm run build"`
   - `"run_cmd": "node dist-sim/launcher.js"` (thay `vite preview` để hỗ trợ lưu bảng xếp hạng lên đĩa cục bộ và cờ `--export-leaderboard out.json` trên macOS/Linux/Windows)
   - `"headless_cmd": "node dist-sim/headless.js"`
   - `"bench_cmd": "node dist-sim/bench.js"`
   - `"soak_cmd": "node dist-sim/soak.js"`
   - Giữ nguyên toàn bộ `tuning` v1.2 để không làm lệch bất kỳ test ẩn nào của Phase 1–3.
3. **Cập nhật AI Harness (`AGENTS.md` & `.agents/skills/verify-phase/SKILL.md`):**
   - Nâng cấp lên Contract `v1.3`, bổ sung luật cảnh `bench` / `soak` (tắt sáng tạo thêm), và lệnh kiểm chứng `npm run verify:all`, `bench`, `soak`, `--export-leaderboard`.

---

## 2. Tối ưu Renderer & Chế độ Benchmark (`bench_cmd`)

### A. Tối ưu `src/client/scene.ts` cho 200 Bóng Mực + 100 Đom Đóm (`avg_fps ≥ 60`, `p1_low_fps ≥ 30`)
- Hiện tại mỗi đom đóm và mỗi Bóng Mực đang là một `THREE.Object3D` / `THREE.Group` riêng lẻ (~900+ draw call khi có 200 Bóng Mực + 100 đom đóm).
- **Chuyển sang `THREE.InstancedMesh`:**
  - `moteInstances` (`THREE.InstancedMesh`, capacity `128`): 1 draw call duy nhất cho toàn bộ đom đóm.
  - `shadeBodyInstances` (`THREE.InstancedMesh`, capacity `256` kèm `instanceColor` đổi màu bình thường / `stunned`) + `shadeEyeInstances` (`THREE.InstancedMesh`, capacity `512`, 2 mắt/con, đổi màu `#7A3CFF` hoặc `#00B3FF` khi bật mù màu) + `shadeRimInstances` (tùy chọn wireframe/emissive nhẹ bằng 1 `InstancedMesh`): giảm từ ~800 draw call xuống **3 draw call**!
- Giảm cấp phát rác mỗi khung hình (tái sử dụng `THREE.Object3D` / `THREE.Matrix4` / `THREE.Color` tạm) để tránh GC spike làm tụt `p1_low_fps`.
- **Cờ `benchMode` trong `src/client/scene.ts`:** khi `benchMode === true`, tắt toàn bộ thực thể/hiệu ứng sáng tạo thêm (đèn trời bay lên, đuôi sáng phụ…), giữ đầy đủ ánh sáng, sương mù, địa hình Đêm 1 và đèn sáng/tắt như lúc chơi thật.

### B. Cảnh Benchmark trong `src/sim/engine.ts` + `src/client/main.ts`
- Thêm phương thức/tùy chọn `Game.createBench(tuning, seed = 42)` (không ảnh hưởng đường chạy bình thường hay headless):
  - Tải Đêm 1 (`night = 1`), `L1–L3` đặt `lit = true, fuel60 = 6000`, `L4–L5` tắt.
  - Sinh chính xác **200 Bóng Mực** trạng thái `wander` phân bố đều trên đảo Đêm 1 (dùng PRNG `seed`, chọn vị trí ngoài vùng an toàn `6 m` quanh `L1–L3` và trong bán kính đảo `R = 40 m`) và chính xác **100 đom đóm** phân bố đều trên đảo.
  - Cờ `bench = true`: trong `step()` chỉ chạy di chuyển `wander` của Bóng Mực + chặn vùng an toàn `L1–L3`; **tắt** sinh thêm thực thể, sát thương, nhặt đom đóm, hao dầu, và điều kiện kết thúc Đêm. Mây đứng yên tại `(0, 0, 0)`.
- Trong `src/client/main.ts`, khi URL có `?bench=1&seed=42&duration=30`:
  - Khởi tạo `Game.createBench(contract.tuning, seed)`, ẩn HUD/menu, chạy vòng lặp fixed-timestep 60Hz cho `wander` + render ở `1280×720`.
  - **Camera quỹ đạo chuẩn:** tâm `(0, 0, 0)`, bán kính `30 m`, `Y = 15 m`, `lookAt(0, 0, 0)`, góc `θ(t) = 2π * t / 15` (`t = 0` tại `(30, 15, 0)`, quay ngược chiều kim đồng hồ từ trên xuống theo quy ước XZ chuẩn của lab).
  - **`3 s` đầu** làm warmup (không thu mẫu); sau đó thu mảng `dt_i` (ms) trong đúng `duration` giây, tính chính xác:
    - `frames = N`
    - `avg_fps = 1000 * N / sum(dt_i)`
    - `p1_low_fps = 1000 / mean(top k = max(1, ceil(0.01 * N)) largest dt_i)`
    - `frame_ms_p95` (phân vị 95 của `dt_i` đã sắp tăng dần)
    - `renderer`: chuỗi gồm `Three.js 0.170.0` + `WebGLRenderer` + thông tin GPU từ `WEBGL_debug_renderer_info` (nếu có).
  - Báo kết quả về harness runner qua `window.__BENCH_DONE__`.

### C. CLI Runner `src/sim/bench.ts` (`node dist-sim/bench.js`)
- Parse tham số `--seed <int> --duration <num> --out <file.json>` (mặc định `42`, `30`, `bench.json`; sai tham số → exit `2`).
- Ghi `processStart = performance.now()` ngay khi tiến trình bắt đầu.
- Khởi động HTTP server nội bộ phục vụ `dist/` (port `0` ngẫu nhiên) và mở Chromium (Playwright) ở **cửa sổ `1280×720`** (không fullscreen), truyền cờ `--disable-frame-rate-limit --disable-gpu-vsync` khi bật GPU để tắt vsync (ghi nhận `vsync_off: true/false` trung thực theo chế độ thực tế và giải thích rõ trong `README.md`).
- Đo `load_ms = firstBenchFrameTime - processStart`.
- Lấy `peak_mem_mb`: đọc RSS đỉnh của tiến trình trình duyệt/Node (hoặc `null` kèm giải thích trong `README.md` nếu môi trường web không đọc được RSS trình duyệt).
- Điền `os` (`${os.platform()} ${os.release()} (${os.arch()})`), ghi `bench.json` chuẩn `contract_version: "1.3"`, đóng trình duyệt & server sạch sẽ, thoát mã `0`.

---

## 3. Soak Test (`src/sim/soak.ts` — `node dist-sim/soak.js`)

- Parse tham số `--seed <int> --nights <int> --out <file.json>` (ví dụ `--seed 7 --nights 10 --out soak.json`).
- Chạy **10 Đêm liên tiếp** trong cùng 1 tiến trình Node.js (`night = (i % 3) + 1`, xoay vòng `1 → 2 → 3`), Đêm thứ `i` dùng seed `seed + i` (`i = 0 .. nights - 1`, ghi rõ quy ước `0-based` trong tài liệu).
- **Input ngẫu nhiên tất định theo PRNG riêng của Đêm:**
  - Mỗi `30` tick chọn hướng di chuyển ngẫu nhiên trên vòng tròn đơn vị `[cos(a), sin(a)]`.
  - Mỗi tick độc lập bốc xác suất: `5%` `jump`, `3%` `dash`, `2%` `pulse`, `10%` `interact` (đặt `false` ở tick không bốc trúng để rising-edge hoạt động đúng tự nhiên).
- **Đo bộ nhớ chuẩn xác:**
  - `mem_start_mb`: `process.memoryUsage().rss / 1048576` ngay sau khi khởi tạo Đêm đầu tiên (`i = 0`).
  - Sau mỗi Đêm, giải phóng tham chiếu đối tượng `Game` (`game = null`) và không giữ mảng log/snapshot thừa.
  - `mem_end_mb`: `process.memoryUsage().rss / 1048576` ngay sau khi kết thúc và reset Đêm cuối cùng.
- Bọc từng Đêm bằng `try/catch` để ghi nhận `crashes` (mục tiêu `0`), xuất `{ nights, crashes, results, mem_start_mb, mem_end_mb, duration_s }` ra `--out`, xác nhận `crashes === 0` và `mem_end_mb <= 1.2 * mem_start_mb`.

---

## 4. Bảng xếp hạng cục bộ & Launcher (`src/sim/launcher.ts` + `src/client/`)

### A. Lưu trữ đĩa cục bộ (`src/sim/leaderboard.ts`)
- Đường dẫn file lưu bền vững: `~/.dao-den-long/leaderboard.json` (tự tạo thư mục nếu chưa có; hỗ trợ override qua biến môi trường `DAO_DEN_LONG_DATA_DIR` cho unit test sạch sẽ mà không đụng dữ liệu thật).
- Quy tắc chuẩn hóa & xếp hạng:
  - Validate tên: `3–12` ký tự `/^[A-Za-z0-9_À-ỹ]{3,12}$/` (hỗ trợ `[A-Za-z0-9_]` + tiếng Việt có dấu).
  - Bản ghi: `{ name, score, nights_won, achieved_at, seed }` (`achieved_at` định dạng ISO 8601 có múi giờ địa phương, ví dụ `+07:00`).
  - Sắp xếp: `score` giảm dần → bằng điểm thì `achieved_at` sớm hơn đứng trước (giữ thứ tự đạt trước).
  - Cắt gọn giữ tối đa **Top 10**.

### B. Launcher đa nền tảng (`src/sim/launcher.ts` — `run_cmd: "node dist-sim/launcher.js"`)
- **Chế độ xuất bảng xếp hạng:** `node dist-sim/launcher.js --export-leaderboard <out.json>`
  - Đọc file bảng xếp hạng từ đĩa cục bộ, ghi `{"entries": [...]}` đúng thứ tự ra `<out.json>`, thoát mã `0`.
- **Chế độ chạy game:** `node dist-sim/launcher.js [--port 4173]`
  - Phục vụ file tĩnh từ `dist/` bằng `node:http` thuần (0 dependency ngoài, chạy tức thì trên macOS/Linux/Windows).
  - Cung cấp REST API nội bộ:
    - `GET /api/leaderboard` → trả về `{"entries": [...]}`.
    - `POST /api/leaderboard` → validate, chèn/sắp xếp top 10, ghi ngay xuống đĩa cục bộ và trả về danh sách mới.
  - In URL `http://127.0.0.1:4173` rõ ràng trên terminal (hỗ trợ `npm run start` gọi thẳng launcher này).

### C. Giao diện Bảng xếp hạng (`src/client/main.ts`, `src/client/ui.ts`)
- Sau màn hình **Bình Minh** (thắng Đêm 3, `nights_won = 3`) hoặc sau khi **thua ở bất kỳ Đêm nào** (`nights_won` = số Đêm đã thắng trong hành trình `0..2`), hiện form nhập tên + thông báo validation + nút **"Lưu điểm"** (gọi `POST /api/leaderboard`, có fallback `localStorage` nếu mở file tĩnh không qua launcher).
- Thêm nút **"Bảng xếp hạng"** ở Menu chính → hiển thị bảng Top 10 (Hạng, Tên, Điểm, Số Đêm thắng, Thời gian, Seed).

---

## 5. Tính năng Dễ tiếp cận — Accessibility (`src/client/`)

1. **Đổi phím (Key Rebinding):**
   - Bổ sung module cấu hình phím trong `src/client/ui.ts` & `src/client/main.ts` cho đủ **9 hành động**:
     - Di chuyển 4 hướng (`moveUp`: `KeyW`, `moveDown`: `KeyS`, `moveLeft`: `KeyA`, `moveRight`: `KeyD`)
     - Nhảy (`jump`: `Space`)
     - Lướt (`dash`: `ShiftLeft`)
     - Tương tác (`interact`: `KeyE`)
     - Tỏa Sáng (`pulse`: `KeyQ`)
     - Tạm dừng (`pause`: `KeyP`, luôn hỗ trợ thêm `Escape` như fallback an toàn khi ở menu hoặc đổi được trực tiếp)
   - Trong màn Cài đặt: bấm nút từng hành động → nhấn phím mới → **phát hiện trùng phím** và báo cảnh báo rõ ràng (không cho trùng âm thầm) → nút **"Khôi phục mặc định"** → lưu bền vững vào `localStorage`.
2. **Phụ đề / Chỉ báo hình ảnh (Visual Indicators & Subtitles):**
   - **Bóng Mực xuất hiện (`shade_spawned`):** hiện phụ đề góc dưới (`"Bóng Mực xuất hiện!"`) + **mũi tên chỉ hướng màu tím/xanh dương** ở mép màn hình trỏ về hướng Bóng Mực vừa sinh trong ~3 giây.
   - **Gió sắp thổi (`windWarning`):** phụ đề + biểu tượng cảnh báo gió (`"Gió mạnh sắp thổi!"`).
   - **10 giây cuối:** phụ đề/biểu tượng nổi bật (`"10 giây cuối tới bình minh!"`) đi kèm đồng hồ nhấp nháy.
   - **Đèn có `fuel < 30`:** phụ đề/chỉ báo danh sách đèn yếu trên HUD (`"Đèn L1 sắp cạn dầu!"`, kèm `⚠` khi bật chế độ mù màu).
3. **Giảm chuyển động (`reducedMotion`):**
   - Nút bật/tắt **"Giảm chuyển động"** trong Cài đặt (lưu `localStorage`).
   - Khi bật: tắt hoàn toàn rung camera (khi bị đánh, tỏa sáng, gió mạnh) và tắt mọi hiệu ứng chớp màn hình (`hit-flash`, `pulse-flash`).
4. **Cỡ chữ UI (`≥ 18 px` + Chữ lớn `×1.25`):**
   - Kiểm tra và nâng toàn bộ `font-size` trong `src/client/style.css` sao cho mọi nhãn, nút, HUD, phụ đề, prompt đều có `computed fontSize ≥ 18px` tại `1280×720`.
   - Thêm cài đặt **"Chữ lớn (×1.25)"** (lưu `localStorage`, gắn class `body.large-text` nhân hệ số `1.25` lên toàn bộ biến cỡ chữ CSS → tối thiểu `22.5px`).

---

## 6. Kiểm chứng, Đóng gói, Retro, Video Demo & Release `v1.0.0`

1. **Bộ test tự động Phase 4 (`tests/phase4.test.ts` + regression Phase 1–3):**
   - Test `soak` CLI (`crashes === 0`, `mem_end_mb <= 1.2 * mem_start_mb`, đủ 10 Đêm, đúng schema).
   - Test `leaderboard` + `node dist-sim/launcher.js --export-leaderboard out.json` (validate tên 3–12 ký tự + tiếng Việt, top 10, sắp xếp điểm giảm dần & tie-break đạt trước đứng trên, tồn tại qua restart tiến trình).
   - Test `Game.createBench` (đúng 200 Bóng Mực `wander`, 100 đom đóm, `L1–L3` sáng `fuel=100`, tắt decay/damage/pickup/spawn/end).
   - Chạy `npm run verify:all` đảm bảo toàn bộ test Phase 1, 2, 3, 4 xanh 100%.
2. **Chạy đo thực tế & commit kết quả:**
   - Chạy `node dist-sim/bench.js --seed 42 --duration 30 --out bench.json` → commit `bench.json` vào gốc repo.
   - Chạy `node dist-sim/soak.js --seed 7 --nights 10 --out soak.json` → commit `soak.json` vào gốc repo.
   - Chạy script kiểm chứng trình duyệt Phase 4 (`tests/phase4-proof.mjs`) ở `1280×720`: kiểm tra tự động mọi `fontSize ≥ 18px` (và `×1.25` khi bật chữ lớn), test đổi phím + báo trùng + khôi phục mặc định, test phụ đề (Bóng Mực + mũi tên, gió, 10s cuối, đèn `< 30`), test giảm chuyển động, test nhập tên lưu Bảng xếp hạng + reload vẫn còn + `--export-leaderboard`, lưu ảnh chụp vào `docs/proof/phase-4/`.
3. **Hoàn thiện bộ tài liệu phát hành:**
   - `README.md`: link video demo ở đầu, mô tả ngắn, ảnh chụp game, yêu cầu hệ thống, hướng dẫn cài & chạy **tối đa 3 lệnh**, bảng điều khiển, mục **"Sáng tạo của tôi"**, các lệnh `test`, `headless`, `bench`, `soak`, `--export-leaderboard`, ghi chú về `vsync_off` / `peak_mem_mb`.
   - `CHANGELOG.md`: tổng hợp đủ **4 phase** (`Phase 1` → `Phase 4 / v1.0.0`).
   - `CREDITS.md` & `LICENSE`: rà soát đầy đủ nguồn thư viện, đồ họa/âm thanh tự tạo, công cụ AI.
   - `docs/notes/retro.md` (`1–2` trang): Evaluation 4 phase, hiệu quả/chưa hiệu quả khi dùng AI, lỗi AI thực tế & cách phát hiện, harness hữu ích nhất, tổng ước tính token & cách tiết kiệm, bài học nếu làm lại.
   - `docs/proof/phase-4.md` & `docs/TIEN-DO.md` & `docs/notes/ai-log.md`.
4. **Đóng gói Release `v1.0.0`, kiểm tra clone sạch & Video demo:**
   - Tạo gói chạy được cho Release `v1.0.0` (ví dụ `dao-den-long-v1.0.0.zip` chứa `dist/`, `dist-sim/`, `game.contract.json`, `package.json`, hướng dẫn chạy 1 lệnh `node dist-sim/launcher.js` — hoặc web tĩnh).
   - Quay/tạo video demo `demo.mp4` (`< 5` phút, mở công khai không cần đăng nhập) thể hiện chơi trực tiếp + chạy `verify:all`, `headless`, `bench`, `soak`, lướt qua harness & git log; đính kèm Release `v1.0.0` (hoặc lưu `docs/demo/demo.mp4` dưới 100 MB) và đặt link ở đầu `README.md`.
   - Clone sạch sang thư mục tạm, chạy đúng ≤ 3 lệnh theo `README.md` để xác nhận chạy ngon trên môi trường sạch.
   - Gắn tag `phase-4`, push tag và tạo **GitHub Release `v1.0.0`**.

---

## 7. Lộ trình thực hiện theo commit nhỏ (6 bước)

1. **Commit 1 — Dọn repo, Contract v1.3 & Harness:** Xóa file rác bị cắt tên, cập nhật `game.contract.json` (`v1.3`), `AGENTS.md`, `.agents/skills/verify-phase/SKILL.md`.
2. **Commit 2 — `InstancedMesh`, Bench Mode & Soak CLI:** Tối ưu `src/client/scene.ts`, thêm `Game.createBench`, viết `src/sim/bench.ts` và `src/sim/soak.ts`.
3. **Commit 3 — Bảng xếp hạng cục bộ & Launcher CLI:** Viết `src/sim/leaderboard.ts`, `src/sim/launcher.ts` (HTTP + `--export-leaderboard`), thêm UI nhập tên & màn hình Bảng xếp hạng.
4. **Commit 4 — Accessibility đầy đủ:** Đổi 9 phím (+ báo trùng + khôi phục mặc định), phụ đề & mũi tên Bóng Mực/gió/10s/đèn yếu, Giảm chuyển động, kiểm soát cỡ chữ `≥ 18px` + Chữ lớn `×1.25`.
5. **Commit 5 — Kiểm chứng thực tế (`bench.json`, `soak.json`, `phase4.test.ts`, `phase4-proof.mjs`):** Chạy `verify:all`, commit `bench.json`, `soak.json` và bằng chứng Phase 4.
6. **Commit 6 — Tài liệu phát hành, Retro, Tag `phase-4` & Release `v1.0.0`:** Hoàn thiện `README.md`, `CHANGELOG.md`, `CREDITS.md`, `docs/notes/retro.md`, kiểm tra clone sạch, đính kèm bản chạy được & `demo.mp4` lên Release `v1.0.0`.
