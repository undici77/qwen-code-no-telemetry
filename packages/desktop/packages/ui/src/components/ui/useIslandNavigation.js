import * as React from 'react';
/**
 * Shared backstack helper for Island multi-view flows.
 */
export function useIslandNavigation(initial) {
    const [stack, setStack] = React.useState([initial]);
    const push = React.useCallback((next) => {
        setStack((prev) => [...prev, next]);
    }, []);
    const replace = React.useCallback((next) => {
        setStack((prev) => {
            const base = prev.length > 0 ? prev.slice(0, -1) : [];
            return [...base, next];
        });
    }, []);
    const pop = React.useCallback(() => {
        setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);
    const reset = React.useCallback((root) => {
        setStack([root ?? initial]);
    }, [initial]);
    const current = stack[stack.length - 1] ?? initial;
    const canPop = stack.length > 1;
    const handleEscapeBackOrClose = React.useCallback((onClose) => {
        if (canPop) {
            pop();
            return true;
        }
        onClose();
        return true;
    }, [canPop, pop]);
    return {
        current,
        canPop,
        stack,
        push,
        replace,
        pop,
        reset,
        handleEscapeBackOrClose,
    };
}
//# sourceMappingURL=useIslandNavigation.js.map