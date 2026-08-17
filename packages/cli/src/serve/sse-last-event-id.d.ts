/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Parse a `Last-Event-ID` header into a bus event id for the ACP `GET /acp`
 * SSE surface.
 *
 * NOTE: the REST `GET /session/:id/events` surface still has its own copy in
 * `server/request-helpers.ts` (the two implement the same accept/reject rule).
 * Unifying them onto this util is a worthwhile cleanup but is deliberately
 * deferred: it would change the REST surface, and this PR keeps REST untouched
 * (no behavioural side effects). Tracked as a follow-up.
 *
 * Stricter than `Number.parseInt`: accept ONLY pure decimal digits (so
 * "1abc" / "1.5" don't silently parse to 1) and reject values past
 * `Number.MAX_SAFE_INTEGER` (the EventBus's monotonic ids are bounded by it).
 * Returns `undefined` for missing/invalid headers ⇒ live-only subscription.
 * Rejections are logged with the offending value for operators; the common
 * "first connect, no resume" case (missing/empty header) is silent.
 *
 * @param logPrefix distinguishes the surface in logs, e.g. `'/acp '` vs `''`.
 */
export declare function parseLastEventId(
  raw: unknown,
  logPrefix?: string,
): number | undefined;
/**
 * Parse an `X-Qwen-Event-Epoch` request header into an epoch token for the
 * EventBus stale-cursor detection (DAEMON-001). Shared by the REST
 * `GET /session/:id/events` surface and the ACP `GET /acp` surface — a
 * single implementation on purpose, to avoid re-growing the
 * `parseLastEventId` dual-copy problem noted above.
 *
 * Accepts only non-empty `[A-Za-z0-9_-]` strings of length ≤ 64 (the daemon
 * emits `randomUUID()` tokens; the bound guards against log/header abuse).
 * Invalid values are treated as "not provided" (the bus falls back to the
 * numeric heuristic) and logged for operators; a missing header is silent.
 *
 * @param logPrefix distinguishes the surface in logs, e.g. `'/acp '` vs `''`.
 */
export declare function parseEventEpochHeader(
  raw: unknown,
  logPrefix?: string,
): string | undefined;
