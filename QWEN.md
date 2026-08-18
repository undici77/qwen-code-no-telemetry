# QWEN.md — Qwen Code No-Telemetry Fork: Project Instructions

This is a **no-telemetry fork** of [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code): maximum privacy, zero external data leakage, while staying aligned with upstream `main`.

## Working Principles

### Simplicity First (most important)

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked; no abstractions for single-use code; no "flexibility" that wasn't requested; no error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it. Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Core Infrastructure Is Maintainer-Only (triage gate)

Core modules — `packages/core/src/**`, `packages/*/src/{auth,providers,models,config,tools,services}/**`, cross-package changes — are the architectural backbone. External PRs touching them face a two-tier gate (maintainer-authored PRs exempt):

1. **Large `refactor` (500+ production logic lines in core, excluding `*.test.*`, `*.spec.*`, `**tests**/**`, `_.schema._`, `**/generated/**`) → hard block.** Must be maintainer-initiated. Non-`refactor` PRs are not size-blocked but escalate for awareness (advisory at 1000+ lines). Breadth alone is not size: a low-risk sweep touching 10+ files with 1-2 lines each is judged under Tier 2.
2. **Small-scope changes → gate may evaluate but must be 100% confident.** Any doubt → escalate. The gate must name every downstream consumer; if it cannot, escalate.

**When in doubt, escalate. Better to wrongly escalate than to wrongly approve.**

## No-Telemetry Policy (MANDATORY)

**Implementation strategy (dummy layer):** instead of deleting telemetry files (which broke merges), keep the file structure but neutralize it:

1. All `@opentelemetry/*` packages removed from dependencies.
2. Telemetry exports in `packages/core/src/telemetry/` replaced with no-op functions.
3. `InstallationManager.getInstallationId()` returns static UUID `00000000-0000-0000-0000-000000000000`.
4. Usage statistics and auto-updates disabled by default.

**Conflict resolution priority:** when merging from `main`, telemetry conflicts are resolved by REMOVAL — never keep `@opentelemetry/*` packages or tracking code "just to match versions". Version strings must match upstream, but the no-telemetry policy overrides any telemetry-related code.

### ⚠️ MANDATORY RULES (verify after every merge)

- **`loggers.ts` partial no-op rule** — `logApiResponse`, `logApiError`, `logToolCall` (and `recordSkillInvocation`) in `packages/core/src/telemetry/loggers.ts` MUST NOT be no-ops. They MUST forward to `uiTelemetryService.addEvent()` (a local-only in-process `EventEmitter` — zero network, zero disk) and `config.getChatRecordingService()?.recordUiTelemetryEvent()` (local file only, for `--resume`). Making them full no-ops blanks the "Agent powering down. Goodbye!" quit stats (Model Usage / tokens / tool counts) — a correctness bug, not a privacy fix. All other ~30 log functions remain empty no-ops. See `NO_TELEMETRY_GUIDELINES.md §11`.

- **`@opentelemetry/api` runtime import rule** — `tsconfig.json` `paths` only affect type-checking and esbuild bundling; they do NOT rewrite `.js` output. Any `.ts` importing from `@opentelemetry/api` must use a **relative import to `dummy-otel.js`** (e.g. `from '../telemetry/dummy-otel.js'`), or `npm start` crashes with `ERR_MODULE_NOT_FOUND`. Verify: `grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\."` — must return zero lines. See `NO_TELEMETRY_GUIDELINES.md §12`.

- **WebSearch/SerpApi patch** — the built-in `web_search` tool MUST remain backed by SerpApi, NOT DashScope/Google/GLM/Tavily. On every merge, restore the SerpApi implementation in `packages/core/src/tools/web-search.ts`. Verify: `grep -n "dashscope\|DashScope" packages/core/src/tools/web-search.ts` — zero lines. See `NO_TELEMETRY_GUIDELINES.md §1.5`.

