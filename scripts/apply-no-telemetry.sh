#!/bin/bash
# apply-no-telemetry.sh
#
# Script to apply no-telemetry changes from v0.10.6-no-telemetry to a target branch
#
# Usage: ./scripts/apply-no-telemetry.sh <target-branch> [base-commit]
#
# Example:
#   ./scripts/apply-no-telemetry.sh v0.12.0-preview.0 origin/v0.12.0-preview.0
#
# This script:
# 1. Creates a new branch from the target
# 2. Cherry-picks no-telemetry commits with conflict resolution
# 3. Updates version to <target>-no-telemetry
# 4. Runs verification checks

set -e

TARGET_BRANCH="${1:-}"
BASE_COMMIT="${2:-}"

if [ -z "$TARGET_BRANCH" ]; then
    echo "Usage: $0 <target-branch> [base-commit]"
    echo ""
    echo "Example:"
    echo "  $0 v0.12.0-preview.0 origin/v0.12.0-preview.0"
    echo ""
    exit 1
fi

if [ -z "$BASE_COMMIT" ]; then
    BASE_COMMIT="origin/$TARGET_BRANCH"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

echo "=============================================="
echo "  No-Telemetry Merge Tool"
echo "=============================================="
echo ""
echo "Target branch: $TARGET_BRANCH"
echo "Base commit:   $BASE_COMMIT"
echo ""

cd "$REPO_ROOT"

# Check if we're on main or release branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && ! "$CURRENT_BRANCH" =~ ^release/ ]]; then
    echo "Warning: Currently on $CURRENT_BRANCH"
fi

# Fetch latest changes
echo "[1/6] Fetching latest changes..."
git fetch origin --no-tags

# Create and checkout new branch
NEW_BRANCH="${TARGET_BRANCH}-no-telemetry"
echo ""
echo "[2/6] Creating branch: $NEW_BRANCH"

if git rev-parse --verify "$NEW_BRANCH" >/dev/null 2>&1; then
    echo "Branch $NEW_BRANCH already exists. Aborting."
    exit 1
fi

git checkout -b "$NEW_BRANCH" "$BASE_COMMIT"
echo "Created branch: $NEW_BRANCH"

# Cherry-pick commits from v0.10.6-no-telemetry
echo ""
echo "[3/6] Cherry-picking no-telemetry commits..."

# Get the telemetry removal commit from v0.10.6-no-telemetry
TELEMETRY_COMMIT=$(git rev-parse origin/v0.10.6-no-telemetry~3)  # "chore: removed telemetry"
DOCKER_UPDATE_COMMIT=$(git rev-parse origin/v0.10.6-no-telemetry~2)  # "feat: Dockerfile to sandbox..."
RELEASE_COMMIT=$(git rev-parse origin/v0.10.6-no-telemetry)  # "chore(release): update..."

echo "Cherry-picking: $TELEMETRY_COMMIT"
if ! git cherry-pick "$TELEMETRY_COMMIT" --no-commit 2>&1 | tee /tmp/cherry-pick-1.log; then
    echo ""
    echo "Conflict detected during cherry-pick. Checking for telemetry_utils.js..."
    
    # Check if telemetry_utils.js conflict exists
    if git ls-files -u | grep -q "scripts/telemetry_utils.js"; then
        echo "  -> Found telemetry_utils.js conflict"
        git ls-files -u scripts/telemetry_utils.js
    fi
    
    echo ""
    echo "Please resolve conflicts manually, then run:"
    echo "  git add <resolved-files>"
    echo "  git commit"
    exit 1
fi

# Stage all changes and commit
git add -A
COMMIT_MSG=$(cat <<'EOF'
chore: removed telemetry

- Deleted scripts/telemetry.js, local_telemetry.js, telemetry_gcp.js, telemetry_utils.js
- Deleted packages/core/src/telemetry/
- Removed telemetry documentation (docs/developers/development/telemetry.md)
- Updated package.json to remove telemetry script
- Added install.sh for no-telemetry installation

This change removes all telemetry functionality from the codebase.
EOF
)
git commit --no-verify -m "$COMMIT_MSG

