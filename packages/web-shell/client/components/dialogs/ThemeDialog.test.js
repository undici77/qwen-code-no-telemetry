import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../i18n';
import { WebShellThemeId } from '../../themeContext';
import { ThemeDialog } from './ThemeDialog';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// jsdom has no layout — stub the scroll-into-view the list uses on selection.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { };
}
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
function press(key) {
    act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
    });
}
function listbox() {
    return container.querySelector('[role="listbox"]');
}
/** The option the listbox currently points `aria-activedescendant` at. */
function activeOption() {
    const id = listbox().getAttribute('aria-activedescendant');
    return id ? document.getElementById(id) : null;
}
afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
});
describe('ThemeDialog aria-activedescendant coupling', () => {
    it('points aria-activedescendant at an existing option, tracking arrow nav', () => {
        mount(_jsx(ThemeDialog, { currentTheme: WebShellThemeId.Dark, onSelect: vi.fn(), onClose: vi.fn() }));
        // Opens on the current theme; the referenced id must resolve to a real
        // option element (guards the hand-built `theme-opt-<i>` id scheme).
        const initial = activeOption();
        expect(initial).not.toBeNull();
        expect(initial.getAttribute('role')).toBe('option');
        expect(initial.getAttribute('aria-selected')).toBe('true');
        // Arrowing moves the reference, and it still resolves to a real option.
        press('ArrowDown');
        const next = activeOption();
        expect(next).not.toBeNull();
        expect(next.getAttribute('role')).toBe('option');
        expect(next).not.toBe(initial);
    });
});
//# sourceMappingURL=ThemeDialog.test.js.map