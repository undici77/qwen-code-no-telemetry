/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * AUTO mode denial-tracking state machine.
 *
 * Protects users from infinite loops when the classifier persistently blocks
 * (LLM stuck in a dead-end) or persistently fails (infrastructure problem).
 * After the consecutive thresholds are exceeded the orchestrator falls back
 * to DEFAULT-mode confirmation flow for the next tool call. The session
 * itself stays in AUTO; only the single offending call is downgraded.
 *
 * Block and unavailable counters cross-reset: they represent different
 * failure modes and should not accumulate together. Switching ApprovalMode
 * resets all counters.
 *
 * `total*` counters are telemetry-only — they do NOT trigger fallback.
 * A long session naturally accumulates blocks; forcing manual approval after
 * an absolute total would harm UX.
 */
/** Reasons the orchestrator may choose to fall back to manual approval. */
export type DenialFallbackReason = 'consecutive_block' | 'consecutive_unavailable';
export interface AutoModeDenialState {
    consecutiveBlock: number;
    consecutiveUnavailable: number;
    totalBlock: number;
    totalUnavailable: number;
}
export declare const AUTO_MODE_DENIAL_LIMITS: {
    readonly maxConsecutiveBlock: 3;
    readonly maxConsecutiveUnavailable: 2;
};
/** Freshly-initialised state with all counters zero. */
export declare function createDenialState(): AutoModeDenialState;
/** Record a successful (allow) decision. Resets both consecutive counters. */
export declare function recordAllow(state: AutoModeDenialState): AutoModeDenialState;
/**
 * Record a classifier-policy block. Increments `consecutiveBlock` and
 * `totalBlock`; cross-resets `consecutiveUnavailable`.
 */
export declare function recordBlock(state: AutoModeDenialState): AutoModeDenialState;
/**
 * Record a classifier-unavailable (infrastructure failure) outcome.
 * Increments `consecutiveUnavailable` and `totalUnavailable`; cross-resets
 * `consecutiveBlock`.
 */
export declare function recordUnavailable(state: AutoModeDenialState): AutoModeDenialState;
/**
 * Decide whether the next tool call should bypass the classifier and fall
 * back to DEFAULT-mode confirmation. The fallback applies to a single call
 * only; the session remains in AUTO.
 */
export declare function shouldFallback(state: AutoModeDenialState): {
    fallback: true;
    reason: DenialFallbackReason;
} | {
    fallback: false;
};
/**
 * Called after the user manually approves a fallback-prompted tool call.
 * Resets BOTH consecutive counters so the agent can resume normal AUTO flow.
 *
 * Symmetric with `recordAllow`: a manual approval signals the user accepted
 * the action, and the next call should re-engage the classifier. If the
 * classifier or its infrastructure is still degraded, the next call's
 * verdict will simply re-arm the appropriate counter (one block / one
 * unavailable) — same recovery curve as initial onset, no permanent
 * lock-out. Resetting only `consecutiveBlock` (the original v1 behaviour)
 * created an asymmetry: a transient API blip past
 * `maxConsecutiveUnavailable` would permanently downgrade the rest of the
 * session to manual approval even after the user approved the fallback
 * prompt, until ApprovalMode toggled.
 */
export declare function recordFallbackApprove(state: AutoModeDenialState): AutoModeDenialState;
/**
 * True when a `ToolConfirmationOutcome` represents the user approving
 * the call (any kind of "proceed"). Shared between the CLI scheduler's
 * outcome handler and the ACP Session's outcome handler so adding a new
 * approve-shaped outcome can't drift between the two paths.
 *
 * Cancel / abort intentionally not handled — they leave denialTracking
 * untouched on the AUTO-fallback path. Caller decides.
 */
export declare function isApproveOutcome(outcome: string): boolean;
/**
 * Reset every counter. Called when the user switches ApprovalMode (a
 * deliberate change of intent invalidates the historic signal).
 */
export declare function resetDenialState(): AutoModeDenialState;
