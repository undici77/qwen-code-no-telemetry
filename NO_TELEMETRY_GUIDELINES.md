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

### How the patch is structured (read this before a merge)

Upstream's `web-search.ts` is a large, actively-changed DashScope implementation (1400+ lines; 4 commits in the two months before v0.23.2). The fork used to carry its SerpApi backend as a whole-file replacement of that file, so **every** upstream change opened an ~800-line semantic conflict. The patch is split so that conflict is structurally impossible:

| File                                                               | Owner    | Merge rule          | Role                                                                                                                                           |
| ------------------------------------------------------------------ | -------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/tools/serpapi-web-search.ts`                    | **fork** | new file            | The whole SerpApi backend: gate, fetch, Markdown conversion, tool class. Upstream never creates it.                                            |
| `packages/core/src/tools/serpapi-web-search.test.ts`               | **fork** | new file            | The executable §1.5 guarantee (below).                                                                                                         |
| `packages/core/src/tools/web-search.ts`                            | **fork** | `merge=ours`        | ~5-line re-export of the module above, under the names upstream's consumers import.                                                            |
| `packages/core/src/tools/web-search.test.ts`                       | **fork** | `merge=ours`        | Shim guard — fails if the seam is ever resolved toward upstream.                                                                               |
| `docs/developers/tools/web-search.md`                              | **fork** | `merge=ours`        | Fork documentation.                                                                                                                            |
| `packages/core/src/config/config.ts` (`webSearch` field docstring) | mixed    | small additive hunk | Fork comment marks SerpApi the only backend and upstream's keys inert. Comment only — no behaviour change, but NOT byte-identical to upstream. |
| `packages/cli/src/config/config.ts` (`resolveWebSearchSettings`)   | mixed    | small additive hunk | Upstream body preserved; four SerpApi keys appended, tagged.                                                                                   |
| `packages/cli/src/config/settingsSchema.ts` (`webSearch` block)    | mixed    | small additive hunk | Upstream keys kept so the block stays upstream-shaped; descriptions are fork-owned.                                                            |

**Upstream's DashScope keys are accepted and inert.** `model`, `webExtractor`, `baseUrl` and `apiKeyEnv` stay in the schema and the resolver because deleting them would re-open a conflict in three files for no privacy gain — the fork has no DashScope backend, so no code path can turn those values into a request. They are documented as ignored in `settingsSchema.ts`, `settings.schema.json` and the tool docs.

**Enablement follows upstream's opt-out shape.** The tool registers whenever `evaluateWebSearchGate` resolves a SerpApi API key (`tools.webSearch.apiKey` or `SERPAPI_API_KEY`) and `enabled !== false`. With nothing configured the gate returns `silent: true`, so the tool stays off with no startup notice. That is what lets upstream's registration _call sites_ survive untouched — the fork adds tagged keys inside the resolver and a tagged comment on the `webSearch` field, but never rewrites the registration itself. No `config.ts` is byte-identical to upstream; the hunks are additive and tagged, which is what makes them cheap to re-apply and easy to spot.

`merge=ours` is **not** a built-in git merge driver — it must be registered in `.git/config`, which git does not clone. `npm install` registers it (`postinstall` → `node scripts/check-merge-drivers.js --fix`); `npm run check:merge-drivers` fails if the `.gitattributes` declaration and the registration drift apart.

### Verification checklist after every merge

The guarantee is now enforced by tests, not by grep. `src/tools/web-search.test.ts` is **no longer excluded** in `packages/core/vitest.config.ts` — it used to be, which left the mandatory patch with zero coverage while upstream's DashScope suite sat against a SerpApi implementation.

```bash
# 1. Executable guarantee: intercepts every outbound request and asserts the
#    host is serpapi.com — including when the config carries upstream's
#    DashScope model / baseUrl / apiKeyEnv values.
cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts

# 2. SerpApi must be the only host the search path can contact. The word
#    "DashScope" stays in the tree ON PURPOSE — inert settings keys, the seam
#    comment, and the tests that prove those keys cannot produce a request all
#    name it. Grepping for the word matches the conflict-reduction strategy
#    itself, and "fixing" a hit means deleting inert upstream code, which
#    re-opens the ~800-line conflict the seam exists to prevent.
grep -n "https://" packages/core/src/tools/serpapi-web-search.ts
# Only the request template `https://serpapi.com/search` (a hardcoded URL whose
# only parameters are q/engine/hl/gl/api_key, so no setting can supply a host)
# and the `example.com` attribution text in the tool description may appear.

# 3. The seam must still point at the fork backend.
grep -n "serpapi-web-search" packages/core/src/tools/web-search.ts
# Must return the re-export line.

# 4. Merge drivers declared in .gitattributes must be registered.
npm run check:merge-drivers
```

**Conflict resolution priority**: if upstream WebSearch code ever conflicts with the SerpApi patch, **always resolve in favor of SerpApi** and document the resolution in the commit message. Because the seams are `merge=ours`, a conflict here means the driver was never registered — fix the driver (`git config --local merge.ours.driver true`) rather than hand-porting code.

**Merge reporting**: `merge=ours` discards upstream's changes silently, so list what was discarded after every merge and decide whether any of it is a generic fix worth porting:

```bash
git log --oneline <previous-upstream>..<new-upstream> -- packages/core/src/tools/web-search.ts
```

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

## 1.7. MANDATORY: Artifact Remote-Upload Lockdown (Non-Negotiable)

Remote artifact publishing **MUST** be hard-locked off, and artifact publishing **MUST** always require a human confirmation — even under `yolo` and `auto_edit`. This is a **mandatory, non-removable patch** that applies to every merge and every release.

**Why**: upstream does the obvious thing right — `ArtifactTool.getDefaultPermission()` returns `'ask'`, and the confirmation text names the remote host. That `'ask'` is then **silently discarded** by two upstream approval-mode overrides in `packages/core/src/core/permissionFlow.ts`:

```ts
// needsConfirmation(): YOLO auto-approves everything except ask_user_question
if (approvalMode === ApprovalMode.YOLO && !isAskUserQuestionTool) return false;

