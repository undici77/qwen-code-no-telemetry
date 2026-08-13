/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReactToolScheduler, mapToDisplay, } from './useReactToolScheduler.js';
import { DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES, DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD, MAX_RETAINED_TOOL_RESULT_DISPLAY_CHARS, ApprovalMode, CoreToolScheduler, getRuntimeContentGenerator, MockTool, } from '@qwen-code/qwen-code-core';
import { ToolCallStatus } from '../types.js';
// Mocks
vi.mock('@qwen-code/qwen-code-core', async () => {
    const actual = await vi.importActual('@qwen-code/qwen-code-core');
    return {
        ...actual,
        ToolRegistry: vi.fn(),
        Config: vi.fn(),
    };
});
const mockToolRegistry = {
    getTool: vi.fn(),
    ensureTool: vi.fn(async (name) => mockToolRegistry.getTool(name)),
    getAllToolNames: vi.fn(() => ['mockTool', 'anotherTool']),
};
const mockConfig = {
    getToolRegistry: vi.fn(() => mockToolRegistry),
    getApprovalMode: vi.fn(() => ApprovalMode.DEFAULT),
    getSessionId: () => 'test-session-id',
    getUsageStatisticsEnabled: () => true,
    getDebugMode: () => false,
    storage: {
        getProjectTempDir: () => '/tmp',
    },
    getTruncateToolOutputThreshold: () => DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD,
    getTruncateToolOutputLines: () => DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES,
    getPermissionsAllow: vi.fn(() => []),
    getContentGeneratorConfig: () => ({
        model: 'test-model',
        authType: 'gemini',
    }),
    getBaseLlmClient: vi.fn(),
    getUseModelRouter: () => false,
    getGeminiClient: () => null, // No client needed for these tests
    getShellExecutionConfig: () => ({ terminalWidth: 80, terminalHeight: 24 }),
    getChatRecordingService: vi.fn(() => undefined),
    getMessageBus: vi.fn().mockReturnValue(undefined),
    getDisableAllHooks: vi.fn().mockReturnValue(true),
    getHookSystem: vi.fn().mockReturnValue(undefined),
    getDebugLogger: vi.fn().mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
};
const mockTool = new MockTool({
    name: 'mockTool',
    displayName: 'Mock Tool',
    execute: vi.fn(),
});
let mockOnUserConfirmForToolConfirmation;
const mockToolRequiresConfirmation = new MockTool({
    name: 'mockToolRequiresConfirmation',
    displayName: 'Mock Tool Requires Confirmation',
    execute: vi.fn(),
    getDefaultPermission: () => Promise.resolve('ask'),
    getConfirmationDetails: vi.fn(),
});
describe('useReactToolScheduler in YOLO Mode', () => {
    let onComplete;
    let setPendingHistoryItem;
    beforeEach(() => {
        onComplete = vi.fn();
        setPendingHistoryItem = vi.fn();
        mockToolRegistry.getTool.mockClear();
        mockToolRegistry.ensureTool.mockClear();
        mockConfig.getBaseLlmClient.mockReset();
        mockConfig.getChatRecordingService.mockReturnValue(undefined);
        mockToolRequiresConfirmation.execute.mockClear();
        mockToolRequiresConfirmation.getConfirmationDetails.mockClear();
        // IMPORTANT: Enable YOLO mode for this test suite
        mockConfig.getApprovalMode.mockReturnValue(ApprovalMode.YOLO);
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        // IMPORTANT: Disable YOLO mode after this test suite
        mockConfig.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
    });
    const renderSchedulerInYoloMode = () => renderHook(() => useReactToolScheduler(onComplete, mockConfig, setPendingHistoryItem, () => { }));
    it('should skip confirmation and execute tool directly when yoloMode is true', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockToolRequiresConfirmation);
        const expectedOutput = 'YOLO Confirmed output';
        mockToolRequiresConfirmation.execute.mockResolvedValue({
            llmContent: expectedOutput,
            returnDisplay: 'YOLO Formatted tool output',
        });
        const { result } = renderSchedulerInYoloMode();
        const schedule = result.current[1];
        const request = {
            callId: 'yoloCall',
            name: 'mockToolRequiresConfirmation',
            args: { data: 'any data' },
        };
        act(() => {
            schedule(request, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync(); // Process validation
        });
        await act(async () => {
            await vi.runAllTimersAsync(); // Process scheduling
        });
        await act(async () => {
            await vi.runAllTimersAsync(); // Process execution
        });
        // Check that execute WAS called
        expect(mockToolRequiresConfirmation.execute).toHaveBeenCalledWith(request.args);
        // Check that onComplete was called with success
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'success',
                request,
                response: expect.objectContaining({
                    resultDisplay: 'YOLO Formatted tool output',
                    responseParts: [
                        {
                            functionResponse: {
                                id: 'yoloCall',
                                name: 'mockToolRequiresConfirmation',
                                response: { output: expectedOutput },
                            },
                        },
                    ],
                }),
            }),
        ]);
        // Ensure no confirmation UI was triggered (setPendingHistoryItem should not have been called with confirmation details)
        const setPendingHistoryItemCalls = setPendingHistoryItem.mock.calls;
        const confirmationCall = setPendingHistoryItemCalls.find((call) => {
            const item = typeof call[0] === 'function' ? call[0]({}) : call[0];
            return item?.tools?.[0]?.confirmationDetails;
        });
        expect(confirmationCall).toBeUndefined();
    });
    it('keeps shell heartbeats out of liveOutput while retaining display chunks', async () => {
        let resolveExecute;
        let emitUpdate;
        const streamingTool = new MockTool({
            name: 'streamingTool',
            displayName: 'Streaming Tool',
            canUpdateOutput: true,
            execute: vi.fn((_params, _signal, updateOutput) => {
                emitUpdate = updateOutput;
                return new Promise((resolve) => {
                    resolveExecute = resolve;
                });
            }),
        });
        mockToolRegistry.getTool.mockReturnValue(streamingTool);
        const { result } = renderSchedulerInYoloMode();
        const schedule = result.current[1];
        act(() => {
            schedule({
                callId: 'hbCall',
                name: 'streamingTool',
                args: {},
            }, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        act(() => {
            emitUpdate('streamed text');
            emitUpdate({ type: 'shell_progress', elapsedMs: 10_000 });
        });
        const executing = result.current[0].find((tc) => tc.request.callId === 'hbCall');
        // The display chunk is retained; the later heartbeat did not replace it.
        expect(executing?.liveOutput).toBe('streamed text');
        act(() => {
            resolveExecute({
                llmContent: 'done',
                returnDisplay: 'done',
            });
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
    });
});
describe('useReactToolScheduler', () => {
    // TODO(ntaylormullen): The following tests are skipped due to difficulties in
    // reliably testing the asynchronous state updates and interactions with timers.
    // These tests involve complex sequences of events, including confirmations,
    // live output updates, and cancellations, which are challenging to assert
    // correctly with the current testing setup. Further investigation is needed
    // to find a robust way to test these scenarios.
    let onComplete;
    let setPendingHistoryItem;
    beforeEach(() => {
        onComplete = vi.fn();
        setPendingHistoryItem = vi.fn();
        mockToolRegistry.getTool.mockClear();
        mockToolRegistry.ensureTool.mockClear();
        mockTool.execute.mockClear();
        mockToolRequiresConfirmation.execute.mockClear();
        mockToolRequiresConfirmation.getConfirmationDetails.mockClear();
        mockConfig.getChatRecordingService.mockReturnValue(undefined);
        mockOnUserConfirmForToolConfirmation = vi.fn();
        mockToolRequiresConfirmation.getConfirmationDetails.mockImplementation(async () => ({
            onConfirm: mockOnUserConfirmForToolConfirmation,
            fileName: 'mockToolRequiresConfirmation.ts',
            fileDiff: 'Mock tool requires confirmation',
            type: 'edit',
            title: 'Mock Tool Requires Confirmation',
        }));
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });
    const renderScheduler = () => renderHook(() => useReactToolScheduler(onComplete, mockConfig, setPendingHistoryItem, () => { }));
    it('initial state should be empty', () => {
        const { result } = renderScheduler();
        expect(result.current[0]).toEqual([]);
    });
    it('should schedule and execute a tool call successfully', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        mockTool.execute.mockResolvedValue({
            llmContent: 'Tool output',
            returnDisplay: 'Formatted tool output',
        });
        const { result } = renderScheduler();
        const schedule = result.current[1];
        const request = {
            callId: 'call1',
            name: 'mockTool',
            args: { param: 'value' },
        };
        act(() => {
            schedule(request, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(mockTool.execute).toHaveBeenCalledWith(request.args);
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'success',
                request,
                response: expect.objectContaining({
                    resultDisplay: 'Formatted tool output',
                    responseParts: [
                        {
                            functionResponse: {
                                id: 'call1',
                                name: 'mockTool',
                                response: { output: 'Tool output' },
                            },
                        },
                    ],
                }),
            }),
        ]);
        expect(result.current[0]).toEqual([]);
    });
    it('resolves full-turn tool calls against the exact model runtime', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        const runtimeView = {
            contentGenerator: {},
            contentGeneratorConfig: {
                model: 'vision-agent',
                authType: 'openai',
            },
            model: 'vision-agent',
        };
        mockTool.execute.mockImplementation(async () => {
            expect(getRuntimeContentGenerator()).toBe(runtimeView);
            return {
                llmContent: 'Tool output',
                returnDisplay: 'Tool output',
            };
        });
        const resolveForModel = vi.fn().mockResolvedValue(runtimeView);
        mockConfig.getBaseLlmClient.mockReturnValue({
            resolveForModel,
        });
        const { result } = renderScheduler();
        const request = {
            callId: 'full-turn-call',
            name: 'mockTool',
            args: {},
        };
        act(() => {
            result.current[1]([request], new AbortController().signal, 'openai:vision-agent\0https://vision.example.com/v1\0');
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(resolveForModel).toHaveBeenCalledWith('openai:vision-agent\0https://vision.example.com/v1', { failClosed: true });
        expect(mockTool.execute).toHaveBeenCalled();
    });
    it('fails closed when the full-turn tool runtime cannot be resolved', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        const recordToolResult = vi.fn();
        mockConfig.getChatRecordingService.mockReturnValue({
            recordToolResult,
        });
        mockConfig.getBaseLlmClient.mockReturnValue({
            resolveForModel: vi.fn().mockRejectedValue(new Error('missing route')),
        });
        const { result } = renderScheduler();
        const request = {
            callId: 'unresolved-full-turn-call',
            name: 'mockTool',
            args: {},
        };
        act(() => {
            result.current[1]([request], new AbortController().signal, 'vision-agent\0');
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(mockTool.execute).not.toHaveBeenCalled();
        expect(recordToolResult).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'error',
                request,
                response: expect.objectContaining({
                    error: expect.objectContaining({
                        message: expect.stringContaining('tool was not executed'),
                    }),
                    executionStatus: 'not_started',
                }),
            }),
        ]);
    });
    it('fails closed when full-turn tool scheduling rejects', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        const runtimeView = {
            contentGenerator: {},
            contentGeneratorConfig: {
                model: 'vision-agent',
                authType: 'openai',
            },
            model: 'vision-agent',
        };
        mockConfig.getBaseLlmClient.mockReturnValue({
            resolveForModel: vi.fn().mockResolvedValue(runtimeView),
        });
        const scheduleSpy = vi
            .spyOn(CoreToolScheduler.prototype, 'schedule')
            .mockRejectedValueOnce(new Error('already running'));
        const { result } = renderScheduler();
        const request = {
            callId: 'rejected-full-turn-call',
            name: 'mockTool',
            args: {},
        };
        act(() => {
            result.current[1]([request], new AbortController().signal, 'vision-agent\0');
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(mockTool.execute).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'error',
                request,
                response: expect.objectContaining({
                    error: expect.objectContaining({
                        message: expect.stringContaining('tool was not executed'),
                    }),
                    executionStatus: 'not_started',
                }),
            }),
        ]);
        scheduleSpy.mockRestore();
    });
    it('should handle tool not found', async () => {
        mockToolRegistry.getTool.mockReturnValue(undefined);
        const { result } = renderScheduler();
        const schedule = result.current[1];
        const request = {
            callId: 'call1',
            name: 'nonexistentTool',
            args: {},
        };
        act(() => {
            schedule(request, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'error',
                request,
                response: expect.objectContaining({
                    error: expect.objectContaining({
                        message: expect.stringMatching(/Tool "nonexistentTool" not found in registry/),
                    }),
                }),
            }),
        ]);
        const errorMessage = onComplete.mock.calls[0][0][0].response.error.message;
        expect(errorMessage).toContain('Did you mean one of:');
        expect(errorMessage).toContain('"mockTool"');
        expect(errorMessage).toContain('"anotherTool"');
        expect(result.current[0]).toEqual([]);
    });
    it('should handle error during getDefaultPermission', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        const confirmError = new Error('Confirmation check failed');
        const originalGetDefaultPermission = mockTool.getDefaultPermission;
        mockTool.getDefaultPermission = () => Promise.reject(confirmError);
        const { result } = renderScheduler();
        const schedule = result.current[1];
        const request = {
            callId: 'call1',
            name: 'mockTool',
            args: {},
        };
        act(() => {
            schedule(request, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'error',
                request,
                response: expect.objectContaining({
                    error: confirmError,
                }),
            }),
        ]);
        expect(result.current[0]).toEqual([]);
        mockTool.getDefaultPermission = originalGetDefaultPermission;
    });
    it('should handle error during execute', async () => {
        mockToolRegistry.getTool.mockReturnValue(mockTool);
        const execError = new Error('Execution failed');
        mockTool.execute.mockRejectedValue(execError);
        const { result } = renderScheduler();
        const schedule = result.current[1];
        const request = {
            callId: 'call1',
            name: 'mockTool',
            args: {},
        };
        act(() => {
            schedule(request, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(onComplete).toHaveBeenCalledWith([
            expect.objectContaining({
                status: 'error',
                request,
                response: expect.objectContaining({
                    error: execError,
                }),
            }),
        ]);
        expect(result.current[0]).toEqual([]);
    });
    it('should schedule and execute multiple tool calls', async () => {
        const tool1 = new MockTool({
            name: 'tool1',
            displayName: 'Tool 1',
            execute: vi.fn().mockResolvedValue({
                llmContent: 'Output 1',
                returnDisplay: 'Display 1',
            }),
        });
        const tool2 = new MockTool({
            name: 'tool2',
            displayName: 'Tool 2',
            execute: vi.fn().mockResolvedValue({
                llmContent: 'Output 2',
                returnDisplay: 'Display 2',
            }),
        });
        mockToolRegistry.getTool.mockImplementation((name) => {
            if (name === 'tool1')
                return tool1;
            if (name === 'tool2')
                return tool2;
            return undefined;
        });
        const { result } = renderScheduler();
        const schedule = result.current[1];
        const requests = [
            { callId: 'multi1', name: 'tool1', args: { p: 1 } },
            { callId: 'multi2', name: 'tool2', args: { p: 2 } },
        ];
        act(() => {
            schedule(requests, new AbortController().signal);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(onComplete).toHaveBeenCalledTimes(1);
        const completedCalls = onComplete.mock.calls[0][0];
        expect(completedCalls.length).toBe(2);
        const call1Result = completedCalls.find((c) => c.request.callId === 'multi1');
        const call2Result = completedCalls.find((c) => c.request.callId === 'multi2');
        expect(call1Result).toMatchObject({
            status: 'success',
            request: requests[0],
            response: expect.objectContaining({
                resultDisplay: 'Display 1',
                responseParts: [
                    {
                        functionResponse: {
                            id: 'multi1',
                            name: 'tool1',
                            response: { output: 'Output 1' },
                        },
                    },
                ],
            }),
        });
        expect(call2Result).toMatchObject({
            status: 'success',
            request: requests[1],
            response: expect.objectContaining({
                resultDisplay: 'Display 2',
                responseParts: [
                    {
                        functionResponse: {
                            id: 'multi2',
                            name: 'tool2',
                            response: { output: 'Output 2' },
                        },
                    },
                ],
            }),
        });
        expect(result.current[0]).toEqual([]);
    });
    it('compacts live output before storing it in React state', async () => {
        vi.useRealTimers();
        const longOutput = `head-${'x'.repeat(MAX_RETAINED_TOOL_RESULT_DISPLAY_CHARS)}-tail`;
        let resolveExecution;
        const streamingTool = new MockTool({
            name: 'streamTool',
            displayName: 'Stream Tool',
            canUpdateOutput: true,
            execute: vi.fn((_params, _signal, updateOutput) => {
                updateOutput?.(longOutput);
                return new Promise((resolve) => {
                    resolveExecution = resolve;
                });
            }),
        });
        mockToolRegistry.getTool.mockReturnValue(streamingTool);
        const { result } = renderScheduler();
        const request = {
            callId: 'stream-call',
            name: 'streamTool',
            args: { param: 'value' },
        };
        act(() => {
            result.current[1](request, new AbortController().signal);
        });
        await waitFor(() => {
            expect(result.current[0].some((call) => call.status === 'executing')).toBe(true);
        });
        const executingCall = result.current[0].find((call) => call.status === 'executing');
        expect(executingCall?.liveOutput).not.toBe(longOutput);
        expect(executingCall?.liveOutput?.length).toBeLessThanOrEqual(MAX_RETAINED_TOOL_RESULT_DISPLAY_CHARS);
        expect(executingCall?.liveOutput).toContain('head-');
        expect(executingCall?.liveOutput).toContain('-tail');
        expect(executingCall?.liveOutput).toContain('truncated from');
        await act(async () => {
            resolveExecution({
                llmContent: 'done',
                returnDisplay: 'done',
            });
        });
        await waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        });
    });
});
describe('mapToDisplay', () => {
    const baseRequest = {
        callId: 'testCallId',
        name: 'testTool',
        args: { foo: 'bar' },
    };
    const baseTool = new MockTool({
        name: 'testTool',
        displayName: 'Test Tool Display',
        execute: vi.fn(),
    });
    const baseResponse = {
        callId: 'testCallId',
        responseParts: [
            {
                functionResponse: {
                    name: 'testTool',
                    id: 'testCallId',
                    response: { output: 'Test output' },
                },
            },
        ],
        resultDisplay: 'Test display output',
        error: undefined,
    };
    const baseInvocation = baseTool.build(baseRequest.args);
    const testCases = [
        {
            name: 'validating',
            status: 'validating',
            extraProps: { tool: baseTool, invocation: baseInvocation },
            expectedStatus: ToolCallStatus.Executing,
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'awaiting_approval',
            status: 'awaiting_approval',
            extraProps: {
                tool: baseTool,
                invocation: baseInvocation,
                confirmationDetails: {
                    onConfirm: vi.fn(),
                    type: 'edit',
                    title: 'Test Tool Display',
                    serverName: 'testTool',
                    toolName: 'testTool',
                    toolDisplayName: 'Test Tool Display',
                    filePath: 'mock',
                    fileName: 'test.ts',
                    fileDiff: 'Test diff',
                    originalContent: 'Original content',
                    newContent: 'New content',
                },
            },
            expectedStatus: ToolCallStatus.Confirming,
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'scheduled',
            status: 'scheduled',
            extraProps: { tool: baseTool, invocation: baseInvocation },
            expectedStatus: ToolCallStatus.Pending,
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'executing no live output',
            status: 'executing',
            extraProps: { tool: baseTool, invocation: baseInvocation },
            expectedStatus: ToolCallStatus.Executing,
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'executing with live output',
            status: 'executing',
            extraProps: {
                tool: baseTool,
                invocation: baseInvocation,
                liveOutput: 'Live test output',
            },
            expectedStatus: ToolCallStatus.Executing,
            expectedResultDisplay: 'Live test output',
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'success',
            status: 'success',
            extraProps: {
                tool: baseTool,
                invocation: baseInvocation,
                response: baseResponse,
            },
            expectedStatus: ToolCallStatus.Success,
            expectedResultDisplay: baseResponse.resultDisplay,
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'error tool not found',
            status: 'error',
            extraProps: {
                response: {
                    ...baseResponse,
                    error: new Error('Test error tool not found'),
                    resultDisplay: 'Error display tool not found',
                },
            },
            expectedStatus: ToolCallStatus.Error,
            expectedResultDisplay: 'Error display tool not found',
            expectedName: baseRequest.name,
            expectedDescription: JSON.stringify(baseRequest.args),
        },
        {
            name: 'error tool execution failed',
            status: 'error',
            extraProps: {
                tool: baseTool,
                response: {
                    ...baseResponse,
                    error: new Error('Tool execution failed'),
                    resultDisplay: 'Execution failed display',
                },
            },
            expectedStatus: ToolCallStatus.Error,
            expectedResultDisplay: 'Execution failed display',
            expectedName: baseTool.displayName, // Changed from baseTool.name
            expectedDescription: JSON.stringify(baseRequest.args),
        },
        {
            name: 'cancelled',
            status: 'cancelled',
            extraProps: {
                tool: baseTool,
                invocation: baseInvocation,
                response: {
                    ...baseResponse,
                    resultDisplay: 'Cancelled display',
                },
            },
            expectedStatus: ToolCallStatus.Canceled,
            expectedResultDisplay: 'Cancelled display',
            expectedName: baseTool.displayName,
            expectedDescription: baseInvocation.getDescription(),
        },
        {
            name: 'cancelled before tool resolution',
            status: 'cancelled',
            extraProps: {
                response: {
                    ...baseResponse,
                    resultDisplay: 'Cancelled before resolution',
                },
            },
            expectedStatus: ToolCallStatus.Canceled,
            expectedResultDisplay: 'Cancelled before resolution',
            expectedName: baseRequest.name,
            expectedDescription: JSON.stringify(baseRequest.args),
        },
    ];
    testCases.forEach(({ name: testName, status, extraProps, expectedStatus, expectedResultDisplay, expectedName, expectedDescription, }) => {
        it(`should map ToolCall with status '${status}' (${testName}) correctly`, () => {
            const toolCall = {
                request: baseRequest,
                status,
                ...(extraProps || {}),
            };
            const display = mapToDisplay(toolCall);
            expect(display.type).toBe('tool_group');
            expect(display.tools.length).toBe(1);
            const toolDisplay = display.tools[0];
            expect(toolDisplay.callId).toBe(baseRequest.callId);
            expect(toolDisplay.status).toBe(expectedStatus);
            expect(toolDisplay.resultDisplay).toBe(expectedResultDisplay);
            expect(toolDisplay.name).toBe(expectedName);
            expect(toolDisplay.description).toBe(expectedDescription);
            expect(toolDisplay.renderOutputAsMarkdown).toBe(extraProps?.tool?.isOutputMarkdown ?? false);
            if (status === 'awaiting_approval') {
                expect(toolDisplay.confirmationDetails).toBe(extraProps.confirmationDetails);
            }
            else {
                expect(toolDisplay.confirmationDetails).toBeUndefined();
            }
        });
    });
    it('should map an array of ToolCalls correctly', () => {
        const toolCall1 = {
            request: { ...baseRequest, callId: 'call1' },
            status: 'success',
            tool: baseTool,
            invocation: baseTool.build(baseRequest.args),
            response: { ...baseResponse, callId: 'call1' },
        };
        const toolForCall2 = new MockTool({
            name: baseTool.name,
            displayName: baseTool.displayName,
            isOutputMarkdown: true,
            execute: vi.fn(),
        });
        const toolCall2 = {
            request: { ...baseRequest, callId: 'call2' },
            status: 'executing',
            tool: toolForCall2,
            invocation: toolForCall2.build(baseRequest.args),
            liveOutput: 'markdown output',
            startTime: 1000000000,
            executionStartTime: 1234567890,
        };
        const display = mapToDisplay([toolCall1, toolCall2]);
        expect(display.tools.length).toBe(2);
        expect(display.tools[0].callId).toBe('call1');
        expect(display.tools[0].status).toBe(ToolCallStatus.Success);
        expect(display.tools[0].renderOutputAsMarkdown).toBe(false);
        expect(display.tools[1].callId).toBe('call2');
        expect(display.tools[1].status).toBe(ToolCallStatus.Executing);
        expect(display.tools[1].resultDisplay).toBe('markdown output');
        expect(display.tools[1].renderOutputAsMarkdown).toBe(true);
        expect(display.tools[1].executionStartTime).toBe(1234567890);
        expect(display.tools[0].executionStartTime).toBeUndefined();
    });
    it('compacts large resultDisplay values before storing display history', () => {
        const longDisplay = `head-${'x'.repeat(MAX_RETAINED_TOOL_RESULT_DISPLAY_CHARS)}-tail`;
        const toolCall = {
            request: { ...baseRequest, callId: 'large-output-call' },
            status: 'success',
            tool: baseTool,
            invocation: baseTool.build(baseRequest.args),
            response: {
                ...baseResponse,
                callId: 'large-output-call',
                resultDisplay: longDisplay,
            },
        };
        const display = mapToDisplay(toolCall);
        const resultDisplay = display.tools[0].resultDisplay;
        expect(typeof resultDisplay).toBe('string');
        expect(resultDisplay.length).toBeLessThanOrEqual(MAX_RETAINED_TOOL_RESULT_DISPLAY_CHARS);
        expect(resultDisplay).toContain('head-');
        expect(resultDisplay).toContain('-tail');
        expect(resultDisplay).toContain('truncated from');
    });
});
//# sourceMappingURL=useToolScheduler.test.js.map