/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Default capacity of the audit ring. Mirrors the pre-F3
 * `MAX_RESOLVED_PERMISSION_RECORDS` (512); each row is small (≤1KB
 * with field names + UUID + decision reason) so 512 entries stays
 * well under 100 KB. Operators can override at construction time.
 */
export const DEFAULT_PERMISSION_AUDIT_RING_SIZE = 512;
function takeLast(arr, limit, methodName) {
    if (limit === undefined)
        return arr.slice();
    if (!Number.isInteger(limit) || limit < 0) {
        throw new Error(`${methodName} limit must be a non-negative integer; got ${String(limit)}`);
    }
    return arr.slice(Math.max(0, arr.length - limit));
}
/**
 * Bounded ring buffer for permission audit entries. Operates as a
 * FIFO: when the ring is full, the oldest entry is evicted to make
 * room for the newest. Two consumers:
 *   1. `PermissionAuditPublisher` writes via `push()`.
 *   2. (future) `GET /workspace/permission/audit` reads via
 *      `snapshot(limit?)` / `snapshotForSession(sessionId, limit?)`.
 */
export class PermissionAuditRing {
    buf = [];
    cap;
    constructor(capacity = DEFAULT_PERMISSION_AUDIT_RING_SIZE) {
        if (!Number.isInteger(capacity) || capacity < 1) {
            throw new Error(`PermissionAuditRing capacity must be a positive integer; got ${String(capacity)}`);
        }
        this.cap = capacity;
    }
    push(entry) {
        this.buf.push(entry);
        while (this.buf.length > this.cap)
            this.buf.shift();
    }
    /** Snapshot the most-recent `limit` entries (or all if omitted). */
    snapshot(limit) {
        return takeLast(this.buf, limit, 'PermissionAuditRing.snapshot');
    }
    /** Subset filtered by sessionId. */
    snapshotForSession(sessionId, limit) {
        return takeLast(this.buf.filter((e) => e.sessionId === sessionId), limit, 'PermissionAuditRing.snapshotForSession');
    }
    /** Current entry count (≤ capacity). For diagnostics. */
    get size() {
        return this.buf.length;
    }
    /** Configured capacity. */
    get capacity() {
        return this.cap;
    }
}
/**
 * Build a `PermissionAuditPublisher` whose 5 `record*` methods push
 * a typed `PermissionAuditEntry` into the supplied ring.
 *
 * Modeled on `createAuditPublisher` in
 * `packages/cli/src/serve/fs/audit.ts:237` — same DI shape (single
 * deps object), same Omit-hidden internal fields synthesis, but
 * writes to a ring rather than the SSE bus.
 *
 * The optional `now` allows tests to inject a deterministic
 * wallclock; production passes `() => Date.now()`.
 */
export function createPermissionAuditPublisher(deps) {
    const { ring } = deps;
    const now = deps.now ?? (() => Date.now());
    return {
        recordRequested(record, policy, votersAtIssue) {
            ring.push({
                kind: 'permission.requested',
                recordedAtMs: now(),
                requestId: record.requestId,
                sessionId: record.sessionId,
                originatorClientId: record.originatorClientId,
                policy,
                votersAtIssue: Array.from(votersAtIssue),
                issuedAtMs: record.issuedAtMs,
                allowedOptionIds: Array.from(record.allowedOptionIds),
            });
        },
        recordVoted(record, vote, outcome) {
            ring.push({
                kind: 'permission.voted',
                recordedAtMs: now(),
                requestId: record.requestId,
                sessionId: record.sessionId,
                clientId: vote.clientId,
                optionId: vote.optionId,
                fromLoopback: vote.fromLoopback,
                receivedAtMs: vote.receivedAtMs,
                outcome,
            });
        },
        recordForbidden(record, vote, reason) {
            ring.push({
                kind: 'permission.forbidden',
                recordedAtMs: now(),
                requestId: record.requestId,
                sessionId: record.sessionId,
                clientId: vote.clientId,
                optionId: vote.optionId,
                fromLoopback: vote.fromLoopback,
                reason,
            });
        },
        recordResolved(record, resolution, decisionReason) {
            ring.push({
                kind: 'permission.resolved',
                recordedAtMs: now(),
                requestId: record.requestId,
                sessionId: record.sessionId,
                resolution,
                decisionReason,
            });
        },
        recordTimeout(record) {
            ring.push({
                kind: 'permission.timeout',
                recordedAtMs: now(),
                requestId: record.requestId,
                sessionId: record.sessionId,
                issuedAtMs: record.issuedAtMs,
            });
        },
    };
}
//# sourceMappingURL=permission-audit.js.map