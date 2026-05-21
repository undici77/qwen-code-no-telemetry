/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import open from 'open';
import { parseInsightMessage, Storage } from '@qwen-code/qwen-code-core';
import { insightCommand } from './insightCommand.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
const mockGenerateStaticInsight = vi.fn();
vi.mock('../../services/insight/generators/StaticInsightGenerator.js', () => ({
    StaticInsightGenerator: vi.fn(() => ({
        generateStaticInsight: mockGenerateStaticInsight,
    })),
}));
vi.mock('open', () => ({
    default: vi.fn(),
}));
describe('insightCommand', () => {
    let mockContext;
    beforeEach(() => {
        Storage.setRuntimeBaseDir(path.resolve('runtime-output'));
        mockGenerateStaticInsight.mockResolvedValue(path.resolve('runtime-output', 'insights', 'insight-2026-03-05.html'));
        vi.mocked(open).mockResolvedValue(undefined);
        mockContext = createMockCommandContext({
            services: {
                config: {},
            },
            ui: {
                addItem: vi.fn(),
                setPendingItem: vi.fn(),
                setDebugMessage: vi.fn(),
            },
        });
    });
    afterEach(() => {
        Storage.setRuntimeBaseDir(null);
        vi.restoreAllMocks();
    });
    it('uses runtime base dir to locate projects directory', async () => {
        if (!insightCommand.action) {
            throw new Error('insight command must have action');
        }
        await insightCommand.action(mockContext, '');
        expect(mockGenerateStaticInsight).toHaveBeenCalledWith(path.join(Storage.getRuntimeBaseDir(), 'projects'), expect.any(Function));
    });
    it('streams ACP progress messages without waiting for generation to finish', async () => {
        let resolveInsight = null;
        let progressCallback = null;
        mockGenerateStaticInsight.mockImplementation(async (_projectsDir, onProgress) => {
            progressCallback = onProgress;
            return await new Promise((resolve) => {
                resolveInsight = resolve;
            });
        });
        const acpContext = createMockCommandContext({
            executionMode: 'acp',
            services: {
                config: {},
            },
            ui: {
                addItem: vi.fn(),
                setPendingItem: vi.fn(),
                setDebugMessage: vi.fn(),
            },
        });
        if (!insightCommand.action) {
            throw new Error('insight command must have action');
        }
        const actionPromise = insightCommand.action(acpContext, '');
        const initialResult = await Promise.race([
            actionPromise,
            new Promise((resolve) => {
                setTimeout(() => resolve('pending'), 0);
            }),
        ]);
        expect(initialResult).not.toBe('pending');
        expect(initialResult).toMatchObject({ type: 'stream_messages' });
        if (!initialResult || initialResult === 'pending') {
            throw new Error('ACP insight result did not resolve immediately');
        }
        const result = initialResult;
        if (result.type !== 'stream_messages') {
            throw new Error('ACP insight result must be stream_messages');
        }
        const messagesPromise = (async () => {
            const messages = [];
            for await (const message of result.messages) {
                messages.push(message);
            }
            return messages;
        })();
        const emitProgress = progressCallback;
        if (emitProgress) {
            emitProgress('Analyzing sessions', 42, '21/50');
        }
        const finishInsight = resolveInsight;
        if (finishInsight) {
            finishInsight(path.resolve('runtime-output', 'insights', 'insight-2026-03-05.html'));
        }
        const messages = await messagesPromise;
        expect(messages[0]).toEqual({
            messageType: 'info',
            content: 'This may take a couple minutes. Sit tight!',
        });
        expect(parseInsightMessage(messages[1].content)).toEqual({
            type: 'insight_progress',
            stage: 'Starting insight generation...',
            progress: 0,
            detail: undefined,
        });
        expect(parseInsightMessage(messages[2].content)).toEqual({
            type: 'insight_progress',
            stage: 'Analyzing sessions',
            progress: 42,
            detail: '21/50',
        });
        expect(parseInsightMessage(messages[3].content)).toEqual({
            type: 'insight_ready',
            path: path.resolve('runtime-output', 'insights', 'insight-2026-03-05.html'),
        });
    });
    it('non_interactive: returns message with output path and does not open browser', async () => {
        const nonInteractiveContext = createMockCommandContext({
            executionMode: 'non_interactive',
            services: {
                config: {},
            },
            ui: {
                addItem: vi.fn(),
                setPendingItem: vi.fn(),
                setDebugMessage: vi.fn(),
            },
        });
        if (!insightCommand.action) {
            throw new Error('insight command must have action');
        }
        const result = await insightCommand.action(nonInteractiveContext, '');
        expect(result).toMatchObject({
            type: 'message',
            messageType: 'info',
        });
        expect(result.content).toContain(path.resolve('runtime-output', 'insights', 'insight-2026-03-05.html'));
        expect(open).not.toHaveBeenCalled();
    });
    it('non_interactive: returns error message when generation fails', async () => {
        mockGenerateStaticInsight.mockRejectedValue(new Error('disk full'));
        const nonInteractiveContext = createMockCommandContext({
            executionMode: 'non_interactive',
            services: {
                config: {},
            },
            ui: {
                addItem: vi.fn(),
                setPendingItem: vi.fn(),
                setDebugMessage: vi.fn(),
            },
        });
        if (!insightCommand.action) {
            throw new Error('insight command must have action');
        }
        const result = await insightCommand.action(nonInteractiveContext, '');
        expect(result).toMatchObject({
            type: 'message',
            messageType: 'error',
        });
        expect(result.content).toContain('disk full');
        expect(open).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=insightCommand.test.js.map