/**
 * SessionLifecycle
 *
 * Shared session lifecycle types and utilities for agent implementations.
 * Provides common abort reasons, session state, and cleanup patterns.
 *
 * The actual abort implementation is provider-specific:
 * - Backend agents use their runtime-specific abort mechanism
 * - CodexAgent uses client.turnInterrupt() with the Codex API
 *
 * This module provides the shared types and utilities that both use.
 */
// ============================================================
// Types
// ============================================================
/**
 * Reason for aborting agent execution.
 * Used to distinguish user-initiated stops from internal aborts.
 */
export var AbortReason;
(function (AbortReason) {
    /** User clicked stop button */
    AbortReason["UserStop"] = "user_stop";
    /** Agent submitted a plan and is awaiting review */
    AbortReason["PlanSubmitted"] = "plan_submitted";
    /** Auth request triggered (OAuth, credential prompt) */
    AbortReason["AuthRequest"] = "auth_request";
    /** New message sent while processing (silent redirect) */
    AbortReason["Redirect"] = "redirect";
    /** Source activation requested - need to restart with new tools */
    AbortReason["SourceActivated"] = "source_activated";
    /** Session timeout */
    AbortReason["Timeout"] = "timeout";
    /** Internal error requiring abort */
    AbortReason["InternalError"] = "internal_error";
})(AbortReason || (AbortReason = {}));
// ============================================================
// SessionLifecycleManager Class
// ============================================================
/**
 * Manages session lifecycle state.
 *
 * Tracks session activity and provides utilities for:
 * - Session state tracking (active, message count, timestamps)
 * - Abort reason management
 * - Session cleanup
 */
export class SessionLifecycleManager {
    state;
    currentAbortReason = null;
    config;
    constructor(config) {
        this.config = config;
        this.state = {
            sessionId: config.sessionId,
            isActive: true,
            messageCount: 0,
            startedAt: Date.now(),
            lastActivityAt: Date.now(),
            hasReceivedContent: false,
        };
    }
    /**
     * Get current session state.
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get the session ID.
     */
    getSessionId() {
        return this.state.sessionId;
    }
    /**
     * Check if this is the first message in the session.
     */
    isFirstMessage() {
        return this.state.messageCount === 0;
    }
    /**
     * Record that a message/turn has started.
     */
    recordMessageStart() {
        this.debug(`Message ${this.state.messageCount + 1} started`);
        this.state.lastActivityAt = Date.now();
    }
    /**
     * Record that a message/turn has completed.
     */
    recordMessageComplete() {
        this.state.messageCount++;
        this.state.lastActivityAt = Date.now();
        this.debug(`Message ${this.state.messageCount} completed`);
        this.notifyStateChange();
    }
    /**
     * Record that content has been received from the assistant.
     * Important for determining if abort should clear session state.
     */
    recordContentReceived() {
        if (!this.state.hasReceivedContent) {
            this.state.hasReceivedContent = true;
            this.debug('First content received');
            this.notifyStateChange();
        }
        this.state.lastActivityAt = Date.now();
    }
    /**
     * Set the abort reason for the current operation.
     * @returns Previous abort reason, if any.
     */
    setAbortReason(reason) {
        const previous = this.currentAbortReason;
        this.currentAbortReason = reason;
        this.debug(`Abort reason set: ${reason}`);
        return previous;
    }
    /**
     * Get and clear the current abort reason.
     */
    consumeAbortReason() {
        const reason = this.currentAbortReason;
        this.currentAbortReason = null;
        return reason;
    }
    /**
     * Get the current abort reason without clearing it.
     */
    getAbortReason() {
        return this.currentAbortReason;
    }
    /**
     * Check if the abort was user-initiated.
     */
    wasUserAbort() {
        return this.currentAbortReason === AbortReason.UserStop;
    }
    /**
     * Check if abort should clear session state.
     *
     * Session state should be cleared if:
     * - Aborted before receiving any content
     * - AND it was the first message
     *
     * This prevents broken resume states.
     */
    shouldClearSessionOnAbort() {
        return !this.state.hasReceivedContent && this.state.messageCount === 0;
    }
    /**
     * Deactivate the session (e.g., on dispose).
     */
    deactivate() {
        this.state.isActive = false;
        this.currentAbortReason = null;
        this.debug('Session deactivated');
        this.notifyStateChange();
    }
    /**
     * Reset session state for a new conversation.
     */
    reset() {
        this.state = {
            sessionId: this.state.sessionId,
            isActive: true,
            messageCount: 0,
            startedAt: Date.now(),
            lastActivityAt: Date.now(),
            hasReceivedContent: false,
        };
        this.currentAbortReason = null;
        this.debug('Session reset');
        this.notifyStateChange();
    }
    notifyStateChange() {
        this.config.onStateChange?.(this.getState());
    }
    debug(message) {
        this.config.onDebug?.(`[SessionLifecycle] ${message}`);
    }
}
/**
 * Create a new SessionLifecycleManager.
 */
export function createSessionLifecycleManager(config) {
    return new SessionLifecycleManager(config);
}
//# sourceMappingURL=session-lifecycle.js.map