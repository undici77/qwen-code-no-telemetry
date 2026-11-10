# Architecture, layout and troubleshooting

Repository layout, the history of the dummy-layer approach, build gotchas and known environmental test failures. Part of [NO_TELEMETRY_GUIDELINES.md](../NO_TELEMETRY_GUIDELINES.md): section numbers are global and cited from source comments, so never renumber.

---

## 7. Architectural Evolution

The strategy for maintaining privacy has evolved to optimize for maintainability:

- **Legacy Approach (Until v0.12.1-no-telemetry)**: The policy was to **delete all telemetry-related files**. While effective for privacy, this caused massive merge conflicts and made it difficult to align with upstream updates.
- **Current Approach (From v0.12.3-no-telemetry onwards)**: Switched to a **"privacy-first" dummy implementation**. We remove all `@opentelemetry/*` packages from `package.json` but maintain the file structure with no-op/dummy layers. This keeps the application code calling these modules untouched, making merges easier while ensuring zero data leakage.

### Repository Layout

`packages/` holds every workspace; the CLI entry is `packages/cli` and the backend plus telemetry dummy layer is `packages/core`. Three of the frontends below (`desktop-shell`, `live-host`, `mobile-shell`) are **excluded** from the root `workspaces` list — present in the tree, but not installed or built by the aggregate commands — and `packages/channels` is a container of nested workspace packages rather than one package:

|Area|Contents|
|---|---|
|`packages/cli`, `packages/core`|Interactive entry point; backend, config, tools, services, telemetry dummy layer.|
|`packages/acp-bridge`, `packages/web-shell`, `packages/web-templates`, `packages/vscode-ide-companion`, `packages/zed-extension`, `packages/chrome-extension`, `packages/desktop-shell`, `packages/mobile-shell`|Frontends and editor integrations.|
|`packages/sdk-java`, `packages/sdk-typescript`, `packages/sdk-python`, `packages/node-repl`, `packages/qwen-live`, `packages/live-host`, `packages/browser-use`, `packages/cua-driver`, `packages/mobile-mcp`, `packages/audio-capture`, `packages/channels`|SDKs, runtime adapters and optional capability packages.|
|`docs/`, `docs-site/`|Source documentation and the Next.js documentation site.|
|`integration-tests/`, `scripts/`, `eslint-rules/`|Cross-package tests, build/release tooling, custom lint rules.|
|`build.sh`, `install.sh`, `install.ps1`, `Dockerfile`, `Makefile`|Build and install entry points (`install.ps1` is the Windows counterpart of `install.sh`).|

_Regenerate rather than trust this table: `ls packages/` is authoritative and this list drifts as upstream adds workspaces._

---

## 10. Troubleshooting & Build Optimizations

### Stale Build Artifacts

If you update a `.ts` file but `esbuild` (e.g., in `vscode-ide-companion`) complains about missing exports in the corresponding `.js` file in the same `src` folder, you have **stale artifacts**.
**Fix**: Use the cleanup command in §3, item 4 (`find packages -name "*.ts" -not -path "*/node_modules/*" -exec bash -c '...' \;`).

### Web Shell Type Generation

