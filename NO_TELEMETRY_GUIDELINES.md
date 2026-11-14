# Qwen Code: No-Telemetry Guidelines

This document defines the privacy policy, technical architecture, and maintenance strategy for the "No-Telemetry" fork of Qwen Code. It is foundational for all automated agents and human developers.

---

## Index of sections

This file is the policy and the merge runbook. The per-patch reference and the runtime proof live beside it so each file is readable in one pass. **Section numbers are global** — source comments cite `NO_TELEMETRY_GUIDELINES.md §N` — so look the number up here and never renumber.

|§|Topic|Where|
|---|---|---|
|1|Core Privacy Policy|this file|
|1.5|WebSearch/SerpApi Patch|`fork-docs/search-vision-artifact.md`|
|1.6|Vision-Bridge Image Concurrency Patch|`fork-docs/search-vision-artifact.md`|
|1.7|Artifact Remote-Upload Lockdown|`fork-docs/search-vision-artifact.md`|
|2|Maintenance Strategy|this file|
|3|Mandatory Post-Merge Actions|this file|
|4|Versioning Strategy|this file|
|5|Release Process|this file|
|6|Conflict Resolution Priority Matrix|this file|
|7|Architectural Evolution|`fork-docs/troubleshooting.md`|
|8|Instructions for AI Models|this file|
|9|Enforcement Principle|this file|
|10|Troubleshooting & Build Optimizations|`fork-docs/troubleshooting.md`|
|11|Privacy-Safe Local Stats vs. External Telemetry: The loggers.ts Rule|`fork-docs/telemetry-timing-and-defaults.md`|
|12|The @opentelemetry/api Runtime Resolution Rule|`fork-docs/telemetry-timing-and-defaults.md`|
|13|Telemetry Commits Can Change Control-Flow Timing — Verify TUI Behavior After Every Merge|`fork-docs/telemetry-timing-and-defaults.md`|
|14|Append-Only Auto-Memory Patch|`fork-docs/prompt-cache.md`|
|15|Context & Prompt-Cache Status Items|`fork-docs/prompt-cache.md`|
|16|Resume Prelude Reuse|`fork-docs/prompt-cache.md`|
|17|Deep Privacy Check — Runtime-First Procedure|`fork-docs/egress-and-runtime-proof.md`|
|18|Egress Tripwire at Every Release|`fork-docs/egress-and-runtime-proof.md`|
|19|Tool-Result Clearing Is Off By Default|`fork-docs/telemetry-timing-and-defaults.md`|
|20|Main-Chat Tool Declarations Are Built Outside Agent Frames|`fork-docs/telemetry-timing-and-defaults.md`|

Before changing any prose here, run `node scripts/check-doc-split.mjs <old.md> <new.md>...` against the old text: it proves every line survived.

---

## 1. Core Privacy Policy: Zero External Data Leakage

1.  **NO TRACKING**: Absolutely NO telemetry, analytics, or usage statistics may be sent to any external server. All OpenTelemetry dependencies are removed.
2.  **NO IDENTITY**: No unique installation IDs. `getInstallationId()` must ALWAYS return `00000000-0000-0000-0000-000000000000`. The `InstallationManager` is hardcoded to this static ID.
3.  **LOCAL PERSISTENCE ONLY**: Data is strictly local. It is only saved for local session history and hierarchical memory, as required for the application's core functionality.
4.  **NEUTRALIZED CORE**: All network-bound loggers are replaced with no-op functions.
5.  **DISABLED AUTO-UPDATES**: Hardcode `enableAutoUpdate` to `false` in default settings. The hardcode in `LoadedSettings.computeMergedSettings` must be **unconditional** (it creates `merged.general` when absent): the startup gate is `enableAutoUpdate !== false`, so an `if (merged.general)` guard leaves it open for any user whose settings never set `general`.
6.  **DISABLED GIT CO-AUTHOR**: Hardcode `gitCoAuthor` to `false` in default settings to prevent accidental identity leakage in commit history.

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

> ⚠️ **CRITICAL: `loggers.ts` partial-no-op rule** — See Section 11 (`fork-docs/telemetry-timing-and-defaults.md`).

---

## 3. Mandatory Post-Merge Actions

Every successful merge REQUIRES:

1.  **NODE VERSION**: Ensure you are using **Node.js >= 22.0.0** to avoid `EBADENGINE` warnings.
2.  **VERSION SYNC**: Update version in ALL `package.json` files (and `integrations/*/qwen-extension.json`, and the internal `@qwen-code/*` pins) to match upstream. **DO NOT** append `-no-telemetry` to the version string. Run `node scripts/resolve-version-conflicts.mjs` first: it takes upstream's side of a hunk only when both sides are single `version` / `sandboxImageUri` / `@qwen-code/*` lines, and refuses everything else. A refused hunk is a real change that must be read — v0.27.2 carried `zod` 3→4 in the gitlab channel — never defaulted.
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

