---
paths:
  - "package.json"
  - "packages/*/package.json"
  - "scripts/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
description: Fork build and test gotchas — workspace-scoped test runs and stale committed artifacts
---

## Build & Test Notes

Never run `npm run test` from the project root — it launches every package and times out. Target one workspace (`npm run test --workspace=packages/core`, or `cd packages/<p> && npx vitest run src/path/to/file.test.ts`); `packages/cli` mutation-testing harnesses take 3+ minutes, so use `--reporter=verbose`. Stale `.js` beside a `.ts` breaks esbuild with "No matching export" — and a `rm` on a _tracked_ one only dirties the tree, so untrack it.

Node ≥ 22, the stale-artifact cleanup command and the `run_shell_command` **timeout table** are in **NTG §3**; Express param casts, vitest version drift, the WebUI `.d.ts` pattern, the root-user pre-existing failure baseline and the tests fixed for no-telemetry are in **NTG §10**. Do not re-derive them, and re-baseline failure counts on a clean `dev` branch before quoting a number.
