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

1.  **VERSION SYNC**: Update version in ALL `package.json` files to match upstream (e.g., `0.12.4`). **DO NOT** append `-no-telemetry` to the version string.
2.  **DOCKER/SANDBOX SYNC**: Update `sandboxImageUri` in root `package.json` and `Dockerfile` to match the new version.
3.  **LOCKFILE REGEN**: Run `npm install` to ensure `package-lock.json` is consistent.
4.  **VERIFICATION**: Run `npm run build:packages` and `npm run lint`.

---

## 4. Versioning Strategy: Two-Layer Approach

The version system has two distinct layers that serve different purposes:

| Layer                | Format          | Purpose                                      | Conflict Resolution                   |
| -------------------- | --------------- | -------------------------------------------- | ------------------------------------- |
| **Upstream version** | `0.12.4`        | Package compatibility, dependency resolution | **Keep identical** to upstream `main` |
| **No-telemetry标识** | `-no-telemetry` | UI identification, user awareness            | Always present in display strings     |

### Critical Rules:

1.  **`package.json` version field**: Must match upstream exactly (e.g., `"version": "0.12.4"`). Never include `-no-telemetry` here.
2.  **UI display version**: Should show `[VERSION]-no-telemetry · ❌📡 · [HASH]` for user clarity.
3.  **Dependency conflicts**: If upstream adds `@opentelemetry/*` or similar telemetry packages, **REMOVE THEM** even if it creates a version mismatch. Privacy > compatibility.
4.  **Code conflicts**: If telemetry code is added upstream, replace with no-op implementations during merge resolution.

---

## 5. Release Process: Updating Version References

When releasing a new version (e.g., bumping from `v0.12.3-no-telemetry` to `v0.12.4-no-telemetry`), update **ALL** references across the codebase:

| File                                         | What to Update                              |
| -------------------------------------------- | ------------------------------------------- |
| `Dockerfile`                                 | `ARG QWEN_REF="v[version]-no-telemetry"`    |
| All `.md` files                              | Any `[old-version]-no-telemetry` references |
| `install.sh`, `build.sh`, `local-install.sh` | Any hardcoded version references            |
| CI/CD configuration files                    | Version tags and refs                       |

**Search command to find all occurrences:**

```bash
grep -r "v[old-version]-no-telemetry" --exclude-dir=node_modules .
```

**Important:** The `package.json` version field should match upstream exactly (e.g., `"0.12.4"`), without `-no-telemetry`. The suffix is only for UI display and branch naming.

---

## 6. Conflict Resolution Priority Matrix

When merging from `main`, conflicts may arise. Use this priority order:

| Conflict Type                      | Priority    | Action                                                    |
| ---------------------------------- | ----------- | --------------------------------------------------------- |
| `@opentelemetry/*` in dependencies | **HIGHEST** | Remove immediately, no exceptions                         |
| Metrics/analytics/tracking code    | **HIGHEST** | Replace with no-op stubs                                  |
| Installation ID generation         | **HIGHEST** | Return static UUID `00000000-0000-0000-0000-000000000000` |
| Version string in `package.json`   | **MEDIUM**  | Match upstream (without `-no-telemetry`)                  |
| UI display version                 | **LOW**     | Keep `-no-telemetry` suffix for clarity                   |

### Golden Rule:

> **No-telemetry policy ALWAYS takes priority over version alignment.**
>
> If keeping telemetry code (packages, imports, or logic) is the only way to "match" upstream versions, **REMOVE IT**. The dummy layer approach means we maintain compatibility through neutral implementations, not by keeping telemetry.

---

## 6. Instructions for AI Models

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
  - ✅ **CLOSE THE JOB** with a successful merge commit, clear version bump, and post-merge verification—even if imperfect. **Imperfect closure > perfect ambiguity**.

---

## 8. Enforcement Principle: _One-Time, One-Attempt Resolution_

> **Every merge attempt is a _single-shots_ operation.**
> You get one chance to evaluate, resolve, and close. No retries, no "second attempts" unless explicitly restarted by a human.
> — If resolution fails after best-effort, _abort silently_, record failure in commit message, and raise no complaint.
> — Human review follows—_you do not escalate_. You closed the job, and it failed. That is acceptable. Delaying or hallucinating is not.
