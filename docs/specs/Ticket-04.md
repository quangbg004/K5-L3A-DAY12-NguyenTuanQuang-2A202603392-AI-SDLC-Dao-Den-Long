# TICKET-04 — "Bình minh: phát hành v1.0.0" (Phase 4 — Đặc tả yêu cầu chi tiết)

> **Nguồn:** Đảo Đèn Lồng Lab — Day 12 · AI SDLC Lab · Phase 4 (`https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW`)  
> **Loại:** Non-functional + Release · **Ưu tiên:** Cao · **Tag nộp:** `phase-4` + GitHub Release `v1.0.0` · **Contract:** `v1.3`  
> **Kế hoạch triển khai tương ứng:** [phase-4-plan.md](../plans/phase-4-plan.md)

---

## Mục tiêu

Đưa game từ **"chạy được"** thành **sản phẩm phát hành được**: đo được hiệu năng, ổn định khi chạy lâu, có bảng xếp hạng cục bộ, dễ tiếp cận, cài đặt dễ dàng. Mọi yêu cầu dưới đây đều có **số đo cụ thể** và được chấm tự động hoặc theo checklist.

**Về sáng tạo:** Phần sáng tạo từ các phase trước vẫn được giữ, miễn là luật, số liệu và Test Contract không bị đổi và đầu ra headless không đổi. Trong **cảnh benchmark và soak test**, nhân vật, kẻ địch và hiệu ứng sáng tạo thêm **phải tắt** (hoặc không ảnh hưởng số đo), để mọi bài được đo trên cùng một cảnh chuẩn.

---

## 1. Chế độ benchmark (bắt buộc)

**Lệnh:**

```bash
<bench_cmd> --seed 42 --duration 30 --out bench.json
```

### Cảnh benchmark chuẩn (mọi bài giống nhau)

- Mở cửa sổ **`1280×720`**, không toàn màn hình; tắt vsync nếu engine cho phép (ghi rõ trong `README.md` nếu không tắt được).
- Tải **Đêm 1** với đầy đủ hiệu ứng và ánh sáng như lúc chơi thật (tắt các hiệu ứng/thực thể sáng tạo thêm).
- Sinh đúng **200 Bóng Mực** ở trạng thái `wander`, rải đều trên đảo (`seed 42`), và đúng **100 đom đóm** (bench được phép vượt trần của gameplay). **3 đèn `L1–L3`** đang sáng với `fuel = 100`.
- Trong cảnh bench **tắt**: sinh thêm thực thể, sát thương, nhặt đom đóm, hao dầu và điều kiện kết thúc Đêm. Bóng Mực vẫn di chuyển theo luật `wander` bình thường.
- Không có input người chơi. Mây đứng yên tại `(0, 0, 0)`.
- **Camera:** bay vòng tròn tâm `(0, 0, 0)`, bán kính `30 m`, độ cao `Y = 15 m`, luôn nhìn vào `(0, 0, 0)`, xuất phát ở góc `0°` (điểm `(30, 15, 0)`), quay ngược chiều kim đồng hồ khi nhìn từ trên xuống, `15 s` một vòng.
- **`3 s` đầu** là khởi động (không đo). Sau đó đo đúng `--duration` giây rồi tự thoát với mã `0`.

### Định dạng output `bench.json`

```json
{
  "contract_version": "1.3",
  "avg_fps": 87.3,
  "p1_low_fps": 52.1,
  "frame_ms_p95": 14.2,
  "frames": 2619,
  "load_ms": 2400,
  "peak_mem_mb": 512,
  "vsync_off": true,
  "renderer": "mô tả engine/renderer và phiên bản",
  "os": "tự điền"
}
```

| Trường | Định nghĩa |
|---|---|
| `frames` | Số khung hình `N` trong khoảng đo |
| `avg_fps` | `1000 × N / Σ dt_i`, với `dt_i` là thời gian từng khung (ms) |
| `p1_low_fps` | `k = max(1, ceil(0.01 × N))`; lấy `k` giá trị `dt` lớn nhất; `p1_low_fps = 1000 / trung bình của k giá trị đó` |
| `frame_ms_p95` | Phân vị 95 của `dt` (ms) |
| `load_ms` | Từ lúc tiến trình bắt đầu tới khung hình đầu tiên của cảnh bench |
| `peak_mem_mb` | Bộ nhớ tiến trình (RSS) cao nhất trong lúc đo; ghi `null` nếu là bản web không đo được và giải thích |

