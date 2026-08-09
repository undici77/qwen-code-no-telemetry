## Qwen Added Memories

- **Version Rule**: `package.json` `"version"` is the single source of truth. On release, read the version from `package.json` and update: **Dockerfile** (`ARG QWEN_REF="v[version]-no-telemetry"`), **install.sh** (all example version references), **install.ps1** (all example version references, Windows counterpart of install.sh), **README.md** (install script URLs and original README link). The `-no-telemetry` suffix is always the same — never change it.

- **Single-Merge Strategy**: To produce a single release commit while keeping `main` aligned:
  1. `git reset --hard [LAST_TAG]`
  2. `git merge --no-ff main -m "feat: release [VERSION]"`
  3. Resolve/neutralize and `git commit --amend`
     _Avoid `reset --soft` after merge as it breaks the history link to `main`._

- **Troubleshooting Stale Artifacts**: If `esbuild` (used in `bundle` or `vscode-ide-companion`) fails with "No matching export" for an internal import that _is_ exported in `.ts`, you have stale `.js` files in your `src` directory.
  **Fix**: `find packages/*/src -name "*.ts" -o -name "*.tsx" | sed 's/\.ts$//; s/\.tsx$//' | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done`

- **Node.js Requirement**: ALWAYS use **Node.js >= 22.0.0**. The project will fail to build on older versions due to `EBADENGINE` and modern dependencies.

- **WebUI Build Pattern**: We use a custom `tsconfig.dts.json` and a manual `tsc` step in `packages/webui/package.json` because `vite-plugin-dts` is unreliable with CSS/SVG imports.

- When running tests in this no-telemetry fork, be aware of these pre-existing test failures that are NOT related to our changes:

**Environment-specific failures (running as root):**

1. `src/tools/edit.test.ts` - "should return FILE_WRITE_FAILURE on write error" - Fails because root bypasses file permission checks
2. `src/utils/pathReader.test.ts` - "should return an error string if reading a file with no permissions" - Fails because root bypasses permission checks
3. `packages/cli/src/utils/housekeeping/cleanup.test.ts` - "counts errors and continues sweep when one dir cannot be removed" - Fails because root bypasses directory write restrictions (fixed by skipping when `process.getuid?.() === 0`).

These tests were already failing before our changes and are expected when running as root.

**Tests we fixed for no-telemetry:**

1. `installationManager.test.ts` - Updated to test static UUID return value
2. `config.test.ts` - Usage statistics tests and gitCoAuthor tests now expect disabled by default
3. `settingsSchema.test.ts` - Added test to verify gitCoAuthor default is false
4. `gemini.test.tsx` - Fixed mock for `getCliVersionDisplay` (was incorrectly checking for non-existent `getCliVersion`)
5. `mustTranslateKeys.test.ts` - Fixed by restoring accidentally deleted locale files and ensuring `git-commit.js` exists.
6. `packages/core/src/telemetry/*.test.ts` (except `uiTelemetry.test.ts`) - Excluded in `packages/core/vitest.config.ts` since all `@opentelemetry` packages are removed in this fork.

**Telemetry Implementation:**

1. **OpenTelemetry Removal**: All `@opentelemetry/*` packages (the original upstream telemetry provider) have been completely removed from dependencies.
2. **QwenLogger Substitution**: OpenTelemetry logic has been replaced with an internal `QwenLogger` (found in `packages/core/src/telemetry/qwen-logger/`) to maintain codebase compatibility without external dependencies.
3. **No-Op Dummy Layer**: In this fork, `QwenLogger` and all associated telemetry loggers are implemented as **hardcoded no-ops (empty stubs)**. This ensures that even if the code calls a logging function, no data is ever processed or leaked, maintaining 100% privacy.

- **⚠️ CRITICAL: `loggers.ts` partial no-op rule** — After every no-telemetry merge, confirm that `logApiResponse`, `logApiError`, and `logToolCall` in `packages/core/src/telemetry/loggers.ts` are NOT no-ops. They MUST call `uiTelemetryService.addEvent()` and `config.getChatRecordingService()?.recordUiTelemetryEvent()`. Making them full no-ops causes the "Agent powering down. Goodbye!" quit panel to show blank Model Usage / token stats. **This does NOT violate the no-telemetry policy**: `uiTelemetryService` is a local-only `EventEmitter` — zero network, zero disk writes, in-memory only — and `getChatRecordingService()` writes to a local file only (for `--resume`). Both have been code-audited: no `fetch`, no `http.request`, no external endpoints. No-op-ing these functions is a correctness bug, not a privacy fix. All other ~30 log functions remain empty no-ops. See `NO_TELEMETRY_GUIDELINES.md §11`.

- **⚠️ CRITICAL: `@opentelemetry/api` runtime import rule** — TypeScript `tsconfig.json` `paths` entries (mapping `@opentelemetry/api` → `dummy-otel.ts`) only affect type-checking and esbuild bundling; they do NOT rewrite `.js` output. After a merge that introduces new files importing from `@opentelemetry/api`, change those imports to relative paths (e.g., `from '../telemetry/dummy-otel.js'`). Otherwise `npm start` crashes with `ERR_MODULE_NOT_FOUND`. Verify with: `grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."` — must return zero lines. See `NO_TELEMETRY_GUIDELINES.md §12`.

- **⚠️ MANDATORY: WebSearch/SerpApi patch** — The built-in `web_search` tool **MUST** remain backed by SerpApi, NOT DashScope/Google/GLM/Tavily. This is a non-removable patch. On every merge, if upstream modifies the WebSearch tool, **restore the SerpApi implementation**. Implementation: `packages/core/src/tools/web-search.ts`. Verification: `grep -n "dashscope\|DashScope" packages/core/src/tools/web-search.ts` must return zero lines. See `NO_TELEMETRY_GUIDELINES.md §1.5`.

- **⚠️ MANDATORY: Vision-bridge image concurrency patch** — The vision bridge **MUST NEVER** reject an image because of a per-turn image count. It throttles concurrent bridge calls to `VISION_BRIDGE_MAX_IMAGES` (4) in flight and **queues** the rest — every valid image is eventually converted, none are dropped. This is a non-removable patch. On every merge, if upstream reintroduces a per-turn rejection cap (a `WeakMap`/counter that fails images past N), **replace it with the concurrency gate** (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot`). Implementation: `packages/core/src/services/visionBridge/vision-bridge-service.ts`. Verification: `grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts` must return zero lines. See `NO_TELEMETRY_GUIDELINES.md §1.6`.
