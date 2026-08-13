import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { WorkspaceSelector } from './WorkspaceSelector';
let root;
let container;
afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
});
function renderSelector(overrides = {}) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
        root?.render(_jsx(I18nProvider, { language: "en", children: _jsx(WorkspaceSelector, { workspaces: [
                    {
                        id: 'primary',
                        cwd: '/primary',
                        label: 'primary',
                        primary: true,
                        trusted: true,
                    },
                    {
                        id: 'locked',
                        cwd: '/locked',
                        label: 'locked',
                        primary: false,
                        trusted: false,
                    },
                ], scratchSupported: true, existingFolderSupported: true, onSelectWorkspace: vi.fn(), onCreateScratch: vi.fn(), onOpenExistingFolder: vi.fn(), ...overrides }) }));
    });
    return container;
}
describe('WorkspaceSelector', () => {
    it('hides for a single workspace without creation capabilities', () => {
        const element = renderSelector({
            workspaces: [
                {
                    id: 'primary',
                    cwd: '/primary',
                    label: 'primary',
                    primary: true,
                    trusted: true,
                },
            ],
            scratchSupported: false,
            existingFolderSupported: false,
        });
        expect(element.querySelector('button')).toBeNull();
    });
    it('gates creation actions and disables untrusted workspaces', async () => {
        const onCreateScratch = vi.fn();
        const element = renderSelector({ onCreateScratch });
        const trigger = element.querySelector('button');
        await act(async () => {
            trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        });
        expect(document.body.textContent).toContain('New workspace');
        expect(document.body.textContent).toContain('untrusted');
        const newWorkspace = document.querySelector('[data-slot="dropdown-menu-sub-trigger"]');
        await act(async () => {
            newWorkspace.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        });
        expect(document.body.textContent).toContain('Start from scratch');
        expect(document.body.textContent).toContain('Use an existing folder');
        const locked = [
            ...document.querySelectorAll('[role="menuitemradio"]'),
        ].find((entry) => entry.textContent?.includes('locked'));
        expect(locked?.getAttribute('data-disabled')).not.toBeNull();
    });
});
//# sourceMappingURL=WorkspaceSelector.test.js.map