- **Ngưỡng đạt (đo trên máy chấm của giảng viên):** `avg_fps ≥ 60` · `p1_low_fps ≥ 30` · `load_ms ≤ 10000`.
- Số liệu tự đo trên máy cá nhân được commit làm bằng chứng tham khảo.

---

## 2. Soak test (bắt buộc)

**Lệnh:**

```bash
<soak_cmd> --seed 7 --nights 10 --out soak.json
```

- Chạy **headless 10 Đêm liên tiếp** trong **cùng một tiến trình** (Đêm `1 → 2 → 3` xoay vòng).
- Đêm thứ `i` dùng seed `7 + i`, mỗi Đêm chạy tới khi kết thúc hoặc hết thời lượng chuẩn.
- **Input ngẫu nhiên theo seed:** mỗi `30` tick chọn lại hướng di chuyển; mỗi tick xác suất `5%` nhảy, `3%` lướt, `2%` tỏa sáng, `10%` tương tác.
- `mem_start_mb`: bộ nhớ tiến trình (RSS) sau khi tải xong Đêm đầu tiên.
- `mem_end_mb`: RSS sau khi reset xong Đêm cuối cùng.

### Định dạng output `soak.json`

```json
{
  "nights": 10,
  "crashes": 0,
  "results": ["lost", "won", "lost"],
  "mem_start_mb": 120,
  "mem_end_mb": 131,
  "duration_s": 84.2
}
```

- **Ngưỡng đạt:** `crashes = 0` và `mem_end_mb ≤ 1.2 × mem_start_mb`.

---

## 3. Bảng xếp hạng cục bộ

- Sau màn hình **Bình Minh** (thắng Đêm 3) hoặc sau khi **thua ở bất kỳ Đêm nào**, cho nhập tên để lưu điểm.
- **Tên:** `3–12` ký tự `[A-Za-z0-9_]` (hỗ trợ tiếng Việt có dấu là điểm cộng, không bắt buộc).
- **Mỗi mục lưu:**
  - `name`: tên người chơi
  - `score`: tổng điểm các Đêm đã thắng
  - `nights_won`: `0–3`
  - `achieved_at`: ISO 8601 có múi giờ
  - `seed`: seed của lượt chơi
- Giữ **top 10**, sắp xếp theo `score` giảm dần; bằng điểm thì ai đạt trước đứng trên.
- Lưu trên **đĩa cục bộ**, vẫn còn sau khi tắt và mở lại game.
- Có màn hình **Bảng xếp hạng** truy cập từ menu chính.
- **Lệnh xuất bắt buộc:**

```bash
<run_cmd> --export-leaderboard out.json
```

Xuất ra JSON dạng `{"entries": [ ... ]}` đúng thứ tự xếp hạng.

---

## 4. Dễ tiếp cận (Accessibility)

| Yêu cầu | Chi tiết |
|---|---|
| **Đổi phím** | Mọi hành động: di chuyển (4 hướng), nhảy, lướt, tương tác, tỏa sáng, tạm dừng. Phát hiện trùng phím và báo cho người dùng. Có nút `"Khôi phục mặc định"`. Được lưu bền vững |
| **Phụ đề / chỉ báo hình ảnh** | Bóng Mực xuất hiện (kèm mũi tên chỉ hướng ở mép màn hình), gió sắp thổi, `10 s` cuối, đèn có `fuel < 30` |
| **Giảm chuyển động** | Tắt rung camera và hiệu ứng chớp màn hình (được lưu bền vững) |
| **Cỡ chữ UI** | Tối thiểu **`18 px`** ở `1280×720`; tùy chọn **chữ lớn (`×1.25`)** (được lưu bền vững) |

---

## 5. Đóng gói & tài liệu

- **Clone repo sạch → làm theo `README.md` tối đa 3 lệnh → chơi được** (giảng viên sẽ thử trên máy sạch).
- `README.md` có: link video demo ở đầu, mô tả ngắn, ảnh chụp hoặc GIF, yêu cầu hệ thống, cài đặt, điều khiển, cách chạy `test`, `headless`, `bench`, `soak`, `--export-leaderboard`, và mục **"Sáng tạo của tôi"**.
- `CHANGELOG.md` có mục cho **cả 4 phase**.
- `CREDITS.md` liệt kê mọi asset, âm thanh và công cụ AI tạo nội dung.
- Có `LICENSE`.
- **GitHub Release `v1.0.0`** có bản chạy được (file thực thi, thư mục web tĩnh hoặc Docker image kèm hướng dẫn).

