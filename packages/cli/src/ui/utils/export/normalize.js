/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { formatVisionBridgeNoticeDisplay, isVisionBridgeNoticeDisplay, ToolNames, } from '@qwen-code/qwen-code-core';
import { buildTruncatedDiffPreviewText } from '../../../utils/truncatedDiffPreview.js';
import { getToolResultCallId } from '../../../utils/chat-record-tool-call-id.js';
import { sanitizeTerminalText } from '../textUtils.js';
/**
 * Normalizes export session data by merging tool call information from tool_result records.
 * This ensures the SSOT contains complete tool call metadata.
 */
export function normalizeSessionData(sessionData, originalRecords, config) {
    const normalized = [...sessionData.messages];
    const toolCallIndexById = new Map();
    // Build index of tool call messages
    normalized.forEach((message, index) => {
        if (message.type === 'tool_call' && message.toolCall?.toolCallId) {
            toolCallIndexById.set(message.toolCall.toolCallId, index);
        }
    });
    // Build index of assistant messages by uuid for usageMetadata merging
    const assistantMessageIndexByUuid = new Map();
    normalized.forEach((message, index) => {
        if (message.type === 'assistant') {
            assistantMessageIndexByUuid.set(message.uuid, index);
        }
    });
    // Merge tool result information into tool call messages
    for (const record of originalRecords) {
        if (record.type !== 'tool_result')
            continue;
        const toolCallMessage = buildToolCallMessageFromResult(record, config);
        if (!toolCallMessage?.toolCall)
            continue;
        const existingIndex = toolCallIndexById.get(toolCallMessage.toolCall.toolCallId);
        if (existingIndex === undefined) {
            // No existing tool call, add this one
            toolCallIndexById.set(toolCallMessage.toolCall.toolCallId, normalized.length);
            normalized.push(toolCallMessage);
            continue;
        }
        // Merge into existing tool call
        const existingMessage = normalized[existingIndex];
        if (existingMessage.type !== 'tool_call' || !existingMessage.toolCall) {
            continue;
        }
        mergeToolCallData(existingMessage.toolCall, toolCallMessage.toolCall);
    }
    // Merge usageMetadata from assistant records
    for (const record of originalRecords) {
        if (record.type !== 'assistant')
            continue;
        if (!record.usageMetadata)
            continue;
        const existingIndex = assistantMessageIndexByUuid.get(record.uuid);
        if (existingIndex !== undefined) {
            // Only set if not already present from collect phase
            if (!normalized[existingIndex].usageMetadata) {
                normalized[existingIndex].usageMetadata = record.usageMetadata;
            }
        }
    }
    return {
        ...sessionData,
        messages: normalized,
    };
}
/**
 * Merges incoming tool call data into existing tool call.
 */
function mergeToolCallData(existing, incoming) {
    if (!existing.content || existing.content.length === 0) {
        existing.content = incoming.content;
    }
    if (existing.status === 'pending' || existing.status === 'in_progress') {
        existing.status = incoming.status;
    }
    if (!existing.rawInput && incoming.rawInput) {
        existing.rawInput = incoming.rawInput;
    }
    if (!existing.kind || existing.kind === 'other') {
        existing.kind = incoming.kind;
    }
    if ((!existing.title || existing.title === '') && incoming.title) {
        existing.title = incoming.title;
    }
    if ((!existing.locations || existing.locations.length === 0) &&
        incoming.locations &&
        incoming.locations.length > 0) {
        existing.locations = incoming.locations;
    }
}
/**
 * Builds a tool call message from a tool_result ChatRecord.
 */
function buildToolCallMessageFromResult(record, config) {
    const toolCallResult = record.toolCallResult;
    const toolName = extractToolNameFromRecord(record);
    // Skip todo_write tool - it's already handled by plan update in collect.ts
    // This prevents duplicate todo messages in the export
    if (toolName === ToolNames.TODO_WRITE) {
        return null;
    }
    const toolCallId = getToolResultCallId(record);
    const functionCallArgs = extractFunctionCallArgs(record);
    const { kind, title, locations } = resolveToolMetadata(config, toolName, functionCallArgs ??
        toolCallResult?.args);
    const rawInput = normalizeRawInput(functionCallArgs ??
        toolCallResult?.args);
    const resultContent = extractDiffContent(toolCallResult?.resultDisplay) ??
        transformPartsToToolCallContent(record.message?.parts ?? []);
    const content = isVisionBridgeNoticeDisplay(toolCallResult?.resultDisplay)
        ? [
            {
                type: 'content',
                content: {
                    type: 'text',
                    text: sanitizeTerminalText(formatVisionBridgeNoticeDisplay(toolCallResult.resultDisplay)),
                },
            },
            ...resultContent,
        ]
        : resultContent;
    return {
        uuid: record.uuid,
        parentUuid: record.parentUuid,
        sessionId: record.sessionId,
        timestamp: record.timestamp,
        type: 'tool_call',
        toolCall: {
            toolCallId,
            kind,
            title,
            status: toolCallResult?.error ? 'failed' : 'completed',
            rawInput,
            content,
            locations,
            timestamp: Date.parse(record.timestamp),
        },
    };
}
/**
 * Extracts tool name from a ChatRecord.
 */
