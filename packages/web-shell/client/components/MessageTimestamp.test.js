import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageTimestamp, formatTimestamp } from './MessageTimestamp';
import styles from './MessageTimestamp.module.css';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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
    act(() => root.render(node));
    mounted.push({ root, container });
    return container;
}
describe('formatTimestamp', () => {
    // Built from local-time parts so expectations are timezone independent
    // (month is 0-based: 5 = June).
    const now = new Date(2026, 5, 13, 12, 0, 0);
    it('shows only HH:mm:ss for a same-day timestamp', () => {
        const ts = new Date(2026, 5, 13, 9, 8, 7).getTime();
        expect(formatTimestamp(ts, now)).toBe('09:08:07');
    });
    it('shows full yyyy-MM-dd HH:mm:ss for an earlier day in the same year', () => {
        const ts = new Date(2026, 0, 2, 9, 8, 7).getTime();
        expect(formatTimestamp(ts, now)).toBe('2026-01-02 09:08:07');
    });
    it('shows full yyyy-MM-dd HH:mm:ss for a previous year', () => {
        // Same month/day as `now` but last year — must not be read as "today".
        const ts = new Date(2025, 5, 13, 9, 8, 7).getTime();
        expect(formatTimestamp(ts, now)).toBe('2025-06-13 09:08:07');
    });
});
describe('MessageTimestamp', () => {
    it('reveals the wall-clock time as a hover tooltip when a timestamp is set', () => {
        const ts = new Date(2026, 5, 13, 9, 8, 7).getTime();
        const container = render(_jsx(MessageTimestamp, { timestamp: ts, children: _jsx("div", { children: "body" }) }));
        const tip = container.querySelector('span[aria-hidden="true"]');
        expect(tip).not.toBeNull();
        // Every variant ends in HH:mm:ss; the leading parts depend on the real
        // "now", so assert the shape rather than an exact string here.
        expect(tip?.textContent).toMatch(/\d{2}:\d{2}:\d{2}$/);
        expect(container.textContent).toContain('body');
    });
    it('renders no wrapper when timestamp is undefined', () => {
        const container = render(_jsx(MessageTimestamp, { children: _jsx("div", { "data-testid": "child", children: "body" }) }));
        expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
        const child = container.querySelector('[data-testid="child"]');
        expect(child).not.toBeNull();
        expect(child?.parentElement).toBe(container);
    });
    it('uses larger spacing only when requested for a tool group', () => {
        const defaultRow = render(_jsx(MessageTimestamp, { children: _jsx("div", { children: "default" }) }));
        const toolRow = render(_jsx(MessageTimestamp, { toolGroupSpacing: true, children: _jsx("div", { children: "tool" }) }));
        expect(defaultRow.firstElementChild?.classList).not.toContain(styles.toolGroupSpacing);
        expect(toolRow.firstElementChild?.classList).toContain(styles.toolGroupSpacing);
    });
});
//# sourceMappingURL=MessageTimestamp.test.js.map