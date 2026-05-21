/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { LspServerManager } from './LspServerManager.js';
const debugLoggerMock = vi.hoisted(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
}));
vi.mock('../utils/debugLogger.js', () => ({
    createDebugLogger: vi.fn(() => debugLoggerMock),
}));
const serverConfig = {
    name: 'clangd',
    languages: ['cpp'],
    command: 'clangd',
    args: [],
    transport: 'stdio',
    rootUri: 'file:///workspace',
    workspaceFolder: '/workspace',
};
function createManager(workspaceRoot) {
    return new LspServerManager({}, {}, {}, {
        requireTrustedWorkspace: false,
        workspaceRoot,
    });
}
describe('LspServerManager', () => {
    describe('isPathSafe', () => {
        it('allows bare commands resolved through PATH', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const manager = createManager(workspaceRoot);
            expect(manager.isPathSafe('clangd', workspaceRoot)).toBe(true);
        });
        it('allows explicit absolute command paths', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const absoluteCommand = path.join(path.parse(workspaceRoot).root, 'usr', 'bin', 'clangd');
            const manager = createManager(workspaceRoot);
            expect(manager.isPathSafe(absoluteCommand, workspaceRoot)).toBe(true);
        });
        it('allows relative paths that resolve inside the workspace', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const manager = createManager(workspaceRoot);
            expect(manager.isPathSafe('./tools/clangd', workspaceRoot, workspaceRoot)).toBe(true);
        });
        it('blocks relative paths that escape the workspace', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const manager = createManager(workspaceRoot);
            expect(manager.isPathSafe('../bin/clangd', workspaceRoot, workspaceRoot)).toBe(false);
        });
        it('blocks relative paths that use intermediate traversal to escape', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const manager = createManager(workspaceRoot);
            expect(manager.isPathSafe('./tools/../../../etc/passwd', workspaceRoot, workspaceRoot)).toBe(false);
        });
        it('treats commands with forward slash but no path.sep on Windows as relative', () => {
            const workspaceRoot = path.resolve('/workspace/project');
            const manager = createManager(workspaceRoot);
            // A command like "subdir/server" is relative; if it resolves inside
            // the workspace it should be allowed.
            expect(manager.isPathSafe('tools/clangd', workspaceRoot, workspaceRoot)).toBe(true);
        });
    });
    it('logs process diagnostics when startup fails after connection creation', async () => {
        const manager = new LspServerManager({
            isTrustedFolder: vi.fn().mockReturnValue(true),
        }, {}, {}, {
            requireTrustedWorkspace: false,
            workspaceRoot: '/workspace',
        });
        const processDiagnostics = {
            stderrTail: 'clangd: unknown argument\n',
            exitCode: 7,
            exitSignal: null,
        };
        vi.spyOn(manager, 'checkWorkspaceTrust').mockResolvedValue(true);
        vi.spyOn(manager, 'commandExists').mockResolvedValue(true);
        vi.spyOn(manager, 'isPathSafe').mockReturnValue(true);
        vi.spyOn(manager, 'createLspConnection').mockResolvedValue({
            connection: {},
            processDiagnostics,
        });
        vi.spyOn(manager, 'initializeLspServer').mockRejectedValue(new Error('initialize failed'));
        manager.setServerConfigs([serverConfig]);
        await manager.startAll();
        expect(debugLoggerMock.error).toHaveBeenCalledWith('LSP server clangd process diagnostics:', processDiagnostics);
        expect(debugLoggerMock.error).toHaveBeenCalledWith('LSP server clangd failed to start:', expect.any(Error));
    });
});
//# sourceMappingURL=LspServerManager.test.js.map