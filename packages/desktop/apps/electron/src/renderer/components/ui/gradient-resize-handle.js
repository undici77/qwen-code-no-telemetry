import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { useResizeGradient } from "@/hooks/useResizeGradient";
/**
 * GradientResizeHandle - A resize handle with a gradient indicator that follows the cursor
 *
 * Features:
 * - 12px touch area (±6px from center) for easy grabbing
 * - 1px static separator line (always visible, connects panels)
 * - Gradient overlay that follows cursor on hover (fades in/out over 150ms)
 * - Horizontal connector line at header height to join panel separators
 *
 * Drop-in replacement for ResizableHandle from shadcn/ui
 */
export function GradientResizeHandle({ className, headerHeight = 50 }) {
    const { ref, handlers, gradientStyle } = useResizeGradient();
    return (_jsxs(ResizablePrimitive.PanelResizeHandle, { className: cn(
        // 1px visual width, touch area extends via absolute positioning
        "relative flex w-px items-center justify-center", "border-0 shadow-none outline-none ring-0", "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0", "after:hidden before:hidden", className), children: [_jsx("div", { className: "absolute h-px bg-border", style: { top: headerHeight, left: -6, right: 0 } }), _jsxs("div", { ref: ref, onMouseDown: handlers.onMouseDown, onMouseMove: handlers.onMouseMove, onMouseLeave: handlers.onMouseLeave, className: "absolute inset-y-0 -left-1.5 -right-1.5 flex justify-center cursor-col-resize", children: [_jsx("div", { className: "w-px h-full bg-border" }), _jsx("div", { className: "absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5", style: gradientStyle })] })] }));
}
//# sourceMappingURL=gradient-resize-handle.js.map