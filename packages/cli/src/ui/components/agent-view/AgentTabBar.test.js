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
    const switchToMain = vi.fn();
    const setAgentTabBarFocused = vi.fn();
    const setBgPillFocused = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        activeKeypressHandler = null;
        vi.mocked(useKeypress).mockImplementation((handler, { isActive }) => {
            if (isActive) {
                activeKeypressHandler = handler;
            }
        });
        vi.mocked(useAgentViewState).mockReturnValue({
            activeView: 'agent-1',
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
        vi.mocked(useAgentViewActions).mockReturnValue({
            switchToNext: vi.fn(),
            switchToPrevious: vi.fn(),
            switchToMain,
            setAgentTabBarFocused,
        });
        vi.mocked(useBackgroundTaskViewState).mockReturnValue({
            entries: [{ kind: 'agent', agentId: 'bg-agent' }],
        });
        vi.mocked(useBackgroundTaskViewActions).mockReturnValue({
            setPillFocused: setBgPillFocused,
        });
        vi.mocked(useUIState).mockReturnValue({
            embeddedShellFocused: false,
        });
    });
    it('uses Ctrl+P/N for focus-chain navigation', () => {
        render(_jsx(AgentTabBar, {}));
        pressKey({ name: 'p', sequence: '\u0010', ctrl: true });
        expect(setAgentTabBarFocused).toHaveBeenCalledWith(false);
        pressKey({ name: 'n', sequence: '\u000E', ctrl: true });
        expect(switchToMain).toHaveBeenCalledTimes(1);
        expect(setBgPillFocused).toHaveBeenCalledWith(true);
    });
});
//# sourceMappingURL=AgentTabBar.test.js.map