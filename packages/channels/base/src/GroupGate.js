export class GroupGate {
    policy;
    groups;
    pairingStore;
    constructor(policy = 'disabled', groups = {}, pairingStore) {
        this.policy = policy;
        this.groups = groups;
        this.pairingStore = pairingStore ?? null;
    }
    /**
     * Full group check: policy + allowlist + pairing + mention gating.
     * Evaluation order:
     *   1. groupPolicy (disabled → drop)
     *   2. group allowlist (allowlist mode, no match → drop)
     *   3. group pairing (pairing mode, group not approved → drop; an explicit
     *      mention or reply creates or returns a pending pairing request unless
     *      `options.createPairingRequest` is false)
     *   4. mention gating (requireMention + not mentioned → drop silently)
     *
     * Under the pairing policy the pairing step itself drops ambient
     * (unmentioned, non-reply) messages before any request is created. Mention
     * gating then runs before the sender gate so unmentioned messages in
     * approved groups don't trigger sender pairing flows.
     */
    check(envelope, options = {}) {
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
        if (this.policy === 'pairing' &&
            !this.pairingStore?.isGroupApproved(envelope.chatId)) {
            if (options.createPairingRequest === false ||
                (!envelope.isMentioned && !envelope.isReplyToBot)) {
                return { allowed: false, reason: 'pairing_trigger_required' };
            }
            const result = this.pairingStore?.createGroupRequest(envelope.chatId, envelope.chatName || envelope.chatId, envelope.senderId, envelope.senderName);
            return {
                allowed: false,
                reason: 'pairing_required',
                pairing: result ?? { rejected: 'cap_reached' },
            };
        }
        // Per-group config, falling back to "*" defaults, then built-in defaults
        const groupConfig = this.groups[envelope.chatId] || this.groups['*'] || {};
        const requireMention = groupConfig.requireMention ?? true;
        if (requireMention && !envelope.isMentioned && !envelope.isReplyToBot) {
            return { allowed: false, reason: 'mention_required' };
        }
        return { allowed: true };
    }
    isGroupApproved(groupId) {
        return this.pairingStore?.isGroupApproved(groupId) ?? false;
    }
}
//# sourceMappingURL=GroupGate.js.map