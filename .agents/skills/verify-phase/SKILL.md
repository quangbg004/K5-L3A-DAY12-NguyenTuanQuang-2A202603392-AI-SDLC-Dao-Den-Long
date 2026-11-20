---
name: verify-phase
description: Verify Đảo Đèn Lồng v1.1 regression, three-night gameplay, CLI performance and browser evidence.
---

Run npm run verify:all after simulation changes. Use the scenario fixtures for v1.1 and compare repeated seeded output byte-for-byte. Verify that the Night 3 benchmark reaches tick 21600 within 30 seconds. For client changes follow docs/proof/phase-2.md, run the browser check at 1280×720 and record measured FPS and settings persistence. Keep Phase 1 evidence separate. Update docs/TIEN-DO.md at each milestone.
