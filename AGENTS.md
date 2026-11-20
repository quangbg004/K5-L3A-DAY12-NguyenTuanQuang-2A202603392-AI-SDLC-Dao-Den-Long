# Đảo Đèn Lồng

Contract v1.1 lấy số liệu từ game.contract.json và bản đồ từ src/sim/maps.ts. CLI và web dùng cùng Game. Đọc docs/specs/Ticket-02.md trước khi sửa.

Giữ thứ tự input/pause → bộ đếm → di chuyển/rơi → nhặt → nạp → vùng an toàn → pulse → AI → chạm (Gió Lạc trước) → sinh → kết quả → snapshot. Tick 0 đứng trước input. Paused đóng băng sim_tick. Trạng thái bóng hợp lệ gồm spawning, wander, chase, recoil, stunned.

Chạy npm run verify:all, kiểm tra trình duyệt theo docs/proof/phase-2.md. Ghi kết quả từng mốc vào docs/TIEN-DO.md. Giữ bằng chứng lịch sử Phase 1.
