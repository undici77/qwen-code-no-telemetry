---
paths:
  - "packages/core/src/telemetry/**"
  - "tsconfig.json"
  - "packages/*/tsconfig*.json"
description: No-telemetry fork §11/§12 — loggers.ts partial no-op and the dummy-otel import rule
---

### `loggers.ts` partial no-op rule (§11)

Six functions in `packages/core/src/telemetry/loggers.ts` call `uiTelemetryService.addEvent()` (a local-only in-process `EventEmitter` — zero network, zero disk): `logApiResponse`, `logApiError`, `logToolCall`, `logApiCancel`, `logUserFeedback`, `recordSkillInvocation`. None of the six may be a no-op, and four of them (`logApiResponse`, `logApiError`, `logToolCall`, `logUserFeedback`) must also reach `config.getChatRecordingService()?.recordUiTelemetryEvent()` (local file only, for `--resume`). Making them full no-ops blanks the "Agent powering down. Goodbye!" quit stats (Model Usage / tokens / tool counts) — a correctness bug, not a privacy fix. The fork patches **no function body** in this file — it differs from upstream by the `dummy-otel.js` import alone — so all 54 exported `log*`/`record*` functions keep upstream bodies and stay **inert** because `QwenLogger` never sends and the OTel SDK never initializes. Never re-point one at a real exporter, and never "tighten" the list by emptying a body.

### `@opentelemetry/api` runtime import rule (§12)

`tsconfig.json` `paths` only affect type-checking and esbuild bundling; they do NOT rewrite `.js` output. Any `.ts` importing from `@opentelemetry/api` must use a **relative import to `dummy-otel.js`** (e.g. `from '../telemetry/dummy-otel.js'`), or `npm start` crashes with `ERR_MODULE_NOT_FOUND`. `check:context` greps both the `from '…'` form and the inline `import('…')` type form — the inline form is what produced `TS2307` for months before v0.23.0.