// isAutoEditApproved(): AUTO_EDIT auto-approves any 'info' confirmation
return (
  approvalMode === ApprovalMode.AUTO_EDIT &&
  (confirmationDetails?.type === 'edit' || confirmationDetails?.type === 'info')
);
```

`ArtifactTool`'s confirmation is `type: 'info'`, so **both** modes skip the prompt. Combined with `artifact.publisher` set to `oss` or `host`, the model picks an absolute `file_path`, reads up to 16 MB, and uploads it with **no prompt at all** — repeatable, file by file, across a whole codebase. `host` is worse still: it runs the configured `uploadCommand` as a subprocess. This is not an upstream bug and not sabotage; it is a gap between two independently reasonable mechanisms. `auto_edit` is the dangerous one precisely because it does not sound alarming.

**What was already safe**: the publisher default is `local` at both layers, so with no explicit `artifact.publisher` there is no egress even under YOLO — it writes a local file. And headless `-p` plus background agents **fail closed** (`'ask'` becomes deny when nobody can prompt). The patch closes the remaining window: remote armed **and** an auto-approving mode.

### How the patch is structured (read this before a merge)

| File                                                               | Owner    | Merge rule            | Role                                                                                                                                                                                                  |
| ------------------------------------------------------------------ | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/tools/artifact/no-remote-publish.ts`            | **fork** | new file              | All lockdown logic. Upstream never creates this path, so it can never conflict.                                                                                                                       |
| `packages/core/src/tools/artifact/no-remote-publish.test.ts`       | **fork** | new file              | The executable §1.7 guarantee (below).                                                                                                                                                                |
| `packages/core/src/tools/artifact/create-publisher.ts`             | mixed    | small additive hunk   | One tagged call wrapping the kind before upstream's `switch`. The `host`/`oss` branches stay in the file and stay type-valid, just unreachable.                                                       |
| `packages/core/src/tools/artifact/artifact-tool.ts`                | mixed    | small additive hunk   | Tagged `requiresUserInteraction()` override — the existing upstream lever (same one `exitPlanMode` uses) that forces `'ask'` past YOLO and AUTO_EDIT.                                                 |
| `packages/core/src/tools/artifact/create-publisher.test.ts`        | mixed    | small additive hunk   | Upstream asserted `HostPublisher`/`OssPublisher`; retagged to assert the collapse to `LocalPublisher`.                                                                                                |
| `packages/cli/src/config/settingsSchema.ts` (`artifact.publisher`) | mixed    | description text only | `'host'`/`'oss'` stay in the enum so the block keeps upstream's shape; the description says they are accepted and ignored. Keys are **not** deleted. Regenerate the vscode schema copy after editing. |

**No escape hatch, by design.** There is deliberately no env var or settings key that re-arms remote publishing. Re-enabling it means editing `no-remote-publish.ts`, so the decision is always visible in a diff. Do not add a bypass "for convenience".

**Unknown kinds must still throw.** The guard collapses only `'host'` and `'oss'`. An unrecognised kind passes through so upstream's `default` branch keeps failing loudly instead of a typo silently becoming `'local'`.

### Verification checklist after every merge

```bash
# 1. Executable guarantee: a fully armed hostile config (real upload command,
#    real bucket+endpoint) still yields LocalPublisher, and the prompt cannot
#    be silenced by YOLO or AUTO_EDIT.
cd packages/core && npx vitest run src/tools/artifact/

# 2. Both hooks must still be present and tagged.
grep -n "enforceNoRemoteArtifactPublisher" packages/core/src/tools/artifact/create-publisher.ts
grep -n "requiresUserInteraction" packages/core/src/tools/artifact/artifact-tool.ts
# Each must return a hit. If either disappears, the lockdown is gone.

# 3. No remote publisher may be constructed outside the tests.
git grep -n "new OssPublisher\|new HostPublisher" -- 'packages/*/src/**' ':!*.test.ts'
# Must return zero lines. create-publisher.ts is the only production site.

# 4. The approval-mode hole must still be the shape this patch assumes. If
#    upstream ever narrows YOLO or the 'info' auto-approve, re-read this
#    section — the patch may become redundant, which is fine, but the test
#    that pins the hole will fail and must be re-evaluated, not deleted.
grep -n "ApprovalMode.YOLO\|type === 'info'" packages/core/src/core/permissionFlow.ts
```

**Runtime proof** (once per release, method in §17): set `artifact.publisher` to `"oss"` with a real bucket and endpoint, then publish under `--approval-mode=yolo` while tracing sockets. Expect a `file://` result, a debug line saying the publisher was disabled, and **zero** non-provider connects.

**Conflict resolution priority**: if upstream changes conflict with this patch, **always resolve in favor of the lockdown** (local-only + always-confirm) and document the resolution in the commit message. If upstream adds a _new_ publisher backend, add it to the collapse list in `no-remote-publish.ts` — a backend not in that list is an open egress path.

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

    **Then check for tracked survivors.** A `rm` on a _tracked_ `.js`/`.d.ts` that sits beside a `.ts` only dirties the tree — the file returns on the next checkout, so the resolution hijack (`.js` wins over `.ts`) is still there and the cleanup has silently done nothing. Untrack instead of deleting, and add an explicit `.gitignore` line for that exact path:

    ```bash
    git ls-files 'packages/*/src/**/*.js' 'packages/*/src/**/*.d.ts'
    # Anything listed here that has a .ts/.tsx sibling is committed build
    # output. Untrack it (git rm --cached) and ignore the explicit path.
    ```

    Do **not** fix this with a blanket `packages/*/src/**/*.js` ignore — `packages/cli/src/i18n/locales/*.js` and the bundled `dataviz` scripts are hand-written tracked sources and would be silently swallowed.

5.  **LOCKFILE REGEN**: Run `npm install` to ensure `package-lock.json` is consistent.
6.  **VERIFICATION**: Run `npm run build:packages` and `npm run lint`.
7.  **STATS DISPLAY CHECK** ⚠️ See Section 11: Verify `logApiResponse`, `logApiError`, `logToolCall` in `packages/core/src/telemetry/loggers.ts` forward to `uiTelemetryService` — they must NOT be no-ops.
8.  **RUNTIME IMPORT CHECK** ⚠️ See Section 12: Verify no `.ts` source files import directly from `@opentelemetry/api` (or other removed packages) using the bare package name:
    ```bash
    grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
    grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
    # BOTH must return zero lines — the second catches inline type references
    # like import('@opentelemetry/api').SpanContext, invisible to the first.
    ```
