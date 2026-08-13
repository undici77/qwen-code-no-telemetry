/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function getToolResultCallId(record) {
    return getExplicitToolResultCallId(record) ?? record.uuid;
}
export function getExplicitToolResultCallId(record) {
    const resultCallId = record.toolCallResult?.callId;
    if (typeof resultCallId === 'string' && resultCallId.length > 0) {
        return resultCallId;
    }
    return extractFunctionResponseId(record);
}
function extractFunctionResponseId(record) {
    if (!record.message?.parts) {
        return undefined;
    }
    for (const part of record.message.parts) {
        const id = 'functionResponse' in part ? part.functionResponse?.id : undefined;
        if (typeof id === 'string' && id.length > 0) {
            return id;
        }
    }
    return undefined;
}
//# sourceMappingURL=chat-record-tool-call-id.js.map