---

## 6. Test Contract v1.3

- `contract_version: "1.3"`.
- `game.contract.json` thêm `bench_cmd` và `soak_cmd`.
- Mọi yêu cầu của `v1.0–v1.2` vẫn giữ nguyên.

---

## 7. Retro & Video demo

- **Bản retro (`1–2` trang, tên và vị trí tự chọn):**
  - Tổng hợp Evaluation của 4 phase.
  - Điều gì hiệu quả hoặc không hiệu quả khi làm với AI.
  - Những lần AI sai và cách phát hiện.
  - Harness nào (`AGENTS.md`, skill, hook) giúp nhiều nhất.
  - Tổng token/chi phí AI ước tính và cách đã tiết kiệm token.
  - Nếu làm lại thì đổi gì.
- **Video demo `.mp4` dưới 5 phút** (đính kèm Release `v1.0.0` hoặc lưu ở `docs/demo/demo.mp4`, link ở đầu `README.md`):
  - Chơi trực tiếp một đoạn.
  - Cho thấy bằng chứng game chạy đúng (`test`, `headless`, `bench`, `soak`).
  - Lướt nhanh qua harness AI và lịch sử git.

---

## 8. Bảng Tiêu chí nghiệm thu (Acceptance Criteria — Phase 4)

| Mã | Mục | Tiêu chí nghiệm thu kiểm chứng được |
|---|---|---|
| **AC4.1** | Chế độ Benchmark | Chạy `<bench_cmd> --seed 42 --duration 30 --out bench.json` mở cảnh chuẩn `1280×720` (200 Bóng Mực `wander`, 100 đom đóm, `L1–L3` sáng `fuel=100`, camera quay 30m/Y=15/15s, 3s warmup, tắt sáng tạo & damage/decay), xuất đủ schema `v1.3`, đạt `avg_fps ≥ 60`, `p1_low_fps ≥ 30`, `load_ms ≤ 10000`, thoát mã `0`. |
| **AC4.2** | Soak test | Chạy `<soak_cmd> --seed 7 --nights 10 --out soak.json` chạy 10 Đêm xoay vòng `1→2→3` trong 1 tiến trình với input ngẫu nhiên đúng xác suất, xuất `soak.json` với `crashes === 0` và `mem_end_mb ≤ 1.2 × mem_start_mb`. |
| **AC4.3** | Bảng xếp hạng cục bộ | Sau Bình Minh hoặc thua có form nhập tên (`3–12` ký tự `[A-Za-z0-9_]` + tiếng Việt), lưu top 10 trên đĩa cục bộ (giảm dần theo `score`, tie-break đạt trước đứng trên), xem được từ menu chính, còn nguyên sau restart, và `<run_cmd> --export-leaderboard out.json` xuất `{"entries":[...]}` đúng thứ tự. |
| **AC4.4** | Dễ tiếp cận | Đổi được đủ 9 phím + báo trùng + `"Khôi phục mặc định"` + lưu bền vững; có phụ đề/chỉ báo cho Bóng Mực xuất hiện (+ mũi tên mép màn hình), gió sắp thổi, `10 s` cuối, đèn `fuel < 30`; có `"Giảm chuyển động"`; mọi chữ UI `≥ 18 px` ở `1280×720` + tùy chọn chữ lớn `×1.25`. |
| **AC4.5** | Đóng gói, Tài liệu & Retro | Clone sạch chạy trong `≤ 3` lệnh; `README.md`, `CHANGELOG.md` (4 phase), `CREDITS.md`, `LICENSE`, `docs/notes/retro.md` (1–2 trang) đầy đủ; không còn file rác hay secret; tag `phase-4` + Release `v1.0.0` + `bench.json` + `soak.json` + video `.mp4` `< 5` phút. |

---

## Định nghĩa hoàn thành (DoD)

- [ ] Có bằng chứng game chạy đúng các yêu cầu của Phase 4.
- [ ] Tag `phase-4` và GitHub Release `v1.0.0` có bản chạy được.
- [ ] `bench.json` và `soak.json` do tự chạy được commit vào repo.
- [ ] Mọi test ẩn Phase 1–3 còn hiệu lực vẫn đạt.
- [ ] Repo **public**, đầy đủ harness AI, tài liệu, retro và video demo theo quy định nộp bài.
