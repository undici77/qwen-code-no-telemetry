import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from '@testing-library/react';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { ToolListStep } from './ToolListStep.js';
vi.mock('../../../hooks/useKeypress.js');
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
const tool = (name) => ({
    name,
    serverName: 'server',
    isValid: true,
});
describe('ToolListStep', () => {
    beforeEach(() => {
        activeKeypressHandler = null;
        vi.mocked(useKeypress).mockImplementation((handler, { isActive }) => {
            if (isActive) {
                activeKeypressHandler = handler;
            }
        });
    });
    it('navigates with Ctrl+N/P readline aliases', () => {
        const { lastFrame } = render(_jsx(ToolListStep, { tools: [tool('first'), tool('second')], serverName: "server", onSelect: vi.fn(), onBack: vi.fn() }));
        expect(lastFrame()).toContain('❯ first');
        pressKey({ name: 'n', sequence: '\u000E', ctrl: true });
        expect(lastFrame()).toContain('❯ second');
        pressKey({ name: 'p', sequence: '\u0010', ctrl: true });
        expect(lastFrame()).toContain('❯ first');
    });
});
//# sourceMappingURL=ToolListStep.test.js.map