- **Vision-bridge image concurrency patch** — the vision bridge (`packages/core/src/services/visionBridge/vision-bridge-service.ts`) MUST NEVER reject an image on a per-turn count. It throttles concurrent bridge calls to `VISION_BRIDGE_MAX_IMAGES` (4) and queues the rest — every valid image is eventually converted. If upstream reintroduces a per-turn rejection cap (a `WeakMap`/counter failing images past N), replace it with the concurrency gate (`tryAcquireBridgeSlotSync` / `waitForBridgeSlot` / `releaseBridgeSlot`). Verify: `grep -n "turnImageCounts\|budget was exhausted" packages/core/src/services/visionBridge/vision-bridge-service.ts` — zero lines. See `NO_TELEMETRY_GUIDELINES.md §1.6`.

- **Telemetry commits can change control-flow timing** — upstream telemetry fixes often add `await`/`try-finally` just to keep a trace span open; the span is a no-op here, but the **timing change survives the merge**. Incident (v0.21.12): upstream `#9121` changed the tool-result submission in `useGeminiStream.ts` from `void submitQuery(...)` to `await submitQuery(...)`, delaying `CoreToolScheduler`'s `notifyToolCallsUpdate([])` until the whole continuation stream ended → the completed tool group rendered in both Static and the live region (TUI duplication of the last tool block during RUN). **On every merge**: audit telemetry commits for `void` → `await` / callback-ordering changes; verify `checkAndNotifyCompletion` in `packages/core/src/core/coreToolScheduler.ts` calls `notifyToolCallsUpdate()` right after `this.toolCalls = []` (before the awaited `onAllToolCallsComplete`), and the regression test "clears the live tool-call view before a slow completion callback resolves" still exists. See `NO_TELEMETRY_GUIDELINES.md §13`.

## Versioning & Release

- **Version rule**: `package.json` `"version"` is the single source of truth. On release, update: **Dockerfile** (`ARG QWEN_REF="v[version]-no-telemetry"`), **install.sh** + **install.ps1** (all example version references), **README.md** (install script URLs + original README link). The `-no-telemetry` suffix is always the same — never change it.
- **Two-layer versioning**: upstream version stays identical to upstream `main` (dependency resolution); the `-no-telemetry` suffix identifies the privacy fork.
- **Single-Merge Strategy** (single release commit while keeping `main` aligned):
  1. `git reset --hard [LAST_TAG]`
  2. `git merge --no-ff main -m "feat: release [VERSION]"`
  3. Resolve/neutralize and `git commit --amend`
     _Avoid `reset --soft` after merge — it breaks the history link to `main`._

## Common Commands

`npm install` · `npm run build` (all packages) · `npm run build:all` (incl. sandbox container) · `npm run bundle` (dist/cli.js via esbuild; requires build first) · `npm start` (CLI from source) · `npm run dev` (watch) · `npm run preflight` (clean → install → format → lint → build → typecheck → test) · `bash local-install.sh` (build + install globally into `$HOME/.npm-global`; timeout 600s)

## Efficiency & Troubleshooting

1. **Stale JS Cleanup**: if esbuild fails with "No matching export" after updating `.ts`, stale `.js` files exist in `src`. Fix:
   ```bash
   find packages/*/src -name "*.ts" -o -name "*.tsx" | sed 's/\.ts$//; s/\.tsx$//' | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done
   ```
2. **Node.js**: ALWAYS use **Node.js >= 22.0.0** (Ink 7 + React 19.2 require it; older fails with `EBADENGINE`).
3. **Express Params**: cast `req.params['id'] as string` to avoid union type errors.
4. **Test Timeout Avoidance**: never run `npm run test` from the project root (launches every package, times out). Always target a single workspace: `npm run test --workspace=packages/core`. If a test exceeds 2× its expected duration, kill it and investigate. `packages/cli` has mutation-testing harnesses that take 3+ minutes; use `--reporter=verbose` to see progress.
5. **Pre-existing Failure Baseline**: before investigating a test failure, confirm it's a regression on the clean `dev` branch (`git stash && npm run test --workspace=... && git stash pop`). The core package has ~22 known pre-existing failures (root-permission tests, LSP config loader, bundled-skill integration) — don't waste cycles on them.
6. **Vitest Version Drift**: `packages/sdk-typescript` must keep vitest in sync with the workspace root (^3.2.4). A mismatch creates an isolated `node_modules` and `tsc` fails with "ExpectStatic has no call signatures" — check `cat packages/sdk-typescript/node_modules/vitest/package.json | grep version`.
7. **WebUI Build Pattern**: `packages/webui` uses a custom `tsconfig.dts.json` + a manual `tsc` step in its build script because `vite-plugin-dts` is unreliable with CSS/SVG imports.

