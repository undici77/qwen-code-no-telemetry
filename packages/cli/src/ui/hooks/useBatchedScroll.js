/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef, useLayoutEffect, useCallback } from 'react';
/**
 * A hook to manage batched scroll state updates.
 * It allows multiple scroll operations within the same tick to accumulate
 * by keeping track of a 'pending' state that resets after render.
 */
export function useBatchedScroll(currentScrollTop) {
    const pendingScrollTopRef = useRef(null);
    const currentScrollTopRef = useRef(currentScrollTop);
    useLayoutEffect(() => {
        currentScrollTopRef.current = currentScrollTop;
        pendingScrollTopRef.current = null;
    });
    const getScrollTop = useCallback(() => pendingScrollTopRef.current ?? currentScrollTopRef.current, []);
    const setPendingScrollTop = useCallback((newScrollTop) => {
        pendingScrollTopRef.current = newScrollTop;
    }, []);
    return { getScrollTop, setPendingScrollTop };
}
//# sourceMappingURL=useBatchedScroll.js.map