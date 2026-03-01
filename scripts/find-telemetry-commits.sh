#!/bin/bash
# find-telemetry-commits.sh
#
# Find commits in v0.10.6-no-telemetry branch that remove telemetry
# Usage: ./scripts/find-telemetry-commits.sh [base-branch]
#
# Outputs the commit hashes and messages for no-telemetry changes
#

TARGET_BRANCH="${1:-v0.10.6}"

echo "Finding telemetry-removal commits from v0.10.6-no-telemetry onto $TARGET_BRANCH"
echo ""

# Get the no-telemetry branch
NO_TELEMETRY_BRANCH="origin/v0.10.6-no-telemetry"

# Check if branch exists
if ! git rev-parse --verify "$NO_TELEMETRY_BRANCH" >/dev/null 2>&1; then
    echo "Error: Branch $NO_TELEMETRY_BRANCH not found"
    echo "Please run: git fetch origin v0.10.6-no-telemetry"
    exit 1
fi

# Get the base commit of v0.10.6-no-telemetry (the release/v0.10.6 commit it's based on)
BASE_COMMIT=$(git merge-base origin/release/v0.10.6 "$NO_TELEMETRY_BRANCH")
echo "Base commit (v0.10.6): $BASE_COMMIT"
echo ""

# List all commits in v0.10.6-no-telemetry that are not in the base
echo "No-Telemetry Commits (in chronological order):"
echo "=============================================="
git log --oneline "$BASE_COMMIT".."$NO_TELEMETRY_BRANCH" | nl

echo ""
echo "Commit Hashes for cherry-pick:"
echo "=============================================="
git log --format="%H" "$BASE_COMMIT".."$NO_TELEMETRY_BRANCH" | tac | while read hash; do
    msg=$(git log --format="%s" -1 "$hash")
    echo "  $hash  - $msg"
done

echo ""
echo "Suggested cherry-pick order (oldest first):"
echo "=============================================="
git log --format="%h" "$BASE_COMMIT".."$NO_TELEMETRY_BRANCH" | tail -4 | nl -v 1

echo ""
echo "To cherry-pick these commits manually:"
echo "=============================================="
echo "# Starting from your target branch (e.g., v0.12.0-preview.0):"
echo "git checkout -b <target>-no-telemetry origin/<target>"
echo ""
echo "# Cherry-pick each commit (oldest first):"
i=1
git log --format="%H" "$BASE_COMMIT".."$NO_TELEMETRY_BRANCH" | tac | while read hash; do
    echo "  git cherry-pick $hash --no-commit  # Commit $i"
    i=$((i+1))
done

echo ""
echo "After all cherry-picks, stage and commit:"
echo "  git add -A"
echo "  git commit --no-verify -m \"chore: update to <target>-no-telemetry\""
