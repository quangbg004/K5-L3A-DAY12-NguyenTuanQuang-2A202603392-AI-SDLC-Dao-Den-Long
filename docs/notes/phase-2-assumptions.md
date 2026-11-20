# Quy ước Phase 2

- Snapshot 0 đứng trước input. night_start là sự kiện vòng đời tại tick 0, sau snapshot. Tick tiếp tục chạy ngay khi resumed.
- Đêm 3 xuất phát ở (0,0,34) trên tầng 0 vì tâm có tháp; scenario được quyền đặt vị trí riêng. Độ cao Gió Lạc và Bóng Mực sinh tự nhiên bằng mặt đất + 0,8 m. Trạng thái spawning kéo dài 1 tick. Vùng sáng đẩy bóng ra mép ngay.
- Bục Đêm 2 dùng đúng hướng tâm, đúng vận tốc và trọng lực như ticket. Từ (20,0,18), quãng bay 33,6 m đủ để chạm đảo bên kia. Dốc và bục xử lý bằng cùng dữ liệu bản đồ ở CLI và web.
- Test Phase 1 được chuyển theo yêu cầu thay thế: nhặt không cộng điểm, nạp cộng 10 mỗi đốm, túi/giá đèn 10, pulse trúng 3D và đẩy nhiều tick, recoil lùi sau hit. Mốc và bằng chứng v1.0 còn ở tag phase-1.
