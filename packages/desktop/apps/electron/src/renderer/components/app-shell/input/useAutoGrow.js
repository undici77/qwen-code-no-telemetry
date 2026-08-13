import { useEffect, useCallback, useRef } from 'react';
/**
 * Hook to auto-grow a textarea based on content
 *
 * Usage:
 * ```tsx
 * const { ref, adjustHeight } = useAutoGrow({ minHeight: 72 })
 * <textarea ref={ref} onChange={(e) => { setValue(e.target.value); adjustHeight() }} />
 * ```
 */
export function useAutoGrow({ minHeight = 72, maxHeight, } = {}) {
    const ref = useRef(null);
    const adjustHeight = useCallback(() => {
        const textarea = ref.current;
        if (!textarea)
            return;
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Calculate new height
        let newHeight = Math.max(textarea.scrollHeight, minHeight);
        // Apply max height if set
        if (maxHeight) {
            newHeight = Math.min(newHeight, maxHeight);
        }
        textarea.style.height = `${newHeight}px`;
    }, [minHeight, maxHeight]);
    // Adjust on mount and when dependencies change
    useEffect(() => {
        adjustHeight();
    }, [adjustHeight]);
    return { ref, adjustHeight };
}
//# sourceMappingURL=useAutoGrow.js.map