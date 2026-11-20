---
name: verify-phase
description: Verify Đảo Đèn Lồng v1.2 headless regression, fuel rules, browser rendering, and performance.
---

Run npm run verify:all. tests/phase3.test.ts exercises the CLI at exact ticks. Run node tests/phase3-proof.mjs after build to capture browser evidence and measure FPS at 1280×720. Follow docs/proof/phase-3.md to reproduce headless evidence. Use matching Git tags to replay historical evidence. Update docs/TIEN-DO.md at each milestone.
Phase 4 uses contract 1.3. Run npm run verify:all, node tests/phase4-proof.mjs and the standard bench/soak commands, then verify disk export and the release ZIP.
