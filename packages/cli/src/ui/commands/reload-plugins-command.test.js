/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadPluginsCommand } from './reload-plugins-command.js';
import { reloadPluginsRuntime } from '../../config/extension-runtime-reload.js';
vi.mock('../../config/extension-runtime-reload.js', () => ({
    reloadPluginsRuntime: vi.fn(async () => ({
        extensionCount: 1,
        commandCount: 2,
        skillCount: 3,
        agentCount: 4,
        hookCount: 5,
        mcpServerCount: 6,
        lspServerCount: 7,
    })),
}));
describe('reloadPluginsCommand', () => {
    let extensionRefreshState;
    beforeEach(() => {
        vi.clearAllMocks();
        extensionRefreshState = {
            clearExtensionsChanged: vi.fn(),
            markExtensionsReloadFailed: vi.fn(),
            notifyExtensionsReloadStarted: vi.fn(),
        };
    });
    it('returns an error when config is missing', async () => {
        const context = {
            services: { config: null, extensionRefreshState },
            ui: { reloadCommands: vi.fn() },
        };
        const result = await reloadPluginsCommand.action?.(context, '');
        expect(result).toEqual({
            type: 'message',
            messageType: 'error',
            content: 'Config not loaded.',
        });
        expect(reloadPluginsRuntime).not.toHaveBeenCalled();
        expect(extensionRefreshState.clearExtensionsChanged).not.toHaveBeenCalled();
        expect(extensionRefreshState.notifyExtensionsReloadStarted).not.toHaveBeenCalled();
    });
    it('reloads extension runtime and clears stale state', async () => {
        const config = {};
        const reloadCommands = vi.fn();
        const context = {
            services: { config, extensionRefreshState },
            ui: { reloadCommands },
        };
        const result = await reloadPluginsCommand.action?.(context, '');
        expect(extensionRefreshState.notifyExtensionsReloadStarted).toHaveBeenCalledOnce();
        expect(reloadPluginsRuntime).toHaveBeenCalledWith({
            config,
            reloadCommands,
        });
        expect(extensionRefreshState.clearExtensionsChanged).toHaveBeenCalledOnce();
        expect(result).toEqual({
            type: 'message',
            messageType: 'info',
            content: 'Reloaded extensions: 1 extension · 2 commands · 3 skills · 4 agents · 5 hooks · 6 extension MCP servers · 7 extension LSP servers',
        });
    });
    it('preserves stale state when reload fails', async () => {
        vi.mocked(reloadPluginsRuntime).mockRejectedValueOnce(new Error('boom'));
        const context = {
            services: { config: {}, extensionRefreshState },
            ui: { reloadCommands: vi.fn() },
        };
        const result = await reloadPluginsCommand.action?.(context, '');
        expect(extensionRefreshState.notifyExtensionsReloadStarted).toHaveBeenCalledOnce();
        expect(extensionRefreshState.clearExtensionsChanged).not.toHaveBeenCalled();
        expect(extensionRefreshState.markExtensionsReloadFailed).toHaveBeenCalledOnce();
        expect(result).toEqual({
            type: 'message',
            messageType: 'error',
            content: 'Reload failed: boom',
        });
    });
});
//# sourceMappingURL=reload-plugins-command.test.js.map