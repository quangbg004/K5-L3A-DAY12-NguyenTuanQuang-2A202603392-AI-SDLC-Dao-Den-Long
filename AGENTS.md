# Đảo Đèn Lồng

Contract v1.3 lấy số liệu từ game.contract.json và bản đồ từ src/sim/maps.ts. CLI và web dùng cùng Game. Đọc docs/specs/Ticket-03.md trước khi sửa.

Giữ thứ tự input/pause → bộ đếm, hao/hút dầu rồi tắt đèn cạn → di chuyển/rơi → nhặt → nạp → vùng an toàn → pulse → AI → chạm (Gió Lạc trước) → sinh → kết quả → snapshot. Tick 0 đứng trước input. Paused đóng băng sim_tick. Trạng thái bóng hợp lệ gồm spawning, wander, chase, recoil, stunned, drain. Dầu lưu bằng số nguyên phần sáu mươi. Xét hết lửa trước, sau đó chỉ thắng ở bình minh nếu đủ đèn sáng.

Chạy npm run verify:all, kiểm tra trình duyệt theo docs/proof/phase-3.md. Ghi kết quả từng mốc vào docs/TIEN-DO.md. Giữ bằng chứng lịch sử Phase 1–2.

Phase 4 dùng Ticket-04. Đo bench với 200 Bóng wander và 100 đom đóm, soak 10 Đêm cùng tiến trình. Kiểm tra xuất leaderboard từ launcher và chạy npm run verify:all.
