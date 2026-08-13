/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Lowercase and strip one trailing `.git`, the normal form comparison runs in. */
export function normalizeSegment(value) {
    const v = value.toLowerCase();
    return v.endsWith('.git') ? v.slice(0, -4) : v;
}
/**
 * Parse one remote URL into its host / owner / repo, or null when it is
 * neither of the two shapes `git remote -v` prints for a GitHub-style host —
 * `git@<host>:<owner>/<repo>(.git)` and `https://<host>/<owner>/<repo>(.git)`
 * — nor the `ssh://` spelling of the first. Anything else (a local path, an
 * `http` URL with extra path segments, a bundle file) is not a candidate and
 * must never match.
 */
export function parseRemoteUrl(raw) {
    const url = raw.trim();
    if (url === '')
        return null;
    let host;
    let pathPart;
    const schemeIdx = url.indexOf('://');
    if (schemeIdx !== -1) {
        // https://<host>/<owner>/<repo>(.git), ssh://git@<host>/<owner>/<repo>.git
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            return null;
        }
        if (parsed.hostname === '')
            return null;
        host = parsed.hostname;
        pathPart = parsed.pathname;
    }
    else {
        // The scp-like shape `[user@]<host>:<owner>/<repo>` — the colon must
        // come before the first slash, which is also what rejects local paths
        // (`/srv/git/x.git`, `C:\repo`) and bare names.
        const colonIdx = url.indexOf(':');
        const slashIdx = url.indexOf('/');
        if (colonIdx === -1 || slashIdx === -1 || colonIdx > slashIdx) {
            return null;
        }
        host = url.slice(0, colonIdx);
        const atIdx = host.lastIndexOf('@');
        if (atIdx !== -1)
            host = host.slice(atIdx + 1);
        pathPart = url.slice(colonIdx + 1);
    }
    const segments = pathPart
        .split('/')
        .map((s) => s.trim())
        .filter((s) => s !== '');
    if (segments.length !== 2)
        return null;
    if (host === '')
        return null;
    return {
        host: host.toLowerCase(),
        owner: normalizeSegment(segments[0]),
        repo: normalizeSegment(segments[1]),
    };
}
/**
 * Match an owner/repo/host against the raw output of `git remote -v`.
 *
 * Only `(fetch)` lines count: `fetch-pr` fetches `pull/<n>/head` through the
 * remote's fetch URL, and a remote whose push URL alone pointed at the repo
 * could not serve it. A remote appears twice (fetch and push); matching the
 * fetch lines alone also dedupes.
 */
export function matchRemotes(remoteVOutput, { owner, repo, host = 'github.com' }) {
    const wantOwner = normalizeSegment(owner);
    const wantRepo = normalizeSegment(repo);
    // A PR URL's host can carry an explicit port (parse-args' PR_URL_RE keeps
    // it, lib/gh.ts' HOSTNAME_RE accepts it), but a parsed remote host never
    // does — compare the hostname part only, or a port-bearing GHE review
    // could never match its own remote.
    const wantHost = normalizeSegment(host.replace(/:\d+$/, ''));
    const matched = [];
    for (const line of remoteVOutput.split('\n')) {
        const trimmed = line.trim();
        // A partial clone's fetch entry carries git's filter annotation AFTER
        // the marker — `<name>\t<url> (fetch) [blob:none]` — so the gate
        // cannot anchor on `(fetch)` alone or that remote is silently lost.
        if (trimmed === '' || !/\(fetch\)(\s+\[[^\]]*\])?$/.test(trimmed)) {
            continue;
        }
        // `<name>\t<url> (fetch)` plus that optional trailing annotation — the
        // name never contains whitespace, so the first run of non-space
        // characters is the name and the URL sits between it and the marker.
        const nameMatch = trimmed.match(/^(\S+)\s+(.*)\s+\(fetch\)(\s+\[[^\]]*\])?$/);
        if (!nameMatch)
            continue;
        const identity = parseRemoteUrl(nameMatch[2]);
        if (identity === null)
            continue;
        if (identity.host === wantHost &&
            identity.owner === wantOwner &&
            identity.repo === wantRepo) {
            matched.push(nameMatch[1]);
        }
    }
    return { matched };
}
//# sourceMappingURL=remote-match.js.map