## Qwen Added Memories

- When releasing a new version (e.g., bumping from v0.13.1-no-telemetry to v0.13.1-no-telemetry), ALWAYS update these files with the new version number:

1. **Dockerfile**: `ARG QWEN_REF="v[version]-no-telemetry"`
2. **install.sh**: All example version references and usage docs
3. **AGENTS.md**: Merge protocol examples (v0.X.Y → v0.X+1.Y)
4. **NO_TELEMETRY_GUIDELINES.md**: Release process examples

Search command before releasing: `grep -r "v[old-version]-no-telemetry" --exclude-dir=node_modules .`

The `package.json` version field should match upstream exactly (e.g., `"0.13.1"`), without `-no-telemetry`. The suffix is only for UI display and branch naming.

- When running tests in this no-telemetry fork, be aware of these pre-existing test failures that are NOT related to our changes:

**Environment-specific failures (running as root):**

1. `src/tools/edit.test.ts` - "should return FILE_WRITE_FAILURE on write error" - Fails because root bypasses file permission checks
2. `src/utils/pathReader.test.ts` - "should return an error string if reading a file with no permissions" - Fails because root bypasses permission checks

These tests were already failing before our changes and are expected when running as root.

**Tests we fixed for no-telemetry:**

1. `installationManager.test.ts` - Updated to test static UUID return value
2. `config.test.ts` - Usage statistics tests now expect disabled by default
3. `gemini.test.tsx` - Fixed mock for `getCliVersionDisplay` (was incorrectly checking for non-existent `getCliVersion`)

**Telemetry Implementation:**

1. **OpenTelemetry Removal**: All `@opentelemetry/*` packages (the original upstream telemetry provider) have been completely removed from dependencies.
2. **QwenLogger Substitution**: OpenTelemetry logic has been replaced with an internal `QwenLogger` (found in `packages/core/src/telemetry/qwen-logger/`) to maintain codebase compatibility without external dependencies.
3. **No-Op Dummy Layer**: In this fork, `QwenLogger` and all associated telemetry loggers are implemented as **hardcoded no-ops (empty stubs)**. This ensures that even if the code calls a logging function, no data is ever processed or leaked, maintaining 100% privacy.
