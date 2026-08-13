import { useState, useCallback } from 'react';
import * as storage from '@/lib/local-storage';
export function useResizablePanels(key, defaultSizes) {
    const [layout, setLayout] = useState(() => {
        const saved = storage.get(storage.KEYS.panelLayout, [], key);
        if (saved.length === defaultSizes.length) {
            return saved;
        }
        return defaultSizes;
    });
    const onLayoutChange = useCallback((sizes) => {
        setLayout(sizes);
        storage.set(storage.KEYS.panelLayout, sizes, key);
    }, [key]);
    return { layout, onLayoutChange };
}
//# sourceMappingURL=useResizablePanels.js.map