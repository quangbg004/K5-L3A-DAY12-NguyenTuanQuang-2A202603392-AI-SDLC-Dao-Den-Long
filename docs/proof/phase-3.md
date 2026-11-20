# Nghiệm thu Phase 3 · Đèn cạn dầu

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| AC3.1 · Nhiên liệu | Một đơn vị dầu cạn ở tick 60. Thắp lại ngay tick đó tốn 5 đom đóm, cộng tổng 65 điểm và tăng túi từ 10 lên 12. | [Cạn và thắp lại](phase-3/fuel-decay-out-relight.jsonl) |
| AC3.2 · Hút dầu | Hai Bóng Mực hút đồng thời, dầu từ 29 xuống 18 sau 60 tick. Châm dầu khôi phục vùng an toàn và đẩy Bóng Mực ra đúng 6 m. Test cũng kiểm tra ngưỡng 30 và 15 điểm cho pulse trúng drain. | [Hút dầu](phase-3/shade-drain-and-pulse.jsonl), [châm dầu](phase-3/refuel-and-safe-push.jsonl), [test](../../tests/phase3.test.ts) |
| AC3.3 · Bình minh | Ba đèn còn 39 dầu cho 417 điểm khi thắng Đêm 1 với ba lửa. Kiểm tra đủ ba ngưỡng và ưu tiên no_flames ngay tick cuối. | [Thắng bình minh](phase-3/dawn-survived.jsonl), [test](../../tests/phase3.test.ts) |
| AC3.4 và AC3.5 · Sức chứa và điểm | Đèn đặt sẵn giữ túi 10. Thắp lại tăng sức chứa nhưng giới hạn 20. Kiểm tra điểm nạp, châm, pulse và thưởng bình minh. | [Giới hạn túi](phase-3/capacity-cap.jsonl), [hồi quy](../../tests/contract.test.ts) |
| AC3.6 · 3D và bảng màu | Trình duyệt kiểm tra lưu cài đặt qua reload, HUD 7 / 14, đồng hồ trắng và ký hiệu ⚠. Tình huống dựng gần bình minh cung cấp cả hai pha nhấp nháy, vết rách trên đèn tắt, thanh dầu và Bóng Mực đang hút. | [Cài đặt](phase-3/settings.png), [pha sáng](phase-3/drain-bright.png), [pha tối](phase-3/drain-dim.png), [kết quả Đêm](phase-3/dawn.png) |
| AC3.7 · Contract và hồi quy | Build production và 34/34 test đạt. Lịch sử thay thế test và các quyết định về thứ tự tick có trong changelog và ADR. | [Log](phase-3/verify.log), [Changelog](../../CHANGELOG.md), [ADR](../adr/ADR-001-lantern-fuel-and-dawn-win.md) |

## Hiệu năng

- Bản production chạy khoảng 48 FPS trên từng đảo ở 1280×720, đo ít nhất 5 giây mỗi đảo trên Edge và Intel HD Graphics 630. [Mẫu đo](phase-3/fps.json)
- CLI chạy đủ Đêm 3, 18.000 tick, trong 1,13 giây và 0,87 giây. Hai đầu ra cùng SHA-256. Fixture kéo dài bất tử và tắt gió để đo hết Đêm. [Kết quả CLI](phase-3/headless.json)

## Tái lập

Chạy `npm run verify:all` từ thư mục gốc. Đặt biến môi trường PHASE3_PROOF thành `docs/proof/phase-3` khi chạy để lưu replay từ test. Benchmark dùng `node dist-sim/headless.js --night 3 --seed 42 --ticks 18000 --snapshot-every 60 --scenario tests/scenarios/perf.json --out dist-sim/phase3-bench.jsonl`.

Sau khi build, chạy `node tests/phase3-proof.mjs`. Nếu dùng Edge có sẵn, đặt BROWSER_CHANNEL thành msedge. Nếu dùng Chromium do Playwright quản lý, cài bằng `npx playwright install chromium`. Trình duyệt dùng bản mặc định để đo FPS và một tình huống đặt sẵn để kiểm tra đèn yếu và thắng bình minh. Test ẩn của giảng viên chưa được cung cấp.