`@qwen-code/webui` was retired upstream (#9812) and no `tsconfig.dts.json` exists in the tree. The live pattern is `packages/web-shell`: its build runs three `vite build` passes and then a manual `tsc -p tsconfig.lib.json` with `emitDeclarationOnly` + `declarationDir: dist/types`, which is how valid `.d.ts` files get produced without a dts plugin. Keep the manual `tsc` step when merging — dropping it ships a package with no types.

### Express Request Params

In newer TypeScript versions or strict modes, `req.params['id']` might be inferred as `string | string[]`.
**Fix**: Always cast to string: `const id = req.params['id'] as string;`.

### Installer Git Errors

`local-install.sh` builds in a temporary directory without `.git`.
**Optimization**: Ensure build scripts (like `generate-git-commit-info.js`) handle the absence of a git repository gracefully (e.g., by checking environment variables first or silencing stderr).

### Vitest Version Drift

`packages/sdk-typescript` must keep vitest in sync with the workspace root (`^3.2.4`). A mismatch creates an isolated `node_modules` and `tsc` fails with `ExpectStatic has no call signatures`.

```bash
cd packages/sdk-typescript && node -p "require('vitest/package.json').version"
# Must print 3.2.x. Do NOT cat packages/sdk-typescript/node_modules/vitest/package.json
# — vitest is hoisted to the repo root, that path does not exist, and a dead path
# reads as "no version" rather than as a failure.
```

### Targeting Tests (never the root suite)

Never run `npm run test` from the project root — it launches every package and times out. Always target a single workspace: `npm run test --workspace=packages/core`, or `cd packages/<p> && npx vitest run src/path/to/file.test.ts`. If a test exceeds 2× its expected duration, kill it and investigate rather than waiting. `packages/cli` carries mutation-testing harnesses that take 3+ minutes; run with `--reporter=verbose` to see progress.

### Pre-Existing Failures (running as root, NOT caused by fork changes)

Before investigating a failure, confirm it is a regression on the clean `dev` branch (`git stash && npm run test --workspace=... && git stash pop`). These fail because root bypasses permission checks, not because of anything the fork changed:

|Test|Why it fails as root|
|---|---|
|`packages/core/src/tools/edit.test.ts` — "should return FILE_WRITE_FAILURE on write error"|root bypasses file permission checks|
|`packages/core/src/utils/pathReader.test.ts` — "should return an error string if reading a file with no permissions"|root bypasses file permission checks|
|`packages/cli/src/utils/housekeeping/cleanup.test.ts` — "counts errors and continues sweep when one dir cannot be removed"|root bypasses directory write restrictions|

`packages/cli`'s permission error-counting case in `cleanup.test.ts` auto-skips when `process.getuid?.() === 0`.

Further classes are environmental rather than fork regressions. Rule them out (Step 4b baseline) before spending time on any "new" failure:

- **`LspConfigLoader`** (core): `mock-fs` mocks `/workspace`, which collides with a checkout living under `/workspace`; it passes in a checkout elsewhere.
- **Process-tree, cgroup and file-watcher tests** (core `hooks/`, acp-bridge `process-registry`, cli `managed-stdio-supervisor` / managed-runtime): real process reaping and file watching inside a container. They also fail under parallel load.
- **`sessionService*.test.ts`** (core): `sessionService.rename.test.ts` mocked `path` but not the title sidecar, so as root it wrote session-title files into the REAL `/chats` and `/projects`, and leftovers made `getSessionTitle` return a stale title in other suites. Fixed at the source (the suite now stubs the sidecar I/O). Directories left by older runs are harmless to those suites but can be deleted by hand.
- **cli UI snapshot and `*.process.test.ts` failures**, 39 tests in 20 files at v0.27.2 (`Header`, `SessionSummaryDisplay`, `InputPrompt`, `ProviderSetupSteps`, …): identical on the pre-merge commit.
- **Bundled-skill integration** tests (core).
- `recall-scan-latency` is load-sensitive and passes alone.

> Counts drift with upstream. Treat the list above as the _known classes_, and re-baseline with a clean-branch run before quoting a number.

### Tests Fixed for No-Telemetry

These tests were changed (not deleted) to match fork behavior, so a merge that restores upstream's version fails:

|Test|What it pins|
|---|---|
|`packages/core/src/config/installationManager.test.ts`|static UUID `00000000-0000-0000-0000-000000000000`|
|`packages/core/src/config/config.test.ts`|usage statistics disabled by default, and the §17 catalog-refresh gate: its `model-catalog-refresh.js` mock must stay a **partial** mock (`importOriginal`), because the fork's call site reads `MODEL_CATALOG_REFRESH_ENV` from that module — upstream's factory listing only `refreshModelCatalog` makes every `Config.initialize()` throw|
|`packages/cli/src/config/settingsSchema.test.ts`|`gitCoAuthor` present in schema with default `false`|
|`packages/cli/src/llm.test.tsx`|mocks `getCliVersionDisplay` to `1.0.0-no-telemetry`|
|`packages/cli/src/ui/systemInfo.test.ts`|renders the `-no-telemetry` suffix in the version line|
|`packages/cli/src/i18n/mustTranslateKeys.test.ts`|restored deleted locale files + `git-commit.js`|
|`packages/core/src/config/config.test.ts` (`getClearContextOnIdle`)|tool-result clearing disabled by default, explicit opt-in still honoured (§19)|
|`packages/cli/src/config/settingsSchema.test.ts`|schema defaults for the two `clearContextOnIdle` thresholds are `-1` (§19)|
|`packages/core/src/core/client.test.ts`|`setTools` builds declarations outside a leaked agent frame (§20)|
|`packages/core/src/telemetry/*.test.ts` (except `uiTelemetry.test.ts`)|excluded in `packages/core/vitest.config.ts` — cannot compile without the removed `@opentelemetry` deps|

> `packages/cli/src/gemini.test.tsx` used to carry the `getCliVersionDisplay` mock. That file no longer exists upstream — the mock now lives in `llm.test.tsx` and the suffix assertion in `ui/systemInfo.test.ts`. A merge that resurrects the old row is pointing at a dead path.

---
