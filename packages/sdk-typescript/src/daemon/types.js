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
 * built with workspaceCwd support) and return it as a non-undefined `string`. Throws
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
            ? 'daemon returned an empty workspaceCwd (newer daemon with a bug)'
            : 'daemon predates workspaceCwd support; upgrade it');
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
    'restore_timeout',
    'protocol_error',
    'missing_file',
    'parse_error',
    // Budget refusal under `--mcp-budget-mode=enforce`.
    'budget_exhausted',
    // Runtime MCP mutation routes (POST/DELETE /workspace/mcp/servers).
    'mcp_budget_would_exceed',
    'mcp_server_spawn_failed',
    'invalid_config',
    // A prompt exceeded the daemon-configured wallclock cap (or the
    // request's own `deadlineMs`, capped at the server flag).
    'prompt_deadline_exceeded',
    // An SSE writer's last successful flush was older than the daemon's
    // writer-idle deadline.
    'writer_idle_timeout',
    // The model response stream ended before a complete turn could be read.
    'model_stream_interrupted',
];
const DAEMON_CONTENT_HASH_RE = /^sha256:[0-9a-f]{64}$/;
export function isDaemonContentHash(value) {
    return typeof value === 'string' && DAEMON_CONTENT_HASH_RE.test(value);
}
/**
 * Closed enumeration of session approval modes the
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