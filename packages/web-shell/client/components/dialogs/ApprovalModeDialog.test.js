import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../i18n';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { };
}
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
    DAEMON_APPROVAL_MODES: ['plan', 'default', 'yolo'],
}));
const { ApprovalModeDialog } = await import('./ApprovalModeDialog');
let container = null;
let root = null;
function mount(node) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
        root.render(_jsx(I18nProvider, { language: "en", children: node }));
    });
}
function rerender(node) {
    act(() => {
        root.render(_jsx(I18nProvider, { language: "en", children: node }));
    });
}
function press(key) {
    act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
}
const activeDescendant = () => container
    .querySelector('[role="listbox"]')
    .getAttribute('aria-activedescendant');
afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
});
describe('ApprovalModeDialog', () => {
    it('renames only the plan entry when Session Workflow is enabled', () => {
        mount(_jsx(ApprovalModeDialog, { currentMode: "default", onSelect: vi.fn() }));
        expect(container.querySelector('[data-mode-id="plan"]')?.textContent).toContain('Plan (plan)');
        rerender(_jsx(ApprovalModeDialog, { currentMode: "default", sessionWorkflowEnabled: true, onSelect: vi.fn() }));
        expect(container.querySelector('[data-mode-id="plan"]')?.textContent).toContain('Plan & Review (plan)');
        expect(container.querySelector('[data-mode-id="default"]')?.textContent).toContain('Ask Approval (default)');
        expect(container.querySelector('[data-mode-id="yolo"]')?.textContent).toContain('Full Access (yolo)');
    });
    it('opens with the highlight on the current mode and confirms on Enter', () => {
        const onSelect = vi.fn();
        mount(_jsx(ApprovalModeDialog, { currentMode: "default", onSelect: onSelect }));
        expect(activeDescendant()).toBe('mode-opt-1');
        press('ArrowDown');
        expect(activeDescendant()).toBe('mode-opt-2');
        press('Enter');
        expect(onSelect).toHaveBeenCalledWith('yolo');
    });
    it('binds aria-selected to the current mode, not the roving highlight', () => {
        mount(_jsx(ApprovalModeDialog, { currentMode: "plan", onSelect: vi.fn() }));
        const selected = () => Array.from(container.querySelectorAll('[aria-selected="true"]'));
        expect(selected()).toHaveLength(1);
        expect(selected()[0].id).toBe('mode-opt-0');
        press('ArrowDown');
        expect(selected()).toHaveLength(1);
        expect(selected()[0].id).toBe('mode-opt-0');
    });
    it('re-syncs the highlight when the current mode changes while open', () => {
        mount(_jsx(ApprovalModeDialog, { currentMode: "plan", onSelect: vi.fn() }));
        expect(activeDescendant()).toBe('mode-opt-0');
        // Another client sharing the session flips approval mode while the dialog
        // is open: the highlight (and Enter's target) must follow.
        rerender(_jsx(ApprovalModeDialog, { currentMode: "yolo", onSelect: vi.fn() }));
        expect(activeDescendant()).toBe('mode-opt-2');
    });
    it('stops following once the user has navigated', () => {
        mount(_jsx(ApprovalModeDialog, { currentMode: "plan", onSelect: vi.fn() }));
        press('ArrowDown');
        expect(activeDescendant()).toBe('mode-opt-1');
        // The user owns the highlight now — a mode change must not steal it.
        rerender(_jsx(ApprovalModeDialog, { currentMode: "yolo", onSelect: vi.fn() }));
        expect(activeDescendant()).toBe('mode-opt-1');
    });
});
//# sourceMappingURL=ApprovalModeDialog.test.js.map