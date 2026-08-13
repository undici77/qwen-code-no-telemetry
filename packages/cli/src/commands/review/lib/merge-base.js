/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Resolve the merge-base of a PR head and its base branch.
 *
 * The remote-tracking ref (`origin/main`) is preferred because a CI checkout
 * has no local base branch; the local ref is the fallback for a developer who
 * has one but is offline. Null means neither resolved, and the caller degrades
 * to a diff-less report rather than failing the whole review.
 */
export function resolveMergeBase(remote, baseRefName, headRef, git) {
    const baseFetchFailed = !git.fetch(remote, baseRefName);
    for (const candidate of [`${remote}/${baseRefName}`, baseRefName]) {
        if (!git.refExists(candidate))
            continue;
        const mb = git.mergeBase(candidate, headRef);
        if (mb)
            return { sha: mb, baseFetchFailed };
    }
    return { sha: null, baseFetchFailed };
}
//# sourceMappingURL=merge-base.js.map