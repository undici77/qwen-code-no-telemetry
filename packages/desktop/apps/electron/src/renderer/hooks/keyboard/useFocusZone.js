import { useRef, useEffect, useCallback } from "react";
import { useFocusContext } from "@/context/FocusContext";
/**
 * Hook for registering a component as a focus zone.
 * Zones can be navigated between using Tab/Shift+Tab or Cmd+1/2/3.
 */
export function useFocusZone({ zoneId, onFocus, onBlur, focusFirst, enabled = true, }) {
    const zoneRef = useRef(null);
    const { registerZone, unregisterZone, focusZone, isZoneFocused, focusState } = useFocusContext();
    const isFocused = enabled && isZoneFocused(zoneId);
    // shouldMoveDOMFocus is true only when this zone is focused AND the intent requires DOM focus movement
    const shouldMoveDOMFocus = enabled && focusState.zone === zoneId && focusState.shouldMoveDOMFocus;
    // Intent is only relevant if this zone is focused
    const intent = focusState.zone === zoneId ? focusState.intent : null;
    // Track previous focus state for callbacks
    const wasFocusedRef = useRef(isFocused);
    // Register zone on mount + stamp container with data attribute for DOM-based zone detection
    useEffect(() => {
        if (!enabled) {
            unregisterZone(zoneId);
            return;
        }
        if (zoneRef.current) {
            zoneRef.current.setAttribute('data-focus-zone', zoneId);
        }
        registerZone({
            id: zoneId,
            ref: zoneRef,
            focusFirst,
        });
        return () => {
            unregisterZone(zoneId);
        };
    }, [zoneId, registerZone, unregisterZone, focusFirst, enabled]);
    // Handle focus/blur callbacks
    useEffect(() => {
        if (isFocused && !wasFocusedRef.current) {
            onFocus?.();
        }
        else if (!isFocused && wasFocusedRef.current) {
            onBlur?.();
        }
        wasFocusedRef.current = isFocused;
    }, [isFocused, onFocus, onBlur]);
    const focus = useCallback((options) => {
        focusZone(zoneId, options);
    }, [focusZone, zoneId]);
    return {
        zoneRef,
        isFocused,
        shouldMoveDOMFocus,
        intent,
        focus,
    };
}
//# sourceMappingURL=useFocusZone.js.map