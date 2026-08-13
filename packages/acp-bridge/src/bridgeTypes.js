/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const LOAD_REPLAY_MODE_META_KEY = 'qwen.session.loadReplayMode';
export const LOAD_REPLAY_META_KEY = 'qwen.session.loadReplay';
export const LOAD_REPLAY_PAGE_SIZE_META_KEY = 'qwen.session.loadReplayPageSize';
export const LOAD_REPLAY_HIDE_INHERITED_META_KEY = 'qwen.session.loadReplayHideInherited';
export const LOAD_REPLAY_BULK_MODE = 'bulk';
export const LOAD_REPLAY_VERSION = 1;
export const REQUESTED_SESSION_ID_META_KEY = 'qwen-code/sessionId';
export const CHANNEL_STARTUP_PROFILE_META_KEY = 'qwen.daemon.channelStartupProfile';
export const CHANNEL_STARTUP_PROFILE_VERSION = 1;
export const ACTIVE_WORK_HEARTBEAT_META_KEY = 'qwen.daemon.activeWorkHeartbeat';
export const ACTIVE_WORK_HEARTBEAT_VERSION = 1;
/** Reporting cadence the daemon asks for; the child may choose another value
 *  inside [MIN, MAX] and the daemon clamps whatever comes back. */
export const ACTIVE_WORK_HEARTBEAT_INTERVAL_MS = 15_000;
export const ACTIVE_WORK_HEARTBEAT_MIN_INTERVAL_MS = 5_000;
export const ACTIVE_WORK_HEARTBEAT_MAX_INTERVAL_MS = 60_000;
/** A channel's cached snapshot goes stale after this many report intervals. */
export const ACTIVE_WORK_STALE_INTERVALS = 3;
export const ACTIVE_WORK_NOTIFICATION_METHOD = 'qwen/notify/channel/active-work';
export const ACTIVE_WORK_CLOSE_IF_UNHELD_PARAM = 'onlyIfUnheld';
/** Bound on the conditional-close round trip. Its own constant rather than the
 *  handshake timeout: this runs on the automatic-cleanup path, where waiting
 *  longer buys nothing — an unanswered request is simply left for the next
 *  snapshot to settle. */
export const ACTIVE_WORK_CLOSE_TIMEOUT_MS = 10_000;
/** Bounds on a single snapshot. Generous next to any real deployment — they
 *  exist so a version-skewed or buggy child cannot make the daemon walk an
 *  unbounded structure per report, not to constrain legitimate use. A packet
 *  over either bound is discarded whole, like any other malformed one. */
export const ACTIVE_WORK_MAX_SNAPSHOT_SESSIONS = 1024;
export const ACTIVE_WORK_MAX_SESSION_HOLDS = 1024;
export const WORKTREE_MCP_DEFER_META_KEY = 'qwen.session.deferMcpDiscovery';
export const ACTIVE_WORK_HOLD_CATEGORIES = [
    'agent',
    'notification',
];
/**
 * Coerce a peer-supplied reporting cadence into the agreed range.
 *
 * Both sides call this on whatever the other side sent. Neither is treated as
 * hostile, but a version-skewed or buggy peer proposing 1ms would flood the
 * transport and one proposing hours would make the daemon's freshness grade
 * meaningless, so the value is never used raw. Anything unusable falls back to
 * the default cadence rather than disabling reporting.
 */
export function clampActiveWorkIntervalMs(raw) {
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : NaN;
    if (Number.isNaN(value))
        return ACTIVE_WORK_HEARTBEAT_INTERVAL_MS;
    return Math.min(ACTIVE_WORK_HEARTBEAT_MAX_INTERVAL_MS, Math.max(ACTIVE_WORK_HEARTBEAT_MIN_INTERVAL_MS, Math.round(value)));
}
/**
 * Collapse coverage counts into the grade `/health?deep=1` reports.
 *
 * Deliberately a function over summed counts rather than a per-runtime getter:
 * grades do not compose. A runtime with no Sessions vouches for everything it
 * has, so folding its vacuous `full` in as evidence let an empty workspace
 * vouch for another workspace's unreported Sessions. Callers sum the counts
 * across every runtime first, then grade once.
 */
