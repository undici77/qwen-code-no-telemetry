import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { TodoPanel } from './TodoPanel';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const mounted = [];
afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});
function render(node) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(_jsx(I18nProvider, { language: 'en', children: node }));
  });
  mounted.push({ root, container });
  return container;
}
const todo = (id, status) => ({
  id,
  status,
  content: `Step ${id}`,
});
describe('TodoPanel bottom status items', () => {
  it('opens plan execution from the progress control', () => {
    const onOpen = vi.fn();
    const container = render(
      _jsx(TodoPanel, { todos: [todo('1', 'in_progress')], onOpen: onOpen }),
    );
    const button = container.querySelector('button[aria-label="Step 1 / 1"]');
    act(() => button.click());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
  it('renders status items beside todo progress with a separator', () => {
    const onClick = vi.fn();
    const container = render(
      _jsx(TodoPanel, {
        todos: [todo('1', 'in_progress'), todo('2', 'pending')],
        statusItems: [
          {
            id: 'changed-files',
            label: '1 file changed',
            title: 'Open changed files',
            onClick,
          },
        ],
      }),
    );
    expect(container.textContent).toContain('Step 1 / 2');
    expect(container.textContent).toContain('·');
    const button = container.querySelector(
      'button[title="Open changed files"]',
    );
    expect(button?.textContent).toBe('1 file changed');
    act(() => {
      button.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('can render status-only content without todo progress or detail tooltip', () => {
    const container = render(
      _jsx(TodoPanel, {
        todos: [],
        statusItems: [
          {
            id: 'changed-files',
            label: '2 files changed',
            ariaLabel: 'Open changed files',
          },
        ],
      }),
    );
    expect(container.textContent).toBe('2 files changed');
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(container.querySelector('section')?.getAttribute('aria-label')).toBe(
      'Open changed files',
    );
    expect(container.querySelector('div[aria-label="Step 0 / 0"]')).toBeNull();
  });
});
//# sourceMappingURL=TodoPanel.test.js.map
