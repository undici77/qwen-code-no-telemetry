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
import { PlatformProvider } from '../../context/PlatformContext.js';
import { MessageMeta } from './MessageMeta.js';
describe('MessageMeta', () => {
    let container = null;
    let root = null;
    beforeEach(() => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        vi.useFakeTimers();
    });
    afterEach(() => {
        if (root) {
            act(() => {
                root?.unmount();
            });
            root = null;
        }
        if (container) {
            container.remove();
            container = null;
        }
        vi.useRealTimers();
    });
    it('renders message time and copy action', () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => {
            root?.render(_jsx(MessageMeta, { timestamp: Date.UTC(2026, 3, 30, 1, 2), copyText: "hello" }));
        });
        const time = container.querySelector('time');
        expect(time?.getAttribute('datetime')).toMatch(/^\d{2}:\d{2}$/);
        const html = container.innerHTML;
        expect(html).not.toContain('2026-04-30');
        expect(html).toContain('Copy message');
    });
    it('shows copied state after copying', async () => {
        const copyToClipboard = vi.fn().mockResolvedValue(undefined);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => {
            root?.render(_jsx(PlatformProvider, { value: {
                    platform: 'web',
                    postMessage: vi.fn(),
                    onMessage: () => () => { },
                    copyToClipboard,
                    features: { canCopy: true },
                }, children: _jsx(MessageMeta, { timestamp: Date.UTC(2026, 3, 30, 1, 2), copyText: "hi" }) }));
        });
        const button = container.querySelector('button[aria-label="Copy message"]');
        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(copyToClipboard).toHaveBeenCalledWith('hi');
        expect(container.querySelector('button[aria-label="Copied"]')).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1400);
        });
        expect(container.querySelector('button[aria-label="Copy message"]')).not.toBeNull();
    });
    it('calls onEdit from the edit button and renders a custom edit icon', () => {
        const onEdit = vi.fn();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => {
            root?.render(_jsx(MessageMeta, { timestamp: Date.UTC(2026, 3, 30, 1, 2), copyText: "hi", onEdit: onEdit, editIcon: _jsx("span", { "data-testid": "edit-icon", children: "edit" }) }));
        });
        const button = container.querySelector('button[aria-label="Edit message"]');
        expect(container.querySelector('[data-testid="edit-icon"]')).not.toBeNull();
        act(() => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(onEdit).toHaveBeenCalledOnce();
    });
    it('disables the edit button when editDisabled is true', () => {
        const onEdit = vi.fn();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => {
            root?.render(_jsx(MessageMeta, { copyText: "hi", onEdit: onEdit, editDisabled: true, editIcon: "edit" }));
        });
        const button = container.querySelector('button[aria-label="Edit message"]');
        expect(button.disabled).toBe(true);
        act(() => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(onEdit).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=MessageMeta.test.js.map