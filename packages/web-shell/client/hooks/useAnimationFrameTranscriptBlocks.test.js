import { jsx as _jsx } from 'react/jsx-runtime';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnimationFrameTranscriptBlocks } from './useAnimationFrameTranscriptBlocks';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const testStore = vi.hoisted(() => {
  let blocks = [];
  const listeners = new Set();
  return {
    getSnapshot: () => ({ blocks }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(nextBlocks) {
      blocks = nextBlocks;
      listeners.forEach((listener) => listener());
    },
    reset() {
      blocks = [];
      listeners.clear();
    },
  };
});
vi.mock('@qwen-code/webui/daemon-react-sdk', () => ({
  useTranscriptStore: () => testStore,
}));
let root = null;
let container = null;
let renderCount = 0;
let latestBlocks = [];
function Harness() {
  latestBlocks = useAnimationFrameTranscriptBlocks();
  renderCount += 1;
  return null;
}
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  renderCount = 0;
  latestBlocks = [];
  testStore.reset();
  vi.restoreAllMocks();
});
describe('useAnimationFrameTranscriptBlocks', () => {
  it('coalesces transcript notifications into one render per frame', () => {
    let pendingFrame = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      pendingFrame = callback;
      return 1;
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(_jsx(Harness, {})));
    const initialRenderCount = renderCount;
    act(() => {
      for (let index = 1; index <= 100; index++) {
        testStore.update(Array.from({ length: index }, () => ({})));
      }
    });
    expect(renderCount).toBe(initialRenderCount);
    expect(pendingFrame).not.toBeNull();
    act(() => {
      pendingFrame?.(performance.now());
    });
    expect(renderCount).toBe(initialRenderCount + 1);
    expect(latestBlocks).toHaveLength(100);
  });
  it('cancels a pending frame on unmount', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(_jsx(Harness, {})));
    act(() => testStore.update([{}]));
    act(() => root.unmount());
    root = null;
    expect(cancelFrame).toHaveBeenCalledWith(7);
  });
});
//# sourceMappingURL=useAnimationFrameTranscriptBlocks.test.js.map
