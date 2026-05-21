/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolCallStatus } from '../../types.js';
/**
 * Convert AgentMessage[] + pendingApprovals into HistoryItem[].
 *
 * Consecutive tool_call / tool_result messages are merged into a single
 * tool_group HistoryItem. pendingApprovals overlays confirmation state so
 * ToolGroupMessage can render confirmation dialogs.
 *
 * liveOutputs (optional) provides real-time display data for executing tools.
 * shellPids (optional) provides PTY PIDs for interactive shell tools so
 * HistoryItemDisplay can render ShellInputPrompt on the active shell.
 */
export function agentMessagesToHistoryItems(messages, pendingApprovals, liveOutputs, shellPids, executionStartTimes) {
    const items = [];
    let nextId = 0;
    let i = 0;
    while (i < messages.length) {
        const msg = messages[i];
        // ── user ──────────────────────────────────────────────────
        if (msg.role === 'user') {
            items.push({ type: 'user', text: msg.content, id: nextId++ });
            i++;
            // ── assistant ─────────────────────────────────────────────
        }
        else if (msg.role === 'assistant') {
            if (msg.metadata?.['error']) {
                items.push({ type: 'error', text: msg.content, id: nextId++ });
            }
            else if (msg.thought) {
                items.push({ type: 'gemini_thought', text: msg.content, id: nextId++ });
            }
            else {
                items.push({ type: 'gemini', text: msg.content, id: nextId++ });
            }
            i++;
            // ── info / warning / success / error ──────────────────────
        }
        else if (msg.role === 'info') {
            const level = msg.metadata?.['level'];
            const type = level === 'warning' || level === 'success' || level === 'error'
                ? level
                : 'info';
            items.push({ type, text: msg.content, id: nextId++ });
            i++;
            // ── tool_call / tool_result → tool_group ──────────────────
        }
        else if (msg.role === 'tool_call' || msg.role === 'tool_result') {
            const groupId = nextId++;
            const callMap = new Map();
            const callOrder = [];
            while (i < messages.length &&
                (messages[i].role === 'tool_call' ||
                    messages[i].role === 'tool_result')) {
                const m = messages[i];
                const callId = m.metadata?.['callId'] ?? `unknown-${i}`;
                if (m.role === 'tool_call') {
                    if (!callMap.has(callId))
                        callOrder.push(callId);
                    callMap.set(callId, {
                        callId,
                        name: m.metadata?.['toolName'] ?? 'unknown',
                        description: m.metadata?.['description'] ?? '',
                        resultDisplay: undefined,
                        outputFile: undefined,
                        renderOutputAsMarkdown: m.metadata?.['renderOutputAsMarkdown'],
                        success: undefined,
                    });
                }
                else {
                    // tool_result — attach to existing call entry
                    const entry = callMap.get(callId);
                    const resultDisplay = m.metadata?.['resultDisplay'];
                    const outputFile = m.metadata?.['outputFile'];
                    const success = m.metadata?.['success'];
                    if (entry) {
                        entry.success = success;
                        entry.resultDisplay = resultDisplay;
                        entry.outputFile = outputFile;
                    }
                    else {
                        // Result arrived without a prior tool_call message (shouldn't
                        // normally happen, but handle gracefully)
                        callOrder.push(callId);
                        callMap.set(callId, {
                            callId,
                            name: m.metadata?.['toolName'] ?? 'unknown',
                            description: '',
                            resultDisplay,
                            outputFile,
                            renderOutputAsMarkdown: undefined,
                            success,
                        });
                    }
                }
                i++;
            }
            const tools = callOrder.map((callId) => {
                const entry = callMap.get(callId);
                const approval = pendingApprovals.get(callId);
                let status;
                if (approval) {
                    status = ToolCallStatus.Confirming;
                }
                else if (entry.success === undefined) {
                    status = ToolCallStatus.Executing;
                }
                else if (entry.success) {
                    status = ToolCallStatus.Success;
                }
                else {
                    status = ToolCallStatus.Error;
                }
                // For executing tools, use live output if available (Gap 4)
                const resultDisplay = status === ToolCallStatus.Executing && liveOutputs?.has(callId)
                    ? liveOutputs.get(callId)
                    : entry.resultDisplay;
                return {
                    callId: entry.callId,
                    name: entry.name,
                    description: entry.description,
                    resultDisplay,
                    outputFile: entry.outputFile,
                    renderOutputAsMarkdown: entry.renderOutputAsMarkdown,
                    status,
                    confirmationDetails: approval,
                    ptyId: status === ToolCallStatus.Executing
                        ? shellPids?.get(callId)
                        : undefined,
                    executionStartTime: status === ToolCallStatus.Executing
                        ? executionStartTimes?.get(callId)
                        : undefined,
                };
            });
            items.push({ type: 'tool_group', tools, id: groupId });
        }
        else {
            // Skip unknown roles
            i++;
        }
    }
    return items;
}
//# sourceMappingURL=agentHistoryAdapter.js.map