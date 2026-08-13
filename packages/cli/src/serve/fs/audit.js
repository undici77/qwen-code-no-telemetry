/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { EVENT_SCHEMA_VERSION, } from '@qwen-code/acp-bridge/eventBus';
/**
 * Frame type for successful filesystem operations on the boundary.
 * Emitted from the orchestrator on the success path of `readText`,
 * `readBytes`, `list`, `glob`, `stat`, `writeText`, `edit`. PR 19/20
 * SSE consumers can fan it out to subscribed clients; PR 18 itself
 * has no consumer beyond unit tests, since no HTTP routes use the
 * boundary yet.
 */
export const FS_ACCESS_EVENT_TYPE = 'fs.access';
/**
 * Frame type for boundary policy denials. Emitted whenever an
 * `FsError` propagates from the orchestrator. Always emitted, even
 * for transient ones that the route handler will surface to the
 * caller — the audit trail is the operator's tool, separate from
 * the client-visible response.
 */
export const FS_DENIED_EVENT_TYPE = 'fs.denied';
// Why the request types `Omit` four fields and pass `pattern`
// through:
//
// `recordAccess` / `recordDenied` callers describe the event in
// domain terms (intent, durationMs, errorKind, ...); the publisher
// synthesizes the wire-shaped fields the schema needs: `kind`,
// `pathHash`, `relPath`, and `route`. Hiding those fields behind
// `Omit` prevents callers from fabricating values that do not match
// what the publisher serializes.
//
// `pattern` is the one optional field that survives the Omit: only
// the orchestrator's glob path knows the literal pattern, and the
// publisher cannot synthesize it from anything else.
/**
 * SHA-256 over the canonical absolute path, truncated to 16 hex
 * chars. The truncation matches claude-code's privacy model: long
 * enough to be unique within a workspace, short enough that an
 * audit log is human-scannable. Full hex (64 chars) buys nothing
 * here because the audit consumer never reverses the hash.
 */
function hashPath(absolute) {
    return createHash('sha256').update(absolute).digest('hex').slice(0, 16);
}
/**
 * Sentinel returned when `path.relative` produces an absolute
 * path — happens on Windows when the input is on a different
 * drive than `boundWorkspace`. Without this guard, audit
 * consumers (even in raw-paths mode) would see something that
 * looks like a valid relative path but is actually a fully
 * qualified `D:\evil\...` leaking the attacker's drive letter +
 * directory structure. The sentinel lets a UI render
 * cross-drive denials distinctly without ambiguity over what's
 * relative vs absolute.
 */
const CROSS_DRIVE_RELPATH = '<cross-drive>';
/**
 * Compute the workspace-relative form of a path for the optional
 * `relPath` audit field. Returns the trailing path even when the
 * input lies outside `boundWorkspace` (the `denied` case): the
 * audit consumer wants to see what the caller asked for, not be
 * silently dropped.
 *
 * On Windows, `path.relative` between paths on different drives
 * (`C:\\ws` vs `D:\\evil`) can't produce a relative form and
 * returns the absolute target — leaking the off-drive path into
 * the audit row. We detect that with `path.isAbsolute` on the
 * *result* and substitute `CROSS_DRIVE_RELPATH` so the field
 * stays a true relative-or-sentinel and the cross-drive case is
 * still visible (just not the absolute path content).
 */
function relForAudit(raw, boundWorkspace) {
    // For absolute inputs, compute relative; for relative, pass through.
    // Either way the operator gets a workspace-anchored view.
    const rel = path.isAbsolute(raw) ? path.relative(boundWorkspace, raw) : raw;
    return path.isAbsolute(rel) ? CROSS_DRIVE_RELPATH : rel;
}
/**
 * Whether the env opt-in for raw paths is active. Read once per
 * factory invocation rather than per emit, so flipping the env
 * mid-process needs a daemon restart — predictable behavior for
 * operators tailing logs.
 */
