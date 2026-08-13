/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const HOSTNAME_RE: RegExp;
/**
 * `owner/repo` — and neither half may be a dot segment.
 *
 * The character class alone admits `../repo`, `owner/..` and `./repo`: `.`
 * and `..` are made of legal characters and mean something else entirely
 * once they reach a URL path. One home for the rule — submit's --repo
 * check and compose-review's plan identity both build API/anchor URLs
 * from it, and a hardening that lands in only one of them leaves the
 * other URL-building site on the stale rule.
 */
export declare function isOwnerRepo(repo: string): boolean;
/**
 * Route every subsequent `gh` invocation in this process at a GitHub host
 * other than github.com (GitHub Enterprise). The subcommands thread their
 * `--host` option here before making any call, so host targeting is code,
 * not a prose instruction the orchestrating model must remember per call —
 * a dropped host silently reads from and posts to github.com's same-named
 * `owner/repo`.
 *
 * `undefined` (or `''`) restores the default: the child then inherits the
 * parent env untouched, so an operator-exported GH_HOST stays in effect.
 */
export declare function setGhHost(host: string | undefined): void;
/**
 * The host `gh` calls are currently routed at, or `undefined` for the
 * default (github.com / an operator-exported GH_HOST). Lets a caller that
 * overrides the host for a scoped block save and restore the prior value
 * instead of leaking the override into module state.
 */
export declare function getGhHost(): string | undefined;
/**
 * The effective GitHub host for a command invocation: an explicit `--host`
 * flag wins, else an operator-exported GH_HOST, else `undefined` — the
 * caller applies its own default (`gh`'s github.com, or the matcher's
 * comparison host). Every call site that needs the effective host as a
 * value — the matcher and the two write-side authorisation gates —
 * resolves through this one helper so they cannot disagree; routing
 * sites go through `setGhHost` and inherit an operator-exported GH_HOST
 * via the child env.
 *
 * `|| undefined`, not `??`: an exported-but-empty GH_HOST ("" survives
 * `??`, being non-nullish) must read as "no host", not as a host named ""
 * that fails every comparison.
 */
export declare function resolveGhHost(flagHost: string | undefined): string | undefined;
/**
 * Environment for `gh` child processes. `undefined` means "inherit the
 * parent env untouched"; with a host set, the inherited env is extended
 * with GH_HOST, which `gh` honours on every command.
 */
export declare function ghEnv(): NodeJS.ProcessEnv | undefined;
/**
 * Run `gh` with args. Returns stdout, trimmed and CRLF-normalised.
 * Retries automatically on transient GitHub errors (HTTP 5xx).
 *
 * `maxBuffer` is raised well past Node's 1 MiB default: paginated fetches
 * on comment-heavy PRs routinely exceed it, and the resulting ENOBUFS kills
 * the subcommand mid-review (observed twice on a 43-file PR whose comments
 * crossed the megabyte). 64 MiB is far above any real PR payload while
 * still bounding a runaway response.
 */
export declare function gh(...args: string[]): string;
/**
 * Run `gh` with `input` on its stdin, WITH the same transient-error retry as
 * `gh()` — for callers whose input-carrying writes are idempotent
 * (publish-assets: content-hashed PUTs, a ref create whose duplicate is
 * caught). Non-idempotent writes use `ghWithInput` below.
 */
export declare function ghWithInputRetried(input: string, ...args: string[]): string;
/**
 * Run `gh` with `input` on its stdin. Returns stdout, trimmed.
 *
 * Unlike `gh()`, this does NOT retry on transient errors: `submit.ts` POSTs
 * a review, which is not idempotent — a retry after a proxy-level 502/503
 * could duplicate the review if GitHub already processed the original
 * request. A caller whose input-carrying write IS idempotent (publish-assets:
 * content-hashed PUTs, a ref create whose duplicate is caught) uses
 * `ghWithInputRetried` above, which shares `gh()`'s transient-error retry.
 *
 * Exists so a caller can send bytes it already holds in memory instead of a
 * pathname `gh` would re-open. Passing `--input <file>` re-reads the file at
 * call time, so a swap or truncation between validating that file and posting it
 * sends GitHub something other than what passed validation — a review the author
 * did not write, or a 422. Sending the validated bytes over stdin (`--input -`)
 * closes that window: the bytes checked are the bytes posted.
 */
