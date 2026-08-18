# Qwen Code: No-Telemetry Guidelines

This document defines the privacy policy, technical architecture, and maintenance strategy for the "No-Telemetry" fork of Qwen Code. It is foundational for all automated agents and human developers.

---

## 1. Core Privacy Policy: Zero External Data Leakage

1.  **NO TRACKING**: Absolutely NO telemetry, analytics, or usage statistics may be sent to any external server. All OpenTelemetry dependencies are removed.
2.  **NO IDENTITY**: No unique installation IDs. `getInstallationId()` must ALWAYS return `00000000-0000-0000-0000-000000000000`. The `InstallationManager` is hardcoded to this static ID.
3.  **LOCAL PERSISTENCE ONLY**: Data is strictly local. It is only saved for local session history and hierarchical memory, as required for the application's core functionality.
4.  **NEUTRALIZED CORE**: All network-bound loggers are replaced with no-op functions.
5.  **DISABLED AUTO-UPDATES**: Hardcode `enableAutoUpdate` to `false` in default settings.
6.  **DISABLED GIT CO-AUTHOR**: Hardcode `gitCoAuthor` to `false` in default settings to prevent accidental identity leakage in commit history.

---

## 1.5. MANDATORY: WebSearch/SerpApi Patch (Non-Negotiable)

The built-in `web_search` tool **MUST** remain backed by [SerpApi](https://serpapi.com), NOT by DashScope/Google/GLM/Tavily or any other upstream provider. This is a **mandatory, non-removable patch** that applies to every merge and every release.

**Why**: The upstream WebSearch tool historically used DashScope Responses API, which routes through external servers and violates the no-telemetry policy. SerpApi is a neutral, privacy-respecting search aggregator with a free tier (250 queries/month) and no identity leakage.

**Rule**: On every merge from `main`, if upstream modifies, replaces, or removes the SerpApi-backed `web_search` implementation, **the SerpApi patch MUST be restored**. The implementation lives in `packages/core/src/tools/web-search.ts`. The configuration schema is in `packages/core/src/config/settingsSchema.ts`. The docs are in `docs/developers/tools/web-search.md`.

**Verification checklist after every merge**:

```bash
# Must reference SerpApi, NOT DashScope/Google/GLM/Tavily as the backend
grep -n "SerpApi\|serpapi\|SERPAPI" packages/core/src/tools/web-search.ts | head -5
# Must NOT contain upstream DashScope Responses API references
grep -n "dashscope\|DashScope" packages/core/src/tools/web-search.ts
# Must return zero lines (no DashScope in web-search.ts)
```

**Conflict resolution priority**: If upstream WebSearch code conflicts with the SerpApi patch, **always resolve in favor of SerpApi**. Document the resolution in the commit message.

---

## 1.6. MANDATORY: Vision-Bridge Image Concurrency Patch (Non-Negotiable)

The vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) **MUST NEVER** permanently reject an image because of how many images were requested in one turn. It **MUST** only throttle how many bridge calls run _concurrently_ (capped at `VISION_BRIDGE_MAX_IMAGES`, currently 4), queuing the rest until a slot frees up. Every valid image is eventually converted — none are dropped.

**Why**: Upstream/legacy code tracked a per-turn `WeakMap` (`turnImageCounts`) and permanently failed any image past the 4th in a turn with `"image conversion budget was exhausted"`. With a text-only primary model + local vision-bridge model, asking about e.g. 9 images in one turn silently dropped 5 of them — the primary model was told those images were "unavailable," even though the bridge model could process them fine. This is a **user-data-loss bug**, not a resource-safety feature: a real per-image-count cap discards user data for no technical reason. The correct safety mechanism is a **concurrency gate**, not a **rejection cap** — it protects a shared local model server from being hit by too many simultaneous requests without ever losing an image.

