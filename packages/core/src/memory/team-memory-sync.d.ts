/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface TeamMemorySyncResult {
    committed: boolean;
    pulled: boolean;
    pushed: boolean;
    skippedReason?: 'not-a-git-repo' | 'no-upstream' | 'detached-head' | 'pull-failed' | 'push-failed' | 'local-ahead';
}
/**
 * Sync the team memory directory with the repository's remote. Best-effort and
 * never throws: any git failure is swallowed so it cannot break a session.
 *
 * Order is deliberate: fast-forward-only PULL first (reconcile), THEN commit the
 * local team path on top of upstream, THEN push. Reconciling before committing
 * keeps a two-writer branch from diverging and wedging `--ff-only`. `--ff-only`
 * never creates a merge commit or a conflict; a diverged branch is left
 * untouched and surfaced as `pull-failed`. Only the team path is staged, so
 * unrelated local changes are never committed; the push is an explicit
 * single-branch refspec gated on this sync having created the commit, so it can
 * never publish unrelated local commits. The commit is authored by `opts.author`
 * when supplied (cooperative per-user attribution on a shared daemon), otherwise
 * by the repo's configured git user.
 */
export declare function syncTeamMemory(projectRoot: string, opts: {
    message: string;
    /**
     * Cooperative per-user attribution (from the unauthenticated client
     * identity). When set, the commit is authored as `name <email>` so a
     * shared-daemon commit reflects the acting user rather than the server's
     * git identity. Omitted in the single-user case, where the repo's git
     * config already attributes correctly.
     */
    author?: {
        name: string;
        email?: string;
    };
}): Promise<TeamMemorySyncResult>;