export function gradeActiveWorkCoverage(totals) {
    // No Sessions means nothing is unreported, so the picture is complete.
    if (totals.total === 0 || totals.covered === totals.total)
        return 'full';
    // `none` is reserved for "not one Session sits on a channel that negotiated
    // reporting" — the case where acting on `activeWork` is unsafe rather than
    // merely degraded.
    return totals.onNegotiatedChannel === 0 ? 'none' : 'partial';
}
export const DAEMON_MODEL_PROMPT_META_KEY = 'qwen.daemon.modelPrompt';
export const MAX_TRUSTED_MODEL_PROMPT_CHARS = 64 * 1024;
export function isValidTrustedModelPrompt(value) {
    return (typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= MAX_TRUSTED_MODEL_PROMPT_CHARS);
}
export const DAEMON_CHANNEL_DELIVERY_META_KEY = 'qwen.daemon.channelDelivery';
export const DAEMON_PROMPT_DISPLAY_TEXT_META_KEY = 'qwen.daemon.promptDisplayText';
/**
 * ACP ext-method the spawned `qwen --acp` child calls between tool batches to
 * pull user messages the browser queued mid-turn. The child-side caller
 * (`cli/src/acp-integration/session/Session.ts`) and the daemon-side answerer
 * (`bridgeClient.ts`) both import THIS single definition, so a rename can't
 * silently desync them into a runtime `-32601 methodNotFound` (which would
 * latch the drain off for the session). The desktop ACP client answers the same
 * method from its own in-memory queue; in `qwen serve` the daemon answers it
 * from `SessionEntry.midTurnMessageQueue`. Responses may also carry
 * `hasQueuedPrompt` so an armed daemon Todo guard yields to complete FIFO
 * prompts; older clients can omit it.
 */
export const MID_TURN_QUEUE_DRAIN_METHOD = 'craft/drainMidTurnQueue';
/**
 * Cap on each per-session mid-turn reconciliation ring.
 */
export const MID_TURN_RECONCILIATION_RING_SIZE = 200;
/**
 * Child-to-parent request that atomically assigns the next Todo Stop Guard
 * model send to the current daemon FIFO owner. `promptId`, when present, is
 * the trusted bridge invocation id rather than the provider-facing prompt id.
 */
export const TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD = 'craft/claimTodoStopGuardContinuation';
/**
 * Parent-to-agent request reporting that the daemon FIFO no longer contains the
 * complete prompt an active Todo Stop Guard yielded to. The child clears the
 * old guard instead of letting background work revive it or leaving unrelated
 * automatic turns blocked forever.
 */
export const TODO_STOP_GUARD_QUEUE_RELEASE_METHOD = 'craft/todoStopGuardQueueReleased';
/** Parent-to-agent request that acknowledges prompt cancellation handling. */
export const PROMPT_CANCEL_METHOD = 'craft/cancelPendingPrompt';
/**
 * Reverse tool channel marker (issue #5626, Phase 2). The parent serve process
 * stamps this boolean on a client-hosted (extension) MCP server's
 * runtime-MCP-add config. The `qwen --acp` child reads it in its
 * `workspaceMcpRuntimeAdd` handler to (1) KEEP `type: 'sdk'` instead of
 * stripping it and (2) let the session `McpClientManager` bind that server's
 * `sendSdkMcpMessage` to the `qwen/control/client_mcp/message` ext-method.
 * Defined here — the single contract package both the parent provider
 * (`cli/src/serve/acp-http`) and the child handler (`cli/src/acp-integration`)
 * import — so a rename can't silently break the handshake.
 */
export const CLIENT_MCP_OVER_WS_CONFIG_FLAG = '__clientMcpOverWs';
//# sourceMappingURL=bridgeTypes.js.map