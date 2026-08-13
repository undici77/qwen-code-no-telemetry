import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { DefaultAppLayout } from './DefaultAppLayout.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { UIActionsContext, } from '../contexts/UIActionsContext.js';
import { useAgentViewState } from '../contexts/AgentViewContext.js';
import { StreamingState } from '../types.js';
const dialogManagerMockState = vi.hoisted(() => ({ lineCount: 1 }));
vi.mock('../components/MainContent.js', () => ({
    MainContent: () => _jsx(Text, { children: "MainContent" }),
}));
vi.mock('../components/UpdateNotification.js', () => ({
    UpdateNotification: ({ message }) => (_jsx(Text, { children: `UpdateNotification: ${message}` })),
}));
vi.mock('../components/DialogManager.js', () => ({
    DialogManager: () => (_jsx(Text, { children: Array.from({ length: dialogManagerMockState.lineCount }, (_, i) => `DialogManager ${i + 1}`).join('\n') })),
}));
vi.mock('../components/Composer.js', () => ({
    Composer: () => _jsx(Text, { children: "Composer" }),
}));
vi.mock('../components/ExitWarning.js', () => ({
    ExitWarning: () => _jsx(Text, { children: "ExitWarning" }),
}));
vi.mock('../components/messages/BtwMessage.js', () => ({
    BtwMessage: () => _jsx(Text, { children: "BtwMessage" }),
}));
vi.mock('../components/StickyTodoList.js', () => ({
    StickyTodoList: () => _jsx(Text, { children: "StickyTodoList" }),
}));
vi.mock('../components/agent-view/AgentTabBar.js', () => ({
    AgentTabBar: () => _jsx(Text, { children: "AgentTabBar" }),
}));
vi.mock('../components/agent-view/AgentChatView.js', () => ({
    AgentChatView: () => _jsx(Text, { children: "AgentChatView" }),
}));
vi.mock('../components/agent-view/AgentComposer.js', () => ({
    AgentComposer: () => _jsx(Text, { children: "AgentComposer" }),
}));
vi.mock('../hooks/useTerminalSize.js', () => ({
    useTerminalSize: () => ({ columns: 80 }),
}));
vi.mock('../contexts/AgentViewContext.js', () => ({
    useAgentViewState: vi.fn(),
}));
const mockedUseAgentViewState = useAgentViewState;
const mockUIActions = {
    refreshStatic: vi.fn(),
};
const baseUIState = {
    dialogsVisible: false,
    isFeedbackDialogOpen: false,
    mainControlsRef: { current: null },
    mainAreaWidth: 80,
    terminalWidth: 80,
    terminalHeight: 24,
    staticExtraHeight: 0,
    constrainHeight: true,
    streamingState: StreamingState.Responding,
    historyManager: {
        addItem: vi.fn(),
        history: [],
        updateItem: vi.fn(),
        clearItems: vi.fn(),
        loadHistory: vi.fn(),
        truncateToItem: vi.fn(),
        compactOldItems: vi.fn(),
    },
    stickyTodos: [
        {
            id: 'todo-1',
            content: 'Pinned task',
            status: 'pending',
        },
    ],
    btwItem: null,
};
const renderLayout = (uiState) => render(_jsx(UIActionsContext.Provider, { value: mockUIActions, children: _jsx(UIStateContext.Provider, { value: uiState, children: _jsx(DefaultAppLayout, {}) }) }));
function frameHeight(frame) {
    return frame.length === 0 ? 0 : frame.split('\n').length;
}
describe('DefaultAppLayout', () => {
    beforeEach(() => {
        dialogManagerMockState.lineCount = 1;
    });
    it('renders sticky todo list before the composer in the main view', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout(baseUIState);
        const output = lastFrame() ?? '';
        expect(output).toContain('StickyTodoList');
        expect(output.indexOf('StickyTodoList')).toBeGreaterThan(output.indexOf('MainContent'));
        expect(output.indexOf('StickyTodoList')).toBeLessThan(output.indexOf('Composer'));
    });
    it('renders an update that arrives after startup above the composer', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            updateInfo: {
                message: 'Update successful!',
                update: {
                    latest: '0.20.0',
                    current: '0.19.12',
                    type: 'latest',
                    name: '@qwen-code/qwen-code',
                },
            },
        });
        const output = lastFrame() ?? '';
        expect(output).toContain('UpdateNotification: Update successful!');
        expect(output.indexOf('UpdateNotification')).toBeLessThan(output.indexOf('Composer'));
    });
    it('does not render sticky todo list when dialogs are visible', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            dialogsVisible: true,
        });
        const output = lastFrame() ?? '';
        expect(output).not.toContain('StickyTodoList');
        expect(output).toContain('DialogManager 1');
    });
    it('keeps a tall dialog within the terminal frame when it appears', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        dialogManagerMockState.lineCount = 20;
        const terminalHeight = 8;
        const { lastFrame } = renderLayout({
            ...baseUIState,
            dialogsVisible: true,
            terminalHeight,
        });
        const output = lastFrame() ?? '';
        expect(frameHeight(output)).toBeLessThanOrEqual(terminalHeight);
        expect(output).toContain('DialogManager 1');
        expect(output).not.toContain('DialogManager 20');
    });
    it('does not cap a tall dialog when height constraints are disabled', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        dialogManagerMockState.lineCount = 20;
        const terminalHeight = 8;
        const { lastFrame } = renderLayout({
            ...baseUIState,
            dialogsVisible: true,
            terminalHeight,
            constrainHeight: false,
        });
        const output = lastFrame() ?? '';
        expect(frameHeight(output)).toBeGreaterThan(terminalHeight);
        expect(output).toContain('DialogManager 20');
    });
    it('does not render sticky todo list while waiting for confirmation', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            streamingState: StreamingState.WaitingForConfirmation,
        });
        const output = lastFrame() ?? '';
        expect(output).not.toContain('StickyTodoList');
        expect(output).toContain('Composer');
    });
    it('does not render sticky todo list when agent is idle', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            streamingState: StreamingState.Idle,
        });
        const output = lastFrame() ?? '';
        expect(output).not.toContain('StickyTodoList');
        expect(output).toContain('Composer');
    });
    it('does not render sticky todo list when feedback dialog is open', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'main',
            agents: new Map(),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            isFeedbackDialogOpen: true,
        });
        const output = lastFrame() ?? '';
        expect(output).not.toContain('StickyTodoList');
        expect(output).toContain('Composer');
    });
    it('does not render sticky todo list in an agent tab view', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'agent-1',
            agents: new Map([['agent-1', {}]]),
        });
        const { lastFrame } = renderLayout(baseUIState);
        const output = lastFrame() ?? '';
        expect(output).not.toContain('StickyTodoList');
        expect(output).toContain('AgentChatView');
        expect(output).toContain('AgentComposer');
    });
    it('renders update notifications in an agent tab view', () => {
        mockedUseAgentViewState.mockReturnValue({
            activeView: 'agent-1',
            agents: new Map([['agent-1', {}]]),
        });
        const { lastFrame } = renderLayout({
            ...baseUIState,
            updateInfo: {
                message: 'Update successful!',
                update: {
                    latest: '0.20.0',
                    current: '0.19.12',
                    type: 'latest',
                    name: '@qwen-code/qwen-code',
                },
            },
        });
        const output = lastFrame() ?? '';
        expect(output).toContain('UpdateNotification: Update successful!');
        expect(output.indexOf('UpdateNotification')).toBeLessThan(output.indexOf('AgentComposer'));
    });
});
//# sourceMappingURL=DefaultAppLayout.test.js.map