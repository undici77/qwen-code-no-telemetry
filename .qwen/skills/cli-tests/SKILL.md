---
name: cli-tests
description: Run CLI tests with focus on unit, integration, and E2E testing patterns.
---

# CLI Testing Guide

How to run end-to-end, integration, and E2E tests of the Qwen Code CLI. Use this skill when you need to verify CLI behavior, reproduce bugs end-to-end, or run the full test suite.

## Which tests to run

The CLI has three layers of testing, with different purposes and expected times:

- **Unit tests** (fast, <10 sec): `packages/cli/src/**/*.test.ts`
- **Integration tests** (slower, 1-2 min): `integration-tests/`
- **E2E tests** (slowest, 3+ min): interactive/tmux mode

## Quick test commands

### Run all CLI tests (recommended)

```bash
cd packages/cli && npx vitest run --reporter=verbose 2>&1 | tee /tmp/test.log
```

- **Scope**: All 295 test files under `packages/cli/src/`
- **Duration**: ~2-5 minutes
- **Expected known failures** (running as root):
  - `src/tools/edit.test.ts` — file permission checks don't apply to root
  - `src/utils/pathReader.test.ts` — same permission issue

### Run specific test patterns

```bash
# Unit tests only
cd packages/cli && npx vitest run --reporter=verbose src/tools/edit.test.ts

# Integration tests
npm run test:integration:cli:sandbox:none

# Terminal benchmark tests
npm run test:terminal-bench

# SDK integration tests
npm run test:sdk:python
```

### Fail-fast / watch mode

```bash
cd packages/cli && npx vitest run --reporter=verbose 2>&1 | tee /tmp/test.log
```

## Pre-flight checklist

Before running tests:

1. Verify Node.js version (>= 22.0.0 required):

   ```bash
   node --version
   ```

2. Install dependencies if needed:

   ```bash
   npm install
   ```

3. Build the project (required for some tests):

   ```bash
   npm run build
   npm run bundle
   ```

4. Check for expected root-user failures:
   - As root, permission checks bypass tests like `edit.test.ts` and `pathReader.test.ts`
   - These are pre-existing known failures, not test bugs

## Integration testing patterns

### Sandbox tests

Three sandbox modes are available in `integration-tests/`:

- **None** (Qwen Code internal sandbox): `npm run test:integration:cli:sandbox:none`
- **Docker**: Requires Docker image (`npm run test:integration:cli:sandbox:docker`)
- **Podman**: Requires Podman container (`npm run test:integration:cli:sandbox:podman`)

### Interactive mode (tmux)

For TUI rendering and keyboard interaction tests:

```bash
cd integration-tests && \
  cross-env QWEN_SANDBOX=false npx vitest run cli interactive
```

### Expected output format

Tests produce structured JSON. Key assertions use patterns:

- **Permission checks** — expect `FILE_WRITE_FAILURE` on write errors
- **PathReader tests** — expect error strings when no permissions exist
- **Unit tests** — expect specific return values, behavior matches

## Debugging test failures

### Common failure patterns

1. **"No matching export"** — stale `.js` files in `src/`:

   ```bash
   find packages/*/src -name "*.ts" -o -name "*.tsx" \
     | sed 's/\.ts$//; s/\.tsx$//' \
     | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done
   ```

2. **`ERR_MODULE_NOT_FOUND`** — imports from `@opentelemetry/api` must be relative:

   ```bash
   grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts"
   ```

3. **Permission test failures** — running as root bypasses checks:
   - `src/tools/edit.test.ts` — expected failure
   - `src/utils/pathReader.test.ts` — expected failure

4. **Timeout on test suite** — reduce timeout:

   ```bash
   npm run build && npm run bundle && \
     QWEN_SANDBOX=false npx vitest run 2>&1 | tee /tmp/test.log
   ```

5. **Snapshot failures** — update snapshots for behavioral changes:
   ```bash
   cd packages/cli && npx vitest run src/path/to/file.test.ts --update
   ```

## Performance tips

1. Use parallel execution: `npx vitest run --parallel`
2. Filter to target suites when full suite is too slow: `npm run test -- --filter=...`
3. Check known failing tests first (root-user permission issues)
4. Use `--reporter=verbose` for detailed output in debug mode

## Tips

- **E2E mode (headless)** — use `<qwen>` to write tests, not for actual TUI testing
- **Interactive mode** — requires tmux, good for permission prompts or slash command testing
- **Unit tests** — fastest, good for regression detection but not realistic behavior
- **Known failures** — always verify your environment before marking tests as passed or failed
