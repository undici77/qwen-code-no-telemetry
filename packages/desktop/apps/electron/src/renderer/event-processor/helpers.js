/**
 * Message Operation Helpers
 *
 * Pure utility functions for finding and updating messages.
 * All lookups are by ID (turnId, toolUseId) - NEVER by position.
 */
let messageIdCounter = 0;
/**
 * Generate a unique message ID
 */
export function generateMessageId() {
    return `msg-${Date.now()}-${++messageIdCounter}`;
}
/**
 * Find message index by turnId
 * Returns -1 if not found
 */
export function findMessageByTurnId(messages, turnId, role) {
    if (!turnId)
        return -1;
    return messages.findIndex(m => m.turnId === turnId && (!role || m.role === role));
}
/**
 * Find streaming assistant message by turnId
 * Falls back to last streaming assistant if no turnId
 */
export function findStreamingMessage(messages, turnId) {
    if (turnId) {
        const index = messages.findIndex(m => m.role === 'assistant' && m.turnId === turnId && m.isStreaming);
        if (index !== -1)
            return index;
    }
    // Fallback: find last streaming assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant' && messages[i].isStreaming) {
            return i;
        }
    }
    return -1;
}
/**
 * Find assistant message by turnId (streaming or not)
 */
export function findAssistantMessage(messages, turnId) {
    if (turnId) {
        const index = messages.findIndex(m => m.role === 'assistant' && m.turnId === turnId);
        if (index !== -1)
            return index;
    }
    // Fallback: find last streaming assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant' && messages[i].isStreaming) {
            return i;
        }
    }
    return -1;
}
/**
 * Find tool message by toolUseId
 */
export function findToolMessage(messages, toolUseId) {
    return messages.findIndex(m => m.toolUseId === toolUseId);
}
/**
 * Update message at index, returning new session
 * Always creates new references (immutable update)
 * @param updateTimestamp - If true, also update lastMessageAt
 */
export function updateMessageAt(session, index, updates, updateTimestamp = false) {
    if (index < 0 || index >= session.messages.length) {
        return session;
    }
    const messages = [...session.messages];
    messages[index] = { ...messages[index], ...updates };
    return {
        ...session,
        messages,
        ...(updateTimestamp ? { lastMessageAt: Date.now() } : {}),
    };
}
/**
 * Append message to session, returning new session
 * @param updateTimestamp - If false, don't update lastMessageAt (for intermediate/tool messages)
 */
export function appendMessage(session, message, updateTimestamp = false) {
    // Guard: skip if message with same ID already exists (prevents duplicate events on Windows)
    if (message.id && session.messages.some(m => m.id === message.id)) {
        return session;
    }
    // Determine if this message role should update lastMessageRole (for badge display)
    const badgeRoles = ['user', 'assistant', 'plan', 'tool', 'error'];
    const roleForBadge = badgeRoles.includes(message.role)
        ? message.role
        : undefined;
    return {
        ...session,
        messages: [...session.messages, message],
        ...(updateTimestamp ? { lastMessageAt: Date.now() } : {}),
        ...(roleForBadge ? { lastMessageRole: roleForBadge } : {}),
    };
}
/**
 * Insert message at index, returning new session
 * @param updateTimestamp - If false, don't update lastMessageAt (for intermediate/tool messages)
 */
export function insertMessageAt(session, index, message, updateTimestamp = false) {
    const messages = [...session.messages];
    messages.splice(index, 0, message);
    return {
        ...session,
        messages,
        ...(updateTimestamp ? { lastMessageAt: Date.now() } : {}),
    };
}
/**
 * Create an empty session for a given ID
 */
export function createEmptySession(sessionId, workspaceId, workspaceName = '') {
    return {
        id: sessionId,
        workspaceId,
        workspaceName,
        lastMessageAt: Date.now(),
        messages: [],
        isProcessing: true,
    };
}
//# sourceMappingURL=helpers.js.map