/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Ceiling on a sub-session prompt arriving over `extMethod`. The child is a
 * separate process, so this is a trust boundary — mirrors the scheduled-task
 * REST route's `MAX_PROMPT_LENGTH` and the core tool's own client-side check. */
export const MAX_SUB_SESSION_PROMPT_CHARS = 100_000;
/** Ceiling on the sub-session display name. It is a label — the launcher
 * truncates it to 60 chars for display anyway. */
export const MAX_SUB_SESSION_NAME_CHARS = 200;
export const MAX_LIVE_SCREEN_CONTEXT_TEXT_CHARS = 32_000;
export const LIVE_TASK_TOOL_NAMES = [
    'list_threads',
    'read_thread',
    'wait_threads',
    'send_message_to_thread',
    'create_thread',
];
export const MAX_LIVE_SPEAK_TO_USER_MESSAGE_CHARS = 32_000;
export const CHANNEL_DELIVERY_ERROR_CODES = new Set([
    'channel_worker_unavailable',
    'channel_delivery_timeout',
    'channel_delivery_invalid',
    'channel_delivery_rejected',
    'channel_delivery_queue_full',
    'channel_delivery_failed',
]);
//# sourceMappingURL=bridgeOptions.js.map