---
name: merge-verify
description: Resolve merge conflicts in the no-telemetry fork, build, test, and verify zero external data leakage
source: auto-skill
extracted_at: '2026-06-10T00:05:35.648Z'
---

## merge-verify Skill

Procedure for aligning the no-telemetry fork with upstream `main` while maintaining full privacy compliance.

### Phase 1: Conflict Assessment

Before resolving anything, scope the conflicts:

```bash
cd /workspace/qwen-code-no-telemetry
git diff --name-only --diff-filter=U          # conflicted files
grep -rn "^<<<<<<< \|^=======\|^>>>>>>>" <each-file>  # conflict markers
git log -3 --oneline                          # recent commits context
```

### Phase 2: Resolve Conflicts

**Priority matrix (from NO_TELEMETRY_GUIDELINES.MD §6):**

| Conflict Type                      | Priority    | Action                                                    |
| ---------------------------------- | ----------- | --------------------------------------------------------- |
| `@opentelemetry/*` in dependencies | **HIGHEST** | Remove immediately, no exceptions                         |
| Metrics/analytics/tracking code    | **HIGHEST** | Replace with no-op stubs                                  |
| Installation ID generation         | **HIGHEST** | Return static UUID `00000000-0000-0000-0000-000000000000` |
| Specialized README.md content      | **HIGHEST** | DO NOT merge upstream README. Keep fork docs.             |
| Version string in package.json     | **MEDIUM**  | Match upstream (without -no-telemetry)                    |
| UI display version                 | **LOW**     | Keep -no-telemetry suffix for clarity                     |

**Resolution strategy:**
- For **test files**: keep origin/main (upstream changes) unless they test telemetry behavior — then revert to no-telemetry defaults
- For **config/schema files**: keep fork defaults (`gitCoAuthor: false`, `enableAutoUpdate: false`)
- For **package-lock.json**: keep origin/main, then regenerate via `npm install`

### Phase 3: Clean & Install

```bash
# Stale JS artifact cleanup (prevents esbuild "No matching export" errors)
find packages/*/src -name "*.ts" -o -name "*.tsx" | sed 's/\.ts$//; s/\.tsx$//' | while read -r base; do rm -f "${base}.js" "${base}.js.map"; done

# Regenerate lockfile
npm install
```

### Phase 4: Build & Typecheck

```bash
npm run build:packages   # TypeScript compilation + asset copying
npm run typecheck        # tsc --noEmit across all workspaces
```

### Phase 5: Test Suite

```bash
npm test    # parallel across all workspaces, ~18000+ tests
```

Known pre-existing failures when running as root (skip these):
- `src/tools/edit.test.ts` — file permission checks bypassed by root
- `src/utils/pathReader.test.ts` — file permission checks bypassed by root
- `packages/cli/src/utils/housekeeping/cleanup.test.ts` — directory write restrictions bypassed by root

### Phase 6: No-Telemetry Verification (mandatory)

Run ALL of the following checks. Every check must pass:

```bash
# 1. No @opentelemetry/* in any package.json dependencies
grep -r "@opentelemetry" package.json packages/*/package.json | grep -v ":0" || echo "PASS"

# 2. Installation ID returns static UUID
grep -A3 'getInstallationId()' packages/core/src/utils/installationManager.ts | grep "00000000"

# 3. enableAutoUpdate default is false
grep -A5 'enableAutoUpdate:' packages/cli/src/config/settingsSchema.ts | grep "default: false"

# 4. gitCoAuthor default is { commit: false, pr: false }
grep -A5 'gitCoAuthor:' packages/cli/src/config/settingsSchema.ts | grep "commit: false, pr: false"

# 5. loggers.ts — the 3 allowed functions forward to uiTelemetryService
grep -n "uiTelemetryService.addEvent" packages/core/src/telemetry/loggers.ts
# Must find exactly 3 lines (logApiResponse, logApiError, logToolCall)

# 6. No stray @opentelemetry/api imports in non-test source
grep -rn "from '@opentelemetry" packages/core/src/ --include="*.ts" | grep -v "\.test\." || echo "PASS"

# 7. Usage statistics disabled
grep -A2 'getUsageStatisticsEnabled' packages/core/src/config/config.ts | grep "return false"

# 8. checkForUpdates guarded by enableAutoUpdate === true
grep -B1 'checkForUpdates()' packages/cli/src/gemini.tsx | grep "enableAutoUpdate === true"

# 9. No fetch/http.request/https.request in telemetry directory
grep -rn "fetch\|http\.request\|https\.request" packages/core/src/telemetry/ --include="*.ts" | grep -v "\.test\." || echo "PASS"

# 10. No OTel packages in node_modules
find node_modules -name "index.js" -path "*opentelemetry/api*" 2>/dev/null | wc -l
# Must be 0
```

### Conflict Resolution Decision Tree

When resolving a conflicted file, ask:

1. **Does it touch telemetry/tracking?** → Keep no-telemetry version (our fork defaults)
2. **Is it a test file?** → Keep origin/main UNLESS the test asserts telemetry behavior
3. **Is it a config/schema?** → Check: does upstream change the default to something non-private? If yes, keep fork defaults
4. **Is it package-lock.json?** → Keep origin/main, regenerate with `npm install`
5. **Is it documentation?** → Keep fork docs (never merge upstream README)

### Post-Merge Commit

After successful verification:
```bash
git add -A
git commit -m "chore: merge from main [upstream-commit-hash]"
```
