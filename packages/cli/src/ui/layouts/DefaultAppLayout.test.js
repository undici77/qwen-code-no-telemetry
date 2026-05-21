import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { DefaultAppLayout } from './DefaultAppLayout.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { UIActionsContext, } from '../contexts/UIActionsContext.js';
import { useAgentViewState } from '../contexts/AgentViewContext.js';
import { StreamingState } from '../types.js';
vi.mock('../components/MainContent.js', () => ({
    MainContent: () => _jsx(Text, { children: "MainContent" }),
}));
vi.mock('../components/DialogManager.js', () => ({
    DialogManager: () => _jsx(Text, { children: "DialogManager" }),
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
    streamingState: StreamingState.Idle,
    historyManager: {
        addItem: vi.fn(),
        history: [],
        updateItem: vi.fn(),
        clearItems: vi.fn(),
        loadHistory: vi.fn(),
        truncateToItem: vi.fn(),
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
describe('DefaultAppLayout', () => {
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
        expect(output).toContain('DialogManager');
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
});
//# sourceMappingURL=DefaultAppLayout.test.js.map