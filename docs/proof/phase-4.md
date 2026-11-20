# Nghiệm thu Phase 4 · Contract v1.3

| Yêu cầu | Phép đo hoặc kiểm tra thực tế | Bằng chứng |
|---|---|---|
| AC4.1 Benchmark | Edge, WebGL2 và GTX 1050 Ti ở 1280×720. Sau 3 giây khởi động, 29.530 khung trong 30 giây đạt 984,32 FPS trung bình, 487,56 FPS ở 1% thấp, p95 1,40 ms. Khung đầu sau 2.135 ms. Đây là số đo ở máy phát triển với cờ tắt VSync. | [bench.json](../../bench.json) |
| AC4.2 Soak | Seed 7, 10 Đêm trong cùng tiến trình, cả 10 ván input ngẫu nhiên kết thúc thua. Không có crash. RSS từ 29,38 lên 33,38 MiB, tăng 13,6%, dưới giới hạn 20%. | [soak.json](../../soak.json) |
| AC4.3 Bảng điểm | Form sau màn kết quả lưu qua HTTP. Khởi động lại launcher và xuất qua tiến trình CLI riêng cho cùng dữ liệu. Test bổ sung kiểm tra giới hạn 10, đồng điểm, tên có dấu và tên không hợp lệ. | [Bảng điểm](phase-4/leaderboard.png), [test](../../tests/phase4.test.ts) |
| AC4.4 Tiếp cận | Đổi phím, báo trùng, khôi phục mặc định, lưu tùy chọn qua reload. Cỡ chữ thường tối thiểu 18 px trên HUD, phím cài đặt chữ lớn đo được 22,5 px. Chỉ báo xuất hiện Bóng Mực lấy từ bản chơi mặc định. Cảnh kiểm tra ở Đêm 3 đặt thời gian và dầu để hiện cùng lúc các phụ đề. | [Cài đặt](phase-4/settings.png), [gameplay](phase-4/playing.png), [phụ đề](phase-4/captions.png) |
| AC4.5 Đóng gói | Clone sạch, chạy npm ci, npm run build, npm start. Trang chủ HTTP 200 và API trả bảng điểm. Build và 37/37 test đạt trên Windows. | [Clone sạch](phase-4/clean-clone.log), [log](phase-4/verify.log), [video](../demo/demo.mp4), [retro](../notes/retro.md) |

## Tái lập

Chạy các lệnh trong README. Sau khi build, chạy `node tests/phase4-proof.mjs` để kiểm tra qua Chromium hoặc đặt BROWSER_CHANNEL thành msedge. Bài thử tạo thư mục điểm tạm nên không sửa điểm cá nhân. Đặt DEMO=1 để ghi lại video bằng FFmpeg. Đầu vào benchmark, bộ đo và số đo máy giảng viên có thể cho kết quả khác. Bộ test ẩn của giảng viên chưa được cung cấp.