5.  **LOCKFILE REGEN**: Run `corepack pnpm install` to keep `pnpm-lock.yaml` consistent with the manifests after the `@opentelemetry/*` lines are stripped, and commit it. The tree is **pnpm-only** — there is no `package-lock.json` and one must not be created; an `npm install` here resolves a different dependency graph and breaks the build. `pnpm-lock.yaml` resolves to OURS on every merge and is then regenerated: upstream's copy re-admits the whole otel closure. `packages/vscode-ide-companion/NOTICES.txt` is not a `merge=ours` seam, so it 3-way merges (v0.27.2: clean, 0 otel mentions though upstream's own copy has 64); confirm `grep -c -i opentelemetry` on it is 0, and resolve to OURS if it ever conflicts. `npm run check:context` fails on `@opentelemetry` in any tracked `package.json`, in `pnpm-lock.yaml`, in `node_modules/.pnpm`, or as a real import in built output (`packages/*/dist`, `dist`). It also asserts the §1/§1.5/§1.7 privacy defaults directly (auto-update and co-author hardcode, usage stats, installation id, catalog-refresh guard, publisher default and collapse, the artifact prompt, the only two `new OssPublisher`/`new HostPublisher` sites, the SerpApi seam and its sole host, the `session_id` host list).
6.  **VERIFICATION**: Run `npm run build:packages` and `npm run lint`.
7.  **STATS DISPLAY CHECK** ⚠️ See Section 11: Verify the six functions in the §11 table still forward to `uiTelemetryService` (run §11's awk, which lists them) — they must NOT be no-ops.
8.  **RUNTIME IMPORT CHECK** ⚠️ See Section 12: Verify no `.ts` source files import directly from `@opentelemetry/api` (or other removed packages) using the bare package name:
    ```bash
    grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
    grep -rn "import('@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
    # BOTH must return zero lines — the second catches inline type references
    # like import('@opentelemetry/api').SpanContext, invisible to the first.
    ```
9.  **TEST SUITE ALIGNMENT**: The suites that cannot run against the dummy layer are excluded **by name** in `packages/core/vitest.config.ts` (9 at v0.27.3, down from 18 once each of the other nine was proved to compile and pass). The list is hand-curated, NOT "every `packages/core/src/telemetry/*.test.ts` except `uiTelemetry.test.ts`" — 25 of the directory's 34 suites run today (610 tests, all passing at v0.27.3), because that config's `resolve.alias` maps `@opentelemetry/api` to `src/telemetry/dummy-otel.ts` and five more otel packages to local fork modules, so a suite that imports only those names compiles and passes. Applying a glob exclusion silently deletes passing coverage. When upstream adds or changes a telemetry suite, run every file in the directory (including the excluded ones, through a scratch config that drops the list) and exclude only what fails, naming one of four causes: it imports an otel package the alias list does NOT cover (`loggers`, `session-events`: `api-logs`; `file-exporters`, `daemon-tracing`: `core`); it imports a module the fork deleted (`sdk`: `otlp-urls.ts`); it asserts span, context or trace-flag behavior the dummy discards (`tracer`, `session-tracing`, `session-context`); or it tests the `QwenLogger` upload/retry/proxy logic the fork stubbed out (`qwen-logger`). A suite on the list that now passes comes off it.
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
12. **APPEND-ONLY AUTO-MEMORY CHECK** ⚠️ See Section 14: run its **"Verify after every merge"** block verbatim. It is the single home of the hook counts (four upstream files, including the converter fold), the wiring greps and the two vitest files. Do not copy the numbers here: this item once said 13 while the real total was 18, and nothing noticed. `npm run check:context` enforces the totals.

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
    # check vitest version drift (see §10 "Vitest Version Drift").
    ```

    **Step 3 — Targeted package tests ONLY (never root `npm run test`):**

    ```bash
    # Run these ONE AT A TIME — in parallel they starve each other and the timing-sensitive
    # process/watcher tests fail for load, not for a regression:
    npm run test --workspace=packages/sdk-typescript 2>&1 | tail -5
    npm run test --workspace=packages/acp-bridge 2>&1 | tail -5
    npm run test --workspace=packages/web-shell 2>&1 | tail -5
    npm run test --workspace=packages/cli 2>&1 | grep -E "Test Files|Tests "   # the largest suite; allow 600s
    ```

    **Step 4 — Core tests (slow, ~75s — only if core files changed):**

    ```bash
    # Capture FAIL count immediately; do not wait for full output:
    npm run test --workspace=packages/core 2>&1 | grep "Test Files"
    # Compare by test NAME against the pre-merge commit, never against a remembered count.
    ```

    **Step 4b — Baseline (the only way to call a failure pre-existing):**

    ```bash
    git worktree add --detach <dir> HEAD && cd <dir> && corepack pnpm install --frozen-lockfile   # ~3 min, builds via prepare
    cd packages/<p> && npx vitest run --reporter=json --outputFile=<before>.json <the failing files>
    # Diff the failed fullName sets. A worktree that merely borrows this checkout's node_modules/dist proves nothing.
    # Remove it afterwards: git worktree remove --force <dir> && git worktree prune
    ```

    At v0.27.2 the sets were identical for cli (39 tests, 20 files), acp-bridge (2) and core, except `LspConfigLoader` (§10).

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
    # local-stats sinks; the authoritative per-function check is §11's awk (6 names):
    grep -c "uiTelemetryService" packages/core/src/telemetry/loggers.ts
    # append-only memory hooks (§14): run that section's verify block; the
    # counts live only there and in scripts/check-context-docs.js
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
    | `npm run test --workspace=packages/web-shell`      | ~190s             | 300s                                        |
    | `npm run test --workspace=packages/cli`            | several minutes   | **600s**                                    |
    | `npm run test --workspace=packages/core`           | ~75s              | **180s**                                    |
    | `npm install`                                      | ~60–100s          | **180s**                                    |
    | `npm run check:egress`                             | ~45s              | 180s                                        |
    | `npm run check:tables`                             | ~1s               | 30s                                         |

15. **EGRESS TRIPWIRE** ⚠️ See Section 18: Run `npm run check:egress` and require zero `LEAK` rows. This is the only check here that observes the running binary rather than its source, so it is the one that catches egress assembled at runtime — by a refactor, a new dependency, or worse. A session scenario that never reached the model is a **broken run, not a clean build**: it has happened, and `check:egress` now exits `2` on it. Read the printed `entry :` line back, and scrub the inherited session environment first — `$QWEN_CODE_CLI` outranks the repo entry, so from inside a live session the bare command certifies the installed release instead of the tree under review (§18 "Run it").
16. **TABLE PADDING** — run `npm run check:tables` after any merge or edit that touches the tables in this file or in `fork-docs/`. Column alignment is ~15% of this file's bytes and it is pure formatting, so the gate strips it and refuses to write unless it has proved every cell string survived verbatim and no line outside a table was touched. Two things it exists to stop: a merge re-padding the tables, and a future reader assuming the padding is meaningful. It deliberately skips `AGENTS.md` — upstream owns that file's tables and prettier emits that padding, so compacting there re-opens a conflict every sync. This file and `fork-docs/` are in `.prettierignore` for the same reason: prettier re-pads every table it sees and would fight the gate forever.
    ```bash
    npm run check:tables                              # self-test, then report only
    npm run check:tables -- --write                   # apply, after the same proof
    ```

17. **TOOL-RESULT CLEARING DEFAULTS CHECK** ⚠️ See Section 19: both microcompaction triggers must still default to `-1`. `npm run check:context` asserts the values; the tests are the second line:

    ```bash
    cd packages/core && npx vitest run src/config/config.test.ts -t "getClearContextOnIdle"
    cd packages/cli && npx vitest run src/config/settingsSchema.test.ts
    ```

18. **SETTOOLS FRAME CHECK** ⚠️ See Section 20: `LlmClient.setTools()` must still build the declarations outside any agent frame.

    ```bash
    grep -n "runOutsideAgentContext" packages/core/src/core/client.ts     # import + the setTools call
    cd packages/core && npx vitest run src/core/client.test.ts -t "outside any leaked agent frame"
    ```

19. **MERGE EGRESS REPORT** ⚠️ Every other check verifies the fork's own state; none says what the upstream side of the merge **added**. Run it and read every row before the merge commit:

    ```bash
    npm run report:merge-egress -- <previous-tag> <new-tag>   # e.g. v0.27.1 v0.27.2
    ```

    It lists, from added production source only: domain names, network primitives (`fetch(`, `http(s).request`, `net.connect`, `WebSocket`, `curl`/`wget`/`git fetch`), uploader/publisher/reporter classes, and dependencies new to any manifest. A row in the CLI/core process needs a gate and an entry in the §17 inventory; a Web Shell (browser) row matters only to the UI. It is a report, not a gate (exit 0): "none" is itself a finding. Loopback IPs and templated hosts (`${host}`) are not listed. v0.27.2 rows, all reviewed: the `fetch` hardening in `llm-content-generator.ts` (`redirect: 'error'`), conditional polling in the GitHub channel, the WeChat QR login (§17), and `qrcode`/`browserify` and other UI dependencies.

    **Trap that made this item necessary:** a git pathspec `packages/*/src` matches the directory itself, not the files beneath it, so the first manual pass returned an empty diff and "no new hosts". Use `packages/*/src/*`.

---

## 4. Versioning Strategy: Two-Layer Approach

The version system has two distinct layers that serve different purposes:

|Layer|Purpose|Conflict Resolution|
|---|---|---|
|**Upstream version**|Package compatibility, dependency resolution|**Keep identical** to upstream `main`|
|**No-telemetry identity**|UI identification, user awareness|Always present in display strings|

### Critical Rules:

1.  **`package.json` version field**: Must match upstream exactly. Never include `-no-telemetry` here.
2.  **UI display version**: Should show `[VERSION]-no-telemetry · ❌📡 · [HASH]` for user clarity.
3.  **Dependency conflicts**: If upstream adds `@opentelemetry/*` or similar telemetry packages, **REMOVE THEM** even if it creates a version mismatch. Privacy > compatibility.
4.  **Code conflicts**: If telemetry code is added upstream, replace with no-op implementations during merge resolution.

---

## 5. Release Process: Updating Version References

`package.json` `"version"` is the single source of truth. On release, read the version from `package.json` and update:

|File|What to Update|
|---|---|
|`Dockerfile`|`ARG QWEN_REF="v[version]-no-telemetry"`|
|`install.sh`|All example version references and usage docs|
|`install.ps1`|All example version references and usage docs (Windows counterpart of `install.sh`)|
|`README.md`|Install script URLs/examples AND the "original README" link version|

The `-no-telemetry` suffix is always the same — never change it.

### Single-Merge Strategy

Produce a single release commit while keeping `main` aligned:

```bash
git reset --hard [LAST_TAG]
git merge --no-ff main -m "feat: release [VERSION]"
# resolve/neutralize the telemetry patches, then:
git commit --amend
```

_Avoid `git reset --soft` after the merge — it breaks the history link to `main`, which is what lets future merges see what was already taken._

---

## 6. Conflict Resolution Priority Matrix

When merging from `main`, conflicts may arise. Use this priority order:

|Conflict Type|Priority|Action|
|---|---|---|
|`@opentelemetry/*` in dependencies|**HIGHEST**|Remove immediately, no exceptions|
|Metrics/analytics/tracking code|**HIGHEST**|Replace with no-op stubs|
|Installation ID generation|**HIGHEST**|Return static UUID `00000000-0000-0000-0000-000000000000`|
|WebSearch/SerpApi patch|**HIGHEST**|**ALWAYS** keep the SerpApi backend. `merge=ours` handles the seams automatically — a conflict here means the driver is unregistered, so fix `git config --local merge.ours.driver true`. Never accept upstream DashScope/Google/GLM/Tavily.|
|Vision-bridge image concurrency patch|**HIGHEST**|**ALWAYS** throttle concurrency (max 4 in flight); never reject an image on a per-turn count.|
|Append-only auto-memory patch|**HIGHEST**|**ALWAYS** re-apply every `[no-telemetry fork]` hook listed in §14 (client.ts, environmentContext.ts, refresh.ts, converter.ts) on top of upstream's new shape. Never resolve by dropping the flag or the converter fold.|
|Tool-result clearing defaults|**HIGHEST**|**ALWAYS** keep both `clearContextOnIdle` triggers at `-1` (§19). Never restore `60` minutes or `500_000` characters as defaults.|
|`setTools()` declaration frame|**HIGHEST**|**ALWAYS** build the main chat's tool declarations through `runOutsideAgentContext` (§20).|
|Specialized `README.md` content|**HIGHEST**|**DO NOT** merge upstream README. Keep fork docs — now declared `merge=ours` in `.gitattributes`, so git discards upstream's version instead of leaving this to memory. List what was discarded per §1.5 merge reporting.|
|Version string in `package.json`|**MEDIUM**|Match upstream (without `-no-telemetry`)|
|UI display version|**LOW**|Keep `-no-telemetry` suffix for clarity|

### Golden Rule:

> **No-telemetry policy ALWAYS takes priority over version alignment.**
>
> If keeping telemetry code (packages, imports, or logic) is the only way to "match" upstream versions, **REMOVE IT**. The dummy layer approach means we maintain compatibility through neutral implementations, not by keeping telemetry.

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
  - ✅ **CLOSE THE JOB** with a merge commit, version bump and post-merge verification. If a step fails or is skipped, close anyway and **say so** — in the commit message and in the final report.

---

## 9. Enforcement Principle: _One-Time, One-Attempt Resolution_

> **Every merge attempt is a _single-shots_ operation.**
> You get one chance to evaluate, resolve, and close. No retries, no "second attempts" unless explicitly restarted by a human.
> — If resolution fails after best-effort, record the failure in the commit message **and report it plainly in the final answer** (what failed, with the output). Never close silently.
> — Human review follows. A failed close that is reported is acceptable; a failed close that is hidden is not, and neither are delay or hallucination.

---