**Timeout reference table** (for `run_shell_command` `timeout`, ms):

| Command                                                               | Expected     | Safe timeout |
| --------------------------------------------------------------------- | ------------ | ------------ |
| `npm run build:packages`                                              | ~30s         | 60s          |
| `npm run build` (full, incl. web-shell)                               | ~90–120s     | **180s**     |
| `npm run typecheck`                                                   | ~30s         | 60s          |
| `npm run lint` / `lint:fix`                                           | ~90s / 120s+ | **180s**     |
| `npm run test --workspace=packages/{sdk-typescript,acp-bridge,webui}` | ~10–25s      | 60s          |
| `npm run test --workspace=packages/core`                              | ~75s         | **180s**     |
| `npm install`                                                         | ~60–100s     | **180s**     |
| `git stash && npm run test && git stash pop` (baseline)               | ~90s         | **180s**     |

## Testing

**Run individual test files** (always preferred): `cd packages/core && npx vitest run src/path/to/file.test.ts` (same for `packages/cli`).

- **OTel test exclusions**: `packages/core/vitest.config.ts` excludes `src/telemetry/*.test.ts` (except `uiTelemetry.test.ts`, which tests local-only stats) — they can't compile without the removed `@opentelemetry` deps.
- **Root-user skip**: `packages/cli`'s permission error-counting case in `cleanup.test.ts` auto-skips when `process.getuid?.() === 0` (root bypasses directory write restrictions).
- **Update snapshots**: `cd packages/cli && npx vitest run src/path/to/file.test.ts --update`.
- **Avoid**: `npm run test -- --filter=...` (does NOT filter — runs everything); `npx vitest` from the project root (fails — package-specific configs); full-suite runs unless necessary.
- **Gotcha**: in CLI tests, use `vi.hoisted()` for mocks consumed by `vi.mock()` — the mock factory runs at module load time.

**Pre-existing failures (running as root, NOT related to our changes):**

1. `src/tools/edit.test.ts` — "should return FILE_WRITE_FAILURE on write error" (root bypasses file permission checks)
2. `src/utils/pathReader.test.ts` — "should return an error string if reading a file with no permissions" (root bypasses permission checks)
3. `packages/cli/src/utils/housekeeping/cleanup.test.ts` — "counts errors and continues sweep when one dir cannot be removed" (root bypasses directory write restrictions)

**Tests we fixed for no-telemetry:** `installationManager.test.ts` (static UUID), `config.test.ts` (usage stats + gitCoAuthor disabled by default), `settingsSchema.test.ts` (gitCoAuthor default false), `gemini.test.tsx` (fixed `getCliVersionDisplay` mock), `mustTranslateKeys.test.ts` (restored deleted locale files + `git-commit.js`), `packages/core/src/telemetry/*.test.ts` excluded in `vitest.config.ts`.

**Integration testing**: build first (`npm run build && npm run bundle`), then `npm run test:integration:cli:sandbox:none` / `npm run test:integration:interactive:sandbox:none`, or `cd integration-tests && cross-env QWEN_SANDBOX=false npx vitest run cli interactive`. Gotcha: always call `session.idle()` between sends — ANSI output streams asynchronously.

**Linting & formatting**: `npm run lint` · `lint:fix` · `format` · `typecheck` · `preflight`.

## Project Structure

