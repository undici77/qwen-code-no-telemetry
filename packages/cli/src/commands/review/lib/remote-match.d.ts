/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RemoteIdentity {
    host: string;
    owner: string;
    repo: string;
}
/** Lowercase and strip one trailing `.git`, the normal form comparison runs in. */
export declare function normalizeSegment(value: string): string;
/**
 * Parse one remote URL into its host / owner / repo, or null when it is
 * neither of the two shapes `git remote -v` prints for a GitHub-style host —
 * `git@<host>:<owner>/<repo>(.git)` and `https://<host>/<owner>/<repo>(.git)`
 * — nor the `ssh://` spelling of the first. Anything else (a local path, an
 * `http` URL with extra path segments, a bundle file) is not a candidate and
 * must never match.
 */
export declare function parseRemoteUrl(raw: string): RemoteIdentity | null;
export interface RemoteMatchInput {
    owner: string;
    repo: string;
    /** Defaults to `github.com` — a PR URL's host, or github.com for bare numbers. */
    host?: string;
}
export interface RemoteMatchOutcome {
    /** Remote names whose FETCH url is an exact-segment match, in `git remote -v` order. */
    matched: string[];
}
/**
 * Match an owner/repo/host against the raw output of `git remote -v`.
 *
 * Only `(fetch)` lines count: `fetch-pr` fetches `pull/<n>/head` through the
 * remote's fetch URL, and a remote whose push URL alone pointed at the repo
 * could not serve it. A remote appears twice (fetch and push); matching the
 * fetch lines alone also dedupes.
 */
export declare function matchRemotes(remoteVOutput: string, { owner, repo, host }: RemoteMatchInput): RemoteMatchOutcome;
