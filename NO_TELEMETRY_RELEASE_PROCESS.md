# No-Telemetry Release Process

This document describes the process for creating no-telemetry releases of Qwen Code.

## Branch Naming Convention

| Base Branch | No-Telemetry Branch |
|-------------|---------------------|
| `v0.10.6` | `v0.10.6-no-telemetry` |
| `v0.11.0-preview.0` | `v0.11.0-preview.0-no-telemetry` |
| `release/v0.12.0` | `v0.12.0-no-telemetry` |

**Rule:** `<target>-no-telemetry`

- For preview releases (e.g., `v0.11.0-preview.0`), use the full name
- For release branches (e.g., `release/v0.12.0`), use just the version number
- Always use the exact base branch name (including any suffixes like `-preview.0`)

---

## Quick Start Command

To create a new no-telemetry branch from any target:

```bash
# Using the helper script (recommended)
./scripts/apply-no-telemetry.sh v0.12.0-preview.0 origin/v0.12.0-preview.0

# Or manually
git checkout -b v0.12.0-preview.0-no-telemetry origin/v0.12.0-preview.0
# Then follow the cherry-pick steps below
```

---

## Manual Cherry-Pick Process

### Step 1: Create the base branch
```bash
git fetch origin
git checkout -b v0.12.0-preview.0-no-telemetry origin/v0.12.0-preview.0
```

### Step 2: Cherry-pick commits (oldest first)
```bash
# Get commit hashes from the helper script:
./scripts/find-telemetry-commits.sh

# Or manually cherry-pick in order (oldest first):
git cherry-pick 5f231e2b --no-commit  # "chore: removed telemetry"
git cherry-pick 2db810ef --no-commit  # "chore: script to apply no-telemetry patch"
git cherry-pick a1739247 --no-commit  # "feat: Dockerfile to sandbox qwen"
git cherry-pick 2d5b307b --no-commit  # "chore(release): update to v0.10.6-no-telemetry"
```

### Step 3: Resolve conflicts
Common conflict files:
- `scripts/telemetry_utils.js` - deleted in no-telemetry, modified in newer versions

```bash
# If conflict with telemetry_utils.js:
rm scripts/telemetry_utils.js
git add scripts/telemetry_utils.js

# Then continue cherry-pick
git cherry-pick --continue
```

### Step 4: Stage and commit each change
```bash
# After each cherry-pick (except the last), run:
git add -A
git commit --no-verify -m "<original-message>

Co-authored-by: Qwen-Coder <qwen-coder@alibabacloud.com>"
```

### Step 5: Update version numbers
```bash
# The release commit (last cherry-pick) should update version to <target>-no-telemetry
# Manually verify:
grep '"version"' package.json  # Should show <target>-no-telemetry
grep 'QWEN_REF=' Dockerfile   # Should show <target>-no-telemetry

# If not updated, fix it:
git add package.json Dockerfile
git commit --no-verify -m "chore: update version to v0.12.0-preview.0-no-telemetry"
```

---

## Dockerfile Template

The Dockerfile for no-telemetry branches follows this pattern:

```dockerfile
FROM docker.io/library/node:20-slim

ARG QWEN_REF="vX.Y.Z-no-telemetry"
ARG REPO_URL="https://github.com/undici77/qwen-code-no-telemetry"

ENV QWEN_REF=${QWEN_REF}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 man-db curl dnsutils less jq bc gh git unzip rsync ripgrep procps psmisc lsof socat ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set up npm global package folder
RUN mkdir -p /usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Build and install qwen-code directly from GitHub
RUN cd /tmp \
    && npm pack "${REPO_URL}#${QWEN_REF}" \
    && npm install -g /tmp/qwen-code-*.tgz \
    && npm cache clean --force \
    && rm -f /tmp/qwen-code-*.tgz

# Create default settings.json for LM Studio
RUN mkdir -p /root/.qwen && cat > /root/.qwen/settings.json << 'SETTINGS'
{
  "modelProviders": {
    "anthropic": [
      {
        "id": "qwen/qwen3-coder-30b",
        "name": "qwen/qwen3-coder-30b",
        "baseUrl": "http://host.docker.internal:1234",
        "description": "Qwen3-Coder via LM STUDIO",
        "envKey": "DASHSCOPE_API_KEY"
      }
    ]
  },
  "env": {
    "DASHSCOPE_API_KEY": "none"
  },
  "security": {
    "auth": {
      "selectedType": "anthropic"
    }
  },
  "model": {
    "name": "qwen3-coder-30b"
  },
  "$version": 3
}
SETTINGS

CMD ["qwen"]
```

**Key elements:**
- `QWEN_REF` set to `<version>-no-telemetry`
- Single-stage build (not multi-stage like mainline)
- Installs from undici77's no-telemetry repository
- Includes LM Studio configuration

---

## Verification Checklist

After creating the branch, run:

```bash
# 1. Verify version
grep '"version"' package.json

# 2. Check telemetry removal
ls scripts/ | grep -E "telemetry|local_telemetry" && echo "FAIL: telemetry scripts exist" || echo "PASS"
ls packages/core/src/telemetry 2>/dev/null && echo "FAIL: telemetry dir exists" || echo "PASS"
grep -c '"telemetry"' package.json && echo "WARNING: telemetry refs in package.json" || echo "PASS"

# 3. Verify Dockerfile
grep 'QWEN_REF=' Dockerfile | grep -v "no-telemetry" && echo "FAIL: wrong version in Dockerfile" || echo "PASS"

# 4. Run tests
npm test

# 5. Build (if applicable)
npm run build
```

---

## Troubleshooting

### Common Issues

#### 1. telemetry_utils.js conflict
```
CONFLICT (modify/delete): scripts/telemetry_utils.js deleted in X and modified in HEAD
```
**Fix:**
```bash
rm scripts/telemetry_utils.js
git add scripts/telemetry_utils.js
git cherry-pick --continue
```

#### 2. ESLint/husky pre-commit failures
```
✖ eslint --fix --max-warnings 0:
  error  'unused_var' is defined but never used
```
**Fix:** Use `--no-verify` to bypass pre-commit hooks, or fix the lint issues:
```bash
git commit --no-verify -m "<message>"
# or fix the lint issues and commit normally
```

#### 3. Multiple version references need updating
Check these files for version updates:
- `package.json` - root version field
- `packages/cli/package.json`
- `packages/core/package.json`
- `Dockerfile` - QWEN_REF argument

---

## Comparison: No-Telemetry vs Mainline

| Aspect | Mainline | No-Telemetry |
|--------|----------|--------------|
| Branch naming | `v0.12.0`, `release/v0.12.0` | `v0.12.0-no-telemetry` |
| Dockerfile | Multi-stage build (builder + runtime) | Single-stage (npm pack from GitHub) |
| Build process | `npm run build` → bundle → pack | Direct `npm pack` from repo |
| Telemetry code | Included | Removed entirely |
| Default installer | Standard npm install | `install.sh` (undici77's version) |

---

## Rollback Procedure

If issues are found after creating a no-telemetry branch:

```bash
# Delete the problematic branch
git checkout main
git branch -D v0.12.0-preview.0-no-telemetry

# Start over with the fix
git checkout -b v0.12.0-preview.0-no-telemetry origin/v0.12.0-preview.0
# Repeat the cherry-pick process...
```
