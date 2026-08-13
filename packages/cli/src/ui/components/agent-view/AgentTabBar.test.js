import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatus } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../hooks/useKeypress.js';
import { useAgentViewActions, useAgentViewState, } from '../../contexts/AgentViewContext.js';
import { useBackgroundTaskViewActions, useBackgroundTaskViewState, } from '../../contexts/BackgroundTaskViewContext.js';
import { useUIState } from '../../contexts/UIStateContext.js';
import { AgentTabBar } from './AgentTabBar.js';
vi.mock('../../hooks/useKeypress.js');
vi.mock('../../contexts/AgentViewContext.js');
vi.mock('../../contexts/BackgroundTaskViewContext.js');
vi.mock('../../contexts/UIStateContext.js');
let activeKeypressHandler = null;
const createKey = (overrides) => ({
    name: '',
    sequence: '',
    ctrl: false,
    meta: false,
    shift: false,
    paste: false,
    ...overrides,
});
const pressKey = (overrides) => {
    if (!activeKeypressHandler) {
        throw new Error('No active keypress handler');
    }
    activeKeypressHandler(createKey(overrides));
};
describe('AgentTabBar', () => {
    const setAgentTabBarFocused = vi.fn();
    const setLivePanelFocused = vi.fn();
    const setPillFocused = vi.fn();
    // Point the mocked view state at a given tab; tab bar starts focused.
    const setActiveView = (activeView) => vi.mocked(useAgentViewState).mockReturnValue({
        activeView,
        agents: new Map([
            [
                'agent-1',
                {
                    modelId: 'qwen',
                    color: 'cyan',
                    interactiveAgent: {
                        getStatus: () => AgentStatus.IDLE,
                        getEventEmitter: () => ({ on: vi.fn(), off: vi.fn() }),
                    },
                },
            ],
        ]),
        agentShellFocused: false,
        agentTabBarFocused: true,
    });
    beforeEach(() => {
        vi.clearAllMocks();
        activeKeypressHandler = null;
        vi.mocked(useKeypress).mockImplementation((handler, { isActive }) => {
            if (isActive) {
                activeKeypressHandler = handler;
            }
        });
        setActiveView('agent-1');
        vi.mocked(useAgentViewActions).mockReturnValue({
            switchToNext: vi.fn(),
            switchToPrevious: vi.fn(),
            setAgentTabBarFocused,
        });
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [{ kind: 'agent', agentId: 'bg-agent', status: 'running' }],
        });
        vi.mocked(useBackgroundTaskViewActions).mockReturnValue({
            setLivePanelFocused,
            setPillFocused,
        });
        vi.mocked(useUIState).mockReturnValue({
            embeddedShellFocused: false,
        });
    });
    it('Up on the Main view ascends to the live agent panel when a bg agent roster exists', () => {
        setActiveView('main');
        render(_jsx(AgentTabBar, {}));
        // Arrow Up: release tab-bar focus and focus the panel (rendered on Main).
        pressKey({ name: 'up', sequence: '[A' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setLivePanelFocused).toHaveBeenCalledWith(true);
        // Ctrl+P is the alias for Up and must behave identically.
        pressKey({ name: 'p', ctrl: true });
        expect(setLivePanelFocused).toHaveBeenCalledTimes(2);
    });
    it('Up on an agent tab returns to the composer (no panel jump), keeping AgentComposer round-trip symmetric', () => {
        // Default view is the agent tab 'agent-1'; the live panel is not rendered
        // there, so ↑ must simply release focus back to the AgentComposer.
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'up', sequence: '[A' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setLivePanelFocused).not.toHaveBeenCalled();
    });
    it('Up returns focus to the input when there is no bg agent roster', () => {
        setActiveView('main');
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [],
        });
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'up', sequence: '[A' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setLivePanelFocused).not.toHaveBeenCalled();
    });
    it('Up ignores non-agent bg entries (e.g. background shell) on the Main view', () => {
        // The panel only renders kind === 'agent' entries, so a lone shell task
        // must not make ↑ jump to a panel that has nothing to show.
        setActiveView('main');
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [{ kind: 'shell', shellId: 'bg-shell' }],
        });
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'up', sequence: '[A' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setLivePanelFocused).not.toHaveBeenCalled();
    });
    it('Up ignores terminal bg agents after the live panel visibility window (#5067)', () => {
        setActiveView('main');
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [
                {
                    kind: 'agent',
                    agentId: 'done-bg-agent',
                    status: 'completed',
                    endTime: Date.now() - 9000,
                },
            ],
        });
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'up', sequence: '[A' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setLivePanelFocused).not.toHaveBeenCalled();
    });
    it('Down (↓ / Ctrl+N) descends into the background-tasks pill when one is shown', () => {
        // Default mock has bg entries → the pill is rendered. Down releases tab-bar
        // focus and hands it to the pill, completing the chain BackgroundTasksPill
        // documents (Composer ↓ → AgentTabBar ↓ → Pill ↓ → Dialog).
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'down', sequence: '[B' });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        expect(setPillFocused).toHaveBeenCalledWith(true);
        expect(setLivePanelFocused).not.toHaveBeenCalled();
        // Ctrl+N is the readline alias for Down and must behave identically.
        pressKey({ name: 'n', ctrl: true });
        expect(setPillFocused).toHaveBeenCalledTimes(2);
    });
    it('Down is a no-op when no background-tasks pill is shown (tab bar is the bottom)', () => {
        // With no bg entries the pill is not rendered, so there is nothing below
        // the tab bar to descend into — Down must do nothing.
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [],
        });
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'down', sequence: '[B' });
        pressKey({ name: 'n', ctrl: true });
        expect(setPillFocused).not.toHaveBeenCalled();
        expect(setLivePanelFocused).not.toHaveBeenCalled();
        expect(setAgentTabBarFocused).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=AgentTabBar.test.js.map