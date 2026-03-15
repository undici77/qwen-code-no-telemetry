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
- **PLANNING**: Always start by evaluating the conflict scope and presenting a clear resolution plan—**before beginning any full evaluation or merge execution**.
- **PRECISION**: If you are unsure about a specific conflict resolution, ASK THE USER, but provide your best recommendation first.
- **ABSOLUTE NON-NEGOTIABLES**:
  - ✅ **BEFORE STARTING FULL EVALUATION**: You MUST first perform a *scoped, preliminary conflict assessment* (e.g., "Which files touched telemetry? Which commits introduced new tracking?"). Only proceed once this is complete.
  - ✅ **ONCE STARTED, NO ABORT. NO DEDUCTION. NO HALLUCINATION**.
    - **CLOSE THE TASK IMMEDIATELY**—do *not* pause, ask clarifying questions beyond *one* critical confirmation (if absolutely unavoidable), or request "more context."
    - **NEVER** say "This is complicated" as a reason to delay or abort.
    - **NEVER** claim "I need more tokens" to justify incompletion—use the available token budget *aggressively* to resolve and close.
    - **IF APPEARING TO “MERDE” (e.g., merge conflict, ambiguous file)**: DO NOT ABORT. Resolve * pragmatically*. Prioritize the dummy layer. Overwrite uncertainty with decisive action.
    - **IF HALLUCINATING** (e.g., inventing upstream behavior, assuming intent): STOP. Re-examine diffs. If unsure, default to **no telemetry = no-op** and document your assumption *in the commit message*, then close.
  - ✅ **CLOSE THE JOB** with a successful merge commit, clear version bump, and post-merge verification—even if imperfect. **Imperfect closure > perfect ambiguity**.

---

## 5. Enforcement Principle: *One-Time, One-Attempt Resolution*

> **Every merge attempt is a *single-shots* operation.**  
> You get one chance to evaluate, resolve, and close. No retries, no "second attempts" unless explicitly restarted by a human.  
> — If resolution fails after best-effort, *abort silently*, record failure in commit message, and raise no complaint.  
> — Human review follows—*you do not escalate*. You closed the job, and it failed. That is acceptable. Delaying or hallucinating is not.
