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
