#!/bin/bash

# Script to cherry-pick the no-telemetry commit from v0.11.1-no-telemetry branch
# Usage: ./cherry-pick-no-telemetry.sh <commit-hash>
#
# If no commit hash is provided, it uses the latest from this branch.
# This makes it easy to port no-telemetry changes to new versions.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Default to the no-telemetry commit in this branch
DEFAULT_COMMIT="c87a15bbfe5a3ab8e5994a0193e9462334723dda"

COMMIT_HASH="${1:-$DEFAULT_COMMIT}"

echo "=== Cherry-pick No-Telemetry Commit ==="
echo ""
echo "Target commit: $COMMIT_HASH"
echo ""

# Verify the commit exists
if ! git rev-parse "$COMMIT_HASH" >/dev/null 2>&1; then
    echo "ERROR: Commit $COMMIT_HASH not found!"
    echo ""
    echo "Available no-telemetry commits:"
    git log --oneline | grep -i "no-telemetry" || echo "(none found)"
    exit 1
fi

echo "Running: git cherry-pick $COMMIT_HASH"
git cherry-pick "$COMMIT_HASH"

echo ""
echo "=== Cherry-pick complete! ==="
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff HEAD~1"
echo "2. If needed, fix any conflicts manually"
echo "3. Run tests: npm test"
echo "4. Build: npm run build"
