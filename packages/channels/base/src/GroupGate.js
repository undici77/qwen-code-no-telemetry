export class GroupGate {
    policy;
    groups;
    constructor(policy = 'disabled', groups = {}) {
        this.policy = policy;
        this.groups = groups;
    }
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
    check(envelope) {
        if (!envelope.isGroup) {
            return { allowed: true };
        }
        if (this.policy === 'disabled') {
            return { allowed: false, reason: 'disabled' };
        }
        if (this.policy === 'allowlist') {
            // In allowlist mode, "*" is only a default config — not a wildcard allow.
            // The group must be explicitly listed by ID.
            if (!this.groups[envelope.chatId]) {
                return { allowed: false, reason: 'not_allowlisted' };
            }
        }
        // Per-group config, falling back to "*" defaults, then built-in defaults
        const groupConfig = this.groups[envelope.chatId] || this.groups['*'] || {};
        const requireMention = groupConfig.requireMention ?? true;
        if (requireMention && !envelope.isMentioned && !envelope.isReplyToBot) {
            return { allowed: false, reason: 'mention_required' };
        }
        return { allowed: true };
    }
}
//# sourceMappingURL=GroupGate.js.map