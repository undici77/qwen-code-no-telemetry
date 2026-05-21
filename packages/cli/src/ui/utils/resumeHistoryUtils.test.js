/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildResumedHistoryItems } from './resumeHistoryUtils.js';
import { ToolCallStatus } from '../types.js';
const makeConfig = (tools) => ({
    getToolRegistry: () => ({
        getTool: (name) => tools[name],
    }),
    getContentGenerator: () => ({
        // Default to showing full thinking content during resume unless explicitly
        // summarized; tests don't care about summarized thinking behavior.
        useSummarizedThinking: () => false,
    }),
});
describe('resumeHistoryUtils', () => {
    let mockTool;
    beforeEach(() => {
        const mockInvocation = {
            getDescription: () => 'Mocked description',
        };
        mockTool = {
            name: 'replace',
            displayName: 'Replace',
            description: 'Replace text',
            build: vi.fn().mockReturnValue(mockInvocation),
        };
    });
    it('converts conversation into history items with incremental ids', () => {
        const conversation = {
            messages: [
                {
                    type: 'user',
                    message: { parts: [{ text: 'Hello' }] },
                },
                {
                    type: 'assistant',
                    message: {
                        parts: [
                            { text: 'Hi there' },
                            {
                                functionCall: {
                                    id: 'call-1',
                                    name: 'replace',
                                    args: { old: 'a', new: 'b' },
                                },
                            },
                        ],
                    },
                },
                {
                    type: 'tool_result',
                    toolCallResult: {
                        callId: 'call-1',
                        resultDisplay: 'All set',
                        status: 'success',
                    },
                },
            ],
        };
        const session = {
            conversation,
        };
        const baseTimestamp = 1_000;
        const items = buildResumedHistoryItems(session, makeConfig({ replace: mockTool }), baseTimestamp);
        expect(items).toEqual([
            { id: baseTimestamp + 1, type: 'user', text: 'Hello' },
            { id: baseTimestamp + 2, type: 'gemini', text: 'Hi there' },
            {
                id: baseTimestamp + 3,
                type: 'tool_group',
                tools: [
                    {
                        callId: 'call-1',
                        name: 'Replace',
                        description: 'Mocked description',
                        resultDisplay: 'All set',
                        status: ToolCallStatus.Success,
                        confirmationDetails: undefined,
                    },
                ],
            },
        ]);
    });
    it('restores mid-turn user messages from display text', () => {
        const conversation = {
            messages: [
                {
                    type: 'tool_result',
                    toolCallResult: {
                        callId: 'call-1',
                        resultDisplay: 'All set',
                        status: 'success',
                    },
                },
                {
                    type: 'user',
                    subtype: 'mid_turn_user_message',
                    message: {
                        parts: [
                            {
                                text: '\n[User message received during tool execution]: save logs',
                            },
                        ],
                    },
                    systemPayload: { displayText: 'save logs' },
                },
            ],
        };
        const session = {
            conversation,
        };
        const items = buildResumedHistoryItems(session, makeConfig({ replace: mockTool }), 20);
        expect(items).toContainEqual({ id: 21, type: 'user', text: 'save logs' });
    });
    it('marks tool results as error, captures thought text, and falls back when tool is missing', () => {
        const conversation = {
            messages: [
                {
                    type: 'assistant',
                    message: {
                        parts: [
                            {
                                text: 'should be skipped',
                                thought: { subject: 'hidden' },
                            },
                            { text: 'visible text' },
                            {
                                functionCall: {
                                    id: 'missing-call',
                                    name: 'unknown_tool',
                                    args: { foo: 'bar' },
                                },
                            },
                        ],
                    },
                },
                {
                    type: 'tool_result',
                    toolCallResult: {
                        callId: 'missing-call',
                        resultDisplay: { summary: 'failure' },
                        status: 'error',
                    },
                },
            ],
        };
        const session = {
            conversation,
        };
        const items = buildResumedHistoryItems(session, makeConfig({}));
        expect(items).toEqual([
            {
                id: expect.any(Number),
                type: 'gemini_thought',
                text: 'should be skipped',
            },
            { id: expect.any(Number), type: 'gemini', text: 'visible text' },
            {
                id: expect.any(Number),
                type: 'tool_group',
                tools: [
                    {
                        callId: 'missing-call',
                        name: 'unknown_tool',
                        description: '',
                        resultDisplay: { summary: 'failure' },
                        status: ToolCallStatus.Error,
                        confirmationDetails: undefined,
                    },
                ],
            },
        ]);
    });
    it('flushes pending tool groups before subsequent user messages', () => {
        const conversation = {
            messages: [
                {
                    type: 'assistant',
                    message: {
                        parts: [
                            {
                                functionCall: {
                                    id: 'call-2',
                                    name: 'replace',
                                    args: { target: 'a' },
                                },
                            },
                        ],
                    },
                },
                {
                    type: 'user',
                    message: { parts: [{ text: 'next user message' }] },
                },
            ],
        };
        const session = {
            conversation,
        };
        const items = buildResumedHistoryItems(session, makeConfig({ replace: mockTool }), 10);
        expect(items[0]).toEqual({
            id: 11,
            type: 'tool_group',
            tools: [
                {
                    callId: 'call-2',
                    name: 'Replace',
                    description: 'Mocked description',
                    resultDisplay: undefined,
                    status: ToolCallStatus.Success,
                    confirmationDetails: undefined,
                },
            ],
        });
        expect(items[1]).toEqual({
            id: 12,
            type: 'user',
            text: 'next user message',
        });
    });
    it('replays slash command history items (e.g., /about) on resume', () => {
        const conversation = {
            messages: [
                {
                    type: 'system',
                    subtype: 'slash_command',
                    systemPayload: {
                        phase: 'invocation',
                        rawCommand: '/about',
                    },
                },
                {
                    type: 'system',
                    subtype: 'slash_command',
                    systemPayload: {
                        phase: 'result',
                        rawCommand: '/about',
                        outputHistoryItems: [
                            {
                                type: 'about',
                                systemInfo: {
                                    cliVersion: '1.2.3',
                                    osPlatform: 'darwin',
                                    osArch: 'arm64',
                                    osRelease: 'test',
                                    nodeVersion: '20.x',
                                    npmVersion: '10.x',
                                    sandboxEnv: 'none',
                                    modelVersion: 'qwen',
                                    selectedAuthType: 'none',
                                    ideClient: 'none',
                                    sessionId: 'abc',
                                    memoryUsage: '0 MB',
                                },
                            },
                        ],
                    },
                },
                {
                    type: 'assistant',
                    message: { parts: [{ text: 'Follow-up' }] },
                },
            ],
        };
        const session = {
            conversation,
        };
        const items = buildResumedHistoryItems(session, makeConfig({}), 5);
        expect(items).toEqual([
            { id: 6, type: 'user', text: '/about' },
            {
                id: 7,
                type: 'about',
                systemInfo: expect.objectContaining({ cliVersion: '1.2.3' }),
            },
            { id: 8, type: 'gemini', text: 'Follow-up' },
        ]);
    });
});
//# sourceMappingURL=resumeHistoryUtils.test.js.map