9.  **TEST SUITE ALIGNMENT**: Ensure that obsolete OpenTelemetry test suites (`packages/core/src/telemetry/*.test.ts` except `uiTelemetry.test.ts`) are excluded in `packages/core/vitest.config.ts`, as they cannot compile/resolve without the removed `@opentelemetry` dependencies.
10. **WEBSEARCH/SERPAPI CHECK** ⚠️ See Section 1.5: Verify the built-in `web_search` tool still uses SerpApi backend and NOT DashScope/Google/GLM/Tavily. The guarantee is a test, not a grep:
    ```bash
    cd packages/core && npx vitest run src/tools/serpapi-web-search.test.ts src/tools/web-search.test.ts
    # The suite intercepts every outbound request and asserts host === serpapi.com.
    grep -n "https://" packages/core/src/tools/serpapi-web-search.ts
    # Only `https://serpapi.com/search` and the `example.com` attribution text
    # may appear. Do NOT grep for the word "DashScope" — it is kept in the
    # tree on purpose (inert keys + the tests that prove they stay inert).
    grep -n "serpapi-web-search" packages/core/src/tools/web-search.ts
    # The shim must still re-export the fork backend.
    grep -c "\[no-telemetry fork\]" packages/core/src/config/config.ts packages/cli/src/config/config.ts packages/cli/src/config/settingsSchema.ts
    # Each must report >=1. These three carry the §1.5 guards stating that
    # upstream's model/baseUrl/apiKeyEnv values are inert. They were the files
    # no documented checklist looked at: a merge can strip them and every other
    # gate still reports clean.
    npm run check:merge-drivers
    # .gitattributes declares merge=ours for the fork seams; it must be registered.
    ```
11. **VISION-BRIDGE CONCURRENCY CHECK** ⚠️ See Section 1.6: Verify the vision bridge throttles concurrency instead of rejecting images past a per-turn count:
    ```bash
    grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
    # Must return zero lines
    grep -c "tryAcquireBridgeSlotSync\|waitForBridgeSlot\|releaseBridgeSlot" packages/core/src/services/visionBridge/vision-bridge-service.ts
    # Must report 7+. The negative grep above only catches a VERBATIM
    # reintroduction of the names this fork deleted; an upstream cap under a new
    # name slips past it. These positive greps are the load-bearing check.
    grep -n "bridgeSlotsAvailable = VISION_BRIDGE_MAX_IMAGES" packages/core/src/services/visionBridge/vision-bridge-service.ts
    # The bound must be a concurrency limit, not a per-turn count.
    ```
12. **APPEND-ONLY AUTO-MEMORY CHECK** ⚠️ See Section 14: Verify the prompt-cache patch survived. All **13** tagged hook lines must still be present across the three files (`core/client.ts` 5, `core/environmentContext.ts` 6, `memory/refresh.ts` 2), and the memory layer must no longer be hardcoded into the main system prompt:

    ```bash
    grep -rn "no-telemetry fork" packages/core/src/core/client.ts packages/core/src/core/environmentContext.ts packages/core/src/memory/refresh.ts
    # Must return 13 lines
    grep -c "autoMemory: this.config.getAutoMemoryPrompt()" packages/core/src/core/client.ts
    # Must return exactly 1 (the custom-instruction branch, intentionally untouched)
    grep -rn "includeAutoMemoryReminder" packages/core/src/agents/
    # Must return zero lines (subagents never opt in)
    ```

13. **CONTEXT & PROMPT-CACHE STATUS ITEMS CHECK** ⚠️ See Section 15: Verify the status-line patch survived. All logic must still live in the fork-owned module, and the fork module must not import upstream values back (module cycle):

    ```bash
    grep -rn "no-telemetry fork" packages/cli/src/ui/statusLinePresets.ts packages/cli/src/ui/hooks/useStatusLine.ts
    # Must return 12 lines (statusLinePresets.ts 7, useStatusLine.ts 5)
    grep -n "from './statusLinePresets" packages/cli/src/ui/status-line-fork-items.ts
    # Must return zero lines (importing upstream back forms a startup-breaking cycle)
    ```

14. **TEST STRATEGY — AVOID TIME WASTE** ⚠️ Every merge verification must follow this ordered checklist. Do NOT skip steps or run blind full suites:

    **Step 1 — Build (fast, 30s):**

    ```bash
    npm run build:packages 2>&1 | tail -5
    # Must exit 0. If it fails, fix before testing.
    ```

    **Step 2 — Typecheck (fast, 30s):**

    ```bash
    npm run typecheck 2>&1 | tail -10
    # If sdk-typescript fails with "ExpectStatic has no call signatures",
    # check vitest version drift (see QWEN.md §Efficiency & Troubleshooting #6).
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
    grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."
    grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts
    grep -rn "includeAutoMemoryReminder" packages/core/src/agents/
    # Search path may contact only serpapi.com. Never grep for the word
    # "DashScope" here — the inert keys and the tests that prove them inert
    # name it deliberately, so a word-grep reports the strategy as a violation.
    grep -n "https://" packages/core/src/tools/serpapi-web-search.ts
    # loggers.ts must reference uiTelemetryService (4+ lines):
    grep -c "uiTelemetryService" packages/core/src/telemetry/loggers.ts
    # append-only memory hooks must survive the merge — grep -c prints one
    # "path:count" per file, so read the numbers, not a line count:
    grep -c "no-telemetry fork" packages/core/src/core/client.ts packages/core/src/core/environmentContext.ts packages/core/src/memory/refresh.ts
    # expect client.ts 5, environmentContext.ts 6, refresh.ts 2  (13 total)
    # status-line context/cache hooks must survive the merge:
    grep -c "no-telemetry fork" packages/cli/src/ui/statusLinePresets.ts packages/cli/src/ui/hooks/useStatusLine.ts
    # expect statusLinePresets.ts 7, useStatusLine.ts 5  (12 total)
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
    | `npm run test --workspace=packages/web-shell`      | ~10s              | 60s                                         |
    | `npm run test --workspace=packages/core`           | ~75s              | **180s**                                    |
    | `npm install`                                      | ~60–100s          | **180s**                                    |
    | `npm run check:egress`                             | ~45s              | 180s                                        |

15. **EGRESS TRIPWIRE** ⚠️ See Section 18: Run `npm run check:egress` and require zero `LEAK` rows. This is the only check here that observes the running binary rather than its source, so it is the one that catches egress assembled at runtime — by a refactor, a new dependency, or worse. A run that reports `0 egress attempts` for the session scenario is a **broken detector, not a clean build**: it has happened, and §18 explains how to tell.

---

## 4. Versioning Strategy: Two-Layer Approach

The version system has two distinct layers that serve different purposes:

| Layer                     | Purpose                                      | Conflict Resolution                   |
| ------------------------- | -------------------------------------------- | ------------------------------------- |
| **Upstream version**      | Package compatibility, dependency resolution | **Keep identical** to upstream `main` |
| **No-telemetry identity** | UI identification, user awareness            | Always present in display strings     |

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

