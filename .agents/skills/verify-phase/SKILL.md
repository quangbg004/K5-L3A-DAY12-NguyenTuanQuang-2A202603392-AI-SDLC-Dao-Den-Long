---
name: verify-phase
description: Verify Đảo Đèn Lồng Phase 1 changes against the headless contract and browser gameplay, and refresh the corresponding evidence.
---

Run npm run verify:all at the project root. Re-run the affected CLI scenarios in tests/scenarios with seed 42 and save the actual JSONL in docs/proof. Compare complete output bytes across repeated runs for changes to the simulation. For visual changes, run the preview and tests/browser-proof.mjs as described in docs/proof/phase-1.md. Record observed results and any pending checks in docs/TIEN-DO.md.
