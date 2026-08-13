/**
 * UsageTracker
 *
 * Tracks token usage and context window consumption for agent sessions.
 * Provides accurate per-message tracking (not cumulative billing totals)
 * for real-time context window display.
 *
 * Used by backend agents to:
 * - Track input/output tokens per message
 * - Calculate cache hit/miss rates
 * - Emit usage_update events for UI display
 * - Track cumulative session usage (for billing display)
 */
// ============================================================
// UsageTracker Class
// ============================================================
/**
 * Tracks token usage for an agent session.
 *
 * Provides:
 * - Per-message usage tracking (for accurate context window display)
 * - Cumulative session usage (for billing totals)
 * - Cache efficiency metrics
 * - Real-time usage update events
 */
export class UsageTracker {
    config;
    sessionUsage;
    lastMessageUsage = null;
    cachedContextWindow;
    constructor(config = {}) {
        this.config = config;
        this.cachedContextWindow = config.contextWindow;
        this.sessionUsage = {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCacheReadTokens: 0,
            totalCacheCreationTokens: 0,
            messageCount: 0,
            startedAt: Date.now(),
        };
    }
    /**
     * Record usage from an assistant message.
     * This is called during message processing to track real-time usage.
     */
    recordMessageUsage(usage) {
        const now = Date.now();
        // Calculate total input including cache
        const cacheRead = usage.cacheReadTokens ?? 0;
        const cacheCreation = usage.cacheCreationTokens ?? 0;
        const totalInput = usage.inputTokens + cacheRead + cacheCreation;
        // Update last message usage (for per-message display)
        this.lastMessageUsage = {
            inputTokens: totalInput,
            outputTokens: usage.outputTokens ?? 0,
            cacheReadTokens: cacheRead,
            cacheCreationTokens: cacheCreation,
            timestamp: now,
        };
        this.debug(`Message usage: ${totalInput} input, ${usage.outputTokens ?? 0} output, ${cacheRead} cache read`);
        // Emit usage update
        this.emitUsageUpdate();
    }
    /**
     * Record final usage when a turn completes.
     * Updates cumulative session totals.
     */
    recordTurnComplete(usage) {
        // Use provided usage or last tracked message usage
        const finalUsage = usage ?? this.lastMessageUsage;
        if (finalUsage) {
            this.sessionUsage.totalInputTokens += finalUsage.inputTokens;
            this.sessionUsage.totalOutputTokens += finalUsage.outputTokens;
            this.sessionUsage.totalCacheReadTokens += finalUsage.cacheReadTokens ?? 0;
            this.sessionUsage.totalCacheCreationTokens += finalUsage.cacheCreationTokens ?? 0;
            this.sessionUsage.messageCount++;
        }
        this.debug(`Turn complete: ${this.sessionUsage.messageCount} messages, ${this.sessionUsage.totalInputTokens} total input`);
    }
    /**
     * Set/update the context window size.
     * This can be updated dynamically as model info becomes available.
     */
    setContextWindow(contextWindow) {
        this.cachedContextWindow = contextWindow;
        this.debug(`Context window set: ${contextWindow}`);
    }
    /**
     * Get the current context window size.
     */
    getContextWindow() {
        return this.cachedContextWindow;
    }
    /**
     * Get the last message's usage (for per-message display).
     */
    getLastMessageUsage() {
        return this.lastMessageUsage ? { ...this.lastMessageUsage } : null;
    }
    /**
     * Get cumulative session usage (for billing/totals).
     */
    getSessionUsage() {
        return { ...this.sessionUsage };
    }
    /**
     * Get the current input tokens (from last message).
     * This represents the actual context size sent to the API.
     */
    getCurrentInputTokens() {
        return this.lastMessageUsage?.inputTokens ?? 0;
    }
    /**
     * Calculate cache hit rate (0-1).
     * Higher is better - more tokens served from cache.
     */
    getCacheHitRate() {
        const total = this.sessionUsage.totalInputTokens;
        if (total === 0)
            return 0;
        const cacheRead = this.sessionUsage.totalCacheReadTokens;
        return cacheRead / total;
    }
    /**
     * Get context usage as a percentage (0-100).
     * Returns undefined if context window is not set.
     */
    getContextUsagePercent() {
        if (!this.cachedContextWindow || !this.lastMessageUsage) {
            return undefined;
        }
        return (this.lastMessageUsage.inputTokens / this.cachedContextWindow) * 100;
    }
    /**
     * Check if context is getting full (> 80% used).
     */
    isContextFilling() {
        const percent = this.getContextUsagePercent();
        return percent !== undefined && percent > 80;
    }
    /**
     * Check if context is critically full (> 95% used).
     */
    isContextCritical() {
        const percent = this.getContextUsagePercent();
        return percent !== undefined && percent > 95;
    }
    /**
     * Reset all tracking (for new session).
     */
    reset() {
        this.sessionUsage = {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCacheReadTokens: 0,
            totalCacheCreationTokens: 0,
            messageCount: 0,
            startedAt: Date.now(),
        };
        this.lastMessageUsage = null;
        this.debug('Usage tracker reset');
    }
    /**
     * Build a UsageUpdate object for emitting events.
     */
    buildUsageUpdate() {
        return {
            inputTokens: this.getCurrentInputTokens(),
            contextWindow: this.cachedContextWindow,
            cacheHitRate: this.getCacheHitRate(),
        };
    }
    emitUsageUpdate() {
        this.config.onUsageUpdate?.(this.buildUsageUpdate());
    }
    debug(message) {
        this.config.onDebug?.(`[UsageTracker] ${message}`);
    }
}
/**
 * Create a new UsageTracker.
 */
export function createUsageTracker(config) {
    return new UsageTracker(config);
}
//# sourceMappingURL=usage-tracker.js.map