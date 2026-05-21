import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from '@testing-library/react';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileHistoryService } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { RewindSelector } from './RewindSelector.js';
vi.mock('../hooks/useKeypress.js');
vi.mock('../hooks/useTerminalSize.js');
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
    const handler = activeKeypressHandler;
    act(() => {
        handler(createKey(overrides));
    });
};
const userTurn = (id, text) => ({
    id,
    type: 'user',
    text,
});
describe('RewindSelector', () => {
    let fileHistoryService;
    beforeEach(() => {
        activeKeypressHandler = null;
        fileHistoryService = new FileHistoryService('test-session', false, '/tmp');
        vi.mocked(useTerminalSize).mockReturnValue({ columns: 100, rows: 30 });
        vi.mocked(useKeypress).mockImplementation((handler, { isActive }) => {
            if (isActive) {
                activeKeypressHandler = handler;
            }
        });
    });
    it('navigates the pick list with Ctrl+P/N readline aliases', () => {
        const { lastFrame } = render(_jsx(RewindSelector, { history: [userTurn(1, 'first prompt'), userTurn(2, 'second prompt')], onRewind: vi.fn(), onCancel: vi.fn(), fileCheckpointingEnabled: false, fileHistoryService: fileHistoryService }));
        expect(lastFrame()).toContain('› #2 second prompt');
        pressKey({ name: 'p', sequence: '\u0010', ctrl: true });
        expect(lastFrame()).toContain('› #1 first prompt');
        pressKey({ name: 'n', sequence: '\u000E', ctrl: true });
        expect(lastFrame()).toContain('› #2 second prompt');
    });
});
//# sourceMappingURL=RewindSelector.test.js.map