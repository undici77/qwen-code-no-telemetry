#!/bin/bash

set -euo pipefail

# Check for input argument
if [[ -z "${1:-}" ]]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v0.10.6"
    exit 1
fi

INPUT_VER="$1"

# 1. Normalize Variables
# Determine if input is 'v0.10.6' or 'release/v0.10.6'
if [[ "${INPUT_VER}" == release/* ]]; then
    RELEASE_BRANCH="${INPUT_VER}"
    VERSION_TAG="${INPUT_VER#release/}"
else
    RELEASE_BRANCH="release/${INPUT_VER}"
    VERSION_TAG="${INPUT_VER}"
fi

NEW_NOTELEM_BRANCH="${RELEASE_BRANCH}-no-telemetry"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Guess the previous base version by stripping the suffix
PREV_BASE_GUESS="${CURRENT_BRANCH%-no-telemetry}"

echo "=========================================="
echo "  Source (Old)  : ${CURRENT_BRANCH}"
echo "  Old Base      : ${PREV_BASE_GUESS}"
echo "  Upstream New  : ${RELEASE_BRANCH}"
echo "  Target Branch : ${NEW_NOTELEM_BRANCH}"
echo "=========================================="

# 2. Preliminary Checks
# Ensure we are currently on a *-no-telemetry branch
[[ "${CURRENT_BRANCH}" == *-no-telemetry ]] \
    || { echo "✗ Error: You must be on the previous *-no-telemetry branch to run this script."; exit 1; }

# Ensure working directory is clean
git diff --quiet && git diff --cached --quiet \
    || { echo "✗ Error: Working tree is not clean. Please commit or stash changes."; exit 1; }

# Verify the old base exists (to calculate which commits are yours)
if ! git rev-parse "${PREV_BASE_GUESS}" >/dev/null 2>&1; then
    echo "✗ Error: Could not find the previous base tag/branch: '${PREV_BASE_GUESS}'"
    echo "  Make sure you have run 'git fetch --all --tags'"
    exit 1
fi

# 3. Update Upstream
echo "➜ Fetching upstream..."
git fetch upstream --tags

# 4. Create/Reset the Clean Official Branch
# We use -B to force reset if the branch already exists locally
echo "➜ Aligning local '${RELEASE_BRANCH}' with upstream..."
git checkout -B "${RELEASE_BRANCH}" "upstream/${RELEASE_BRANCH}"

echo "✓ Clean branch '${RELEASE_BRANCH}' updated."
# Optional: Push the clean branch to origin
# git push origin "${RELEASE_BRANCH}"

# 5. Create the New No-Telemetry Branch
echo "➜ Preparing new branch '${NEW_NOTELEM_BRANCH}'..."

# Go back to the old branch to grab the state
git checkout "${CURRENT_BRANCH}"

# Create (or overwrite with -B) the new branch, initially pointing to the OLD state.
# We do this so Git knows where the commits are coming from before we move them.
git checkout -B "${NEW_NOTELEM_BRANCH}"

echo "➜ Replaying patches from ${PREV_BASE_GUESS} onto new base ${RELEASE_BRANCH}..."

# REBASE STRATEGY:
# Take commits between PREV_BASE_GUESS and HEAD (the current branch)
# and apply them on top of 'upstream/release/v0.10.6'.
if git rebase --onto "upstream/${RELEASE_BRANCH}" "${PREV_BASE_GUESS}" "${NEW_NOTELEM_BRANCH}"; then
    echo ""
    echo "✓ Success! You are now on branch: ${NEW_NOTELEM_BRANCH}"
    echo "  Your custom changes have been applied on top of version ${VERSION_TAG}."
    echo ""
    read -r -p "Do you want to push to origin? [y/N] " confirm
    if [[ "${confirm}" =~ ^[Yy]$ ]]; then
        # Force push is required because we rewrote history for this branch name
        git push -f origin "${NEW_NOTELEM_BRANCH}"
        
        # Uncomment below if you also want to push the clean release branch
        # git push origin "${RELEASE_BRANCH}"
    else
        echo "  Manual push command: git push -f origin ${NEW_NOTELEM_BRANCH}"
    fi
else
    echo ""
    echo "⚠ CONFLICTS DETECTED"
    echo "  Git could not automatically apply your patches to the new version."
    echo "  1. Resolve conflicts in your editor."
    echo "  2. Run 'git add <file>'"
    echo "  3. Run 'git rebase --continue'"
    exit 1
fi