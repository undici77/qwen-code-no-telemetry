import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { BaseTextInput } from './BaseTextInput.js';
import { useKeypress } from '../hooks/useKeypress.js';
vi.mock('../hooks/useKeypress.js', () => ({
    useKeypress: vi.fn(),
}));
const mockedUseKeypress = vi.mocked(useKeypress);
function makeKey(overrides) {
    return {
        name: '',
        ctrl: false,
        meta: false,
        shift: false,
        paste: false,
        sequence: '',
        ...overrides,
    };
}
function createBuffer() {
    return {
        text: '',
        viewportVisualLines: [''],
        visualCursor: [0, 0],
        visualScrollRow: 0,
        setText: vi.fn(),
        newline: vi.fn(),
        move: vi.fn(),
        killLineRight: vi.fn(),
        killLineLeft: vi.fn(),
        deleteWordLeft: vi.fn(),
        openInExternalEditor: vi.fn(),
        backspace: vi.fn(),
        handleInput: vi.fn(),
    };
}
function captureKeypressHandler() {
    const calls = mockedUseKeypress.mock.calls;
    if (calls.length === 0) {
        throw new Error('useKeypress was not called');
    }
    return calls[calls.length - 1][0];
}
describe('BaseTextInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('does not type the render-mode shortcut into the buffer', () => {
        const buffer = createBuffer();
        render(_jsx(BaseTextInput, { buffer: buffer, onSubmit: vi.fn() }));
        const handler = captureKeypressHandler();
        handler(makeKey({ name: 'm', meta: true, sequence: 'µ' }));
        expect(buffer.handleInput).not.toHaveBeenCalled();
    });
    it('still passes pasted µ text through to the buffer', () => {
        const buffer = createBuffer();
        render(_jsx(BaseTextInput, { buffer: buffer, onSubmit: vi.fn() }));
        const handler = captureKeypressHandler();
        const pastedKey = makeKey({ sequence: 'µ', paste: true });
        handler(pastedKey);
        expect(buffer.handleInput).toHaveBeenCalledWith(pastedKey);
    });
    it('passes typed µ text through to the buffer', () => {
        const buffer = createBuffer();
        render(_jsx(BaseTextInput, { buffer: buffer, onSubmit: vi.fn() }));
        const handler = captureKeypressHandler();
        const typedKey = makeKey({ name: 'µ', sequence: 'µ' });
        handler(typedKey);
        expect(buffer.handleInput).toHaveBeenCalledWith(typedKey);
    });
});
//# sourceMappingURL=BaseTextInput.test.js.map