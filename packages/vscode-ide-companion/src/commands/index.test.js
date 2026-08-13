/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authCommand, focusChatCommand, openNewChatTabCommand, registerNewCommands, showDiffCommand, } from './index.js';
const { registerCommand, executeCommand, showWarningMessage, showInformationMessage, joinPath, workspaceMock, } = vi.hoisted(() => ({
    registerCommand: vi.fn((_id, handler) => ({
        dispose: vi.fn(),
        handler,
    })),
    executeCommand: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    joinPath: vi.fn((base, filePath) => ({
        fsPath: `${base.fsPath}/${filePath}`,
    })),
    workspaceMock: {
        workspaceFolders: [],
    },
}));
vi.mock('vscode', () => ({
    commands: {
        registerCommand,
        executeCommand,
    },
    window: {
        showWarningMessage,
        showInformationMessage,
    },
    workspace: workspaceMock,
    Uri: {
        file: (fsPath) => ({ fsPath }),
        joinPath,
    },
}));
function getRegisteredHandler(commandId) {
    const call = registerCommand.mock.calls.find(([id]) => id === commandId);
    if (!call) {
        throw new Error(`Command ${commandId} was not registered`);
    }
    return call[1];
}
describe('registerNewCommands', () => {
    const context = { subscriptions: [] };
    const diffManager = { showDiff: vi.fn() };
    const log = vi.fn();
    beforeEach(() => {
        context.subscriptions = [];
        registerCommand.mockClear();
        executeCommand.mockClear();
        showWarningMessage.mockClear();
        showInformationMessage.mockClear();
        joinPath.mockClear();
        diffManager.showDiff.mockClear();
        log.mockClear();
        workspaceMock.workspaceFolders = [];
    });
    it('openNewChatTab opens a new provider without creating a second session explicitly', async () => {
        const provider = {
            show: vi.fn().mockResolvedValue(undefined),
            createNewSession: vi.fn().mockResolvedValue(undefined),
            startInteractiveAuth: vi.fn().mockResolvedValue(undefined),
            setInitialModelId: vi.fn(),
        };
        registerNewCommands(context, log, diffManager, () => [], () => provider);
        await getRegisteredHandler(openNewChatTabCommand)({
            initialModelId: 'glm-5',
        });
        expect(provider.show).toHaveBeenCalledTimes(1);
        expect(provider.createNewSession).not.toHaveBeenCalled();
        expect(provider.setInitialModelId).toHaveBeenCalledWith('glm-5');
    });
    it('auth opens the interactive provider setup flow instead of VS Code settings', async () => {
        const provider = {
            show: vi.fn().mockResolvedValue(undefined),
            startInteractiveAuth: vi.fn().mockResolvedValue(undefined),
        };
        registerNewCommands(context, log, diffManager, () => [provider], vi.fn(() => provider));
        await getRegisteredHandler(authCommand)();
        expect(provider.show).toHaveBeenCalledTimes(1);
        expect(provider.startInteractiveAuth).toHaveBeenCalledTimes(1);
        expect(executeCommand).not.toHaveBeenCalled();
    });
    it('focusChat focuses the Activity Bar chat view', async () => {
        registerNewCommands(context, log, diffManager, () => [], vi.fn());
        await getRegisteredHandler(focusChatCommand)();
        expect(executeCommand).toHaveBeenCalledWith('qwen-code.chatView.sidebar.focus');
    });
    it('showDiff resolves relative paths against the workspace', async () => {
        workspaceMock.workspaceFolders = [
            { uri: { fsPath: '/workspace' }, name: 'workspace', index: 0 },
        ];
        registerNewCommands(context, log, diffManager, () => [], vi.fn());
        await getRegisteredHandler(showDiffCommand)({
            path: 'src/app.ts',
            oldText: 'old',
            newText: 'new',
        });
        expect(joinPath).toHaveBeenCalledWith({ fsPath: '/workspace' }, 'src/app.ts');
        expect(diffManager.showDiff).toHaveBeenCalledWith('/workspace/src/app.ts', 'old', 'new');
    });
    it('showDiff keeps UNC paths absolute', async () => {
        workspaceMock.workspaceFolders = [
            { uri: { fsPath: '/workspace' }, name: 'workspace', index: 0 },
        ];
        registerNewCommands(context, log, diffManager, () => [], vi.fn());
        await getRegisteredHandler(showDiffCommand)({
            path: '\\\\server\\share\\app.ts',
            oldText: 'old',
            newText: 'new',
        });
        expect(joinPath).not.toHaveBeenCalled();
        expect(diffManager.showDiff).toHaveBeenCalledWith('\\\\server\\share\\app.ts', 'old', 'new');
    });
});
//# sourceMappingURL=index.test.js.map