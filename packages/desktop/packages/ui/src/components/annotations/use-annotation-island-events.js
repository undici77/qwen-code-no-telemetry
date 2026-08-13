import * as React from 'react';
import { resolveIslandOutsideDismissAction, } from './island-dismiss-policy';
export const ISLAND_BLOCKER_SELECTOR = '[data-ca-island-blocker="true"]';
export function isIslandBlockerTarget(target) {
    if (!target || typeof target !== 'object')
        return false;
    const maybeElement = target;
    if (typeof maybeElement.closest === 'function') {
        return Boolean(maybeElement.closest(ISLAND_BLOCKER_SELECTOR));
    }
    if (maybeElement.parentElement && typeof maybeElement.parentElement.closest === 'function') {
        return Boolean(maybeElement.parentElement.closest(ISLAND_BLOCKER_SELECTOR));
    }
    return false;
}
export function useAnnotationIslandEvents({ enabled, openedAtRef, isCompactView, isTargetInsideAnnotationIsland, onClose, onBack, outsideClickBehavior = 'back-or-close', scrollGraceMs = 180, }) {
    React.useEffect(() => {
        if (!enabled)
            return;
        const dismissOutside = () => {
            const action = resolveIslandOutsideDismissAction({
                isCompactView,
                behavior: outsideClickBehavior,
            });
            if (action === 'back' && onBack?.()) {
                return;
            }
            onClose();
        };
        const handlePointerDown = (event) => {
            if (isIslandBlockerTarget(event.target))
                return;
            const target = event.target;
            if (!target)
                return;
            if (isTargetInsideAnnotationIsland(target))
                return;
            dismissOutside();
        };
        const handleScroll = (event) => {
            if (Date.now() - openedAtRef.current < scrollGraceMs) {
                return;
            }
            if (!isCompactView) {
                return;
            }
            if (isIslandBlockerTarget(event.target)) {
                return;
            }
            const target = event.target;
            if (target && isTargetInsideAnnotationIsland(target)) {
                return;
            }
            dismissOutside();
        };
        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [
        enabled,
        openedAtRef,
        isCompactView,
        isTargetInsideAnnotationIsland,
        onClose,
        onBack,
        outsideClickBehavior,
        scrollGraceMs,
    ]);
}
//# sourceMappingURL=use-annotation-island-events.js.map