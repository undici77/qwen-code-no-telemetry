/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import { computeApiTruncationIndex, isRealUserTurn } from './historyMapping.js';
import { CompressionStatus, SYSTEM_REMINDER_OPEN, SYSTEM_REMINDER_CLOSE, } from '@qwen-code/qwen-code-core';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function userContent(text) {
    return { role: 'user', parts: [{ text }] };
}
function modelContent(text) {
    return { role: 'model', parts: [{ text }] };
}
function functionResponseContent() {
    return {
        role: 'user',
        parts: [
            {
                functionResponse: { name: 'tool', response: { result: 'ok' } },
            },
        ],
    };
}
function startupEntry() {
    return userContent(`${SYSTEM_REMINDER_OPEN}\nEnvironment context...\n${SYSTEM_REMINDER_CLOSE}`);
}
function userItem(id, text = `prompt ${id}`, sentToModel) {
    return {
        type: 'user',
        id,
        text,
        ...(sentToModel === undefined ? {} : { sentToModel }),
    };
}
function geminiItem(id) {
    return { type: 'gemini', id, text: `response ${id}` };
}
function compressionItem(id, compressionStatus = CompressionStatus.COMPRESSED) {
    return {
        type: 'compression',
        id,
        compression: {
            isPending: false,
            originalTokenCount: 100,
            newTokenCount: 40,
            compressionStatus,
        },
    };
}
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('computeApiTruncationIndex', () => {
    it('returns 0 for empty API history', () => {
        const ui = [userItem(1)];
        const api = [];
        expect(computeApiTruncationIndex(ui, 1, api)).toBe(0);
    });
    describe('without startup context', () => {
        it('rewinds to the first user turn (keep nothing)', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
            ];
            const api = [
                userContent('prompt 1'),
                modelContent('response 1'),
                userContent('prompt 3'),
                modelContent('response 3'),
            ];
            // Rewind to turn 1 → keep 0 entries before it
            expect(computeApiTruncationIndex(ui, 1, api)).toBe(0);
        });
        it('rewinds to the second user turn (keep first turn)', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
            ];
            const api = [
                userContent('prompt 1'),
                modelContent('response 1'),
                userContent('prompt 3'),
                modelContent('response 3'),
            ];
            // Rewind to turn 3 → keep entries before the second user Content
            expect(computeApiTruncationIndex(ui, 3, api)).toBe(2);
        });
        it('rewinds to the third user turn', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
                userItem(5),
                geminiItem(6),
            ];
            const api = [
                userContent('prompt 1'),
                modelContent('response 1'),
                userContent('prompt 3'),
                modelContent('response 3'),
                userContent('prompt 5'),
                modelContent('response 5'),
            ];
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(4);
        });
    });
    describe('with startup context entry', () => {
        it('keeps startup context when rewinding to the first turn', () => {
            const ui = [userItem(1), geminiItem(2)];
            const api = [
                startupEntry(),
                userContent('prompt 1'),
                modelContent('response 1'),
            ];
            // Rewind to turn 1 -> keep startup entry.
            expect(computeApiTruncationIndex(ui, 1, api)).toBe(1);
        });
        it('keeps startup + first turn when rewinding to second turn', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
            ];
            const api = [
                startupEntry(),
                userContent('prompt 1'),
                modelContent('response 1'),
                userContent('prompt 3'),
                modelContent('response 3'),
            ];
            // startup(1) + turn1(2) = 3 entries to keep.
            expect(computeApiTruncationIndex(ui, 3, api)).toBe(3);
        });
    });
    describe('with mid-history system-reminder entries', () => {
        const mcpReminder = () => userContent(`${SYSTEM_REMINDER_OPEN}\nNew tools available: foo\n${SYSTEM_REMINDER_CLOSE}`);
        it('does not count an MCP added-tool reminder as a user prompt', () => {
            // drainPendingAddedMcpToolsReminder injects a pure <system-reminder>
            // user entry mid-history. It is role:'user' with text, so a naive count
            // treats it as a real prompt and lands the truncation index one turn
            // early, silently dropping a turn's context.
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
                userItem(5),
                geminiItem(6),
            ];
            const api = [
                startupEntry(),
                userContent('prompt 1'),
                modelContent('response 1'),
                mcpReminder(), // must NOT count as a user turn
                userContent('prompt 3'),
                modelContent('response 3'),
                userContent('prompt 5'),
                modelContent('response 5'),
            ];
            // Rewind to turn 5 (2 real turns before it). If the reminder counted,
            // the walk would stop at its successor (idx 4) and drop turn 3's
            // context; excluding it lands correctly at prompt 5 (idx 6).
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(6);
        });
        it('still counts a real turn that has a per-turn reminder prepended', () => {
            // In plan mode the reminder is an extra part on the SAME Content as the
            // prompt: parts = [<system-reminder>…, prompt]. That entry IS a real
            // user turn (it has a non-reminder prompt part), so it must be counted —
            // a parts[0]-only exclusion would wrongly skip it and miscount.
            const planTurn = (id) => ({
                role: 'user',
                parts: [
                    {
                        text: `${SYSTEM_REMINDER_OPEN}\nPlan mode is active.\n${SYSTEM_REMINDER_CLOSE}`,
                    },
                    { text: `prompt ${id}` },
                ],
            });
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
            ];
            const api = [
                startupEntry(),
                planTurn(1),
                modelContent('response 1'),
                planTurn(3),
                modelContent('response 3'),
            ];
            // Rewind to turn 3 → keep startup + turn 1 = 3 entries.
            expect(computeApiTruncationIndex(ui, 3, api)).toBe(3);
        });
    });
    describe('with tool call entries (functionResponse)', () => {
        it('skips functionResponse entries when counting user prompts', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                // tool_group items are not type 'user', they don't affect the count
                userItem(5),
                geminiItem(6),
            ];
            const api = [
                userContent('prompt 1'),
                modelContent('response with tool call'),
                functionResponseContent(), // tool result — should be skipped
                modelContent('response after tool'),
                userContent('prompt 5'),
                modelContent('response 5'),
            ];
            // Rewind to turn 5: 1 user turn before it → find the 2nd user text
            // API walk: idx 0 = user text (count=1), idx 4 = user text (count=2 > 1) → return 4
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(4);
        });
    });
    describe('compression fallback', () => {
        it('returns -1 when not enough user prompts found', () => {
            const ui = [
                userItem(1),
                geminiItem(2),
                userItem(3),
                geminiItem(4),
                userItem(5),
                geminiItem(6),
            ];
            // After compression, API history may be shorter than expected
            const api = [
                modelContent('compressed summary'),
                userContent('prompt 5'),
                modelContent('response 5'),
            ];
            // Rewind to turn 5 → 2 user turns before it, but API only has 1 user text
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(-1);
        });
        it('maps post-compression UI turns from the latest compressed marker', () => {
            const ui = [
                userItem(1, 'pre-compression prompt'),
                geminiItem(2),
                compressionItem(3),
                userItem(4, 'post 1'),
                geminiItem(5),
                userItem(6, 'post 2'),
                geminiItem(7),
                userItem(8, 'post 3'),
                geminiItem(9),
            ];
            const api = [
                startupEntry(),
                userContent('<state_snapshot>summary\n\nResume the prior task...'),
                modelContent('Got it. Thanks for the additional context!'),
                userContent('post 1'),
                modelContent('response 1'),
                userContent('post 2'),
                modelContent('response 2'),
                userContent('post 3'),
                modelContent('response 3'),
            ];
            expect(computeApiTruncationIndex(ui, 4, api)).toBe(3);
            expect(computeApiTruncationIndex(ui, 6, api)).toBe(5);
            expect(computeApiTruncationIndex(ui, 8, api)).toBe(7);
        });
        it('does not rewind to UI turns before a successful compression marker', () => {
            const ui = [
                userItem(1, 'pre-compression prompt'),
                geminiItem(2),
                compressionItem(3),
                userItem(4, 'post compression'),
            ];
            const api = [
                startupEntry(),
                userContent('<state_snapshot>summary\n\nResume the prior task...'),
                modelContent('Got it. Thanks for the additional context!'),
                userContent('post compression'),
            ];
            expect(computeApiTruncationIndex(ui, 1, api)).toBe(-1);
        });
        it('does not treat no-op compression markers as collapsed history', () => {
            const ui = [
                userItem(1, 'first prompt'),
                geminiItem(2),
                compressionItem(3, CompressionStatus.NOOP),
                userItem(4, 'second prompt'),
                geminiItem(5),
            ];
            const api = [
                startupEntry(),
                userContent('first prompt'),
                modelContent('response 1'),
                userContent('second prompt'),
                modelContent('response 2'),
            ];
            expect(computeApiTruncationIndex(ui, 4, api)).toBe(3);
        });
    });
    describe('mid-turn user messages (notification type)', () => {
        it('skips notification items so btw merged into functionResponse does not cause mismatch', () => {
            // Mid-turn messages are type 'notification' in UI (not counted by
            // isRealUserTurn) and merged into tool_result in API (skipped by
            // isUserTextContent). Both sides agree → correct truncation index.
            const ui = [
                userItem(1, 'first prompt'),
                geminiItem(2),
                {
                    type: 'notification',
                    id: 3,
                    text: 'btw side question',
                },
                userItem(5, 'next prompt'),
                geminiItem(6),
            ];
            const btwMergedIntoToolResult = {
                role: 'user',
                parts: [
                    {
                        functionResponse: { name: 'tool', response: { result: 'ok' } },
                    },
                    { text: 'btw side question' },
                ],
            };
            const api = [
                userContent('first prompt'),
                modelContent('response with tool call'),
                btwMergedIntoToolResult,
                modelContent('response after btw'),
                userContent('next prompt'),
                modelContent('response 5'),
            ];
            // notification is not counted → uiUserTurnCount=1 before 'next prompt'
            // API has 2 user text entries (idx 0 and 4) → finds idx 4 correctly
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(4);
        });
    });
    describe('with slash-command items in UI history', () => {
        it('ignores slash-command items when counting user turns', () => {
            const ui = [
                userItem(1, 'hello'),
                geminiItem(2),
                userItem(3, '/help'), // slash command — should be skipped
                userItem(5, 'world'),
                geminiItem(6),
            ];
            const api = [
                userContent('hello'),
                modelContent('response 1'),
                userContent('world'),
                modelContent('response 2'),
            ];
            // Rewind to 'world' (id=5): 1 real user turn before it (id=1)
            // Slash '/help' (id=3) should not be counted
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(2);
        });
        it('counts path-like slash prompts that were sent to the model', () => {
            const ui = [
                userItem(1, 'hello'),
                geminiItem(2),
                userItem(3, '/api/apiFunction/接口的实现'),
                geminiItem(4),
                userItem(5, 'world'),
                geminiItem(6),
            ];
            const api = [
                userContent('hello'),
                modelContent('response 1'),
                userContent('/api/apiFunction/接口的实现'),
                modelContent('response 2'),
                userContent('world'),
                modelContent('response 3'),
            ];
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(4);
        });
        it('counts slash command invocations explicitly marked as sent to the model', () => {
            const ui = [
                userItem(1, 'hello'),
                geminiItem(2),
                userItem(3, '/filecmd', true),
                geminiItem(4),
                userItem(5, 'world'),
                geminiItem(6),
            ];
            const api = [
                userContent('hello'),
                modelContent('response 1'),
                userContent('expanded file command prompt'),
                modelContent('response 2'),
                userContent('world'),
                modelContent('response 3'),
            ];
            expect(computeApiTruncationIndex(ui, 5, api)).toBe(4);
        });
    });
    describe('single turn', () => {
        it('handles rewinding the only turn', () => {
            const ui = [userItem(1), geminiItem(2)];
            const api = [
                userContent('prompt 1'),
                modelContent('response 1'),
            ];
            expect(computeApiTruncationIndex(ui, 1, api)).toBe(0);
        });
    });
});
describe('isRealUserTurn', () => {
    it('returns true for normal user prompts', () => {
        expect(isRealUserTurn(userItem(1, 'hello world'))).toBe(true);
    });
    it('returns false for slash commands', () => {
        expect(isRealUserTurn(userItem(1, '/help'))).toBe(false);
        expect(isRealUserTurn(userItem(1, '/rewind'))).toBe(false);
        expect(isRealUserTurn(userItem(1, '/stats'))).toBe(false);
    });
    it('uses explicit model-sent metadata for slash commands', () => {
        expect(isRealUserTurn(userItem(1, '/filecmd', true))).toBe(true);
        expect(isRealUserTurn(userItem(1, '/help', false))).toBe(false);
    });
    it('ignores corrupted non-boolean sentToModel metadata', () => {
        const item = {
            type: 'user',
            id: 1,
            text: '/filecmd',
            sentToModel: 'true',
        };
        expect(isRealUserTurn(item)).toBe(false);
    });
    it('returns true for path-like slash prompts', () => {
        expect(isRealUserTurn(userItem(1, '/api/apiFunction/接口的实现'))).toBe(true);
        expect(isRealUserTurn(userItem(1, '/Users/name/project 帮我安装'))).toBe(true);
    });
    it('returns false for ? commands', () => {
        expect(isRealUserTurn(userItem(1, '?help'))).toBe(false);
    });
    it('returns false for non-user items', () => {
        expect(isRealUserTurn(geminiItem(1))).toBe(false);
        expect(isRealUserTurn({ type: 'info', id: 1, text: 'info' })).toBe(false);
    });
    it('returns true for user items with suppressOnRestore', () => {
        const item = userItem(1, 'hello world');
        item.display = { suppressOnRestore: true };
        expect(isRealUserTurn(item)).toBe(true);
    });
});
//# sourceMappingURL=historyMapping.test.js.map