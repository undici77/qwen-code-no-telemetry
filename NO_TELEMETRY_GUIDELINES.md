# Qwen Code: No-Telemetry Guidelines

This document defines the privacy policy, technical architecture, and maintenance strategy for the "No-Telemetry" fork of Qwen Code. It is intended for AI models and developers responsible for merging upstream changes while preserving absolute user privacy.

---

## 1. Core Privacy Policy

The fundamental goal of this fork is **Zero External Data Leakage**.

1.  **No Tracking**: No telemetry, analytics, or usage statistics may be sent to any external server (including Google, Aliyun, or OTLP collectors).
2.  **No Unique Identifiers**: The application must not generate or persist unique installation IDs that could be used to track a specific user across sessions.
3.  **Local Data Only**: Persistence is strictly limited to:
    *   Local session history (for user reference).
    *   Local hierarchical memory (e.g., `QWEN.md` or context files).
    *   Configuration files explicitly managed by the user.
4.  **No Auto-Updates**: Auto-update mechanisms must be disabled by default to prevent unauthorized code execution or tracking via update pings.

---

## 2. Technical Implementation Architecture

To ensure the application code remains as close to `main` as possible (for easy merging) while ensuring privacy, we use a **Dummy Layer Strategy** rather than file deletion.

### A. The Telemetry Dummy Layer
*   **Location**: `packages/core/src/telemetry/`
*   **Strategy**: All telemetry-related exports (loggers, metrics, SDK initializers) must exist to satisfy internal imports, but their implementations must be replaced with **no-op (empty) functions**.
*   **Dependencies**: All `@opentelemetry/*` packages must be removed from `package.json` to guarantee that no OTEL code is even bundled.

### B. Identity Neutralization
*   **InstallationManager**: The `getInstallationId()` method must return a static, non-unique UUID (e.g., `00000000-0000-0000-0000-000000000000`).
*   **Storage**: Any logic that attempts to write a unique ID to the file system must be neutralized.

### C. Configuration Hardening
*   **Usage Statistics**: `Config.getUsageStatisticsEnabled()` must be hardcoded to return `false`.
*   **Default Settings**: The `settingsSchema.ts` must set `enableAutoUpdate` to `default: false`.

---

## 3. Maintenance & Merge Strategy

When merging upstream `main` commits into this branch, follow this protocol:

### Step 1: The Merge
Perform a standard git merge. If conflicts arise in the `telemetry/` directory or `InstallationManager`, **always prioritize the no-telemetry implementation**.

### Step 2: Neutralizing New Telemetry
If upstream adds new telemetry functions or loggers:
1.  Add the new function signatures to the dummy files in `packages/core/src/telemetry/`.
2.  Implement them as empty functions.
3.  Ensure any new dependencies related to tracking are removed from `package.json`.

### Step 3: Versioning & Consistency
**Mandatory Rule**: Every time a new upstream version is merged, the version number must be updated **everywhere** in the project and it **MUST always include the `-no-telemetry` suffix**.

It is critical to ensure this version string is applied consistently:
1.  **package.json**: Update the `version` field in the root and **ALL** workspace packages (`packages/*/package.json`) to `[NEW_VERSION]-no-telemetry`.
2.  **package-lock.json**: Run `npm install` or use `sed` to ensure the lockfile reflects the new version and sandbox image URIs.
3.  **Dockerfile**: Update the `ARG QWEN_REF` to the new tag/branch name (e.g., `v[NEW_VERSION]-no-telemetry`).
4.  **install.sh / local-install.sh**: Update all hardcoded examples, version checks, and default reference variables to use the new `-no-telemetry` version.
5.  **Build Info**: Run `npm run generate` to bake the current git hash and version into the application constants.

3.  **Dockerfile Maintenance**: The `Dockerfile` must remain in its current single-stage, runtime-focused state. It should only be modified if the upstream repository introduces essential dependency or build-system updates. In such cases, merge the new dependencies but **strictly exclude** any that are related to telemetry or tracking.

### Step 4: Verification & Final Privacy Audit
1.  **Build**: Run `npm run build:packages` to ensure no broken imports or `noUnusedLocals` errors.
2.  **Lint**: Run linting to ensure code consistency.
3.  **Comprehensive Privacy Audit**: At the end of every merge or update, **re-analyze the entire codebase**. 
    *   Search for new occurrences of `fetch`, `http`, `axios`, or any other networking libraries.
    *   Verify that no new external endpoints or tracking SDKs have been introduced.
    *   Evaluate the overall privacy risk of any newly merged features and neutralize them if they involve data collection.

---

## 4. Version String Standard

For clarity and transparency, the version string displayed in the GUI must follow this format:
`[VERSION]-no-telemetry · ❌📡 · [SHORT GIT HASH]`

*   The clean version (for `User-Agent` headers) must remain ASCII-only: `[VERSION]-no-telemetry`.
*   The display version (for UI) must include the satellite emoji to signal the no-telemetry state.

---

## 5. Instructions for Future AI Models

When you are tasked with "Aligning this branch with main" or "Updating to a new version":
1.  Locate the current release tag on `main`.
2.  Follow the **Maintenance & Merge Strategy** above.
3.  Do **not** delete files unless they are entirely telemetry-specific and not imported elsewhere.
4.  Ensure that the `packages/core/src/telemetry/index.ts` continues to export the expected symbols to prevent build failures in the rest of the application.
5.  **Always** fix `noUnusedLocals` errors by removing unused imports or variables introduced during the neutralization process.