```
packages/{cli (main entry), core (backend + telemetry dummy layer), sdk-java, sdk-typescript,
          test-utils, vscode-ide-companion, web-templates, webui, zed-extension}
docs/ (source docs) · docs-site/ (Next.js site) · integration-tests/ · scripts/ · eslint-rules/
build.sh / install.sh (install.ps1 = Windows counterpart) · Dockerfile · Makefile
```

## Code Conventions

- **Module system**: ESM throughout (`"type": "module"` in all packages)
- **TypeScript**: strict mode (`noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `verbatimModuleSyntax`)
- **Formatting**: Prettier — single quotes, semicolons, trailing commas, 2-space indent, 80-char width
- **Linting**: no `any`, consistent type imports, no relative imports between packages
- **Tests**: collocated (`file.test.ts` next to `file.ts`), vitest
- **File naming**: `PascalCase.tsx` for React components; `kebab-case.ts` for `.ts` in `packages/core` and `packages/cli` (ESLint-enforced; camelCase files are allowlisted in `eslint.legacy-filenames.mjs` — rename opportunistically, updating imports in the same commit; renames lose `git blame`)
- **Comments**: default to none; add only when the _why_ is non-obvious; don't delete existing ones as cleanup
- **Commits**: Conventional Commits (e.g. `feat(cli): Add --json flag`)
- **Node.js**: dev and prod both require `>=22`

## Web Shell UI Development

- Prefer the shared primitives in `packages/web-shell/client/components/ui`; don't duplicate an existing primitive or rewrite stable CSS Modules.
- If a primitive is missing, run `npx shadcn@latest add <component>` from `packages/web-shell`, then review the diff. Don't let the CLI overwrite global CSS, semantic tokens, CSS scoping, or portal-root integration. Keep generated components internal unless a public API is required.
- Web Shell supports React 18 and 19; generated shadcn components often assume React 19 ref semantics — wrappers accepting/receiving refs (including Radix `asChild`, `Slot`, `Presence`, portal children) must use `React.forwardRef` and pass the ref through. Add a regression test for any ref-sensitive path.
- Use unprefixed Tailwind classes and shadcn semantic tokens (`background`, `primary`, `muted`). The package build scopes CSS to the Web Shell root and portal root and prefixes global animations — preserve that isolation from host-page styles.
- Portal components (dialogs, popovers, dropdowns, tooltips) must use `useWebShellPortalRoot()` as the Radix portal container. Preserve existing `data-web-shell-*` attributes and public `--web-shell-*` CSS variables. See `packages/web-shell/README.md`.

## Development Guidelines

1. **Design doc for non-trivial work** — write one in `docs/design/` if the change touches multiple files or involves design decisions. Skip for small bugfixes.
2. **Test plan for behavioral changes** — write an E2E test plan in `.qwen/e2e-tests/` when the change affects user-observable behavior. Dry-run against the global `qwen` CLI first to confirm the baseline.
3. **Build, typecheck, and test before declaring done**: `npm run build && npm run typecheck`, plus unit tests for the files you changed.
4. **Self-audit before declaring done** — read the full diff (including new untracked files) in open-ended passes. Verify each change and each green test you rely on, presuming it wrong. Stop after two consecutive clean passes; a fix re-runs step 3 and resets the count. If five passes bring no convergence, say so instead of declaring done. Scale to the diff: one clean pass suffices for a trivial change.

**Feature development**: use the `/feat-dev` skill (investigate, design, test plan, dry-run, implement, verify, self-audit, review, iterate).
**Bugfix**: use the `/bugfix` skill (reproduce-first workflow).

## Code Review

Project-specific rules for `/review`. The skill loads this section verbatim (by its `## Code Review` heading) and hands it to every review agent, so keep it to things a reviewer of _this_ codebase must check — not general advice.

- **Verify a finding against the exact reviewed commit before reporting it.**
  Read the lines you are about to cite. A Critical that quotes code not present at
  the commit under review is worse than no finding — it blocks the author over
  nothing. Do not report a defect you have only inferred from a symbol name or a
  diff fragment.
- **A `C=0` / APPROVE is a claim, not a default.** Before submitting one, take
  each unresolved Critical already on the PR and check it against the code as it
  stands: _still stands_ / _fixed by this diff_ / _cannot tell_. A GitHub thread
  can read `isResolved: false, isOutdated: false` for a bug that a later commit
  fixed on an adjacent line — the flag tracks the anchored line, not the fix.
- **For every added field, option, or optional parameter, grep its read sites**,
  including outside the diff. A `foo?: boolean` that is declared and read but never
  set by any caller is a dead switch (`options.foo ?? true` always takes the
  default). Decide severity at the read site; never explain an unpopulated field
  with author intent you cannot observe.
- **Classify every added or changed daemon route by ownership.** Name whether it
  is process-global, legacy-primary, selected-runtime, live-session-owner, or
  persisted-workspace scoped, and verify every downstream consumer matches that
  scope.
- **Verify workspace-scoped routes stay inside the resolved runtime.** Check the
  environment, bridge, service, filesystem, trust boundary, and failure paths.
  Each unknown, untrusted, ambiguous, bootstrapping, draining, or removed state
  must follow its declared failure semantics and must never fall back to the
  primary runtime.
- **Match the house style when judging.** ESM only; no `any`; no relative imports
  between packages; `kebab-case.ts` for `.ts` in `packages/core` and `packages/cli`,
  `PascalCase.tsx` for React components; tests collocated as `file.test.ts`.
  Comments default to none — flag a _missing_ comment only where the _why_ is
  genuinely non-obvious, and never fault a diff for deleting a comment that no
  longer applies.
- **A missing test for changed behavior is a Suggestion, not a Critical**, unless
  the untested path is itself the defect.

## GitHub Operations

Use the `gh` CLI for all GitHub-related operations — issues, pull requests, comments, CI checks, releases, and API calls. Prefer `gh issue view`, `gh pr view`, `gh pr checks`, `gh run view`, `gh api`, etc. over web fetches or manual REST calls.

## Testing, Debugging, and Bug Fixes

- **Bug reproduction & verification**: spawn the `test-engineer` agent. It reads code and docs, reproduces the bug via E2E testing (or a test-script fallback), and handles post-fix verification. It cannot edit source code.
- **Hard bugs**: use the `structured-debugging` skill when debugging needs more than a quick glance — especially when the first fix attempt failed or the behavior seems impossible.
- **E2E testing**: the `e2e-testing` skill covers headless mode, interactive (tmux) mode, MCP server testing, and API traffic inspection. The `test-engineer` agent invokes it internally.

## Submitting PRs

Follow the template at `.github/pull_request_template.md`; after submitting, post a separate comment with the E2E test report if applicable.

- **PR description**: explain motivation and changes in prose; avoid referencing file or function names.
- **Reviewer Test Plan**: describe behaviors a reviewer should verify and what to expect, not scripted test commands. Use **How to verify** for reproduction steps; Before/After for TUI evidence when applicable.
- **Line wrapping**: do not hard-wrap the PR body at a fixed column width — GitHub renders single newlines as `<br>`. Write each paragraph or list item as one long line.
- **Don't let review rounds balloon the PR.** After roughly **5 review rounds**, land only Critical fixes (correctness, security, data loss, regressions) and defer remaining Suggestions to a follow-up issue or PR. Record each deferral in the PR thread so nothing is silently dropped.

## Project Directories

Design docs and plans are committed under `docs/` (tracked in VCS): `docs/design/` (planned features), `docs/plans/` (implementation plans). Working artifacts live under `.qwen/` (git-ignored): `.qwen/e2e-tests/` (E2E plans + results), `.qwen/issues/` (issue drafts), `.qwen/pr-drafts/`, `.qwen/pr-reviews/` (review notes), `.qwen/investigations/` (debugging journals), `.qwen/scripts/` (utility scripts).
