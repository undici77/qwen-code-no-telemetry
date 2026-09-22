---
paths:
  - "packages/core/src/tools/artifact/**"
  - "packages/core/src/core/permissionFlow.ts"
description: No-telemetry fork §1.7 — remote artifact publishing hard-locked off, publish always prompts
---

### Artifact remote-upload lockdown (§1.7)

Remote artifact publishing MUST be hard-locked off, and publishing MUST always prompt a human — even under `yolo` and `auto_edit`. All logic is fork-owned in `tools/artifact/no-remote-publish.ts`; `create-publisher.ts` carries one tagged call collapsing `host`/`oss` to `local` before upstream's `switch`, and `artifact-tool.ts` carries a tagged `requiresUserInteraction()` override.

**Trap:** `getDefaultPermission() === 'ask'` is **not** evidence a user is prompted — `permissionFlow.ts` discards it: YOLO auto-approves everything except `ask_user_question`, and `AUTO_EDIT` auto-approves any confirmation of `type: 'info'`, which is what `ArtifactTool`'s confirmation is. Without the override, an armed `oss`/`host` publisher lets the model read and upload up to 16 MB per file with no prompt. If upstream ever adds a new publisher backend, add it to the collapse list — a backend not in that list is an open egress path.
