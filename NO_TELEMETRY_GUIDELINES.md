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

## 2. Maintenance Strategy: MERGE + FIX CONFLICTS

This branch must remain aligned with upstream `main`.

### THE GOLDEN RULE: ALWAYS MERGE MAIN

- **BE PRAGMATIC**: Do not wait for a "clean" upstream state. Merge frequently.
- **BE ASSERTIVE**: Conflicts are expected. **RESOLVE THEM!** Do not use conflicts as an excuse to avoid alignment.
- **STRATEGY**: Merge the latest `main` HEAD (or a stable commit near HEAD) into the current `no-telemetry` branch.
- **SINGLE-MERGE SQUASH**: To produce a single commit for a release while keeping `main` aligned, use the "Single-Merge" approach:
  1. `git reset --hard [LAST_RELEASE_TAG]` (e.g., `v0.14.5-no-telemetry`)
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
2.  **VERSION SYNC**: Update version in ALL `package.json` files to match upstream (e.g., `0.16.0`). **DO NOT** append `-no-telemetry` to the version string.
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

---

## 4. Versioning Strategy: Two-Layer Approach

The version system has two distinct layers that serve different purposes:

| Layer                | Format          | Purpose                                      | Conflict Resolution                   |
| -------------------- | --------------- | -------------------------------------------- | ------------------------------------- |
| **Upstream version** | `0.14.3`        | Package compatibility, dependency resolution | **Keep identical** to upstream `main` |
| **No-telemetry标识** | `-no-telemetry` | UI identification, user awareness            | Always present in display strings     |

### Critical Rules:

1.  **`package.json` version field**: Must match upstream exactly (e.g., `"0.14.3"`). Never include `-no-telemetry` here.
2.  **UI display version**: Should show `[VERSION]-no-telemetry · ❌📡 · [HASH]` for user clarity.
3.  **Dependency conflicts**: If upstream adds `@opentelemetry/*` or similar telemetry packages, **REMOVE THEM** even if it creates a version mismatch. Privacy > compatibility.
4.  **Code conflicts**: If telemetry code is added upstream, replace with no-op implementations during merge resolution.

---

## 5. Release Process: Updating Version References

When releasing a new version (e.g., bumping from `v0.15.11-no-telemetry` to `v0.16.0-no-telemetry`), update **ALL** references across the codebase:

| File                                         | What to Update                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Dockerfile`                                 | `ARG QWEN_REF="v[version]-no-telemetry"`                                                              |
| All `.md` files (especially `README.md`)     | Any `[old-version]-no-telemetry` references AND the "original README" link version (e.g., `v0.16.0`) |
| `install.sh`, `build.sh`, `local-install.sh` | Any hardcoded version references                                                                      |
| CI/CD configuration files                    | Version tags and refs                                                                                 |

**Search command to find all occurrences:**

```bash
grep -r "v[old-version]-no-telemetry" --exclude-dir=node_modules .
```

**Important:** The `package.json` version field should match upstream exactly (e.g., `"0.14.3"`), without `-no-telemetry`. The suffix is only for UI display and branch naming.

---

## 6. Conflict Resolution Priority Matrix

When merging from `main`, conflicts may arise. Use this priority order:

| Conflict Type                      | Priority    | Action                                                    |
| ---------------------------------- | ----------- | --------------------------------------------------------- |
| `@opentelemetry/*` in dependencies | **HIGHEST** | Remove immediately, no exceptions                         |
| Metrics/analytics/tracking code    | **HIGHEST** | Replace with no-op stubs                                  |
| Installation ID generation         | **HIGHEST** | Return static UUID `00000000-0000-0000-0000-000000000000` |
| Specialized `README.md` content    | **HIGHEST** | **DO NOT** merge upstream README. Keep fork docs.         |
| Version string in `package.json`   | **MEDIUM**  | Match upstream (without `-no-telemetry`)                  |
| UI display version                 | **LOW**     | Keep `-no-telemetry` suffix for clarity                   |

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
> - Defined in `packages/core/src/telemetry/uiTelemetry.ts` as `class UiTelemetryService extends EventEmitter`
> - Contains NO `fetch`, NO `http.request`, NO `https.request`, NO `XMLHttpRequest`, NO WebSocket, NO `child_process`, NO `fs.write*` calls
> - Data lives entirely in memory (`SessionMetrics` object) and is consumed only by `StatsDisplay.tsx` (the local TUI panel)
> - Listeners are registered via `uiTelemetryService.on(...)` only within the same process
> - **Forwarding events to it is 100% privacy-safe and does NOT violate the no-telemetry policy**

### The `loggers.ts` PARTIAL no-op rule

`packages/core/src/telemetry/loggers.ts` contains ~30 logger functions. After a no-telemetry merge, it is tempting to make ALL of them no-ops. **DO NOT do this.** Three functions MUST forward events to `uiTelemetryService` or the quit statistics will be permanently blank:

| Function | Must forward to | Privacy impact |
|---|---|---|
| `logApiResponse` | `uiTelemetryService.addEvent()` | ✅ Zero — local memory only |
| `logApiError` | `uiTelemetryService.addEvent()` | ✅ Zero — local memory only |
| `logToolCall` | `uiTelemetryService.addEvent()` | ✅ Zero — local memory only |

**These three functions are NOT a telemetry leak.** They do not send data anywhere. They update an in-memory counter that is displayed to the user on their own screen when the session ends. No-op-ing them is a correctness bug, not a privacy improvement.

The correct implementation (copy exactly, do NOT make no-ops):

```typescript
export function logApiResponse(config: Config, event: ApiResponseEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_API_RESPONSE as typeof EVENT_API_RESPONSE,
  });
  uiTelemetryService.addEvent(uiEvent);           // ✅ local EventEmitter only
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent); // ✅ local file only
}

export function logApiError(config: Config, event: ApiErrorEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_API_ERROR as typeof EVENT_API_ERROR,
  });
  uiTelemetryService.addEvent(uiEvent);           // ✅ local EventEmitter only
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent); // ✅ local file only
}

export function logToolCall(config: Config, event: ToolCallEvent): void {
  const uiEvent = Object.assign(event, {
    'event.name': EVENT_TOOL_CALL as typeof EVENT_TOOL_CALL,
  });
  uiTelemetryService.addEvent(uiEvent);           // ✅ local EventEmitter only
  config.getChatRecordingService()?.recordUiTelemetryEvent(uiEvent); // ✅ local file only
}
```

> 🔒 **Privacy proof for `getChatRecordingService()`** — writes to a local file (`~/.qwen/tmp/<session-id>.json`) for the `--resume` feature only. Verified: no network calls anywhere in `ChatRecordingService`. This is purely local session persistence.

All other ~30 `log*` functions in `loggers.ts` MUST remain `(_config, _event): void {}` (complete no-ops) because they would otherwise route data to external OTel exporters, GCP, or analytics endpoints.

### Verification checklist after every merge

Run this grep to confirm no external data paths snuck in:

```bash
# Must print ZERO results (no real OTel packages)
find node_modules -name "index.js" -path "*opentelemetry/api*" 2>/dev/null

# Must show uiTelemetryService only for the 3 allowed functions
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

| Source file location | Correct import |
|---|---|
| `packages/core/src/telemetry/*.ts` | `import ... from './dummy-otel.js'` |
| `packages/core/src/core/*.ts` | `import ... from '../telemetry/dummy-otel.js'` |
| `packages/core/src/core/subdir/*.ts` | `import ... from '../../telemetry/dummy-otel.js'` |
| `packages/core/src/utils/*.ts` | `import ... from '../telemetry/dummy-otel.js'` |

**After every merge**, verify no stray `@opentelemetry` imports remain in non-test source:

```bash
grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" \
  | grep -v "\.test\." | grep -v "node_modules"
# Must return zero lines
```

esbuild (`npm run bundle`) correctly resolves `@opentelemetry/api` via root `tsconfig.json` paths during bundling, so the *bundle* works even without this fix. But `npm start` (non-bundled mode) and any direct `node packages/core/dist/...` invocation will crash without it.