Co-authored-by: Qwen-Coder <qwen-coder@alibabacloud.com>"

echo ""
echo "Cherry-picking: $DOCKER_UPDATE_COMMIT"
if ! git cherry-pick "$DOCKER_UPDATE_COMMIT" --no-commit 2>&1 | tee /tmp/cherry-pick-2.log; then
    echo "Please resolve conflicts manually"
    exit 1
fi

git add -A
COMMIT_MSG=$(cat <<'EOF'
feat: Dockerfile to sandbox qwen and README.md update

This commit was cherry-picked from v0.10.6-no-telemetry.
EOF
)
git commit --no-verify -m "$COMMIT_MSG"

echo ""
echo "Cherry-picking: $RELEASE_COMMIT"
if ! git cherry-pick "$RELEASE_COMMIT" --no-commit 2>&1 | tee /tmp/cherry-pick-3.log; then
    echo "Please resolve conflicts manually"
    exit 1
fi

git add -A
COMMIT_MSG=$(cat <<'EOF'
chore: update to ${TARGET_BRANCH}-no-telemetry

This cherry-pick was applied to v${TARGET_BRANCH} base.
EOF
)
git commit --no-verify -m "$COMMIT_MSG"

echo ""
echo "[4/6] Updating version to ${TARGET_BRANCH}-no-telemetry..."

# Update package.json versions
if [ -f "package.json" ]; then
    # Extract current version from package.json
    CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_VERSION" ]; then
        NEW_VERSION="${TARGET_BRANCH}-no-telemetry"
        
        # Use sed to update the version - handles both quoted and unquoted versions
        if grep -q "\"version\":" package.json; then
            sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json
            echo "  Updated package.json version: $CURRENT_VERSION -> $NEW_VERSION"
        fi
        
        # Update Dockerfile QWEN_REF
        if [ -f "Dockerfile" ]; then
            sed -i.bak2 's|ARG QWEN_REF="[^"]*"|ARG QWEN_REF="'${NEW_VERSION}'"|' Dockerfile
            echo "  Updated Dockerfile QWEN_REF: $NEW_VERSION"
        fi
        
        git add package.json Dockerfile
        git commit --no-verify -m "chore: update version to ${TARGET_BRANCH}-no-telemetry"
    fi
fi

echo ""
echo "[5/6] Running verification checks..."

# Verification checklist
ERRORS=0

echo "  Checking telemetry removal..."
if ls scripts/ | grep -q telemetry; then
    echo "    ERROR: Telemetry scripts still exist in scripts/"
    ERRORS=$((ERRORS + 1))
else
    echo "    OK: No telemetry scripts in scripts/"
fi

if [ -d "packages/core/src/telemetry" ]; then
    echo "    ERROR: Telemetry directory still exists"
    ERRORS=$((ERRORS + 1))
else
    echo "    OK: Telemetry directory deleted"
fi

TELEMETRY_COUNT=$(grep -r "\"telemetry\"" package.json 2>/dev/null | wc -l || echo "0")
if [ "$TELEMETRY_COUNT" -gt 0 ]; then
    echo "    WARNING: Found $TELEMETRY_COUNT telemetry references in package.json"
else
    echo "    OK: No telemetry references in package.json"
fi

echo ""
echo "[6/6] Final summary..."
echo ""
echo "=============================================="
echo "  No-Telemetry Merge Complete!"
echo "=============================================="
echo ""
echo "Branch: $NEW_BRANCH"
echo "Commits added:"
git log --oneline origin/$TARGET_BRANCH..HEAD 2>/dev/null | grep -v "^$(git rev-parse $BASE_COMMIT)"
echo ""
echo "Verification: $ERRORS errors found"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "WARNING: Some checks failed. Please review."
    exit 1
else
    echo "SUCCESS: All checks passed!"
    echo ""
    echo "Next steps:"
    echo "  git checkout $NEW_BRANCH"
    echo "  npm test"
    echo ""
fi

# Clean up backup files
rm -f package.json.bak Dockerfile.bak2 2>/dev/null || true
