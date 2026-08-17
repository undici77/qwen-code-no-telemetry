import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useFilterInput } from './useFilterInput';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let latest = null;
function Harness({ onFilterChange }) {
  const result = useFilterInput(onFilterChange);
  latest = result;
  return _jsx('input', { ...result.inputProps });
}
let container = null;
let root = null;
function mount(onFilterChange) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(_jsx(Harness, { onFilterChange: onFilterChange }));
  });
}
function input() {
  return container.querySelector('input');
}
// React installs a value tracker on the input element, so assigning `.value`
// directly is ignored by its onChange. Use the prototype's native setter so the
// tracker observes the change and React fires onChange.
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  'value',
).set;
function type(value) {
  act(() => {
    const el = input();
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  latest = null;
});
describe('useFilterInput', () => {
  it('commits the filter value on plain (non-composition) input', () => {
    const onFilterChange = vi.fn();
    mount(onFilterChange);
    type('abc');
    expect(input().value).toBe('abc');
    expect(latest.filterValue).toBe('abc');
    expect(onFilterChange).toHaveBeenLastCalledWith('abc');
  });
  it('holds the filter value steady during IME composition, committing on end', () => {
    const onFilterChange = vi.fn();
    mount(onFilterChange);
    act(() => {
      input().dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true }),
      );
    });
    // Intermediate pinyin keystrokes update the visible value but not the filter.
    type('ni');
    type('nih');
    expect(input().value).toBe('nih');
    expect(latest.filterValue).toBe('');
    expect(onFilterChange).not.toHaveBeenCalled();
    // Committing the composition applies the final value once.
    act(() => {
      const el = input();
      nativeInputValueSetter.call(el, '你好');
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '你好' }),
      );
    });
    expect(latest.filterValue).toBe('你好');
    expect(onFilterChange).toHaveBeenLastCalledWith('你好');
    // No `input` event followed the compositionend here, so this proves the
    // controlled value is synced by compositionend itself — the field must
    // never display a stale preedit while the list filters by the new value.
    expect(input().value).toBe('你好');
  });
  it('ignores a cancelled composition that leaves the value unchanged', () => {
    const onFilterChange = vi.fn();
    mount(onFilterChange);
    type('abc');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    // Start a composition, type an intermediate pinyin char, then cancel it
    // (e.g. Esc): the visible value returns to 'abc' and compositionend fires.
    act(() => {
      input().dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true }),
      );
    });
    type('abcn');
    act(() => {
      const el = input();
      nativeInputValueSetter.call(el, 'abc');
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '' }),
      );
    });
    // The committed filter never changed, so consumers must not be notified —
    // a notification would reset dialog selection state (e.g. delete checks).
    expect(latest.filterValue).toBe('abc');
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    // A real edit afterwards still commits normally.
    type('abcd');
    expect(latest.filterValue).toBe('abcd');
    expect(onFilterChange).toHaveBeenLastCalledWith('abcd');
  });
});
//# sourceMappingURL=useFilterInput.test.js.map
