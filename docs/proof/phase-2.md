# Nghiệm thu Phase 2 · Ba hòn đảo

**26/26 test đạt** khi chạy build và Vitest trên Windows, Node 20.17. Đã kiểm tra hồi quy theo số liệu mới của Ticket-02. Bộ test ẩn của giảng viên chưa được cung cấp. [Log chạy](phase-2/verify.log)

## Chơi trọn màn mặc định

Các lượt sau dùng CLI production, seed 42, chỉ truyền input, giữ nguyên bản đồ, đồng hồ, kẻ địch, gió và vật phẩm mặc định. Mỗi tệp nén chứa đúng một JSON input theo contract. Script tái lập bên dưới giải nén rồi chạy CLI và kiểm tra từng sự kiện thắp đèn.

| Đêm | Số đèn thắp | Tick thắng | Điểm |
|---|---:|---:|---:|
| [Đảo Bến](phase-2/night-1-inputs.json.gz) | 5 | 8.421 | 1.468 |
| [Đảo Cau](phase-2/night-2-inputs.json.gz) | 6 | 12.239 | 1.602 |
| [Đảo Chuông](phase-2/night-3-inputs.json.gz) | 7 | 17.735 | 1.678 |

Tổng điểm ba lượt thắng là **4.748**. [Kết quả và tick thắp từng đèn](phase-2/campaign.json)

## Truy vết Ticket-02

| Yêu cầu | Kiểm chứng | Bằng chứng |
|---|---|---|
| Luật chuẩn, điểm, bất tử, vùng đèn | Chạy lại tám fixture Phase 1 với tham số mới. Kiểm tra xung theo 3D, đẩy qua 15 bước, điều kiện kết thúc đồng thời | [Hồi quy CLI](../../tests/contract.test.ts), [luật từng Đêm](../../tests/unit/night-rules.test.ts) |
| F1 Lướt, rơi và hồi sinh | 12 tick đi 2,8 m, khóa cao độ trên không, hồi chiêu, mất toàn bộ đom đóm khi rơi | [Lướt](phase-2/dash.jsonl), [trên không](phase-2/air-dash.jsonl), [rơi](phase-2/fall.jsonl) |
| F2 Gió Lạc và F3 Bùa Gió | Nhặt bùa, cướp trước hit, trả đồ khi bị pulse, hết hạn và hồi bùa | [Replay trên cầu](phase-2/night2-drifter-charm.jsonl), [test trạng thái](../../tests/phase2.test.ts) |
| Địa hình và gió mạnh | Qua cầu hoặc dùng bục tới đảo B, leo dốc lên tầng 1, phóng lên tầng 2, gió đẩy 10 m trong 300 tick | [Cầu](phase-2/night2-bridge.jsonl), [bục Đêm 2](phase-2/night2-pad.jsonl), [dốc](phase-2/night3-ramp.jsonl), [bục Đêm 3](phase-2/night3-pad.jsonl), [gió](phase-2/night3-wind.jsonl) |
| F4 Hành trình | Mở các đảo mặc định trên bản build. Kiểm tra chuyển màn và tổng điểm qua ba tình huống trình duyệt đặt Mây trước đèn cuối, nhấn E thật. Kiểm tra chơi lại Đêm 2 với 3 lửa | [Menu](phase-2/menu.png), [lời Ông Đăng](phase-2/intro.png), [Đảo Cau](phase-2/intro-2.png), [Đảo Chuông](phase-2/intro-3.png), [Bình Minh](phase-2/dawn.png) |
| F5 Tạm dừng, F6 Cài đặt | Kiểm tra sim_tick đóng băng, mở đủ bốn nút, tiếp tục bằng phím/nút. Chỉnh âm lượng và độ nhạy rồi reload, đọc lại giá trị | [Replay](phase-2/pause.jsonl), [tạm dừng](phase-2/pause.png), [cài đặt](phase-2/settings.png) |
| F7 Âm thanh | Nhạc nền và cue Web Audio được nối với sự kiện, nhảy, cảnh báo gió và giây đếm ngược. Trình duyệt chạy qua phát nhạc và chỉnh volume. Chất lượng nghe từng cue cần đánh giá bằng tai | [Âm thanh](../../src/client/audio.ts), [điểm kích hoạt](../../src/client/main.ts) |
| F8 HUD, F9 màu và ánh sáng | HUD ở ba đảo, prompt nạp và đồng hồ đỏ khi còn 20 giây, mũi tên khi quay camera. Màu vật liệu theo bảng, ambient theo tỉ lệ đèn sáng | [HUD](phase-2/night-1.png), [đồng hồ và nạp](phase-2/deposit-countdown.png), [chỉ hướng](phase-2/direction.png), [bảng màu](../../src/client/palette.ts) |

## Hiệu năng và tính tất định

- **Headless** chạy hai lần đủ 21.600 tick ở Đêm 3, ghi snapshot mỗi 10 tick. Thời gian thực gồm khởi động Node và ghi JSONL lần lượt 1,60 s và 1,88 s. SHA-256 trùng nhau. Fixture bật sinh thực thể, tắt gió và kéo dài bất tử để Mây đứng yên đến bình minh. [Số đo và hash](phase-2/headless.json)
- **Đồ họa** đạt trung bình khoảng 48,0 FPS trên từng đảo ở 1280×720, đo bằng requestAnimationFrame ít nhất 5 giây trên Edge và Intel HD Graphics 630. Đây là kết quả trên máy đo này. [Số khung hình, thời gian và GPU](phase-2/fps.json)

## Tái lập từ thư mục gốc

1. Chạy `npm ci` và `npm run verify:all`.
2. Chạy `node tests/phase2-proof.mjs` để tái lập các JSONL, hai hash và ba lượt thắng mặc định.
3. Chạy `npx playwright install chromium` rồi `node tests/browser-proof.mjs` để mở bản build ở loopback, đo FPS và chụp ảnh. Có thể đặt `BROWSER_CHANNEL=msedge` nếu dùng Edge đã cài. Script tự mở và dừng hai máy chủ cục bộ. Các fixture kết thúc Đêm chỉ được nạp trên máy chủ kiểm thử.
