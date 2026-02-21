#!/bin/bash

set -euo pipefail

if [[ -z "${1:-}" ]]; then
    echo "Usage: $0 <new-upstream-tag>"
    echo "Example: $0 v0.10.6"
    exit 1
fi

NEW_TAG="$1"
NEW_BRANCH="${NEW_TAG}-no-telemetry"

# Derive previous base tag from current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
PREV_BASE_TAG="${CURRENT_BRANCH%-no-telemetry}"

echo "=========================================="
echo "  Previous : ${CURRENT_BRANCH}"
echo "  New      : ${NEW_BRANCH}"
echo "=========================================="

# Sanity checks
[[ "${CURRENT_BRANCH}" == *-no-telemetry ]] \
    || { echo "✗ Current branch '${CURRENT_BRANCH}' is not a *-no-telemetry branch"; exit 1; }

git rev-parse "${NEW_TAG}" >/dev/null 2>&1 \
    || { echo "✗ Tag '${NEW_TAG}' not found — run: git fetch upstream --tags"; exit 1; }

git diff --quiet && git diff --cached --quiet \
    || { echo "✗ Working tree is not clean"; exit 1; }

echo ""
echo "Commits to replay:"
git log "${PREV_BASE_TAG}..${CURRENT_BRANCH}" --oneline
echo ""

# Create new branch from new tag and replay no-telemetry commits
git checkout -b "${NEW_BRANCH}" "${NEW_TAG}"

if git rebase --onto HEAD "${PREV_BASE_TAG}" "${CURRENT_BRANCH}"; then
    git tag "${NEW_BRANCH}"
    echo ""
    echo "✓ Done! ${NEW_BRANCH} is ready."
    echo ""
    read -r -p "Push to origin? [y/N] " confirm
    [[ "${confirm}" =~ ^[Yy]$ ]] && git push origin "${NEW_BRANCH}" --tags \
        || echo "  Run manually: git push origin ${NEW_BRANCH} --tags"
else
    echo ""
    echo "⚠ Conflicts detected — resolve them, then:"
    echo "   git rebase --continue"
    echo "   git tag ${NEW_BRANCH}"
    echo "   git push origin ${NEW_BRANCH} --tags"
    exit 1
fi
