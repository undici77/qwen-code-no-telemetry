import type { GroupPolicy, GroupConfig, Envelope } from './types.js';
export interface GroupCheckResult {
    allowed: boolean;
    reason?: 'disabled' | 'not_allowlisted' | 'mention_required';
}
export declare class GroupGate {
    private policy;
    private groups;
    constructor(policy?: GroupPolicy, groups?: Record<string, GroupConfig>);
    /**
     * Full group check: policy + allowlist + mention gating.
     * Evaluation order:
     *   1. groupPolicy (disabled → drop)
     *   2. group allowlist (allowlist mode, no match → drop)
     *   3. mention gating (requireMention + not mentioned → drop silently)
     *
     * Mention gating runs before sender gate so that unmentioned messages
     * in groups don't trigger pairing flows.
     */
    check(envelope: Envelope): GroupCheckResult;
}
