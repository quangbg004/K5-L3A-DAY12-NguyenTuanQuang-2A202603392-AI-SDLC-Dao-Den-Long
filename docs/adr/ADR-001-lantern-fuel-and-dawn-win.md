# ADR-001 · Nhiên liệu đèn và thắng ở bình minh

Playtest kết thúc quá sớm khi người chơi thắp đủ đèn. Mỗi đèn nay lưu dầu bằng số nguyên fuel60, một đơn vị bằng 1/60 dầu. Bước 2 trừ hao và cộng dồn lượng hút, rồi tắt đèn cạn. Đèn sáng đủ 30 dầu giữ vùng an toàn. Khi dưới 30, Bóng Mực đang wander có thể tìm đến và chuyển drain. Đèn từng sáng cần 5 đom đóm để thắp lại.

Sau mọi cập nhật ở bước 11, hết lửa luôn thua trước. Chỉ khi hết giờ và đủ ngưỡng 60% đèn sáng mới thắng. Điểm thưởng lấy từ dầu và số lửa còn lại. Giá trị dầu chỉ làm tròn khi xuất. HUD, bản 3D và CLI dùng cùng trạng thái.

Châm dầu xét lượng dầu sau bước trừ hao. Đèn đặt sẵn có fuel mặc định 100 và không làm tăng sức chứa. Mỗi Bóng Mực phát fuel_drain sau từng 60 tick hút liên tục theo thời gian mô phỏng.
