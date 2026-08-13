import { act } from 'react';
import { createRoot } from 'react-dom/client';
const mounted = [];
export function mountReact(node) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
        root.render(node);
    });
    mounted.push({ root, container });
    return container;
}
export function cleanupReact() {
    for (const { root, container } of mounted.splice(0)) {
        act(() => {
            root.unmount();
        });
        container.remove();
    }
}
export async function flushReact() {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
}
export function immediateClipboardWrite() {
    return {
        then(onFulfilled) {
            onFulfilled?.(undefined);
            return Promise.resolve();
        },
    };
}
//# sourceMappingURL=reactHarness.js.map