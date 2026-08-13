import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useHorizontalResizeGradient } from "@/hooks/useHorizontalResizeGradient";
/**
 * HorizontalResizeHandle - A horizontal resize handle with gradient indicator
 *
 * Used for splitting panels vertically (top/bottom). The handle is a horizontal
 * bar that can be dragged up/down to resize the panels.
 *
 * Features:
 * - 12px touch area (±6px from center) for easy grabbing
 * - 1px static separator line (always visible)
 * - Gradient overlay that follows cursor on hover (fades in/out over 150ms)
 * - cursor-row-resize for vertical splitting
 */
export function HorizontalResizeHandle({ onResize, onResizeEnd, className }) {
    const { ref, handlers, gradientStyle, isDragging } = useHorizontalResizeGradient();
    const lastYRef = React.useRef(null);
    // Handle drag movement
    React.useEffect(() => {
        if (!isDragging) {
            lastYRef.current = null;
            return;
        }
        const handleMouseMove = (e) => {
            if (lastYRef.current !== null) {
                const deltaY = e.clientY - lastYRef.current;
                onResize(deltaY);
            }
            lastYRef.current = e.clientY;
        };
        const handleMouseUp = () => {
            lastYRef.current = null;
            onResizeEnd?.();
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onResize, onResizeEnd]);
    // Initialize lastY on mouse down
    const handleMouseDown = (e) => {
        lastYRef.current = e.clientY;
        handlers.onMouseDown();
    };
    return (_jsx("div", { className: cn(
        // 1px visual height, touch area extends via absolute positioning
        "relative flex h-px w-full items-center justify-center shrink-0", className), children: _jsxs("div", { ref: ref, onMouseDown: handleMouseDown, onMouseMove: handlers.onMouseMove, onMouseLeave: handlers.onMouseLeave, className: "absolute inset-x-0 -top-1.5 -bottom-1.5 flex items-center cursor-row-resize", children: [_jsx("div", { className: "w-full h-px bg-border" }), _jsx("div", { className: "absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5", style: gradientStyle })] }) }));
}
//# sourceMappingURL=horizontal-resize-handle.js.map