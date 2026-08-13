/**
 * Convert runtime Message to StoredMessage for persistence.
 *
 * Excludes transient runtime-only fields:
 * - isStreaming
 * - isPending
 */
export function messageToStored(msg) {
    const { role, isStreaming, isPending, badges: _legacyBadges, ...rest } = msg;
    return { ...rest, type: role };
}
/**
 * Convert StoredMessage to runtime Message.
 *
 * Adds a timestamp fallback for legacy messages where timestamp was omitted.
 */
export function storedToMessage(stored) {
    const { type, badges: _legacyBadges, ...rest } = stored;
    return { ...rest, role: type, timestamp: stored.timestamp ?? Date.now() };
}
//# sourceMappingURL=message-mapper.js.map