export declare function ghWithInput(input: string, ...args: string[]): string;
/**
 * Run `gh api <path>` (optionally with `--jq <expr>`) and JSON-parse the
 * result. Returns null when the response is empty (e.g. 204 / no content).
 */
export declare function ghApi(path: string, jq?: string): unknown;
/**
 * Run `gh api --paginate <path>` and JSON-parse the merged result.
 *
 * Use this for endpoints that return arrays and may have more than 30
 * (the default `per_page`) entries — PR `/comments`, `/issues/{n}/comments`,
 * `/reviews`, etc.
 *
 * **Why a single `JSON.parse` is correct on multi-page output (a recurring
 * review question):** for a TOP-LEVEL JSON array `gh --paginate` MERGES the
 * pages into one array — it does NOT emit one array per page. So the output
 * is a single well-formed array and `JSON.parse` recovers the full set. The
 * per-page-concatenation failure mode (`}{` / `][` between pages that would
 * throw) only happens for endpoints whose array is NESTED under a key (e.g.
 * `check-runs`), and those go through {@link ghApiAllNested} with
 * `--jq '.<key>[]'` + NDJSON parsing precisely because `--paginate` can't
 * merge them. Verified empirically on a 4-page (`per_page=30`, 97-comment)
 * `pulls/{n}/comments` response: zero `][` markers, one array, clean parse.
 *
 * Returns `[]` for empty responses or non-array payloads (defensive — the
 * endpoint may legitimately return an object on a 4xx-style 200, e.g. an
 * error envelope).
 */
export declare function ghApiAll(path: string): unknown[];
/**
 * Paginate an endpoint whose array is nested under a key, e.g.
 * `check-runs` → `{ total_count, check_runs: [...] }`.
 *
 * A plain `ghApiAll` cannot be used here: `--paginate` alone concatenates the
 * raw per-page objects, so `JSON.parse` sees `}{ ` between pages and throws. On
 * a commit with more than 30 check runs (a busy CI matrix — one real head had
 * 508) the un-paginated call silently saw only the first page, which could hide
 * a failing or skipped run behind the cut and let a review approve past it.
 *
 * `--paginate --jq '.<key>[]'` applies the jq to every page and streams each
 * element as a newline-delimited JSON value (NDJSON), so the result is parsed
 * line by line rather than as one array. (`gh api` has no `--slurp`.)
 *
 * `strict` parsing here: a check-runs snapshot feeds CI classification, and
 * dropping a malformed line could hide a *failing* run — the same fail-open the
 * pagination fix closed, reintroduced by lenient parsing. A parse failure
 * throws.
 */
export declare function ghApiAllNested(path: string, key: string): unknown[];
/**
 * Parse the newline-delimited JSON that `gh --paginate --jq '.x[]'` streams:
 * one JSON value per non-blank line. Split out and exported so the parse is
 * unit-testable without spawning `gh` (the spawn is covered by the commands'
 * own runs, per this module's testing note above).
 *
 * `strict` (default) throws on any non-JSON line — correct when a dropped
 * record would change a safety-relevant answer (e.g. hiding a failing check
 * run). Non-strict skips a stray line, for the rare caller that genuinely
 * expects interleaved human-readable notices and can tolerate a lost record.
 */
export declare function parseNdjson(out: string, opts?: {
    strict?: boolean;
}): unknown[];
/** Login of the currently authenticated GitHub user. */
export declare function currentUser(): string;
/**
 * Verify `gh` is installed and authenticated. Throws a clear error if not —
 * subcommands call this first so missing-auth failures don't show up as
 * cryptic 401s mid-run.
 *
 * Retries once after a short delay: the OS keyring can transiently fail to
 * unlock (observed on macOS when the keyring prompt races with process
 * startup), and a single retry avoids a spurious "not authenticated" abort
 * that forces the orchestrating model to debug and re-run the subcommand.
 */
export declare function ensureAuthenticated(): void;
