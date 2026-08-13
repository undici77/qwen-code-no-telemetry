import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../lib/utils";
/**
 * Format duration in human-readable form
 * @param ms Duration in milliseconds
 * @returns "45s" for under a minute, "1:02" for 1+ minutes
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
/**
 * Spinner - 3x3 grid spinner based on SpinKit Grid
 *
 * Features:
 * - Uses currentColor (inherits text color from parent)
 * - Uses em sizing (scales with font-size)
 * - 3x3 grid of cubes with staggered scale animation
 * - Pure CSS animation (no JS state)
 *
 * Usage:
 * ```tsx
 * // Inherits color and size from parent
 * <div className="text-muted-foreground text-sm">
 *   <Spinner />
 * </div>
 *
 * // Or override with className
 * <Spinner className="text-amber-500 text-lg" />
 * ```
 */
export function Spinner({ className }) {
    return (_jsxs("span", { className: cn("spinner", className), role: "status", "aria-label": "Loading", children: [_jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" }), _jsx("span", { className: "spinner-cube" })] }));
}
/**
 * LoadingIndicator - Spinner with optional label and elapsed time
 *
 * Inherits text color and size from parent element.
 *
 * Features:
 * - Animated 3x3 dot grid spinner (CSS-only)
 * - Optional label text
 * - Optional elapsed time display
 */
export function LoadingIndicator({ label, animated = true, showElapsed = false, className, spinnerClassName, }) {
    const [elapsed, setElapsed] = React.useState(0);
    const startTimeRef = React.useRef(null);
    // Elapsed time tracking
    React.useEffect(() => {
        if (!showElapsed)
            return;
        // Initialize start time
        if (typeof showElapsed === 'number') {
            startTimeRef.current = showElapsed;
        }
        else if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
        const interval = setInterval(() => {
            if (startTimeRef.current) {
                setElapsed(Date.now() - startTimeRef.current);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [showElapsed]);
    return (_jsxs("span", { className: cn("inline-flex items-center gap-2", className), children: [animated ? (_jsx(Spinner, { className: spinnerClassName })) : (_jsx("span", { className: "inline-flex items-center justify-center w-[1em] h-[1em]", children: "\u25CF" })), label && (_jsx("span", { className: "text-muted-foreground", children: label })), showElapsed && elapsed >= 1000 && (_jsxs("span", { className: "text-muted-foreground/60 tabular-nums", children: ["(", formatDuration(elapsed), ")"] }))] }));
}
//# sourceMappingURL=LoadingIndicator.js.map