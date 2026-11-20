# Tiến độ Đảo Đèn Lồng · Phase 1

| Mốc | Kết quả |
|---|---|
| Đọc yêu cầu | Đã đối chiếu PRD-0, Test Contract v1.0 và sáu bước trong kế hoạch. Repo ban đầu chỉ có tài liệu. |
| Khởi tạo | Đã khai báo các lệnh chạy, cấu hình TypeScript và tuning dùng chung. |
| Lõi và CLI | Đã viết mô phỏng 60 Hz, xử lý input theo cạnh lên, nạp đèn, Bóng Mực, vùng an toàn, tính điểm và xuất JSONL. Đang kiểm chứng bằng scenario. |
| Kiểm thử lõi | Vitest đạt 13/13. Tám scenario chạy CLI thật, kiểm tra điểm, thắng/thua, input lỗi, hồi choáng, mất lửa và tính tất định. |
| Bản 3D | Đã dựng Đảo Bến, Mây, đèn lồng, biển mây, âm thanh, HUD và nút chơi lại. Đang chạy build và kiểm tra trình duyệt. |
| Kiểm chứng trên Edge | Hoàn tất ván mặc định trong 1.957 tick, đạt 1.189 điểm. Đã kiểm tra thua và chơi lại từ cả hai màn kết quả. [Ảnh và JSONL](proof/phase-1.md). |
| Cài sạch và bàn giao | npm ci thành công, npm audit báo 0 lỗ hổng. Build production và 13/13 test đạt trên Windows. Skill verify-phase hợp lệ. [Log kiểm chứng](proof/verify.log). Mốc bàn giao cục bộ dùng tag phase-1. |

## Phase 2 · Ba hòn đảo

| Mốc | Kết quả |
|---|---|
| Phạm vi | Đã đọc Ticket-02 và kế hoạch; chuẩn hóa tuning v1.1 và giữ riêng bằng chứng Phase 1. |
| Lõi mô phỏng | Đã biên dịch CLI v1.1 cho 3 Đêm, gồm bản đồ, pause, dash, bùa, gió, hồi sinh, Gió Lạc và điểm theo lượng nạp. Đang kiểm tra các mốc tick. |
| Hồi quy và benchmark | 20/20 test đạt, gồm 8 scenario cũ theo luật mới và các phép thử CLI cho dash, pause, rơi, bùa, Gió Lạc, cầu, bục, dốc và gió. Benchmark đã chạy đủ 21.600 tick. |
| Bản chơi 3D | Đã build giao diện ba đảo, chuỗi Đêm, tạm dừng, âm lượng/độ nhạy, âm thanh, vật liệu và HUD. Bước tiếp theo là kiểm chứng bằng trình duyệt. |
| Nghiệm thu | Build và 26/26 test đạt. Hai lượt chạy đủ 21.600 tick trong 1,60 s và 1,88 s, SHA-256 giống nhau. Edge 1280×720 đạt khoảng 48 FPS ở cả ba đảo. |
| Bàn giao | Đã lưu input tái lập ba Đêm mặc định (thắng đủ 18 đèn, tổng 4.748 điểm), ảnh HUD, pause, cài đặt, Bình Minh và [hồ sơ nghiệm thu](proof/phase-2.md). Mốc bàn giao cục bộ dùng tag phase-2. |

## Phase 3 · Đèn cạn dầu

| Mốc | Kết quả |
|---|---|
| Phạm vi | Đã đối chiếu Ticket-03 với Phase 2, cập nhật contract v1.2, ADR và changelog. |
| Lõi v1.2 | Đã tích hợp dầu nguyên, châm dầu, thắp lại, drain, túi mở rộng và tính kết quả ở bình minh. |
| Hồi quy | Đã cập nhật kỳ vọng bị thay thế và bổ sung test cho mốc cạn dầu, drain, thắp lại, sức chứa và bình minh. |
| Bản 3D | Đã tích hợp thanh dầu, nhấp nháy 1 Hz, vết rách, luồng hút dầu, HUD động và bảng màu lưu bền vững. |
| Nghiệm thu | Build và 34/34 test đạt. Edge đo khoảng 48 FPS ở 1280×720 trên ba đảo, kiểm tra bảng màu sau reload, nhấp nháy và bình minh. CLI hoàn tất 18.000 tick trong 1,13 giây và 0,87 giây, SHA-256 trùng. |
| Bàn giao | Đã lưu [ảnh, replay, log và số đo](proof/phase-3.md). Mốc bàn giao cục bộ dùng tag phase-3. |

## Phase 4 · Phát hành v1.0.0

| Mốc | Kết quả |
|---|---|
| Phạm vi | Đã đọc Ticket-04 và kế hoạch, khai báo contract v1.3 cùng các lệnh bench, soak, launcher. |
| CLI và giao diện | Đã chạy benchmark và soak chuẩn, bổ sung launcher, lưu điểm trên đĩa, đổi phím, phụ đề, giảm chuyển động và chữ lớn. |
| Nghiệm thu | 37/37 test đạt; clone sạch khởi động thành công. Benchmark cuối đạt 984,32 FPS trên GTX 1050 Ti. Soak 0 crash, RSS tăng 13,6%. Đã kiểm tra điểm sau restart, phím đổi, cỡ chữ và phụ đề. |
| Đóng gói | Đã chuẩn bị [hồ sơ nghiệm thu](proof/phase-4.md), [retro](notes/retro.md), video và workflow phát hành ZIP từ tag v1.0.0. |
| Phát hành | Hai tag phase-4 và v1.0.0 trỏ tới 349caca. [Workflow Linux](https://github.com/quangbg004/K5-L3A-DAY12-NguyenTuanQuang-2A202603392-AI-SDLC-Dao-Den-Long/actions/runs/44748422408) đã thành công. [Release công khai](https://github.com/quangbg004/K5-L3A-DAY12-NguyenTuanQuang-2A202603392-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) có ZIP, MP4, bench.json và soak.json. Đã tải ZIP từ GitHub, giải nén, chạy CLI headless và xuất bảng điểm thành công. |

## Sửa lỗi CI sau Phase 4

| Mốc | Kết quả |
|---|---|
| Tái lập | Một lượt CI trên commit `349caca` thất bại vì RSS cuối lượt soak là 56,64 MiB, vượt giới hạn 56,30 MiB. Trên Ubuntu WSL với Node.js 20.20.2, cả 8 lần chạy lệnh cũ đều vượt ngưỡng, tăng 22,41–29,50%. [Lượt CI lỗi](https://github.com/quangbg004/K5-L3A-DAY12-NguyenTuanQuang-2A202603392-AI-SDLC-Dao-Den-Long/actions/runs/44748419923) |
| Sửa | Dùng `--jitless` riêng cho lệnh soak để giảm ảnh hưởng của mã do V8 biên dịch động lên RSS. Vitest gọi đúng lệnh trong contract v1.3. Vẫn đo RSS ở hai mốc cũ và giữ ngưỡng 20%. Nâng `checkout` và `setup-node` lên v5 để xử lý cảnh báo runtime của GitHub Actions. |
| Kiểm chứng | Trên Ubuntu WSL, 8/8 lượt soak đạt, RSS tăng 7,21–7,84%. Trên Windows, `npm run verify:all` đạt 37/37 bài kiểm thử. |
