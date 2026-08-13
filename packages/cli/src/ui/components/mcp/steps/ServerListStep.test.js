import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from '@testing-library/react';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MCPServerStatus } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { ServerListStep } from './ServerListStep.js';
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
const server = (name) => ({
    name,
    status: MCPServerStatus.CONNECTED,
    source: 'user',
    config: {},
    toolCount: 0,
    promptCount: 0,
    resourceCount: 0,
    isDisabled: false,
});
describe('ServerListStep', () => {
    beforeEach(() => {
        activeKeypressHandler = null;
        vi.mocked(useKeypress).mockImplementation((handler, { isActive }) => {
            if (isActive) {
                activeKeypressHandler = handler;
            }
        });
    });
    it('navigates with Ctrl+N/P readline aliases', () => {
        const { lastFrame } = render(_jsx(ServerListStep, { servers: [server('first'), server('second')], onSelect: vi.fn() }));
        expect(lastFrame()).toContain('❯ first');
        pressKey({ name: 'n', sequence: '\u000E', ctrl: true });
        expect(lastFrame()).toContain('❯ second');
        pressKey({ name: 'p', sequence: '\u0010', ctrl: true });
        expect(lastFrame()).toContain('❯ first');
    });
    describe('approval reason (gated servers skipped by discovery)', () => {
        const gatedServer = (name, approvalState) => ({
            name,
            status: MCPServerStatus.DISCONNECTED,
            source: 'workspace',
            config: { scope: 'workspace' },
            toolCount: 0,
            promptCount: 0,
            resourceCount: 0,
            isDisabled: false,
            approvalState,
        });
        it('shows "rejected" with the re-approve hint, not a bare "disconnected"', () => {
            const { lastFrame } = render(_jsx(ServerListStep, { servers: [gatedServer('blocked', 'rejected')], onSelect: vi.fn() }));
            expect(lastFrame()).toContain('rejected — edit config to re-approve');
        });
        it('shows "needs approval" for a pending gated server', () => {
            const { lastFrame } = render(_jsx(ServerListStep, { servers: [gatedServer('waiting', 'pending')], onSelect: vi.fn() }));
            expect(lastFrame()).toContain('needs approval');
        });
        it('does not show the debug-log hint for an approval-skipped server', () => {
            const { lastFrame } = render(_jsx(ServerListStep, { servers: [gatedServer('blocked', 'rejected')], onSelect: vi.fn() }));
            expect(lastFrame()).not.toContain('see error logs');
        });
        it('still shows the debug-log hint for a genuinely failed connection', () => {
            const failed = {
                name: 'broken',
                status: MCPServerStatus.DISCONNECTED,
                source: 'user',
                config: {},
                toolCount: 0,
                promptCount: 0,
                resourceCount: 0,
                isDisabled: false,
            };
            const { lastFrame } = render(_jsx(ServerListStep, { servers: [failed], onSelect: vi.fn() }));
            expect(lastFrame()).toContain('see error logs');
            expect(lastFrame()).not.toContain('needs approval');
        });
    });
});
//# sourceMappingURL=ServerListStep.test.js.map