| Conflict Type                         | Priority    | Action                                                                                                                                                                                                                                       |
| ------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@opentelemetry/*` in dependencies    | **HIGHEST** | Remove immediately, no exceptions                                                                                                                                                                                                            |
| Metrics/analytics/tracking code       | **HIGHEST** | Replace with no-op stubs                                                                                                                                                                                                                     |
| Installation ID generation            | **HIGHEST** | Return static UUID `00000000-0000-0000-0000-000000000000`                                                                                                                                                                                    |
| WebSearch/SerpApi patch               | **HIGHEST** | **ALWAYS** keep the SerpApi backend. `merge=ours` handles the seams automatically — a conflict here means the driver is unregistered, so fix `git config --local merge.ours.driver true`. Never accept upstream DashScope/Google/GLM/Tavily. |
| Vision-bridge image concurrency patch | **HIGHEST** | **ALWAYS** throttle concurrency (max 4 in flight); never reject an image on a per-turn count.                                                                                                                                                |
| Append-only auto-memory patch         | **HIGHEST** | **ALWAYS** re-apply the 13 `[no-telemetry fork]` hook lines (client.ts 5, environmentContext.ts 6, refresh.ts 2) on top of upstream's new shape. Never resolve by dropping the flag.                                                         |
| Specialized `README.md` content       | **HIGHEST** | **DO NOT** merge upstream README. Keep fork docs — now declared `merge=ours` in `.gitattributes`, so git discards upstream's version instead of leaving this to memory. List what was discarded per §1.5 merge reporting.                    |
| Version string in `package.json`      | **MEDIUM**  | Match upstream (without `-no-telemetry`)                                                                                                                                                                                                     |
| UI display version                    | **LOW**     | Keep `-no-telemetry` suffix for clarity                                                                                                                                                                                                      |

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
grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" \
  | grep -v "\.test\." | grep -v "node_modules"
# BOTH must return zero lines. The first matches only `from '…'`; inline type
# references such as import('@opentelemetry/api').SpanContext are invisible to
# it and caused TS2307 in telemetry/session-tracing.ts for months before
# v0.23.0. Run both or the check is not a check.
```

esbuild (`npm run bundle`) correctly resolves `@opentelemetry/api` via root `tsconfig.json` paths during bundling, so the _bundle_ works even without this fix. But `npm start` (non-bundled mode) and any direct `node packages/core/dist/...` invocation will crash without it.

---

## 13. Telemetry Commits Can Change Control-Flow Timing — Verify TUI Behavior After Every Merge

Upstream telemetry fixes frequently change **control flow** (adding `await`, wrapping calls in `try/finally`, deferring callbacks) in order to keep trace spans open. These changes are invisible to the no-telemetry dummy layer — the spans are no-ops — but the **timing change itself survives the merge** and can break unrelated behavior. This is the most subtle post-merge failure mode after the `loggers.ts` rule (§11).

### The incident (v0.21.12 regression)

Upstream commit `43b0779bc fix(telemetry): Address main agent tracing edge cases (#9121)` changed the tool-result submission in `packages/cli/src/ui/hooks/useGeminiStream.ts` from fire-and-forget to awaited:

```ts
// before (v0.21.11): submission returns immediately
void submitQuery(responsesToSend, SendMessageType.ToolResult, promptId, {...});
// after (v0.21.13): submission blocks until the whole continuation stream ends
await submitQuery(responsesToSend, SendMessageType.ToolResult, promptId, {...});
```

The change was made so the main-agent trace span covers the full continuation stream. **Side effect**: `handleCompletedTools` (and therefore `CoreToolScheduler.onAllToolCallsComplete`) now stays pending for the entire continuation, so the scheduler's `notifyToolCallsUpdate([])` — which clears the completed tool calls from the live pending region — only fires **after** the stream ends. Meanwhile `addItem(toolGroupDisplay)` had already committed the tool group to Static history. Result: the completed tool group renders in **both** the Static scrollback and the live pending region for the whole stream → the TUI visibly duplicates the last tool block during RUN.

### The rule

When merging upstream telemetry commits, audit them for **control-flow changes**, not just telemetry calls:

- `void foo(...)` → `await foo(...)` (or any new `await` around an existing call)
- calls moved inside `try/finally` or `useEffect`/ref indirections
- callback resolution order changes (e.g., a notify/emit moved after an awaited callback)

Any of these can delay a state update that other code depends on, even with all telemetry no-op'd.

### The fix pattern (already applied — keep it on every merge)

The display-clear notification must fire **at the commit point**, not after the (potentially long) completion callback. In `packages/core/src/core/coreToolScheduler.ts`, `checkAndNotifyCompletion()` must call `notifyToolCallsUpdate()` right after `this.toolCalls = []` and **before** `await this.onAllToolCallsComplete(...)` (the `finally` block re-notifies afterwards to report any calls the continuation scheduled). If a merge removes or reorders this early notify, restore it.

### Verification checklist after every merge

```bash
# 1. The tool-result submission must not block the scheduler's display-clear.
#    (An `await` here is fine ONLY while the early notify in #2 is present.)
grep -n "submitQuery(responsesToSend, SendMessageType.ToolResult" packages/cli/src/ui/hooks/useGeminiStream.ts
# 2. The early display-clear notify must exist in the core scheduler:
grep -n "notifyToolCallsUpdate()" packages/core/src/core/coreToolScheduler.ts
#    It must appear BOTH right after `this.toolCalls = [];` in
#    checkAndNotifyCompletion AND in the finally block (2+ occurrences).
# 3. Regression test must exist:
grep -n "clears the live tool-call view before a slow completion callback" packages/core/src/core/coreToolScheduler.test.ts
```

**Manual smoke test** (interactive TUI): run a turn where a tool batch completes and the model continues streaming (e.g., a shell command with long output, then a follow-up reply). The completed tool block must appear **exactly once** — if it appears twice (once committed, once in the live region below the streaming answer), the early notify was lost in the merge.

---

## 14. MANDATORY: Append-Only Auto-Memory Patch (Non-Negotiable)

The managed auto-memory index **MUST** be deliverable through the conversation instead of the system prompt tail, gated by the `QWEN_MEMORY_APPEND_ONLY` environment variable. This is a **mandatory, non-removable patch** that applies to every merge.

**Why**: upstream keeps the memory index in the **system prompt**, which is serialized ahead of the whole conversation. `refreshMemoryInstruction()` rewrites it on every memory write, and the background extractor runs once per user turn — so one added index line invalidates every KV block behind it. On a prefix-caching server (oMLX, DeepSeek/Qwen, Anthropic `cache_control`) that is a full re-prefill of the transcript. With the flag on, the index rides in the startup prelude and later saves append a small delta at the end of history.

**Usage**: `QWEN_MEMORY_APPEND_ONLY=1` (also `true` / `on`). Unset = upstream behavior, byte for byte.

**Hooks** — all logic is in the fork-owned module; upstream files carry only additive hunks tagged `// [no-telemetry fork]`.

| File                                                                  | Ownership | Must contain                                                                                                                               |
| --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/memory/append-only-prompt-cache.ts` (+ `.test.ts`) | **Fork**  | `isAppendOnlyMemoryEnabled`, `buildAutoMemoryReminder`, `appendAutoMemoryDelta`. Restore verbatim if a merge deletes it.                   |
| `packages/core/src/memory/refresh.ts`                                 | Upstream  | Early return at the top of `refreshMemoryInstruction()`.                                                                                   |
| `packages/core/src/core/client.ts`                                    | Upstream  | `autoMemory:` ternary in `getMainSessionSystemInstruction()` + `includeAutoMemoryReminder: true` at the **three** main-session call sites. |
| `packages/core/src/core/environmentContext.ts`                        | Upstream  | `includeAutoMemoryReminder?` option + the `reminderParts` entry.                                                                           |

**Invariants**:

1. `refreshMemoryInstruction()` is the single chokepoint — route any new memory-driven refresh through it.
2. `includeAutoMemoryReminder` defaults to `false`; only the three main-session sites opt in. Subagents never do.
3. The custom-instruction branch of `client.ts` stays untouched.
4. Flag off ⇒ upstream behavior unchanged.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/core/src/core/client.ts \
  packages/core/src/core/environmentContext.ts packages/core/src/memory/refresh.ts   # 13 lines (client 5, envContext 6, refresh 2)
grep -c "autoMemory: this.config.getAutoMemoryPrompt()" packages/core/src/core/client.ts  # exactly 1
grep -c "includeAutoMemoryReminder" packages/core/src/core/client.ts                      # 3
grep -c "isAppendOnlyMemoryEnabled()" packages/core/src/memory/refresh.ts                 # 1
grep -rn "includeAutoMemoryReminder" packages/core/src/agents/                            # zero lines
cd packages/core && npx vitest run src/memory/append-only-prompt-cache.test.ts
```

**Conflict resolution**: keep upstream's refactor, re-apply the hooks on top. Never resolve by dropping the patch.

---

## 15. MANDATORY: Context & Prompt-Cache Status Items (Non-Negotiable)

The status line **MUST** be able to report live prompt-cache state and precise context size. This is a **mandatory, non-removable patch** that applies to every merge.

**Why**: §14 optimizes prompt-cache preservation, but that work is otherwise invisible at runtime — nothing tells you whether the prefix actually survived a turn, or how close the session is to an auto-compaction that will destroy it. Upstream ships 16 preset items, none cache-related, and `aggregateModelTokens` sums only `prompt`/`candidates`. These four items make §14 observable.

**Items** (all opt-in — absent from `DEFAULT_STATUS_LINE_PRESET_CONFIG`):

| Id               | Renders            | Source                                                              |
| ---------------- | ------------------ | ------------------------------------------------------------------- |
| `context-tokens` | `54.1k/128.0k`     | `lastPromptTokenCount` / `contextWindowSize`                        |
| `cache-live`     | `Cache 92% now`    | `uiTelemetryService.getLastCachedContentTokenCount()` ÷ last prompt |
| `cache-hit`      | `Cache 88% avg`    | main model's `bySource[MAIN_SOURCE]` cached ÷ prompt                |
| `compact-in`     | `Compact in 18.2k` | `computeThresholds(window, pct).auto` − current usage               |

**Hooks** — all logic is in the fork-owned module; upstream files carry only additive hunks tagged `// [no-telemetry fork]`.

| File                                                           | Ownership | Must contain                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/cli/src/ui/status-line-fork-items.ts` (+ `.test.ts`) | **Fork**  | `FORK_STATUS_LINE_ITEM_IDS`, `FORK_STATUS_LINE_ITEMS`, `FORK_CONTEXT_ITEM_IDS`, `resolveMainModelContext`, `buildForkStatusLineData`, `formatForkStatusLineItem`. Restore verbatim if a merge deletes it.                                                                                                                 |
| `packages/cli/src/ui/statusLinePresets.ts`                     | Upstream  | Import + 2 array spreads + `fork?` field on `StatusLinePresetData` and the builder params + `default:` branch delegating to `formatForkStatusLineItem`.                                                                                                                                                                   |
| `packages/cli/src/ui/hooks/useStatusLine.ts`                   | Upstream  | Import + `...FORK_CONTEXT_ITEM_IDS` in `CONTEXT_PRESET_ITEM_IDS` + `resolveMainModelContext(cfg, ui.currentModel)` replacing the `contextWindowSize` read in `doUpdate` + the `fork: buildForkStatusLineData({...})` argument + `resolveMainModelContext` in the over-limit check of the returned `hideContextIndicator`. |
| `packages/cli/src/ui/hooks/useStatusLine.test.ts`              | Upstream  | `getAutoCompactThreshold` on `mockConfig` (the real `Config` has it; the literal mock does not).                                                                                                                                                                                                                          |

**Invariants**:

1. All logic stays in `status-line-fork-items.ts`. Upstream hunks stay additive one-liners.
2. **Never import upstream values into the fork module** — `statusLinePresets.ts` imports it to build the catalogue, so importing back forms a module cycle that throws `FORK_STATUS_LINE_ITEM_IDS is not iterable` at startup. `formatTokenCount` is injected as a parameter for exactly this reason.
3. **Never read the context window (or the model id) from `Config.getContentGeneratorConfig()` / `Config.getModel()` in UI code.** Both resolve through an AsyncLocalStorage runtime view that forked and fast-model runs push (`getRuntimeContentGenerator()`, read by `Config.getContentGeneratorConfig()`), and ALS propagates into React continuations — so the footer transiently renders the _fast_ model's window and then flips back (the documented #7156 leak class; `runOutsideAgentContext` wraps only four call sites, none of them UI readers). Go through `resolveMainModelContext()`, which prefers the ALS-immune `getModelsConfig().getGenerationConfig()`.
4. `resolveMainModelContext()` returns **0 for an unknown window** and must never fall back to `tokenLimit(modelId)`. A provider-declared window (any custom `modelProviders` entry) never appears in `tokenLimits.ts`, so that fallback fabricates a plausible-but-wrong size; 0 correctly hides the item.
5. Cache figures are scoped to the **main model's main-source traffic**. Never sum across `metrics.models` — auxiliary models (title generation, summarization, a fast model with its own window) and subagents would report a hit rate for a cache the main conversation never uses.
6. `cache-live` / `cache-hit` stay hidden while `sessionCachedTokens === 0`. The `cachedInputTokensReported` provenance flag is dropped before it reaches `SessionMetrics`, so a provider that never reports cache is indistinguishable from a real 0% — without this guard the footer pins a misleading `0% cached`.
7. Items return plain strings. The footer colors the whole line at once (`Footer.tsx`), so state is conveyed with wording, never per-item color.
8. Not listing an item ⇒ byte-identical upstream behavior.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/cli/src/ui/statusLinePresets.ts \
  packages/cli/src/ui/hooks/useStatusLine.ts                                    # 12 lines (presets 7, useStatusLine 5)
grep -c "FORK_STATUS_LINE_ITEM_IDS\|FORK_STATUS_LINE_ITEMS" packages/cli/src/ui/statusLinePresets.ts  # 4
grep -c "FORK_CONTEXT_ITEM_IDS\|buildForkStatusLineData" packages/cli/src/ui/hooks/useStatusLine.ts   # 4
grep -n "from './statusLinePresets" packages/cli/src/ui/status-line-fork-items.ts  # zero lines (invariant 2)
grep -n "getContentGeneratorConfig()?.contextWindowSize" packages/cli/src/ui/hooks/useStatusLine.ts  # zero lines (invariant 3)
grep -c "resolveMainModelContext" packages/cli/src/ui/hooks/useStatusLine.ts                         # 3 (import + 2 call sites)
cd packages/cli && npx vitest run src/ui/status-line-fork-items.test.ts \
  src/ui/statusLinePresets.test.ts src/ui/hooks/useStatusLine.test.ts \
  src/ui/components/StatusLineDialog.test.tsx src/ui/components/Footer.test.tsx
```

**Manual smoke test** (interactive TUI): add `context-tokens`, `cache-live`, `cache-hit`, `compact-in` to `ui.statusLine.items` and run two turns. `cache-hit` must match `/stats`, and `compact-in` must agree with `/context`'s threshold ladder. The four items must also appear in the `/statusline` dialog with a live preview.

**Conflict resolution**: keep upstream's refactor, re-apply the hooks on top. Never resolve by dropping the patch.

---

## 16. Resume Prelude Reuse (Automatic, Safe-Only)

Not gated by a flag or a command — always on, because it can never show the model anything other than what a full, correct rebuild would have produced anyway. Documented as its own section because it is a fork behavior change to an upstream-owned function (`getInitialChatHistory`) and needs the same merge-survival care as §14/§15.

**Why**: `getInitialChatHistory()` unconditionally rebuilds the startup prelude (workspace folder structure, MCP server instructions, `<available_skills>` snapshot, deferred-tools reminder) and prepends it as `history[0]` on every call — including on `--continue`/`--resume` (close-and-reopen), where `extraHistory` is the replayed transcript and **already begins with the original prelude** from the first time the session ever started. Upstream never strips that old entry before resuming, so every resume produced `[newPrelude, oldPrelude, ...conversation]`: fresh content in front of an otherwise-unchanged transcript. A prefix-caching backend (oMLX, other vLLM-style paged KV caches) matches cache reuse by exact longest-common-prefix from token 0, so this guaranteed a full re-prefill of the whole conversation on every reopen, even seconds later with nothing on disk changed.

**How it stays 100% safe**: the fix never skips or guesses. The full rebuild (workspace scan, MCP instructions, skills, memory, deferred tools) always runs exactly as upstream does it. Only _after_ that rebuild completes does `reuseResumedPreludeIfUnchanged()` compare the freshly rebuilt **stable** texts (MCP instructions, skills, memory, workspace/date) against the prelude already at the front of `extraHistory`, part-by-part, text-for-text. Only when they are **provably identical** does it return the existing entry (dropping the now-redundant rebuilt copy) instead of prepending a second, duplicate one. Any real change to those stable parts — an edited memory file, a new/changed MCP server, a renamed skill, a folder change, a date rollover past midnight — makes the comparison fail, and `getInitialChatHistory` falls straight through to the exact, unmodified upstream rebuild-and-prepend path. There is no code path where a real change to a stable part is silently dropped; the worst case on a false mismatch is simply "no cache win this time," never stale content.

**Why the deferred-tools tail is deliberately excluded from the comparison** (the bug in the first cut of this patch): `buildDeferredToolsReminder` lists deferred tools NOT yet revealed, and `LlmClient.revealDeferredToolsReferencedInHistory` (`client.ts`) re-reveals every deferred tool ever called anywhere in the transcript **before** `getInitialChatHistory` runs on every resume. So the very first build (before any tool had been called) always lists the full deferred set, while any resume after the session called even one deferred tool — i.e. almost any real session — reveals it first, making the tail shorter on every subsequent rebuild. Comparing that tail made reuse fail almost every real resume, for a reason that has nothing to do with anything the user needs re-announced (the model already knows about that tool — it called it). The tail is safe to leave uncompared: it only ever shrinks, never reintroduces stale info, and a genuinely NEW deferred tool is announced through the existing mid-conversation "now available" delta reminders, never through the prelude.

**Hooks** — all logic is in the fork-owned module; the upstream file carries only an additive import and a post-build comparison call site tagged `// [no-telemetry fork]`.

| File                                                        | Ownership | Must contain                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/core/resume-opt-cache.ts` (+ `.test.ts`) | **Fork**  | `reuseResumedPreludeIfUnchanged`. Restore verbatim if a merge deletes it.                                                                                                                                                                                                                   |
| `packages/core/src/core/environmentContext.ts`              | Upstream  | Import of `reuseResumedPreludeIfUnchanged` + the `stableTexts`/`deferredToolsText` split inside `getInitialChatHistory` + the post-build comparison call site (after `prelude` is constructed, before the final `return`), injecting `getStartupContextLength` as `deps` (see invariant 2). |

**Invariants**:

1. All comparison logic stays in `resume-opt-cache.ts`. The upstream hunk in `environmentContext.ts` stays an additive post-build check, never a rewrite of the existing rebuild path — the rebuild must always run in full, unconditionally, so the comparison has something honest to compare against. `reminderParts`/`prelude` (what actually gets sent when NOT reusing) must stay byte-identical to upstream's construction — only the `stableTexts`/`deferredToolsText` split is new, and it must recombine into exactly the same array, in the same order, as before the split.
2. **Never import `environmentContext.ts` values into the fork module** — `environmentContext.ts` imports `reuseResumedPreludeIfUnchanged` from `resume-opt-cache.ts`, so importing back (e.g. `getStartupContextLength`) would form a module cycle. It is injected as the `deps` parameter instead — mirrors the `formatTokenCount` injection pattern in §15 invariant 2.
3. The reuse check matches ONLY a single delivered prelude (`getStartupContextLength(extraHistory) === 1`, no `includeCompressed`) AND at least one fresh stable text. A legacy ack-pair session (length 2), a post-compression summary prefix, and an empty rebuild (`skipStartupContext` with nothing else to say) all fail this check on purpose and fall through to the normal path — the first two are shapes never meant to be preserved verbatim, the last is a no-op either way since an empty prelude prepends nothing regardless.
4. The stable comparison is by **part text content**, in order and count — not by object reference, not by a hash, not by a partial/summarized diff. This is what makes it provably safe rather than merely probably safe. The existing entry's part count must equal the fresh stable count, or (when `includeDeferredToolsReminder` was true for this call) stable-count-plus-one — never more. This bounds the tolerance to exactly the one part that's allowed to differ.
5. `toleratesTrailingDeferredToolsPart` must be wired to the SAME `includeDeferredToolsReminder` flag the caller used to decide whether to build that part — never hardcoded `true`. A call site that never builds a deferred-tools part (e.g. a subagent snapshot with `includeDeferredToolsReminder: false`) must not tolerate an unexplained trailing part either.
6. No flag exists to force this off. If a merge needs to disable it temporarily, delete the call site's `if (deduped) { ... }` branch — do not reintroduce an env var, since the whole point is that this needs no manual toggle.

**Verify after every merge**:

```bash
grep -rn "no-telemetry fork" packages/core/src/core/environmentContext.ts | grep -i "resume"   # 2 lines (import + call site)
grep -c "reuseResumedPreludeIfUnchanged" packages/core/src/core/environmentContext.ts          # 2 (import + call)
grep -n "from './environmentContext" packages/core/src/core/resume-opt-cache.ts                # zero lines (invariant 2)
cd packages/core && npx vitest run src/core/resume-opt-cache.test.ts src/core/environmentContext.test.ts
```

**Manual smoke test**: with an oMLX (or other prefix-caching) backend, start a session, call at least one deferred/`tool_search`-reachable tool, send a turn, close the CLI, and `--continue` immediately with nothing changed on disk. `cache-hit`/`cache-live` (§15 status-line items, if enabled) should show a healthy hit ratio on the first resumed turn instead of resetting — the deferred-tool call is the part of this test that would have caught the original bug (a smoke test that never calls a deferred tool cannot distinguish this fix from the broken first cut). Then edit a memory file (or add an MCP server) before resuming again — the prelude should rebuild and the model should see the change, confirming the fallback path still fires on real changes.

**Conflict resolution**: keep upstream's refactor, re-apply the hook on top. Never resolve by dropping the patch.

---

## 17. Deep Privacy Check — Runtime-First Procedure (Fast Path)

**Prove egress with syscalls, not with greps.** A traced run of the installed CLI settles "does anything leave the device" in about two minutes. A source sweep of `packages/core` takes tens of minutes, has twice killed the subagent running it out of memory, and even when it succeeds it only enumerates what _could_ connect — not what _does_. Do the runtime pass first; use static analysis only to explain a hit or to cover paths the run did not exercise.

Run against the **installed** artifact (`$HOME/.npm-global/bin/qwen`), not `npm start` from source — the installed tree is what the user executes, and it is built through a different pipeline (`local-install.sh` stages, bundles and packs), so a source-only audit can certify bytes that never ship. Reinstall with `bash local-install.sh` first if the global copy is stale (see §5).

### Step 1 — Trace every socket (this is the proof)

```bash
# Baseline: a no-op invocation must open ZERO network sockets.
strace -f -q -e trace=connect -o /tmp/st_version.log qwen --version
# Live session: one cheap prompt, tracing connects AND outbound datagrams.
strace -f -q -e trace=connect,sendto,sendmsg -s 220 -o /tmp/st_live.log \
  qwen -p "Reply with exactly: OK"
```

Then read every destination. **This extraction is the part people get wrong** — see Step 2:

```bash
grep -oE 'connect\(.*' /tmp/st_live.log | head -40
grep -c 'htons(53)' /tmp/st_live.log   # 0 = no DNS left the box
```

**Interpretation table** — what each shape means:

| Observed                                         | Meaning                                                                         | Verdict                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `AF_INET … :8000` (or your `model.baseUrl` port) | The LLM API call                                                                | Expected — this is the only permitted egress     |
| `AF_INET … :0`                                   | Routing probe (`connect` with port 0 selects a local address and sends nothing) | Harmless, no bytes leave                         |
| `AF_UNIX sun_path="/var/run/nscd/socket"`        | Local name-service cache lookup                                                 | Harmless, never leaves the box                   |
| `AF_INET6 … :8000`                               | Same LLM endpoint over IPv6                                                     | Expected                                         |
| `htons(53)`                                      | DNS query egress                                                                | Investigate — resolver should be container-local |
| Any other host/port                              | Real egress                                                                     | Must be named, gated, and user-initiated         |

Resolve the endpoint so you do not mistake a local gateway for an internet host — in a container `host.docker.internal` answers with **both** an IPv4 and an IPv6 address, so checking only one family is not enough:

```bash
node -e "require('dns').lookup('host.docker.internal',{all:true},(e,a)=>console.log(e?e.code:a.map(x=>x.address).join(' ')))"
```

Expected clean result: every destination is the configured model endpoint, plus port-0 routing probes and the nscd socket. `qwen --version` should show **no** connects at all — a connect there means a startup ping came back in with a merge.

### Step 2 — The three traps that report a FALSE CLEAN

These all fail _silent_, which is what makes them dangerous:

1. **Grepping only `inet_addr` drops every IPv6 destination.** strace prints IPv4 as `inet_addr("1.2.3.4")` and IPv6 as `inet_pton(AF_INET6, "fd00::1")`; a one-family regex quietly returns "clean" while the whole session ran over IPv6. Match both, plus `sun_path` for `AF_UNIX`.
2. **URL strings in `dist/` are noise, not egress.** The shipped bundle carries thousands of documentation and SDK reference URLs (chat-channel SDKs alone account for thousands of hits). Presence of a host string proves nothing; the invariant is _exercised_ egress. Never report a host as a leak because it appears in `dist/` — this is the same principle as §1.5's no-word-grep rule, applied to hosts.
3. **Two different functions share the name `checkForUpdates`.** One is local-only (reads and migrates settings, no network); the other is the npm-registry version check that shells out to `npm view`. Grepping the bare name finds the wrong one and certifies the wrong file. Always follow the import to the definition before judging. The network one is reachable only through a sentinel process exit code produced by an explicit update, never at startup — which the Step 1 trace independently confirms by showing zero registry connects.

### Step 3 — Opt-in egress inventory (start here, do not rediscover)

Every path that can leave the device, and the gate that holds it. All are **off or user-triggered** by default; verify the gate, not the existence of the code.

| Path                                | Destination                         | Gate and default                                                                                                                                                                                              |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model / LLM API                     | configured `model.baseUrl`          | The permitted traffic                                                                                                                                                                                         |
| `web_search`                        | `serpapi.com`                       | Requires a resolved SerpApi key; no key ⇒ `ok:false, silent:true`, tool never registers (§1.5)                                                                                                                |
| Update check                        | npm registry                        | Explicit `/update` only, behind a sentinel relaunch exit code; `enableAutoUpdate` forced `false` (§1.5 in §3, §1)                                                                                             |
| Update download, skill install      | GitHub / release hosts              | Explicit `/update` or skill-install action                                                                                                                                                                    |
| GitHub repo metadata, `git fetch`   | `api.github.com`, `github.com`      | Explicit GitHub-setup and `/review` commands                                                                                                                                                                  |
| Chat channels (Feishu, Telegram, …) | per-channel hosts                   | Require user-supplied tokens; unconfigured ⇒ no traffic                                                                                                                                                       |
| MCP servers                         | user-configured URLs                | Only servers the user added                                                                                                                                                                                   |
| Artifact publish                    | `https://<bucket>.<endpoint>/<key>` | Publisher defaults to **`local`**; `oss` needs explicit selection **and** bucket **and** endpoint, endpoint is regex-pinned to `*.aliyuncs.com`; publishing is permission `ask` and the prompt names the host |
| Artifact host publish               | whatever the user wrote             | Runs the user's own `uploadCommand`                                                                                                                                                                           |
| live-host install                   | asset CDN + GitHub releases         | Explicit install command                                                                                                                                                                                      |
| Web Shell `unpkg.com`               | browser, not CLI                    | Appears only as a CSP `connect-src` allowance; the CLI never fetches it                                                                                                                                       |

Two things to keep flagging rather than "fixing": the OSS publisher's object ACL defaults to **`public-read`**, so an artifact you deliberately publish is world-readable at a predictable key unless you set `acl`; and the artifact tool itself is registered by default, which is safe only because of the publisher-default and `ask` gates above. If either gate moves, that becomes a real leak path.

### Step 4 — Confirm the gates in code (fast, after the trace)

Read the actual default at each assignment; never infer it from a schema description.

```bash
grep -rn "enableAutoUpdate" packages/cli/src/config/settings.ts | grep -v "\.test\."
grep -rn "usageStatisticsEnabled = " packages/core/src/config/config.ts
grep -rn "00000000-0000-0000-0000-000000000000" packages/core/src/config/installationManager.ts
grep -rni "publisher ?? 'local'" packages/cli/src/config/config.ts packages/core/src/config/config.ts
# Must return BOTH files. Case-insensitive on purpose: the two layers spell the
# same default with different identifiers (`settings.artifact?.publisher` in the
# cli resolver, `params.artifactPublisher` in core), so a case- or format-
# sensitive pattern matches one file and looks clean while missing the other.
grep -rn "getDefaultPermission" packages/core/src/tools/artifact/artifact-tool.ts
grep -rn "artifactEnabled ?? true\|omniEnabled ?? false" packages/core/src/config/config.ts
```

Then prove the telemetry layer is inert **structurally**, not by vocabulary — the durable argument is that no exporter exists to send anything, so a retained `otlp*Endpoint` key is harmless:

```bash
grep -n "sdk-impl" packages/core/src/telemetry/sdk.ts            # zero: never imported
grep -n "startTelemetrySdk" packages/core/src/telemetry/sdk-impl.ts  # stub, resolves sdk: undefined
grep -c "uiTelemetryService" packages/core/src/telemetry/loggers.ts  # 4+ local-only sinks (§11)
```

And certify the shipped bytes, remembering `dist/cli.js` is a thin entry (§3 step 4 note) — grep the tree:

```bash
grep -rl "@opentelemetry/" "$HOME/.npm-global/lib/node_modules/@qwen-code/qwen-code/dist/"   # empty
grep -rho "0\.[0-9]*\.[0-9]*-no-telemetry[^\"'\`]*" "$HOME/.npm-global/lib/node_modules/@qwen-code/qwen-code/dist/" | sort -u
```

The version string there embeds the build-time HEAD hash, so it doubles as proof of _which_ commit was installed.

### Step 5 — If you delegate, scope narrowly

Broad "very thorough" whole-repo sweeps have killed subagents here with host GPU out-of-memory, twice, after 13–32 tool calls and 250k–360k tokens each. Concurrency multiplies it: do not run two big agents plus a live traced session at once. Give each agent a short list of directories, a bounded question, and a word limit on the answer.

### What this still does not prove

Say so explicitly when reporting:

- **Unexercised paths.** A trace certifies only the code that ran. `qwen serve`, Web Shell, chat channels, `/update`, `/review`, extension install and computer use need their own traced runs, or they rest on static gates alone.
- **Prompt content.** The permitted LLM call still carries the prompt and any file context out of the process. A local endpoint keeps it on the machine; it is not the same as never leaving the process.
- **Native binaries and dependencies.** Tracing `qwen` covers the Node process tree it spawns, not arbitrary native helpers reached by another route.
- **DNS of inert URL strings.** Thousands of documented hosts are never contacted; this method does not prove each one unreachable, only that no socket was opened to any of them during the traced runs.

---

## 18. MANDATORY: Egress Tripwire at Every Release (Non-Negotiable)

`npm run check:egress` **MUST** pass, with no `LEAK` rows, before any release is cut. It is the only check in this document that observes the running binary instead of its source, and therefore the only one that catches an arbitrary new egress path — including one introduced by an upstream merge, a new dependency, or code that never touches any subsystem the other gates watch.

**Why this exists when §1–§17 exist.** Every other check inspects source or shipped bytes, so each proves only what the code _says_ it does. A grep cannot see a leak that a refactor assembled at runtime. This gate watches every way out of Node — `net`/`tls`/`http`/`https` sockets, `fetch`, `dgram`, `WebSocket`, DNS resolution, and `child_process` spawns (a `curl` or `git` subprocess bypasses the entire Node stack, so its argv is inspected instead).

### Run it

```bash
npm run check:egress                              # fast scenario, ~45s
node scripts/check-egress.mjs --cli=<path>       # trace a specific entry
```

It runs two scenarios — `--version` (which must open **zero** sockets) and one headless session that makes the model call a tool — then prints every destination it saw. Exit `0` = clean, `1` = leak found, `2` = the detector itself is broken.

### The allowlist is derived, never hardcoded

Trusted hosts are collected by walking the user's **own** settings (`~/.qwen/settings.json`, `QWEN_HOME`, workspace `.qwen/settings.json`) and **every string in it**, plus any exported `*_BASE_URL` / `*_ENDPOINT`, plus loopback and the container gateway. Anything else is a leak.

This is deliberate and it is the load-bearing design decision:

- A machine whose model endpoint is remote is not falsely accused — its endpoint is trusted because _its owner_ configured it.
- Because the walk is generic rather than a list of known keys, **a new remote option added by an upstream merge surfaces as a finding instead of being silently trusted.** Enumerating keys would have gone stale the first time upstream added an option.
- The resolved allowlist is printed at the top of every run. Read it. If a host is trusted that you did not configure, that is itself the finding.

`QWEN_EGRESS_ALLOW=host1,host2` exists for legitimate one-offs. Using it means the run was no longer an unmodified test — record why in the release notes, the same rule §5 applies to every other waiver.

### The self-test is not optional decoration

Every run begins by reaching for `egress-tripwire-selftest.invalid` — a host that can never be allowed — and asserting the probe flags it as `LEAK`. If it does not, the run exits `2` (broken), **not** `0`.

This rule was earned, not designed in: the first version of this gate reported _"0 egress attempts, no unexpected egress"_ while strace showed six sockets open. The launcher and the CLI it spawns both preload the probe and shared one log file, and the launcher — which makes no requests and exits last — overwrote the child's real hits with an empty list. A gate that can only ever say "clean" is indistinguishable from a dead one. It was also silently recording every connection as `0.0.0.0`, because undici passes an options object whose `host`/`port` are unpopulated at call time; destinations are now captured from the socket's `lookup`/`connect` events, which is ground truth.

**How to apply:** never "fix" a green run by trusting it. Confirm the attempt count is plausible and the peers match the configured endpoint, and if you change the probe, verify against an independent `strace` run before believing it.

### What it cannot see

State these limits when reporting a pass — a clean verdict is scoped, not absolute:

- **External agent binaries.** `codex-subagent-executor` deletes `NODE_OPTIONS` from its children, so those processes run untraced. Their _spawn_ is recorded, their sockets are not.
- **Non-Node native helpers** doing raw syscalls bypass every hook. That is what the §17 `strace` pass is for — run it on Linux at least once per major release.
- **The sanctioned channel.** The model endpoint is trusted by definition, and it carries the prompt and every file the model reads. If `model.baseUrl` is remote, your content leaves the machine by design and this gate will correctly call that clean. §1 prints the endpoint loudly for exactly this reason.
- **Unexercised paths.** Only code that ran is certified. `serve`, Web Shell, channels, `/update` and `/review` need the deep scenario or their own traced runs.

### Where it goes in the workflow

- **Every release:** `npm run check:egress` is a blocking step, alongside `check:context` and `check:merge-drivers`.
- **After any merge that touches network code, a dependency, or an approval-mode path:** run it. This is the check that would have caught the §1.7 artifact window on its own.
- **CI:** deliberately **not** wired into the merged upstream workflows. Adding a job there re-conflicts on every merge; the fork's gates are run by hand at release, which is the same trade §1.5 makes with its `merge=ours` seams.