function extractToolNameFromRecord(record) {
    if (!record.message?.parts) {
        return '';
    }
    for (const part of record.message.parts) {
        if ('functionResponse' in part && part.functionResponse?.name) {
            return part.functionResponse.name;
        }
    }
    return '';
}
/**
 * Extracts function call args from a ChatRecord.
 */
function extractFunctionCallArgs(record) {
    if (!record.message?.parts) {
        return undefined;
    }
    for (const part of record.message.parts) {
        if ('functionCall' in part && part.functionCall?.args) {
            return part.functionCall.args;
        }
    }
    return undefined;
}
/**
 * Resolves tool metadata (kind, title, locations) from tool registry.
 */
function resolveToolMetadata(config, toolName, args) {
    const toolRegistry = config.getToolRegistry?.();
    const tool = toolName ? toolRegistry?.getTool?.(toolName) : undefined;
    let title = tool?.displayName ?? toolName ?? 'tool_call';
    let locations;
    const kind = mapToolKind(tool?.kind, toolName);
    if (tool?.build && args) {
        try {
            const invocation = tool.build(args);
            title = `${title}: ${invocation.getDescription()}`;
            locations = invocation.toolLocations().map((loc) => ({
                path: loc.path,
                line: loc.line ?? null,
            }));
        }
        catch {
            // Keep defaults on build failure
        }
    }
    return { kind, title, locations };
}
/**
 * Maps tool kind to allowed export kinds.
 */
function mapToolKind(kind, toolName) {
    if (toolName &&
        (toolName === ToolNames.EXIT_PLAN_MODE ||
            toolName === ToolNames.ENTER_PLAN_MODE)) {
        return 'switch_mode';
    }
    if (toolName && toolName === ToolNames.TODO_WRITE) {
        return 'todowrite';
    }
    const allowedKinds = new Set([
        'read',
        'edit',
        'delete',
        'move',
        'search',
        'execute',
        'think',
        'fetch',
        'other',
    ]);
    if (kind && allowedKinds.has(kind)) {
        return kind;
    }
    return 'other';
}
/**
 * Extracts diff content from tool result display.
 */
function extractDiffContent(resultDisplay) {
    if (!resultDisplay || typeof resultDisplay !== 'object') {
        return null;
    }
    const display = resultDisplay;
    if ('fileName' in display && 'newContent' in display) {
        if (display['truncatedForSession'] === true) {
            return [
                {
                    type: 'content',
                    content: {
                        type: 'text',
                        text: buildTruncatedDiffPreviewText(display),
                    },
                },
            ];
        }
        return [
            {
                type: 'diff',
                path: display['fileName'],
                oldText: display['originalContent'] ?? '',
                newText: display['newContent'],
            },
        ];
    }
    return null;
}
/**
 * Normalizes raw input to string or object.
 */
function normalizeRawInput(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'object' && value !== null)
        return value;
    return undefined;
}
/**
 * Transforms Parts to tool call content array.
 */
function transformPartsToToolCallContent(parts) {
    const content = [];
    for (const part of parts) {
        if ('text' in part && part.text) {
            content.push({
                type: 'content',
                content: { type: 'text', text: part.text },
            });
            continue;
        }
        if ('functionResponse' in part && part.functionResponse) {
            const response = part.functionResponse.response;
            const outputField = response?.['output'];
            const errorField = response?.['error'];
            const responseText = typeof outputField === 'string'
                ? outputField
                : typeof errorField === 'string'
                    ? errorField
                    : JSON.stringify(response);
            content.push({
                type: 'content',
                content: { type: 'text', text: responseText },
            });
        }
    }
    return content;
}
//# sourceMappingURL=normalize.js.map