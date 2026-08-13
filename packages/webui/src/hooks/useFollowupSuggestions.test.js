import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFollowupSuggestions, } from './useFollowupSuggestions.js';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe('useFollowupSuggestions', () => {
    let container;
    let root;
    let followup;
    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement('div');
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        vi.useRealTimers();
    });
    async function renderHook(onAccept) {
        function HookHost() {
            followup = useFollowupSuggestions({ onAccept });
            return null;
        }
        await act(async () => root.render(_jsx(HookHost, {})));
        act(() => {
            followup.setSuggestion('Run the tests');
            vi.advanceTimersByTime(300);
        });
    }
    it('skips onAccept when the caller submits the suggestion directly', async () => {
        const onAccept = vi.fn();
        await renderHook(onAccept);
        await act(async () => {
            followup.accept('enter', { skipOnAccept: true });
            await Promise.resolve();
        });
        expect(onAccept).not.toHaveBeenCalled();
        expect(followup.state.isVisible).toBe(false);
    });
    it('calls onAccept for the normal accept path', async () => {
        const onAccept = vi.fn();
        await renderHook(onAccept);
        await act(async () => {
            followup.accept('tab');
            await Promise.resolve();
        });
        expect(onAccept).toHaveBeenCalledOnce();
        expect(onAccept).toHaveBeenCalledWith('Run the tests');
    });
});
//# sourceMappingURL=useFollowupSuggestions.test.js.map