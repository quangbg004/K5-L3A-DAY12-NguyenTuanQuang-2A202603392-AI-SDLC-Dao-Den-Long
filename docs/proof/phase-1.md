# Bằng chứng · Đêm 1

| Yêu cầu | Phép kiểm tra | Kết quả thực tế |
|---|---|---|
| Nhặt và giới hạn túi | Sáu đom đóm ở đúng bán kính 1,8 m | [Nhặt 5, còn 1](pickup.jsonl) |
| Nạp một phần rồi thắp | Hai lần nhấn E, giữa hai lần nhặt thêm một đốm | [Nạp 2 rồi 1, đạt 110 điểm](deposit.jsonl) |
| Xung, hồi chiêu, hồi choáng | Bóng Mực ở đúng 6 m | [Đẩy đến 10 m, choáng 180 tick](pulse.jsonl) |
| Sát thương và bất tử | Đứng yên cạnh Bóng Mực | [Chạm ở tick 1 và 91](hit.jsonl) |
| Vùng an toàn | Đặt Bóng Mực cùng vị trí với Mây dưới đèn | [Đẩy ra rìa, giữ 3 lửa](safe.jsonl) |
| Thắng và thưởng | Thắp đèn cuối | [all_lit, 608 điểm](win.jsonl) |
| Hai điều kiện thua | Một lửa hoặc 0,05 giây còn lại | [no_flames](loss.jsonl) · [dawn](dawn.jsonl) |
| Xoay camera, đi chéo, nhảy, giữ nút | Một giây input xoay 90° | [Test chuyển động](../../tests/unit/motion.test.ts) |
| Lỗi schema và tick trùng | Chạy CLI trong tiến trình riêng | [Kiểm tra mã 2 và stderr](../../tests/contract.test.ts) |
| Tính tất định | Hai lần chạy CLI seed 42, 1.501 tick, snapshot mỗi 10 tick | SHA-256 hai tệp cùng bằng `c06d039a2ac288ce5e0e083fff67707e74108494e9758d1ba5c77eaef8ab200d` |
| Bản web WebGL | Edge chạy bản build qua HTTP, gửi phím theo đường đi từ đảo mặc định | [Màn đầu](welcome.png) · [HUD](playing.png) · [Thắng ở tick 1.957, 1.189 điểm](won.png) · [Thua](lost.png). Chơi lại sau cả hai kết quả, HUD trở về 0/5 đèn và 0 điểm. |

## Tái lập

Chạy `npm run verify:all`. Các đầu vào nằm trong [tests/scenarios](../../tests/scenarios). Ví dụ xuất lại bằng chứng thắng bằng `node dist-sim/headless.js --seed 42 --night 1 --ticks 10 --scenario tests/scenarios/win.json --inputs tests/scenarios/win-inputs.json --out docs/proof/win.jsonl`.

Để chạy bài kiểm tra hình ảnh, mở `npm start` tại cổng 4173. Trong terminal thứ hai, chạy `npx playwright install chromium` rồi `node tests/browser-proof.mjs`. Có thể đặt biến môi trường BROWSER_CHANNEL thành msedge để dùng Edge đã cài sẵn. Script dùng bàn phím và đồng hồ khung hình có kiểm soát, kiểm tra điểm hiển thị, chụp ảnh trực tiếp từ trang.
