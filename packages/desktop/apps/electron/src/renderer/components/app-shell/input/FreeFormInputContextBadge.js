import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui';
import { FadingText } from '@/components/ui/fading-text';
import { cn } from '@/lib/utils';
/**
 * FreeFormInputContextBadge - Unified context badge for Sources, Files, and Folder selectors
 *
 * Visual States:
 * - Expanded: Icon + Label + Chevron, no background, hover shows background
 * - Collapsed (no selection): Icon only, no background, hover shows background
 * - Collapsed (has selection): Icon + Label (fading), bg-background + shadow-minimal
 * - Open: bg-foreground/5 (like hover)
 */
export const FreeFormInputContextBadge = React.forwardRef(function FreeFormInputContextBadge({ icon, label, ariaLabel, trailingContent, isExpanded = false, hasSelection = false, showChevron = false, onClick, tooltip, isOpen = false, disabled = false, className, buttonRef, 'data-tutorial': dataTutorial, }, ref) {
    // Merge refs if both are provided
    const mergedRef = buttonRef || ref;
    // Show label in expanded state OR in collapsed state with selection
    const showLabel = isExpanded || hasSelection;
    const button = (_jsxs("button", { ref: mergedRef, type: "button", "aria-label": ariaLabel ?? label, onClick: onClick, disabled: disabled, "data-tutorial": dataTutorial, className: cn(
        // Base styles - shrink + min-w-0 allows badge to compress in tight layouts
        "input-toolbar-btn inline-flex items-center gap-1.5 h-7 rounded-[6px] text-[13px] text-foreground transition-colors select-none shrink min-w-0", "disabled:opacity-50 disabled:pointer-events-none", 
        // Padding: more padding when showing label
        showLabel ? "px-2" : "px-1.5", 
        // Collapsed with selection: visible background + thin 1px border + margin
        !isExpanded && hasSelection && "bg-background border border-foreground/5 mx-0.5", 
        // Hover state (when not already showing background from selection)
        !(!isExpanded && hasSelection) && "hover:bg-foreground/5", 
        // Open state (dropdown shown)
        isOpen && "bg-foreground/5", className), children: [_jsx("span", { className: "shrink-0 flex items-center", children: icon }), showLabel && (isExpanded ? (
            // Expanded: simple truncate, placeholder (no selection) gets 60% opacity
            _jsx("span", { className: cn("truncate max-w-[120px] min-w-0 shrink", !hasSelection && "opacity-50"), children: label })) : (
            // Collapsed with selection: fading text with max width
            _jsx(FadingText, { className: "max-w-[140px] min-w-0 shrink", fadeWidth: 20, children: label }))), showLabel && trailingContent, isExpanded && showChevron && (_jsx(ChevronDown, { className: "h-3 w-3 opacity-50 shrink-0" }))] }));
    // Wrap with tooltip if provided (skip when dropdown is open to avoid showing tooltip)
    if (tooltip && !isOpen) {
        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { side: "top", children: tooltip })] }));
    }
    return button;
});
//# sourceMappingURL=FreeFormInputContextBadge.js.map