/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OutputFormat, } from '@qwen-code/qwen-code-core';
import { createChatRecordingFailureSystemMessage, settleChatRecording, subscribeToHeadlessChatRecordingFailures, } from './chat-recording-failure.js';
const { mockWriteStderrLine } = vi.hoisted(() => ({
    mockWriteStderrLine: vi.fn(),
}));
vi.mock('./stdioHelpers.js', () => ({
    writeStderrLine: mockWriteStderrLine,
}));
describe('chat recording failure reporting', () => {
    afterEach(() => {
        vi.useRealTimers();
    });
    it('uses the affected session id in both system-message locations', () => {
        const message = createChatRecordingFailureSystemMessage({
            sessionId: 'failed-session',
            error: new Error('private path details'),
        });
        expect(message).toMatchObject({
            type: 'system',
            subtype: 'session_recording_degraded',
            session_id: 'failed-session',
            parent_tool_use_id: null,
            data: {
                session_id: 'failed-session',
                reason: 'write_failed',
            },
        });
        expect(JSON.stringify(message)).not.toContain('private path details');
    });
    it('reports structured failures through the supplied adapter', () => {
        let listener;
        const unsubscribe = vi.fn();
        const config = {
            getOutputFormat: () => OutputFormat.JSON,
            onChatRecordingFailure: (next) => {
                listener = next;
                return unsubscribe;
            },
        };
        const adapter = {
            emitMessage: vi.fn(),
        };
        const dispose = subscribeToHeadlessChatRecordingFailures(config, adapter);
        listener?.({
            sessionId: 'failed-session',
            error: new Error('disk full'),
        });
        expect(adapter.emitMessage).toHaveBeenCalledWith(expect.objectContaining({
            subtype: 'session_recording_degraded',
            session_id: 'failed-session',
        }));
        dispose();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });
    it('reports text failures to stderr without using the adapter', () => {
        let listener;
        const config = {
            getOutputFormat: () => OutputFormat.TEXT,
            onChatRecordingFailure: (next) => {
                listener = next;
                return vi.fn();
            },
        };
        const adapter = {
            emitMessage: vi.fn(),
        };
        subscribeToHeadlessChatRecordingFailures(config, adapter);
        listener?.({
            sessionId: 'failed-session',
            error: new Error('disk full'),
        });
        expect(mockWriteStderrLine).toHaveBeenCalledWith(expect.stringMatching(/^Warning: Session recording stopped/));
        expect(adapter.emitMessage).not.toHaveBeenCalled();
    });
    it('finalizes before flushing and treats a rejected flush as settled', async () => {
        const order = [];
        const config = {
            getChatRecordingService: () => ({
                finalize: () => order.push('finalize'),
                flush: async () => {
                    order.push('flush');
                    throw new Error('disk full');
                },
            }),
        };
        await expect(settleChatRecording(config, { finalize: true })).resolves.toBe('settled');
        expect(order).toEqual(['finalize', 'flush']);
    });
    it('stops waiting after two seconds without cancelling the write', async () => {
        vi.useFakeTimers();
        const flush = vi.fn(() => new Promise(() => { }));
        const config = {
            getChatRecordingService: () => ({ finalize: vi.fn(), flush }),
        };
        const result = settleChatRecording(config, { finalize: false });
        await vi.advanceTimersByTimeAsync(2_000);
        await expect(result).resolves.toBe('timeout');
        expect(flush).toHaveBeenCalledOnce();
    });
});
//# sourceMappingURL=chat-recording-failure.test.js.map