import { useCallback, useSyncExternalStore } from 'react';
import { useTranscriptStore } from '@qwen-code/webui/daemon-react-sdk';
export function useAnimationFrameTranscriptBlocks() {
    const store = useTranscriptStore();
    const subscribe = useCallback((notify) => {
        let frame = null;
        const unsubscribe = store.subscribe(() => {
            if (frame !== null)
                return;
            frame = window.requestAnimationFrame(() => {
                frame = null;
                notify();
            });
        });
        return () => {
            unsubscribe();
            if (frame !== null) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [store]);
    const getSnapshot = useCallback(() => store.getSnapshot().blocks, [store]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
//# sourceMappingURL=useAnimationFrameTranscriptBlocks.js.map