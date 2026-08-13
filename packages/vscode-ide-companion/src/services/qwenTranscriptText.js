/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { projectUserTranscriptForDisplay } from '@qwen-code/qwen-code-core';
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function messageParts(message) {
    if (!isRecord(message) || !Array.isArray(message.parts))
        return [];
    return message.parts;
}
function partsToText(parts) {
    const texts = [];
    for (const part of parts) {
        if (!isRecord(part))
            continue;
        if (typeof part.text === 'string') {
            texts.push(part.text);
        }
        else if (typeof part.data === 'string') {
            texts.push(part.data);
        }
    }
    return texts.join('\n');
}
export function qwenContentToText(message) {
    return partsToText(messageParts(message));
}
export function qwenRecordToText(record) {
    if (record.type !== 'user')
        return qwenContentToText(record.message);
    const projection = projectUserTranscriptForDisplay({
        message: { parts: messageParts(record.message) },
        systemPayload: record.systemPayload,
    });
    return projection.displayText ?? partsToText(projection.parts);
}
//# sourceMappingURL=qwenTranscriptText.js.map