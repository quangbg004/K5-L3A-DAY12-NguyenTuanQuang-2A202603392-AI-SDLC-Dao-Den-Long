# Changelog

## Phase 3 · Contract v1.2

- Thắp đủ đèn vẫn tiếp tục chơi. Thắng ở bình minh khi đủ 3/5, 4/6 hoặc 5/7 đèn sáng và còn lửa. Lý do thắng là dawn_survived. Thời lượng chuẩn là 240/270/300 giây.
- Đèn có dầu, châm dầu, cạn dầu và thắp lại bằng 5 đom đóm. Vùng an toàn cần ít nhất 30 dầu. Bóng Mực có trạng thái drain. Snapshot, scenario và sự kiện có các trường mới theo Ticket-03.
- Túi tăng 2 ô sau mỗi lần thắp, tối đa 20. Nạp hoặc châm dầu cộng 5 mỗi đom đóm. Thắp mới cộng 100, thắp lại cộng 40. Pulse trúng Bóng đang hút cộng 15. Thưởng bình minh dựa trên dầu và lửa, giữ khóa per_second_left bằng 0 để tương thích khi đọc cấu hình.
- HUD có mục tiêu bình minh, lượng dầu và sức chứa. Bảng màu dễ phân biệt lưu qua localStorage.
- Test deposit đổi 200 thành 150. Test win xác nhận ván tiếp tục khi sáng đủ. Test thắng mới kiểm tra ngưỡng từng đảo, điểm dầu, và thứ tự ưu tiên hết lửa. Benchmark hồi quy dùng 18.000 tick theo thời lượng mới. Bộ chứng cứ thắng sớm Phase 2 vẫn tái lập tại tag phase-2.
