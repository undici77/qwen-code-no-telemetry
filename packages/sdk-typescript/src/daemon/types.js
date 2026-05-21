/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Thrown by `requireWorkspaceCwd` (and any future
 * `requireCapability` helpers) when the daemon's
 * `/capabilities` envelope is missing a field the caller needs.
 * Carries the field name so handlers can branch on it.
 */
export class DaemonCapabilityMissingError extends Error {
    capability;
    constructor(capability, hint) {
        super(`DaemonCapabilities.${capability} is missing — ${hint}. The daemon ` +
            `you are connected to likely predates the feature that added ` +
            `this field; upgrade the daemon or fall back to a different ` +
            `code path that doesn't require it.`);
        this.name = 'DaemonCapabilityMissingError';
        this.capability = capability;
    }
}
/**
 * Assert that `caps.workspaceCwd` is populated (i.e. the daemon was
 * built post-§02) and return it as a non-undefined `string`. Throws
 * `DaemonCapabilityMissingError` otherwise so the call site gets an
 * actionable error rather than a downstream
 * `Cannot read properties of undefined`.
 *
 * Use this when you need the value as a guaranteed `string` —
 * e.g. to render in UI, log, compare with `.startsWith()`, or pass
 * into a function typed `string`. If your code is fine with the
 * value being absent (e.g. you fall back to `POST /session` without
 * `workspaceCwd` and let the daemon choose), just read
 * `caps.workspaceCwd` directly.
 */
export function requireWorkspaceCwd(caps) {
    if (typeof caps.workspaceCwd !== 'string' || caps.workspaceCwd.length === 0) {
        throw new DaemonCapabilityMissingError('workspaceCwd', caps.workspaceCwd === ''
            ? 'daemon returned an empty workspaceCwd (post-§02 daemon with a bug)'
            : 'daemon predates #3803 §02 (1 daemon = 1 workspace); upgrade it');
    }
    return caps.workspaceCwd;
}
/**
 * Closed taxonomy of structured error categories surfaced on diagnostic
 * status cells (workspace preflight, env, MCP guardrails). SDK consumers
 * can switch on a known set rather than parsing free-form messages.
 */
export const DAEMON_ERROR_KINDS = [
    'missing_binary',
    'blocked_egress',
    'auth_env_error',
    'init_timeout',
    'protocol_error',
    'missing_file',
    'parse_error',
    // Issue #4175 PR 14: budget refusal under `--mcp-budget-mode=enforce`.
    // Mirrors the serve-side `SERVE_ERROR_KINDS` addition.
    'budget_exhausted',
];
const DAEMON_CONTENT_HASH_RE = /^sha256:[0-9a-f]{64}$/;
export function isDaemonContentHash(value) {
    return typeof value === 'string' && DAEMON_CONTENT_HASH_RE.test(value);
}
/**
 * #4175 Wave 4 PR 17. Closed enumeration of session approval modes the
 * daemon exposes via `POST /session/:id/approval-mode`. Mirrors core's
 * `ApprovalMode` enum — the drift detector test in
 * `packages/cli/src/acp-integration/approvalMode.test.ts` walks the
 * core enum and fails CI if any value is missing here.
 *
 * Order matters for diagnostic UIs that render the modes in the
 * advertised sequence.
 */
export const DAEMON_APPROVAL_MODES = [
    'plan',
    'default',
    'auto-edit',
    'auto',
    'yolo',
];
//# sourceMappingURL=types.js.map