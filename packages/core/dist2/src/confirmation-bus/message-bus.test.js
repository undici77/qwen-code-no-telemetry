/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageBus } from './message-bus.js';
import { MessageBusType } from './types.js';
vi.mock('../utils/debugLogger.js', () => ({
    createDebugLogger: () => ({
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));
vi.mock('../utils/safeJsonStringify.js', () => ({
    safeJsonStringify: (obj) => JSON.stringify(obj),
}));
describe('MessageBus', () => {
    let bus;
    beforeEach(() => {
        bus = new MessageBus();
    });
    afterEach(() => {
        bus.removeAllListeners();
    });
    describe('publish', () => {
        it('should auto-confirm tool confirmation requests', async () => {
            const responses = [];
            bus.subscribe(MessageBusType.TOOL_CONFIRMATION_RESPONSE, (msg) => responses.push(msg));
            const request = {
                type: MessageBusType.TOOL_CONFIRMATION_REQUEST,
                toolCall: { name: 'test_tool', args: {} },
                correlationId: 'test-123',
            };
            await bus.publish(request);
            expect(responses).toHaveLength(1);
            expect(responses[0].confirmed).toBe(true);
            expect(responses[0].correlationId).toBe('test-123');
        });
        it('should emit hook execution requests directly', async () => {
            const received = [];
            bus.subscribe(MessageBusType.HOOK_EXECUTION_REQUEST, (msg) => received.push(msg));
            const request = {
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'UserPromptSubmit',
                input: { prompt: 'test' },
                correlationId: 'hook-123',
            };
            await bus.publish(request);
            expect(received).toHaveLength(1);
            expect(received[0].eventName).toBe('UserPromptSubmit');
            expect(received[0].correlationId).toBe('hook-123');
        });
        it('should emit other message types directly', async () => {
            const received = [];
            bus.subscribe(MessageBusType.TOOL_EXECUTION_SUCCESS, (msg) => received.push(msg));
            const message = {
                type: MessageBusType.TOOL_EXECUTION_SUCCESS,
                toolCall: { name: 'test_tool', args: {} },
                result: { data: 'test' },
            };
            await bus.publish(message);
            expect(received).toHaveLength(1);
            expect(received[0].result).toEqual({ data: 'test' });
        });
        it('should emit error for invalid messages', async () => {
            const errors = [];
            bus.on('error', (err) => errors.push(err));
            await bus.publish(null);
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain('Invalid message structure');
        });
        it('should emit error for tool confirmation request without correlationId', async () => {
            const errors = [];
            bus.on('error', (err) => errors.push(err));
            await bus.publish({
                type: MessageBusType.TOOL_CONFIRMATION_REQUEST,
                toolCall: { name: 'test', args: {} },
            });
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toContain('Invalid message structure');
        });
        it('should emit error for message without type', async () => {
            const errors = [];
            bus.on('error', (err) => errors.push(err));
            await bus.publish({});
            expect(errors).toHaveLength(1);
        });
    });
    describe('subscribe / unsubscribe', () => {
        it('should subscribe and receive messages', async () => {
            const received = [];
            const listener = (msg) => received.push(msg);
            bus.subscribe(MessageBusType.HOOK_EXECUTION_RESPONSE, listener);
            const response = {
                type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                correlationId: 'resp-123',
                success: true,
            };
            await bus.publish(response);
            expect(received).toHaveLength(1);
        });
        it('should unsubscribe and stop receiving messages', async () => {
            const received = [];
            const listener = (msg) => received.push(msg);
            bus.subscribe(MessageBusType.HOOK_EXECUTION_RESPONSE, listener);
            bus.unsubscribe(MessageBusType.HOOK_EXECUTION_RESPONSE, listener);
            const response = {
                type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                correlationId: 'resp-123',
                success: true,
            };
            await bus.publish(response);
            expect(received).toHaveLength(0);
        });
    });
    describe('request', () => {
        it('should correlate request and response', async () => {
            // Set up a handler that responds to hook execution requests
            bus.subscribe(MessageBusType.HOOK_EXECUTION_REQUEST, (msg) => {
                void bus.publish({
                    type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                    correlationId: msg.correlationId,
                    success: true,
                    output: { result: 'done' },
                });
            });
            const response = await bus.request({
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'TestEvent',
                input: {},
            }, MessageBusType.HOOK_EXECUTION_RESPONSE);
            expect(response.success).toBe(true);
            expect(response.output).toEqual({ result: 'done' });
        });
        it('should ignore responses with non-matching correlationId', async () => {
            // Emit a response with wrong correlation ID, then the correct one
            bus.subscribe(MessageBusType.HOOK_EXECUTION_REQUEST, (msg) => {
                // First emit a wrong correlation ID
                void bus.publish({
                    type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                    correlationId: 'wrong-id',
                    success: false,
                });
                // Then emit the correct one
                void bus.publish({
                    type: MessageBusType.HOOK_EXECUTION_RESPONSE,
                    correlationId: msg.correlationId,
                    success: true,
                });
            });
            const response = await bus.request({
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'TestEvent',
                input: {},
            }, MessageBusType.HOOK_EXECUTION_RESPONSE);
            expect(response.success).toBe(true);
        });
        it('should timeout if no response is received', async () => {
            await expect(bus.request({
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'TestEvent',
                input: {},
            }, MessageBusType.HOOK_EXECUTION_RESPONSE, 50)).rejects.toThrow('Request timed out');
        });
        it('should reject immediately when signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();
            await expect(bus.request({
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'TestEvent',
                input: {},
            }, MessageBusType.HOOK_EXECUTION_RESPONSE, 5000, controller.signal)).rejects.toThrow('Request aborted');
        });
        it('should reject when signal is aborted during wait', async () => {
            const controller = new AbortController();
            const promise = bus.request({
                type: MessageBusType.HOOK_EXECUTION_REQUEST,
                eventName: 'TestEvent',
                input: {},
            }, MessageBusType.HOOK_EXECUTION_RESPONSE, 5000, controller.signal);
            // Abort after a tick
            setTimeout(() => controller.abort(), 10);
            await expect(promise).rejects.toThrow('Request aborted');
        });
        it('should auto-confirm tool confirmation via request pattern', async () => {
            const response = await bus.request({
                type: MessageBusType.TOOL_CONFIRMATION_REQUEST,
                toolCall: { name: 'test_tool', args: {} },
            }, MessageBusType.TOOL_CONFIRMATION_RESPONSE);
            expect(response.confirmed).toBe(true);
        });
    });
    describe('debug mode', () => {
        it('should create MessageBus with debug enabled', () => {
            const debugBus = new MessageBus(true);
            expect(debugBus).toBeInstanceOf(MessageBus);
            debugBus.removeAllListeners();
        });
    });
});
//# sourceMappingURL=message-bus.test.js.map