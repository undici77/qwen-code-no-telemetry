# Qwen Code: No-Telemetry Guidelines

This document defines the privacy policy, technical architecture, and maintenance strategy for the "No-Telemetry" fork of Qwen Code. It is foundational for all automated agents and human developers.

---

## 1. Core Privacy Policy: Zero External Data Leakage

1.  **NO TRACKING**: Absolutely NO telemetry, analytics, or usage statistics may be sent to any external server.
2.  **NO IDENTITY**: No unique installation IDs. `getInstallationId()` must ALWAYS return `00000000-0000-0000-0000-000000000000`.
3.  **LOCAL PERSISTENCE ONLY**: Data is strictly local.
4.  **DISABLED AUTO-UPDATES**: Hardcode `enableAutoUpdate` to `false` in default settings.

---

## 2. Maintenance Strategy: MERGE + FIX CONFLICTS

This branch must remain aligned with upstream `main`.

### THE GOLDEN RULE: ALWAYS MERGE MAIN

- **BE PRAGMATIC**: Do not wait for a "clean" upstream state. Merge frequently.
- **BE ASSERTIVE**: Conflicts are expected. **RESOLVE THEM!** Do not use conflicts as an excuse to avoid alignment.
- **STRATEGY**: Merge the latest `main` HEAD (or a stable commit near HEAD) into the current `no-telemetry` branch.
- **NEUTRALIZATION**: During resolution, ALWAYS prioritize the dummy/no-op implementations for anything telemetry-related.

### Implementation Pattern (Dummy Layer)

- **packages/core/src/telemetry/**: Maintain no-op functions for all exports.
- **package.json**: Remove ALL `@opentelemetry/*` dependencies.
- **Neutralize New Features**: If upstream adds new tracking logic, immediately neutralize it in the merge result.

---

## 3. Mandatory Post-Merge Actions

Every successful merge REQUIRES:

1.  **VERSION SYNC**: Update version in ALL `package.json` files to `[UPSTREAM_VERSION]-no-telemetry`.
2.  **DOCKER/SANDBOX SYNC**: Update `sandboxImageUri` in root `package.json` and `Dockerfile` to match the new version.
3.  **LOCKFILE REGEN**: Run `npm install` to ensure `package-lock.json` is consistent.
4.  **VERIFICATION**: Run `npm run build:packages` and `npm run lint`.

---

## 4. Instructions for AI Models

- **NO EXCUSES**: Aligning this branch is your job. "Conflicts too complex" is not an acceptable failure.
- **PLANNING**: Always start by evaluating the conflict scope and presenting a clear resolution plan.
- **PRECISION**: If you are unsure about a specific conflict resolution, ASK THE USER, but provide your best recommendation first.
