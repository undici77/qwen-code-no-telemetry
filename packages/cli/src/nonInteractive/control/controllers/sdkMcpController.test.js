/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { createMinimalSettings } from '../../../config/settings.js';
import { SdkMcpController } from './sdkMcpController.js';
function createRegistry() {
    return {
        registerIncomingRequest: vi.fn(),
        deregisterIncomingRequest: vi.fn(),
        registerOutgoingRequest: vi.fn(),
        deregisterOutgoingRequest: vi.fn(),
    };
}
describe('SdkMcpController', () => {
    it('binds an SDK MCP request to the turn that created it', async () => {
        const session = new AbortController();
        const firstTurn = new AbortController();
        const secondTurn = new AbortController();
        let activeTurnSignal = firstTurn.signal;
        const context = {
            config: {
                getDebugMode: vi.fn().mockReturnValue(false),
            },
            streamJson: { send: vi.fn() },
            sessionId: 'test-session-id',
            abortSignal: session.signal,
            getActiveTurnAbortSignal: () => activeTurnSignal,
            debugMode: false,
            settings: createMinimalSettings(),
            permissionMode: 'default',
            sdkMcpServers: new Set(),
            mcpClients: new Map(),
            inputClosed: false,
        };
        const controller = new SdkMcpController(context, createRegistry(), 'SdkMcpController');
        let requestSignal;
        vi.spyOn(controller, 'sendControlRequest').mockImplementation((_payload, _timeout, signal) => {
            requestSignal = signal;
            return new Promise((_, reject) => {
                signal?.addEventListener('abort', () => reject(new Error('Request aborted')), { once: true });
            });
        });
        const sendMcpMessage = controller.createSendSdkMcpMessage();
        const request = sendMcpMessage('sdk-server', {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
        });
        const result = request.then(() => ({ status: 'fulfilled' }), (error) => ({ status: 'rejected', error }));
        await vi.waitFor(() => {
            expect(requestSignal).toBeDefined();
        });
        activeTurnSignal = secondTurn.signal;
        firstTurn.abort();
        await expect(result).resolves.toMatchObject({
            status: 'rejected',
            error: expect.objectContaining({ message: 'Request aborted' }),
        });
        expect(requestSignal?.aborted).toBe(true);
        expect(session.signal.aborted).toBe(false);
        expect(secondTurn.signal.aborted).toBe(false);
        requestSignal = undefined;
        const sessionRequest = sendMcpMessage('sdk-server', {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
        });
        const sessionResult = sessionRequest.then(() => ({ status: 'fulfilled' }), (error) => ({ status: 'rejected', error }));
        await vi.waitFor(() => {
            expect(requestSignal).toBeDefined();
        });
        const sessionOwnedSignal = requestSignal;
        session.abort();
        await expect(sessionResult).resolves.toMatchObject({
            status: 'rejected',
            error: expect.objectContaining({ message: 'Request aborted' }),
        });
        expect(sessionOwnedSignal?.aborted).toBe(true);
        expect(secondTurn.signal.aborted).toBe(false);
    });
});
//# sourceMappingURL=sdkMcpController.test.js.map