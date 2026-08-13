/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface WriteAuthorizationRequest {
    /**
     * The skill may pass this only after the user asked, in a message they typed
     * this session, for this review to be published.
     */
    userAuthorized: boolean;
    /**
     * Test seam only (there is no session id under vitest). Ignored whenever a
     * session id is present — honouring a caller-supplied path in a real run
     * would hand the gate back the model-writable file the design removed.
     */
    skillArgs?: string;
    /** The pull request this write targets. */
    pr: number;
    /**
     * The `owner/repo` the PR under review lives in, when the caller knows it.
     *
     * Optional because the two callers know different things. `submit` writes TO
     * the pull request, so it always knows (and must bind) the repo it is
     * posting to. `publish-assets` writes to the user-designated assets repo on
     * BEHALF of a PR — the destination is consented to by the designation
     * itself, and the reviewed repo is not among its inputs. Binding the
     * URL-shaped authorisation against the assets repo was the bug this field's
     * optionality fixes: a fork-hosted assets repo plus a URL target refused a
     * legitimately authorised run. When absent, the gate binds the PR number
     * (and host) alone.
     */
    repo?: string;
    /**
     * The EFFECTIVE host of the write — where the gh calls will actually route,
     * including an operator-exported GH_HOST the caller resolved. Absent means
     * github.com, and the gate compares against that default rather than
     * skipping the check: a URL-shaped authorisation recorded for an Enterprise
     * host must not admit a write routed at github.com merely because the
     * caller omitted --host — and vice versa. (The asymmetric `req.host &&`
     * guard this replaces bound the host in one direction only; caught by this
     * skill's own review.)
     */
    host?: string;
}
/**
 * Exactly two things authorise a public write, and both are facts rather than
 * impressions: `--comment` in the arguments the user typed (re-parsed from the
 * CLI's verbatim record), or `--user-authorized`. Authorisation is for a
 * *target*, not a mood: the recorded arguments must name the same pull request
 * (and, for a URL target, the same repo and host) as the write being attempted.
 */
export declare function reviewWriteAuthorization(req: WriteAuthorizationRequest): {
    ok: boolean;
    why: string;
};