function rawPathsEnabled() {
    return process.env['QWEN_AUDIT_RAW_PATHS'] === '1';
}
/**
 * Build an `AuditPublisher` whose emit method publishes typed
 * `BridgeEvent`s onto the daemon's per-session NDJSON stream. The
 * publisher takes care of:
 *
 * - hashing the path (always)
 * - computing relative path (only when `includeRawPaths` is on)
 * - synthesizing the `BridgeEvent.type` discriminator
 * - forwarding `originatorClientId` so the SSE fan-out can suppress
 *   self-echoes
 *
 * Publishers are cheap to construct and intended to live on a
 * `WorkspaceFileSystemFactory` for the daemon's process lifetime.
 */
export function createAuditPublisher(deps) {
    const includeRawPaths = deps.includeRawPaths ?? rawPathsEnabled();
    const { emit, boundWorkspace } = deps;
    return {
        recordAccess(ctx, record) {
            const absolute = String(record.absolute);
            const payload = {
                kind: FS_ACCESS_EVENT_TYPE,
                intent: record.intent,
                route: ctx.route,
                pathHash: hashPath(absolute),
                durationMs: record.durationMs,
            };
            if (ctx.sessionId)
                payload.sessionId = ctx.sessionId;
            if (record.sizeBytes !== undefined)
                payload.sizeBytes = record.sizeBytes;
            if (record.truncated)
                payload.truncated = true;
            if (record.matchedIgnore)
                payload.matchedIgnore = record.matchedIgnore;
            // `pattern` shares the same privacy gate as `relPath` and
            // `message`. Glob patterns commonly embed workspace-relative
            // or absolute path fragments (`src/secrets/*.env`,
            // `/Users/alice/ws/**`), so emitting the literal pattern in
            // privacy mode would bypass the same redaction the other
            // path-bearing fields honor. Operators wanting full forensic
            // context opt in via `QWEN_AUDIT_RAW_PATHS=1`.
            if (record.pattern !== undefined && includeRawPaths) {
                payload.pattern = record.pattern;
            }
            if (includeRawPaths) {
                payload.relPath = relForAudit(absolute, boundWorkspace);
            }
            emit({
                v: EVENT_SCHEMA_VERSION,
                type: FS_ACCESS_EVENT_TYPE,
                data: payload,
                originatorClientId: ctx.originatorClientId,
            });
        },
        recordDenied(ctx, record) {
            const probe = path.isAbsolute(record.input)
                ? record.input
                : path.resolve(boundWorkspace, record.input);
            const payload = {
                kind: FS_DENIED_EVENT_TYPE,
                intent: record.intent,
                route: ctx.route,
                pathHash: hashPath(probe),
                errorKind: record.errorKind,
            };
            if (ctx.sessionId)
                payload.sessionId = ctx.sessionId;
            if (record.hint)
                payload.hint = record.hint;
            // `message` carries the underlying `FsError.message`, which
            // many throw-sites embed `${p}` (absolute workspace path) or
            // user-supplied `oldText` snippets into. Privacy-mode
            // deployments that intentionally disabled raw-path logging
            // would otherwise see those paths leak through the message.
            // Gate the field on `includeRawPaths` so privacy mode means
            // privacy mode for ALL path-bearing audit content (relPath
            // AND message). Operators who want full forensic context
            // opt in via `QWEN_AUDIT_RAW_PATHS=1`.
            if (record.message && includeRawPaths) {
                payload.message = record.message;
            }
            // Same privacy gate as the success-path `pattern` above
            // (and as `relPath` / `message` here). Reject-pattern denials
            // (`../**`, `/etc/**`) are themselves path content; emitting
            // them in privacy mode would let the audit log echo exactly
            // what the operator opted out of seeing.
            if (record.pattern !== undefined && includeRawPaths) {
                payload.pattern = record.pattern;
            }
            if (includeRawPaths) {
                payload.relPath = relForAudit(record.input, boundWorkspace);
            }
            emit({
                v: EVENT_SCHEMA_VERSION,
                type: FS_DENIED_EVENT_TYPE,
                data: payload,
                originatorClientId: ctx.originatorClientId,
            });
        },
    };
}
//# sourceMappingURL=audit.js.map