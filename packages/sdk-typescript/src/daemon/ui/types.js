/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const DAEMON_PLAN_TOOL_CALL_ID = 'daemon-plan';
/**
 * Why the normalizer produced a `debug` projection instead of a typed event.
 *
 * `unrecognized_*` means the daemon sent a frame this normalizer has no case
 * for — expected whenever the daemon runs ahead of the client, and the payload
 * is developer diagnostics rather than conversation content. `malformed_*`
 * means a frame the normalizer *does* know arrived with an unusable payload,
 * which signals an actual defect.
 *
 * Renderers should branch on this instead of pattern-matching the debug text:
 * client-dispatched debug events (e.g. Web Shell's model-switch summary) carry
 * no `debugReason` at all and must keep rendering.
 */
export const DAEMON_UI_DEBUG_REASONS = [
    'unrecognized_event',
    'unrecognized_session_update',
    'malformed_payload',
];
//# sourceMappingURL=types.js.map