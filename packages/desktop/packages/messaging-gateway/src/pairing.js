/**
 * PairingCodeManager — issues and validates one-time pairing codes.
 *
 * Codes are 6-digit, 5-minute TTL, in-memory only (never persisted).
 * Rate-limited per workspace (default: 10 codes/minute) to prevent brute-force
 * enumeration if a bot token ever leaks.
 *
 * Consumption is atomic: consume() returns the entry exactly once, then deletes
 * it. A wrong code does not count against the issuing rate limit (consume is
 * called by incoming chat messages which are their own side-channel).
 */
import { randomInt } from 'node:crypto';
export const PAIRING_TTL_MS = 5 * 60 * 1000;
export const PAIRING_RATE_LIMIT_PER_MINUTE = 10;
/**
 * Per-sender ceiling on `/pair` attempts. With a 6-digit decimal code and a
 * 5-minute TTL, a brute-force needs on the order of 500k attempts per target
 * code. 5/minute × 5 minutes = 25 tries across the TTL — a ~25/1,000,000
 * upper bound. That's defence-in-depth; the real guarantee is the short TTL.
 */
export const PAIR_CONSUME_RATE_PER_MINUTE = 5;
export class PairingCodeManager {
    ttlMs;
    ratePerMinute;
    consumeRatePerMinute;
    /** Key: `${platform}:${code}` */
    entries = new Map();
    /** Key: workspaceId */
    buckets = new Map();
    /** Key: `${workspaceId}:${platform}:${senderId}` — counts attempts, right or wrong. */
    consumeBuckets = new Map();
    constructor(ttlMs = PAIRING_TTL_MS, ratePerMinute = PAIRING_RATE_LIMIT_PER_MINUTE, consumeRatePerMinute = PAIR_CONSUME_RATE_PER_MINUTE) {
        this.ttlMs = ttlMs;
        this.ratePerMinute = ratePerMinute;
        this.consumeRatePerMinute = consumeRatePerMinute;
    }
    /**
     * Issue a new pairing code.
     * @throws Error with code 'RATE_LIMIT' when the workspace exceeds the per-minute cap.
     */
    generate(workspaceId, sessionId, platform) {
        this.checkRate(workspaceId);
        this.gc();
        // Collision-resistant: retry a few times if we clash with a live code.
        let code = this.randomCode();
        for (let i = 0; i < 5 && this.entries.has(this.key(platform, code)); i++) {
            code = this.randomCode();
        }
        const expiresAt = Date.now() + this.ttlMs;
        this.entries.set(this.key(platform, code), {
            workspaceId,
            sessionId,
            platform,
            code,
            expiresAt,
        });
        return { code, expiresAt };
    }
    /**
     * Consume a code. Returns the entry once then deletes it.
     * Returns null if unknown, expired, or workspace does not match.
     */
    consume(workspaceId, platform, code) {
        const entry = this.entries.get(this.key(platform, code));
        if (!entry)
            return null;
        if (entry.workspaceId !== workspaceId)
            return null;
        if (entry.expiresAt < Date.now()) {
            this.entries.delete(this.key(platform, code));
            return null;
        }
        this.entries.delete(this.key(platform, code));
        return entry;
    }
    /** Invalidate all codes for a workspace. Used on platform disconnect. */
    clearWorkspace(workspaceId) {
        for (const [k, v] of this.entries) {
            if (v.workspaceId === workspaceId)
                this.entries.delete(k);
        }
    }
    /**
     * Per-sender throttle for `/pair` attempts. Counts on entry, NOT after
     * validation — otherwise wrong guesses cost nothing and the throttle is
     * decorative. Sender identity is always scoped with workspaceId+platform
     * so a leaked senderId can't bleed across workspaces.
     *
     * Returns `true` if the caller may attempt another consume, `false` if
     * they've hit the per-minute cap.
     */
    canConsume(workspaceId, platform, senderId) {
        const key = `${workspaceId}:${platform}:${senderId}`;
        const now = Date.now();
        const bucket = this.consumeBuckets.get(key);
        if (!bucket || now - bucket.windowStart > 60_000) {
            this.consumeBuckets.set(key, { windowStart: now, count: 1 });
            return true;
        }
        if (bucket.count >= this.consumeRatePerMinute)
            return false;
        bucket.count += 1;
        return true;
    }
    // -------------------------------------------------------------------------
    key(platform, code) {
        return `${platform}:${code}`;
    }
    randomCode() {
        // 6 decimal digits, zero-padded
        return randomInt(0, 1_000_000).toString().padStart(6, '0');
    }
    checkRate(workspaceId) {
        const now = Date.now();
        const bucket = this.buckets.get(workspaceId);
        if (!bucket || now - bucket.windowStart > 60_000) {
            this.buckets.set(workspaceId, { windowStart: now, count: 1 });
            return;
        }
        if (bucket.count >= this.ratePerMinute) {
            const err = new Error('Pairing code rate limit exceeded');
            err.code = 'RATE_LIMIT';
            throw err;
        }
        bucket.count += 1;
    }
    /** Purge expired entries. O(n) but n is tiny (per-workspace, 5-min window). */
    gc() {
        const now = Date.now();
        for (const [k, v] of this.entries) {
            if (v.expiresAt < now)
                this.entries.delete(k);
        }
    }
}
//# sourceMappingURL=pairing.js.map