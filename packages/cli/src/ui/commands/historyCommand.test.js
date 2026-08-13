/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historyCommand } from './historyCommand.js';
import { MessageType } from '../types.js';
describe('historyCommand', () => {
    let mockHistory;
    let mockLoadHistory;
    let mockRefreshStatic;
    let mockSettings;
    let mockContext;
    beforeEach(() => {
        mockHistory = [
            { id: 1, type: 'user', text: 'hello' },
            { id: 2, type: 'gemini', text: 'hi' },
        ];
        mockLoadHistory = vi.fn((newHistory) => {
            mockHistory = newHistory;
        });
        mockRefreshStatic = vi.fn();
        mockSettings = {
            setValue: vi.fn(),
        };
        mockContext = {
            ui: {
                history: mockHistory,
                loadHistory: mockLoadHistory,
                refreshStatic: mockRefreshStatic,
            },
            services: {
                settings: mockSettings,
            },
        };
    });
    it('collapse-on-resume sets the user preference', async () => {
        const collapseCommand = historyCommand.subCommands.find((c) => c.name === 'collapse-on-resume');
        const result = await collapseCommand.action(mockContext, '');
        expect(result).toEqual({
            type: 'message',
            messageType: 'info',
            content: expect.stringContaining('History will be collapsed by default'),
        });
        expect(mockSettings.setValue).toHaveBeenCalledWith('User', 'ui.history.collapseOnResume', true);
    });
    it('expand-on-resume sets the user preference', async () => {
        const expandCommand = historyCommand.subCommands.find((c) => c.name === 'expand-on-resume');
        const result = await expandCommand.action(mockContext, '');
        expect(result).toEqual({
            type: 'message',
            messageType: 'info',
            content: expect.stringContaining('History will be expanded by default'),
        });
        expect(mockSettings.setValue).toHaveBeenCalledWith('User', 'ui.history.collapseOnResume', false);
    });
    it('expand-now removes suppressOnRestore and drops summary', async () => {
        const expandNowCommand = historyCommand.subCommands.find((c) => c.name === 'expand-now');
        // Setup collapsed state
        mockHistory = [
            {
                id: 1,
                type: 'user',
                text: 'hello',
                display: { suppressOnRestore: true },
            },
            {
                id: 2,
                type: 'gemini',
                text: 'hi',
                display: { suppressOnRestore: true },
            },
            {
                id: 3,
                type: MessageType.INFO,
                text: 'History collapsed: 2 messages hidden.',
                display: { kind: 'collapse-summary' },
            },
        ];
        mockContext.ui.history = mockHistory;
        const result = await expandNowCommand.action(mockContext, '');
        expect(result).toBeUndefined();
        expect(mockLoadHistory).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1, display: undefined }),
            expect.objectContaining({ id: 2, display: undefined }),
        ]);
        expect(mockRefreshStatic).toHaveBeenCalled();
    });
    it('expand-now returns already expanded when expanding an uncollapsed session', async () => {
        const expandNowCommand = historyCommand.subCommands.find((c) => c.name === 'expand-now');
        const result = await expandNowCommand.action(mockContext, '');
        expect(result).toEqual({
            type: 'message',
            messageType: 'info',
            content: 'History is already expanded in this session.',
        });
        expect(mockLoadHistory).not.toHaveBeenCalled();
        expect(mockRefreshStatic).not.toHaveBeenCalled();
    });
    it('returns usage error for unknown subcommand', async () => {
        const result = await historyCommand.action(mockContext, 'unknown');
        expect(result).toEqual({
            type: 'message',
            messageType: 'error',
            content: 'Usage: /history collapse-on-resume|expand-on-resume|expand-now',
        });
    });
});
//# sourceMappingURL=historyCommand.test.js.map