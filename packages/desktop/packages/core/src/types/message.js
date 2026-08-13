/**
 * Message types for conversations
 */
/**
 * Generate a unique message ID
 */
export function generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
//# sourceMappingURL=message.js.map