**Rule**: On every merge from `main`, if upstream reintroduces a per-turn/per-image-count rejection cap in the vision bridge (a `WeakMap`/counter that fails images past some N), **replace it with the concurrency-gate pattern** (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot` in `vision-bridge-service.ts`). Never accept a design where the Nth+1 image in a turn returns `status: 'failed'` due to volume alone.

**Verification checklist after every merge**:

```bash
# Must return zero lines — no rejection cap tracking has crept back in
grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
# Must reference the concurrency gate
grep -n "tryAcquireBridgeSlotSync\|waitForBridgeSlot\|releaseBridgeSlot" packages/core/src/services/visionBridge/vision-bridge-service.ts | head -5
```

**Conflict resolution priority**: If upstream vision-bridge code conflicts with this patch, **always resolve in favor of the concurrency gate** (throttle, never reject on count). Document the resolution in the commit message.

---

## 2. Maintenance Strategy: MERGE + FIX CONFLICTS

This branch must remain aligned with upstream `main`.

### THE GOLDEN RULE: ALWAYS MERGE MAIN

- **BE PRAGMATIC**: Do not wait for a "clean" upstream state. Merge frequently.
- **BE ASSERTIVE**: Conflicts are expected. **RESOLVE THEM!** Do not use conflicts as an excuse to avoid alignment.
- **STRATEGY**: Merge the latest `main` HEAD (or a stable commit near HEAD) into the current `no-telemetry` branch.
- **SINGLE-MERGE SQUASH**: To produce a single commit for a release while keeping `main` aligned, use the "Single-Merge" approach:
  1. `git reset --hard [LAST_RELEASE_TAG]`
  2. `git merge --no-ff main -m "feat: release [NEW_VERSION]"`
  3. Resolve conflicts, neutralize telemetry, and `git commit --amend` to finalize.
     _This ensures `main` is a parent (alignment) while keeping all changes in one commit._
- **NEUTRALIZATION**: During resolution, ALWAYS prioritize the dummy/no-op implementations for anything telemetry-related.
- **README MAINTENANCE**: The `README.md` in this fork is a specialized replacement. Maintain it "as is", updating ONLY the version references and installation URLs.

### Implementation Pattern (Dummy Layer)

- **packages/core/src/telemetry/**: Maintain no-op functions for all exports.
- **package.json**: Remove ALL `@opentelemetry/*` dependencies.
- **Neutralize New Features**: If upstream adds new tracking logic, immediately neutralize it in the merge result.

> ⚠️ **CRITICAL: `loggers.ts` partial-no-op rule** — See Section 11 below.

---

## 3. Mandatory Post-Merge Actions

Every successful merge REQUIRES:

1.  **NODE VERSION**: Ensure you are using **Node.js >= 22.0.0** to avoid `EBADENGINE` warnings.
2.  **VERSION SYNC**: Update version in ALL `package.json` files to match upstream. **DO NOT** append `-no-telemetry` to the version string.
3.  **DOCKER/SANDBOX SYNC**: Update `sandboxImageUri` in root `package.json` and `Dockerfile` to match the new version.
4.  **CLEAN BUILD ARTIFACTS**: If seeing "No matching export" errors in `esbuild`, run a selective cleanup:
    ```bash
    find packages/*/src -name "*.ts" -o -name "*.tsx" | sed 's/\.ts$//; s/\.tsx$//' | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done
    ```
5.  **LOCKFILE REGEN**: Run `npm install` to ensure `package-lock.json` is consistent.
6.  **VERIFICATION**: Run `npm run build:packages` and `npm run lint`.
7.  **STATS DISPLAY CHECK** ⚠️ See Section 11: Verify `logApiResponse`, `logApiError`, `logToolCall` in `packages/core/src/telemetry/loggers.ts` forward to `uiTelemetryService` — they must NOT be no-ops.
8.  **RUNTIME IMPORT CHECK** ⚠️ See Section 12: Verify no `.ts` source files import directly from `@opentelemetry/api` (or other removed packages) using the bare package name:
    ```bash
    grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
    # Must return zero lines
    ```
9.  **TEST SUITE ALIGNMENT**: Ensure that obsolete OpenTelemetry test suites (`packages/core/src/telemetry/*.test.ts` except `uiTelemetry.test.ts`) are excluded in `packages/core/vitest.config.ts`, as they cannot compile/resolve without the removed `@opentelemetry` dependencies.
10. **WEBSEARCH/SERPAPI CHECK** ⚠️ See Section 1.5: Verify the built-in `web_search` tool still uses SerpApi backend and NOT DashScope/Google/GLM/Tavily:
    ```bash
    grep -n "SerpApi\|serpapi\|SERPAPI" packages/core/src/tools/web-search.ts | head -5
    grep -n "dashscope\|DashScope" packages/core/src/tools/web-search.ts
    # Second command must return zero lines
    ```
11. **VISION-BRIDGE CONCURRENCY CHECK** ⚠️ See Section 1.6: Verify the vision bridge throttles concurrency instead of rejecting images past a per-turn count:
    ```bash
    grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
    # Must return zero lines
    ```
12. **TEST STRATEGY — AVOID TIME WASTE** ⚠️ Every merge verification must follow this ordered checklist. Do NOT skip steps or run blind full suites:

    **Step 1 — Build (fast, 30s):**

    ```bash
    npm run build:packages 2>&1 | tail -5
    # Must exit 0. If it fails, fix before testing.
    ```

    **Step 2 — Typecheck (fast, 30s):**

    ```bash
    npm run typecheck 2>&1 | tail -10
    # If sdk-typescript fails with "ExpectStatic has no call signatures",
    # check vitest version drift (see AGENTS.md §Efficiency & Troubleshooting #6).
    ```

    **Step 3 — Targeted package tests ONLY (never root `npm run test`):**

    ```bash
    # Run these in parallel; each should complete in <60s:
    npm run test --workspace=packages/sdk-typescript 2>&1 | tail -5
    npm run test --workspace=packages/acp-bridge 2>&1 | tail -5
    npm run test --workspace=packages/webui 2>&1 | tail -5
    ```

    **Step 4 — Core tests (slow, ~75s — only if core files changed):**

    ```bash
    # Capture FAIL count immediately; do not wait for full output:
    npm run test --workspace=packages/core 2>&1 | grep "Test Files"
    # Expected: ~22 pre-existing failures. If NEW failures appear, investigate.
    ```

    **Step 5 — No-telemetry grep checks (instant):**

    ```bash
    # All must return zero lines:
    grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."
    grep -n "dashscope\|DashScope" packages/core/src/tools/web-search.ts
    grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
    # loggers.ts must reference uiTelemetryService (4+ lines):
    grep -c "uiTelemetryService" packages/core/src/telemetry/loggers.ts
    ```

    **Golden rule:** If a command times out, kill it. Never let a test run beyond 2× its expected duration. The full `npm run test` from root is a trap — it launches every package including slow integration tests.

    **Timeout reference (use these values in `run_shell_command` `timeout` parameter):**

    | Command                                            | Expected duration | Safe timeout                                |
    | -------------------------------------------------- | ----------------- | ------------------------------------------- |
    | `npm run build:packages`                           | ~30s              | 60s                                         |
    | `npm run build` (full, incl. web-shell)            | ~90–120s          | **180s**                                    |
    | `npm run typecheck`                                | ~30s              | 60s                                         |
    | `npm run lint`                                     | ~90s              | **180s**                                    |
    | `npm run lint:fix`                                 | ~120s+            | **180s** (may still timeout on large diffs) |
    | `npm run test --workspace=packages/sdk-typescript` | ~25s              | 60s                                         |
    | `npm run test --workspace=packages/acp-bridge`     | ~20s              | 60s                                         |
    | `npm run test --workspace=packages/webui`          | ~10s              | 60s                                         |
    | `npm run test --workspace=packages/core`           | ~75s              | **180s**                                    |
    | `npm install`                                      | ~60–100s          | **180s**                                    |

---

## 4. Versioning Strategy: Two-Layer Approach

The version system has two distinct layers that serve different purposes:

| Layer                | Purpose                                      | Conflict Resolution                   |
| -------------------- | -------------------------------------------- | ------------------------------------- |
| **Upstream version** | Package compatibility, dependency resolution | **Keep identical** to upstream `main` |
| **No-telemetry标识** | UI identification, user awareness            | Always present in display strings     |

### Critical Rules:

1.  **`package.json` version field**: Must match upstream exactly. Never include `-no-telemetry` here.
2.  **UI display version**: Should show `[VERSION]-no-telemetry · ❌📡 · [HASH]` for user clarity.
3.  **Dependency conflicts**: If upstream adds `@opentelemetry/*` or similar telemetry packages, **REMOVE THEM** even if it creates a version mismatch. Privacy > compatibility.
4.  **Code conflicts**: If telemetry code is added upstream, replace with no-op implementations during merge resolution.

---

## 5. Release Process: Updating Version References

`package.json` `"version"` is the single source of truth. On release, read the version from `package.json` and update:

| File          | What to Update                                                                      |
| ------------- | ----------------------------------------------------------------------------------- |
| `Dockerfile`  | `ARG QWEN_REF="v[version]-no-telemetry"`                                            |
| `install.sh`  | All example version references and usage docs                                       |
| `install.ps1` | All example version references and usage docs (Windows counterpart of `install.sh`) |
| `README.md`   | Install script URLs/examples AND the "original README" link version                 |

The `-no-telemetry` suffix is always the same — never change it.

---

## 6. Conflict Resolution Priority Matrix

When merging from `main`, conflicts may arise. Use this priority order:

| Conflict Type                         | Priority    | Action                                                                                        |
| ------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `@opentelemetry/*` in dependencies    | **HIGHEST** | Remove immediately, no exceptions                                                             |
| Metrics/analytics/tracking code       | **HIGHEST** | Replace with no-op stubs                                                                      |
| Installation ID generation            | **HIGHEST** | Return static UUID `00000000-0000-0000-0000-000000000000`                                     |
| WebSearch/SerpApi patch               | **HIGHEST** | **ALWAYS** restore SerpApi backend. Never accept upstream DashScope/Google/GLM/Tavily.        |
| Vision-bridge image concurrency patch | **HIGHEST** | **ALWAYS** throttle concurrency (max 4 in flight); never reject an image on a per-turn count. |
| Specialized `README.md` content       | **HIGHEST** | **DO NOT** merge upstream README. Keep fork docs.                                             |
| Version string in `package.json`      | **MEDIUM**  | Match upstream (without `-no-telemetry`)                                                      |
| UI display version                    | **LOW**     | Keep `-no-telemetry` suffix for clarity                                                       |

### Golden Rule:

> **No-telemetry policy ALWAYS takes priority over version alignment.**
>
> If keeping telemetry code (packages, imports, or logic) is the only way to "match" upstream versions, **REMOVE IT**. The dummy layer approach means we maintain compatibility through neutral implementations, not by keeping telemetry.

---

## 7. Architectural Evolution

The strategy for maintaining privacy has evolved to optimize for maintainability:

- **Legacy Approach (Until v0.12.1-no-telemetry)**: The policy was to **delete all telemetry-related files**. While effective for privacy, this caused massive merge conflicts and made it difficult to align with upstream updates.
- **Current Approach (From v0.12.3-no-telemetry onwards)**: Switched to a **"privacy-first" dummy implementation**. We remove all `@opentelemetry/*` packages from `package.json` but maintain the file structure with no-op/dummy layers. This keeps the application code calling these modules untouched, making merges easier while ensuring zero data leakage.

---

## 8. Instructions for AI Models

- **TOKEN EFFICIENCY**:
  - Combine multiple `grep` or `ls` commands into a single `run_shell_command` call.
  - Use `npm run build --workspace=<pkg>` instead of root build if only one package changed.
  - When fixing mass type errors (like `req.params` casts), use `replace` with `allow_multiple: true` or a `sed` loop to fix all at once.
- **NO EXCUSES**: Aligning this branch is your job. "Conflicts too complex" is not an acceptable failure.
- **PLANNING**: Always start by evaluating the conflict scope and presenting a clear resolution plan—**before beginning any full evaluation or merge execution**.
- **PRECISION**: If you are unsure about a specific conflict resolution, ASK THE USER, but provide your best recommendation first.
- **ABSOLUTE NON-NEGOTIABLES**:
  - ✅ **BEFORE STARTING FULL EVALUATION**: You MUST first perform a _scoped, preliminary conflict assessment_ (e.g., "Which files touched telemetry? Which commits introduced new tracking?"). Only proceed once this is complete.
  - ✅ **ONCE STARTED, NO ABORT. NO DEDUCTION. NO HALLUCINATION**.
    - **CLOSE THE TASK IMMEDIATELY**—do _not_ pause, ask clarifying questions beyond _one_ critical confirmation (if absolutely unavoidable), or request "more context."
    - **NEVER** say "This is complicated" as a reason to delay or abort.
    - **NEVER** claim "I need more tokens" to justify incompletion—use the available token budget _aggressively_ to resolve and close.
    - **IF APPEARING TO "MERDE" (e.g., merge conflict, ambiguous file)**: DO NOT ABORT. Resolve _ pragmatically_. Prioritize the dummy layer. Overwrite uncertainty with decisive action.
    - **IF HALLUCINATING** (e.g., inventing upstream behavior, assuming intent): STOP. Re-examine diffs. If unsure, default to **no telemetry = no-op** and document your assumption _in the commit message_, then close.
  - ✅ **CLOSE THE JOB** with a successful merge commit, clear version bump, and post-merge verification—even if imperfect. **Imperfect closure > perfect ambiguity**.

---

## 9. Enforcement Principle: _One-Time, One-Attempt Resolution_

> **Every merge attempt is a _single-shots_ operation.**
> You get one chance to evaluate, resolve, and close. No retries, no "second attempts" unless explicitly restarted by a human.
> — If resolution fails after best-effort, _abort silently_, record failure in commit message, and raise no complaint.
> — Human review follows—_you do not escalate_. You closed the job, and it failed. That is acceptable. Delaying or hallucinating is not.

---

## 10. Troubleshooting & Build Optimizations

### Stale Build Artifacts

If you update a `.ts` file but `esbuild` (e.g., in `vscode-ide-companion`) complains about missing exports in the corresponding `.js` file in the same `src` folder, you have **stale artifacts**.
**Fix**: Use the cleanup script in Section 3.4.

### WebUI Type Generation

`vite-plugin-dts` may fail to generate types if CSS/SVG imports are present.
**Pattern**: Use a dedicated `tsconfig.dts.json` and a manual `tsc` step in the `webui` build script to ensure valid `.d.ts` files are produced.

### Express Request Params

In newer TypeScript versions or strict modes, `req.params['id']` might be inferred as `string | string[]`.
**Fix**: Always cast to string: `const id = req.params['id'] as string;`.

### Installer Git Errors

`local-install.sh` builds in a temporary directory without `.git`.
**Optimization**: Ensure build scripts (like `generate-git-commit-info.js`) handle the absence of a git repository gracefully (e.g., by checking environment variables first or silencing stderr).

---

## 11. Privacy-Safe Local Stats vs. External Telemetry: The `loggers.ts` Rule

This is the most subtle and dangerous post-merge failure mode. **Read carefully.**

### The `uiTelemetryService` is NOT telemetry — it is local stats

`packages/core/src/telemetry/uiTelemetry.ts` exports a `uiTelemetryService` singleton that is a **pure in-process Node.js `EventEmitter`**. It has zero network code. It aggregates token counts and tool stats that are displayed in the "Agent powering down. Goodbye!" quit panel. It never persists to disk and never touches the network.

> 🔒 **Privacy proof for `uiTelemetryService`** — verified by code audit:
>
> - Defined in `packages/core/src/telemetry/uiTelemetry.ts` as `class UiTelemetryService extends EventEmitter`
> - Contains NO `fetch`, NO `http.request`, NO `https.request`, NO `XMLHttpRequest`, NO WebSocket, NO `child_process`, NO `fs.write*` calls
> - Data lives entirely in memory (`SessionMetrics` object) and is consumed only by `StatsDisplay.tsx` (the local TUI panel)
> - Listeners are registered via `uiTelemetryService.on(...)` only within the same process
> - **Forwarding events to it is 100% privacy-safe and does NOT violate the no-telemetry policy**

### The `loggers.ts` PARTIAL no-op rule

`packages/core/src/telemetry/loggers.ts` contains ~30 logger functions. After a no-telemetry merge, it is tempting to make ALL of them no-ops. **DO NOT do this.** Four functions MUST forward events to `uiTelemetryService` or the quit statistics will be permanently blank:

| Function                | Must forward to                              | Privacy impact              |
| ----------------------- | -------------------------------------------- | --------------------------- |
| `logApiResponse`        | `uiTelemetryService.addEvent()`              | ✅ Zero — local memory only |
| `logApiError`           | `uiTelemetryService.addEvent()`              | ✅ Zero — local memory only |
| `logToolCall`           | `uiTelemetryService.addEvent()`              | ✅ Zero — local memory only |
| `recordSkillInvocation` | `uiTelemetryService.recordSkillInvocation()` | ✅ Zero — local memory only |

**These four functions are NOT a telemetry leak.** They do not send data anywhere. They update an in-memory counter that is displayed to the user on their own screen when the session ends. No-op-ing them is a correctness bug, not a privacy improvement.

The correct implementation (copy exactly, do NOT make no-ops):

```typescript
export function logApiResponse(config: Config, event: ApiResponseEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_API_RESPONSE,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function logApiError(config: Config, event: ApiErrorEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_API_ERROR,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function logToolCall(config: Config, event: ToolCallEvent): void {
  const uiEvent = {
    ...event,
    'event.name': EVENT_TOOL_CALL,
    'event.timestamp': new Date().toISOString(),
  } as UiEvent;
  uiTelemetryService.addEvent(uiEvent, config.getSessionId());
  recordUiTelemetryEventToChat(config, uiEvent);
}

export function recordSkillInvocation(
  config: Config,
  event: { skillName: string; success: boolean },
): void {
  uiTelemetryService.recordSkillInvocation(
    event.skillName,
    event.success,
    config.getSessionId(),
  );
}
```

> 🔒 **Privacy proof for `getChatRecordingService()`** — writes to a local file (`~/.qwen/tmp/<session-id>.json`) for the `--resume` feature only. Verified: no network calls anywhere in `ChatRecordingService`. This is purely local session persistence.

All other ~29 `log*` functions in `loggers.ts` MUST remain `(_config, _event): void {}` (complete no-ops) because they would otherwise route data to external OTel exporters, GCP, or analytics endpoints.

### Verification checklist after every merge

Run this grep to confirm no external data paths snuck in:

```bash
# Must print ZERO results (no real OTel packages)
find node_modules -name "index.js" -path "*opentelemetry/api*" 2>/dev/null

# Must show uiTelemetryService only for the 4 allowed functions
grep -n "uiTelemetryService\|fetch\|http\.request\|https\.request" \
  packages/core/src/telemetry/loggers.ts

# Must return false (no usage stats sent as request headers)
grep -A3 "getUsageStatisticsEnabled" packages/core/src/config/config.ts

# Must be === true guard (update check disabled by default)
grep -B1 "checkForUpdates()" packages/cli/src/gemini.tsx
```

---

## 12. The `@opentelemetry/api` Runtime Resolution Rule

**Problem**: TypeScript `tsconfig.json` `paths` entries (e.g., `"@opentelemetry/api": ["./src/telemetry/dummy-otel.ts"]`) only affect type-checking. They do **NOT** rewrite import specifiers in the compiled `.js` output. So after `tsc --build`, every `import { context } from '@opentelemetry/api'` in `.js` files stays as-is and will throw `ERR_MODULE_NOT_FOUND` at runtime if the real package is absent.

**Rule**: All source `.ts` files that import from `@opentelemetry/api` (or any other removed `@opentelemetry/*` package) MUST use **relative imports** pointing to the local dummy instead:

| Source file location                 | Correct import                                    |
| ------------------------------------ | ------------------------------------------------- |
| `packages/core/src/telemetry/*.ts`   | `import ... from './dummy-otel.js'`               |
| `packages/core/src/core/*.ts`        | `import ... from '../telemetry/dummy-otel.js'`    |
| `packages/core/src/core/subdir/*.ts` | `import ... from '../../telemetry/dummy-otel.js'` |
| `packages/core/src/utils/*.ts`       | `import ... from '../telemetry/dummy-otel.js'`    |

**After every merge**, verify no stray `@opentelemetry` imports remain in non-test source:

```bash
grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" \
  | grep -v "\.test\." | grep -v "node_modules"
# Must return zero lines
```

esbuild (`npm run bundle`) correctly resolves `@opentelemetry/api` via root `tsconfig.json` paths during bundling, so the _bundle_ works even without this fix. But `npm start` (non-bundled mode) and any direct `node packages/core/dist/...` invocation will crash without it.
