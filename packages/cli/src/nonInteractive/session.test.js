/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SendMessageType } from '@qwen-code/qwen-code-core';
import { runNonInteractiveStreamJson } from './session.js';
import { StreamJsonInputReader } from './io/StreamJsonInputReader.js';
import { StreamJsonOutputAdapter } from './io/StreamJsonOutputAdapter.js';
import { ControlDispatcher } from './control/ControlDispatcher.js';
import { ControlContext } from './control/ControlContext.js';
import { ControlService } from './control/ControlService.js';
const runNonInteractiveMock = vi.fn();
// Mock dependencies
vi.mock('../nonInteractiveCli.js', () => ({
    runNonInteractive: (...args) => runNonInteractiveMock(...args),
}));
vi.mock('./io/StreamJsonInputReader.js', () => ({
    StreamJsonInputReader: vi.fn(),
}));
vi.mock('./io/StreamJsonOutputAdapter.js', () => ({
    StreamJsonOutputAdapter: vi.fn(),
}));
vi.mock('./control/ControlDispatcher.js', () => ({
    ControlDispatcher: vi.fn(),
}));
vi.mock('./control/ControlContext.js', () => ({
    ControlContext: vi.fn(),
}));
vi.mock('./control/ControlService.js', () => ({
    ControlService: vi.fn(),
}));
let mockMonitorRegistry;
let mockBackgroundShellRegistry;
let mockBackgroundTaskRegistry;
function createConfig(overrides = {}) {
    const base = {
        getSessionId: () => 'test-session',
        getModel: () => 'test-model',
        getIncludePartialMessages: () => false,
        getDebugMode: () => false,
        getApprovalMode: () => 'auto',
        getOutputFormat: () => 'stream-json',
        initialize: vi.fn(),
        waitForMcpReady: vi.fn().mockResolvedValue(undefined),
        getMonitorRegistry: () => mockMonitorRegistry,
        getBackgroundShellRegistry: () => mockBackgroundShellRegistry,
        getBackgroundTaskRegistry: () => mockBackgroundTaskRegistry,
    };
    return { ...base, ...overrides };
}
function createUserMessage(content) {
    return {
        type: 'user',
        session_id: 'test-session',
        message: {
            role: 'user',
            content,
        },
        parent_tool_use_id: null,
    };
}
function createControlRequest(subtype = 'initialize') {
    if (subtype === 'set_model') {
        return {
            type: 'control_request',
            request_id: 'req-1',
            request: {
                subtype: 'set_model',
                model: 'test-model',
            },
        };
    }
    if (subtype === 'interrupt') {
        return {
            type: 'control_request',
            request_id: 'req-1',
            request: {
                subtype: 'interrupt',
            },
        };
    }
    return {
        type: 'control_request',
        request_id: 'req-1',
        request: {
            subtype: 'initialize',
        },
    };
}
function createControlResponse(requestId) {
    return {
        type: 'control_response',
        response: {
            subtype: 'success',
            request_id: requestId,
            response: {},
        },
    };
}
function createControlCancel(requestId) {
    return {
        type: 'control_cancel_request',
        request_id: requestId,
    };
}
describe('runNonInteractiveStreamJson', () => {
    let config;
    let mockInputReader;
    let mockOutputAdapter;
    let mockDispatcher;
    beforeEach(() => {
        mockMonitorRegistry = {
            setNotificationCallback: vi.fn(),
            setRegisterCallback: vi.fn(),
            abortAll: vi.fn(),
        };
        mockBackgroundShellRegistry = {
            abortAll: vi.fn(),
        };
        mockBackgroundTaskRegistry = {
            abortAll: vi.fn(),
        };
        config = createConfig();
        runNonInteractiveMock.mockReset();
        // Setup mocks
        mockOutputAdapter = {
            emitResult: vi.fn(),
            emitUserMessage: vi.fn(),
            emitSystemMessage: vi.fn(),
        };
        StreamJsonOutputAdapter.mockImplementation(() => mockOutputAdapter);
        mockDispatcher = {
            dispatch: vi.fn().mockResolvedValue(undefined),
            handleControlResponse: vi.fn(),
            handleCancel: vi.fn(),
            shutdown: vi.fn(),
            markInputClosed: vi.fn(),
            getPendingIncomingRequestCount: vi.fn().mockReturnValue(0),
            waitForPendingIncomingRequests: vi.fn().mockResolvedValue(undefined),
            sdkMcpController: {
                createSendSdkMcpMessage: vi.fn().mockReturnValue(vi.fn()),
            },
        };
        ControlDispatcher.mockImplementation(() => mockDispatcher);
        ControlContext.mockImplementation(() => ({}));
        ControlService.mockImplementation(() => ({}));
        mockInputReader = {
            async *read() {
                // Default: empty stream
                // Override in tests as needed
            },
        };
        StreamJsonInputReader.mockImplementation(() => mockInputReader);
        runNonInteractiveMock.mockResolvedValue(undefined);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('initializes session and processes initialize control request', async () => {
        const initRequest = createControlRequest('initialize');
        mockInputReader.read = async function* () {
            yield initRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.dispatch).toHaveBeenCalledWith(initRequest);
    });
    it('processes user message when received as first message', async () => {
        const userMessage = createUserMessage('Hello world');
        mockInputReader.read = async function* () {
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(1);
        const runCall = runNonInteractiveMock.mock.calls[0];
        expect(runCall[2]).toBe('Hello world'); // Direct text, not processed
        expect(typeof runCall[3]).toBe('string'); // promptId
        expect(runCall[4]).toEqual(expect.objectContaining({
            abortController: expect.any(AbortController),
            adapter: mockOutputAdapter,
        }));
    });
    it('processes multiple user messages sequentially', async () => {
        // Initialize first to enable multi-query mode
        const initRequest = createControlRequest('initialize');
        const userMessage1 = createUserMessage('First message');
        const userMessage2 = createUserMessage('Second message');
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage1;
            yield userMessage2;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
    });
    it('routes monitor notifications through the session queue', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Start a monitor');
        let closeInput;
        let registerCallback;
        let monitorCallback;
        mockMonitorRegistry.setRegisterCallback.mockImplementation((cb) => {
            registerCallback = cb;
        });
        mockMonitorRegistry.setNotificationCallback.mockImplementation((cb) => {
            monitorCallback = cb;
        });
        const notificationXml = '<task-notification>\n' +
            '<task-id>mon_1</task-id>\n' +
            '<kind>monitor</kind>\n' +
            '<status>running</status>\n' +
            '<summary>Monitor emitted event #1.</summary>\n' +
            '<result>ready</result>\n' +
            '</task-notification>';
        runNonInteractiveMock
            .mockImplementationOnce(async () => {
            registerCallback?.({
                monitorId: 'mon_1',
                toolUseId: 'tool_mon_1',
                description: 'logs',
            });
            monitorCallback?.('Monitor "logs" event #1: ready', notificationXml, {
                monitorId: 'mon_1',
                toolUseId: 'tool_mon_1',
                status: 'running',
            });
        })
            .mockResolvedValueOnce(undefined);
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
            await new Promise((resolve) => {
                closeInput = resolve;
            });
        };
        const sessionPromise = runNonInteractiveStreamJson(config, '');
        await vi.waitFor(() => {
            expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
        });
        closeInput?.();
        await sessionPromise;
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
        expect(mockOutputAdapter.emitSystemMessage).toHaveBeenCalledWith('task_started', {
            task_id: 'mon_1',
            tool_use_id: 'tool_mon_1',
            description: 'logs',
        });
        expect(mockOutputAdapter.emitUserMessage).toHaveBeenCalledWith([
            { text: 'Monitor "logs" event #1: ready' },
        ]);
        expect(mockOutputAdapter.emitSystemMessage).toHaveBeenCalledWith('task_notification', {
            task_id: 'mon_1',
            tool_use_id: 'tool_mon_1',
            status: 'running',
        });
        expect(runNonInteractiveMock).toHaveBeenNthCalledWith(2, config, expect.objectContaining({ merged: expect.any(Object) }), notificationXml, expect.stringContaining('test-session'), expect.objectContaining({
            adapter: mockOutputAdapter,
            sendMessageType: SendMessageType.Notification,
            notificationDisplayText: 'Monitor "logs" event #1: ready',
            captureMonitorNotifications: false,
            captureMonitorRegistrations: false,
        }));
    });
    it('stops accepting new monitor events before EOF drain', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Start a monitor');
        let closeInput;
        let registerCallback;
        let notificationCallback;
        mockMonitorRegistry.setRegisterCallback.mockImplementation((cb) => {
            registerCallback = cb;
        });
        mockMonitorRegistry.setNotificationCallback.mockImplementation((cb) => {
            notificationCallback = cb;
        });
        let releaseFirstTurn;
        runNonInteractiveMock.mockImplementationOnce(async () => {
            registerCallback?.({
                monitorId: 'mon_before_eof',
                toolUseId: 'tool_mon_before_eof',
                description: 'before eof',
            });
            notificationCallback?.('Monitor "before eof" event #1: ready', '<task-notification>before-eof</task-notification>', {
                monitorId: 'mon_before_eof',
                toolUseId: 'tool_mon_before_eof',
                status: 'running',
            });
            await new Promise((resolve) => {
                releaseFirstTurn = () => {
                    registerCallback?.({
                        monitorId: 'mon_late',
                        toolUseId: 'tool_mon_late',
                        description: 'late monitor',
                    });
                    notificationCallback?.('Monitor "late monitor" event #1: ignored', '<task-notification>late</task-notification>', {
                        monitorId: 'mon_late',
                        toolUseId: 'tool_mon_late',
                        status: 'running',
                    });
                    resolve();
                };
            });
        });
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
            await new Promise((resolve) => {
                closeInput = resolve;
            });
        };
        const sessionPromise = runNonInteractiveStreamJson(config, '');
        await vi.waitFor(() => {
            expect(runNonInteractiveMock).toHaveBeenCalledTimes(1);
        });
        closeInput?.();
        await vi.waitFor(() => {
            expect(mockMonitorRegistry.setNotificationCallback).toHaveBeenLastCalledWith(undefined);
            expect(mockMonitorRegistry.setRegisterCallback).toHaveBeenLastCalledWith(undefined);
        });
        releaseFirstTurn?.();
        await sessionPromise;
        expect(mockOutputAdapter.emitSystemMessage).toHaveBeenCalledWith('task_started', {
            task_id: 'mon_before_eof',
            tool_use_id: 'tool_mon_before_eof',
            description: 'before eof',
        });
        expect(mockOutputAdapter.emitSystemMessage).not.toHaveBeenCalledWith('task_started', expect.objectContaining({ task_id: 'mon_late' }));
        expect(mockOutputAdapter.emitSystemMessage).toHaveBeenCalledWith('task_notification', {
            task_id: 'mon_before_eof',
            tool_use_id: 'tool_mon_before_eof',
            status: 'running',
        });
        expect(mockOutputAdapter.emitSystemMessage).not.toHaveBeenCalledWith('task_notification', expect.objectContaining({ task_id: 'mon_late' }));
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
        const clearCalls = mockMonitorRegistry.setNotificationCallback.mock.calls
            .map(([cb]) => cb)
            .filter((cb) => cb === undefined);
        expect(clearCalls).toHaveLength(1);
        expect(mockMonitorRegistry.setRegisterCallback).toHaveBeenLastCalledWith(undefined);
    });
    it('enqueues user messages received during processing', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage1 = createUserMessage('First message');
        const userMessage2 = createUserMessage('Second message');
        // Make runNonInteractive take some time to simulate processing
        runNonInteractiveMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10)));
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage1;
            yield userMessage2;
        };
        await runNonInteractiveStreamJson(config, '');
        // Both messages should be processed
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
    });
    it('processes control request in idle state', async () => {
        const initRequest = createControlRequest('initialize');
        const controlRequest = createControlRequest('set_model');
        mockInputReader.read = async function* () {
            yield initRequest;
            yield controlRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(2);
        expect(mockDispatcher.dispatch).toHaveBeenNthCalledWith(1, initRequest);
        expect(mockDispatcher.dispatch).toHaveBeenNthCalledWith(2, controlRequest);
    });
    it('handles control response in idle state', async () => {
        const initRequest = createControlRequest('initialize');
        const controlResponse = createControlResponse('req-2');
        mockInputReader.read = async function* () {
            yield initRequest;
            yield controlResponse;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.handleControlResponse).toHaveBeenCalledWith(controlResponse);
    });
    it('handles control cancel in idle state', async () => {
        const initRequest = createControlRequest('initialize');
        const cancelRequest = createControlCancel('req-2');
        mockInputReader.read = async function* () {
            yield initRequest;
            yield cancelRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.handleCancel).toHaveBeenCalledWith('req-2');
    });
    it('handles control request during processing state', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Process me');
        const controlRequest = createControlRequest('set_model');
        runNonInteractiveMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10)));
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
            yield controlRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.dispatch).toHaveBeenCalledWith(controlRequest);
    });
    it('handles control response during processing state', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Process me');
        const controlResponse = createControlResponse('req-1');
        runNonInteractiveMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10)));
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
            yield controlResponse;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.handleControlResponse).toHaveBeenCalledWith(controlResponse);
    });
    it('handles user message with text content', async () => {
        const userMessage = createUserMessage('Test message');
        mockInputReader.read = async function* () {
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(1);
        expect(runNonInteractiveMock).toHaveBeenCalledWith(config, expect.objectContaining({ merged: expect.any(Object) }), 'Test message', expect.stringContaining('test-session'), expect.objectContaining({
            abortController: expect.any(AbortController),
            adapter: mockOutputAdapter,
        }));
    });
    it('handles user message with array content blocks', async () => {
        const userMessage = {
            type: 'user',
            session_id: 'test-session',
            message: {
                role: 'user',
                content: [
                    { type: 'text', text: 'First part' },
                    { type: 'text', text: 'Second part' },
                ],
            },
            parent_tool_use_id: null,
        };
        mockInputReader.read = async function* () {
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(1);
        expect(runNonInteractiveMock).toHaveBeenCalledWith(config, expect.objectContaining({ merged: expect.any(Object) }), 'First part\nSecond part', expect.stringContaining('test-session'), expect.objectContaining({
            abortController: expect.any(AbortController),
            adapter: mockOutputAdapter,
        }));
    });
    it('skips user message with no text content', async () => {
        const userMessage = {
            type: 'user',
            session_id: 'test-session',
            message: {
                role: 'user',
                content: [],
            },
            parent_tool_use_id: null,
        };
        mockInputReader.read = async function* () {
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).not.toHaveBeenCalled();
    });
    it('handles error from processUserMessage', async () => {
        const userMessage = createUserMessage('Test message');
        const error = new Error('Processing error');
        runNonInteractiveMock.mockRejectedValue(error);
        mockInputReader.read = async function* () {
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        // Error should be caught and handled gracefully
    });
    it('handles stream error gracefully', async () => {
        const streamError = new Error('Stream error');
        // eslint-disable-next-line require-yield
        mockInputReader.read = async function* () {
            throw streamError;
        };
        await expect(runNonInteractiveStreamJson(config, '')).rejects.toThrow('Stream error');
    });
    it('stops processing when abort signal is triggered', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Test message');
        // Capture abort signal from ControlContext
        let abortSignal = null;
        ControlContext.mockImplementation((options) => {
            abortSignal = options.abortSignal ?? null;
            return {};
        });
        // Create input reader that aborts after first message
        mockInputReader.read = async function* () {
            yield initRequest;
            // Abort the signal after initialization
            if (abortSignal && !abortSignal.aborted) {
                // The signal doesn't have an abort method, but the controller does
                // Since we can't access the controller directly, we'll test by
                // verifying that cleanup happens properly
            }
            // Yield second message - if abort works, it should be checked
            yield userMessage;
        };
        await runNonInteractiveStreamJson(config, '');
        // Verify initialization happened
        expect(mockDispatcher.dispatch).toHaveBeenCalledWith(initRequest);
        expect(mockDispatcher.shutdown).toHaveBeenCalled();
    });
    it('generates unique prompt IDs for each message', async () => {
        // Initialize first to enable multi-query mode
        const initRequest = createControlRequest('initialize');
        const userMessage1 = createUserMessage('First');
        const userMessage2 = createUserMessage('Second');
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage1;
            yield userMessage2;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(runNonInteractiveMock).toHaveBeenCalledTimes(2);
        const promptId1 = runNonInteractiveMock.mock.calls[0][3];
        const promptId2 = runNonInteractiveMock.mock.calls[1][3];
        expect(promptId1).not.toBe(promptId2);
        expect(promptId1).toContain('test-session');
        expect(promptId2).toContain('test-session');
    });
    it('ignores non-initialize control request during initialization', async () => {
        const controlRequest = createControlRequest('set_model');
        mockInputReader.read = async function* () {
            yield controlRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        // Should not transition to idle since it's not an initialize request
        expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
    });
    it('cleans up console patcher on completion', async () => {
        mockInputReader.read = async function* () {
            // Empty stream - should complete immediately
        };
        await runNonInteractiveStreamJson(config, '');
    });
    it('cleans up output adapter on completion', async () => {
        mockInputReader.read = async function* () {
            // Empty stream
        };
        await runNonInteractiveStreamJson(config, '');
    });
    it('calls dispatcher shutdown on completion', async () => {
        const initRequest = createControlRequest('initialize');
        mockInputReader.read = async function* () {
            yield initRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockDispatcher.shutdown).toHaveBeenCalledTimes(1);
    });
    it('aborts background registries on stream completion shutdown', async () => {
        const initRequest = createControlRequest('initialize');
        mockInputReader.read = async function* () {
            yield initRequest;
        };
        await runNonInteractiveStreamJson(config, '');
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(2);
    });
    it('aborts background registries on error shutdown', async () => {
        const streamError = new Error('Stream error');
        // eslint-disable-next-line require-yield
        mockInputReader.read = async function* () {
            throw streamError;
        };
        await expect(runNonInteractiveStreamJson(config, '')).rejects.toThrow('Stream error');
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(2);
    });
    it('runs final background cleanup after in-flight processing drains', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Start background work');
        let releaseProcessing;
        const callOrder = [];
        mockMonitorRegistry.abortAll.mockImplementation(() => {
            callOrder.push('monitor:abortAll');
        });
        mockBackgroundShellRegistry.abortAll.mockImplementation(() => {
            callOrder.push('background:abortAll');
        });
        mockBackgroundTaskRegistry.abortAll.mockImplementation(() => {
            callOrder.push('agent:abortAll');
        });
        runNonInteractiveMock.mockImplementationOnce(() => new Promise((resolve) => {
            callOrder.push('run:start');
            releaseProcessing = () => {
                callOrder.push('run:end');
                resolve();
            };
        }));
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
        };
        const sessionPromise = runNonInteractiveStreamJson(config, '');
        await vi.waitFor(() => {
            expect(releaseProcessing).toBeDefined();
        });
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(callOrder).toContain('run:start');
        expect(callOrder).toContain('monitor:abortAll');
        expect(callOrder).toContain('background:abortAll');
        expect(callOrder).toContain('agent:abortAll');
        releaseProcessing?.();
        await sessionPromise;
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(callOrder.slice(-4)).toEqual([
            'run:end',
            'monitor:abortAll',
            'background:abortAll',
            'agent:abortAll',
        ]);
    });
    it('runs final background cleanup after in-flight processing drains on error shutdown', async () => {
        const initRequest = createControlRequest('initialize');
        const userMessage = createUserMessage('Start background work');
        let releaseProcessing;
        const callOrder = [];
        const streamError = new Error('Stream error');
        mockMonitorRegistry.abortAll.mockImplementation(() => {
            callOrder.push('monitor:abortAll');
        });
        mockBackgroundShellRegistry.abortAll.mockImplementation(() => {
            callOrder.push('background:abortAll');
        });
        mockBackgroundTaskRegistry.abortAll.mockImplementation(() => {
            callOrder.push('agent:abortAll');
        });
        runNonInteractiveMock.mockImplementationOnce(() => new Promise((resolve) => {
            callOrder.push('run:start');
            releaseProcessing = () => {
                callOrder.push('run:end');
                resolve();
            };
        }));
        mockInputReader.read = async function* () {
            yield initRequest;
            yield userMessage;
            throw streamError;
        };
        const sessionPromise = runNonInteractiveStreamJson(config, '');
        await vi.waitFor(() => {
            expect(releaseProcessing).toBeDefined();
        });
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(1);
        expect(callOrder).toContain('run:start');
        releaseProcessing?.();
        await expect(sessionPromise).rejects.toThrow('Stream error');
        expect(mockMonitorRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundShellRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(mockBackgroundTaskRegistry.abortAll).toHaveBeenCalledTimes(2);
        expect(callOrder.slice(-4)).toEqual([
            'run:end',
            'monitor:abortAll',
            'background:abortAll',
            'agent:abortAll',
        ]);
    });
    it('handles empty stream gracefully', async () => {
        mockInputReader.read = async function* () {
            // Empty stream
        };
        await runNonInteractiveStreamJson(config, '');
    });
});
//# sourceMappingURL=session.test.js.map