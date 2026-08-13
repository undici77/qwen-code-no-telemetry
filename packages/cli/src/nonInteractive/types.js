/**
 * Type guard functions for message discrimination
 */
export function isCLIUserMessage(msg) {
    return (msg && typeof msg === 'object' && msg.type === 'user' && 'message' in msg);
}
export function isCLIAssistantMessage(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'assistant' &&
        'uuid' in msg &&
        'message' in msg &&
        'session_id' in msg &&
        'parent_tool_use_id' in msg);
}
export function isCLISystemMessage(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'system' &&
        'subtype' in msg &&
        'uuid' in msg &&
        'session_id' in msg);
}
export function isCLIResultMessage(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'result' &&
        'subtype' in msg &&
        'duration_ms' in msg &&
        'is_error' in msg &&
        'uuid' in msg &&
        'session_id' in msg);
}
export function isCLIPartialAssistantMessage(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'stream_event' &&
        'uuid' in msg &&
        'session_id' in msg &&
        'event' in msg &&
        'parent_tool_use_id' in msg);
}
export function isControlRequest(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'control_request' &&
        'request_id' in msg &&
        'request' in msg);
}
export function isControlResponse(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'control_response' &&
        'response' in msg);
}
export function isControlCancel(msg) {
    return (msg &&
        typeof msg === 'object' &&
        msg.type === 'control_cancel_request' &&
        'request_id' in msg);
}
/**
 * Content block type guards
 */
export function isTextBlock(block) {
    return block && typeof block === 'object' && block.type === 'text';
}
export function isThinkingBlock(block) {
    return block && typeof block === 'object' && block.type === 'thinking';
}
export function isToolUseBlock(block) {
    return block && typeof block === 'object' && block.type === 'tool_use';
}
export function isToolResultBlock(block) {
    return block && typeof block === 'object' && block.type === 'tool_result';
}
//# sourceMappingURL=types.js.map