# Retro · Đảo Đèn Lồng

## Từ một màn chơi đến bản phát hành

| Phase | Câu hỏi nghiệm thu | Kết quả |
|---|---|---|
| 1 | Mây có thể nhặt, nạp, thắng, thua và chơi lại theo cùng một luật trên web và CLI? | 13 test đạt. Edge chơi thắng Đảo Bến mặc định với 1.189 điểm. |
| 2 | Ba đảo có đi được bằng chuyển động và địa hình chuẩn? | 26 test đạt. Ba chuỗi input mặc định thắp đủ 18 đèn, tổng 4.748 điểm. |
| 3 | Đèn có cạn đúng tick và trò chơi chờ bình minh mới xét thắng? | 34 test đạt. Đèn còn một đơn vị dầu tắt sau 60 tick và có thể thắp lại ngay tick đó. |
| 4 | Người khác có thể cài, kiểm tra, lưu điểm và đo lại? | Có launcher Node, CLI xuất điểm, benchmark có camera quay và soak liên tục. Build và 37 test đạt. Số đo gốc nằm trong bench.json và soak.json. |

## Làm việc với AI

Tách mô phỏng khỏi đồ họa ngay ở Phase 1 giúp dùng cùng một input để tái hiện vấn đề. Khi Ticket-03 đổi luật thắng, thay đổi tập trung ở bước xét kết quả. Bộ test cũ lập tức phát hiện các kỳ vọng điểm đã hết hiệu lực. ADR và changelog ghi lý do thay các kỳ vọng đó, giúp so sánh lại hành vi ở tag cũ.

Có những lỗi chỉ thấy khi chạy qua đường dùng thật. TypeScript phát hiện vật liệu Three.js không đúng kiểu ở Phase 1. Playwright phát hiện phím Esc bị bỏ qua khi bấm ngay sau nút Tiếp tục ở Phase 2. Trong Phase 4, proxy của máy chủ kiểm thử chuyển tiếp POST với origin khác launcher, khiến thử nghiệm lưu điểm thất bại. Sửa cấu hình proxy rồi đối chiếu API với CLI export kiểm tra được cả nơi hiển thị lẫn dữ liệu thực sự ghi trên đĩa.

AGENTS.md hữu ích nhất cho các quy tắc dễ bị lẫn giữa các ticket, đặc biệt là thứ tự 12 bước và ưu tiên hết lửa. Skill verify-phase gom các lệnh tái lập. CI chạy lại build và test ở Linux. Cả ba loại hỗ trợ đều phát huy tác dụng khi chúng trỏ đến phép kiểm tra cụ thể có thể thất bại.

## Chi phí và điều sẽ đổi

Nhật ký các phase chỉ cho phép ước lượng bậc độ lớn, khoảng hàng trăm nghìn token cho toàn bộ bốn phase khi tính cả tài liệu, mã, log và các lượt sửa. Phiên làm việc không cung cấp hóa đơn hoặc tổng token chính xác. Tái sử dụng scenario, giới hạn log và giữ một engine dùng chung giúp giảm việc lặp lại cùng một quyết định.

Nếu làm lại, nên có bài thử clone sạch và launcher từ Phase 1 để phát hiện lỗi đóng gói sớm hơn. Nên đo GUI riêng với các fixture dựng sẵn và các ván mặc định, ghi rõ mỗi loại chứng minh điều gì. Với hiệu năng, cần lưu cả GPU, chế độ VSync, số frame và ngưỡng 1% thấp. Một con số FPS trung bình không phản ánh được độ giật ở những khung chậm nhất.
