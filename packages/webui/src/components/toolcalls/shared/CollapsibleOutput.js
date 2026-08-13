import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
/**
 * Renderer-agnostic wrapper for long tool output.
 */
export const CollapsibleOutput = ({ children, isCollapsible, collapsedHeight = 200, fadeStart = 140, className = '', }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (_jsxs("div", { className: "flex flex-col gap-[3px]", children: [_jsx("div", { className: `toolcall-collapsible-output-content overflow-hidden ${className}`, style: !isExpanded && isCollapsible
                    ? {
                        maxHeight: `${collapsedHeight}px`,
                        maskImage: `linear-gradient(to bottom, var(--app-primary-background) ${fadeStart}px, transparent ${collapsedHeight}px)`,
                        WebkitMaskImage: `linear-gradient(to bottom, var(--app-primary-background) ${fadeStart}px, transparent ${collapsedHeight}px)`,
                    }
                    : undefined, children: children }), isCollapsible && (_jsx("div", { className: "flex justify-center border-t border-[var(--app-input-border)] pt-1", children: _jsx("button", { type: "button", onClick: (event) => {
                        event.stopPropagation();
                        setIsExpanded((expanded) => !expanded);
                    }, "aria-expanded": isExpanded, "aria-label": isExpanded ? 'Collapse output' : 'Expand output', className: "text-[var(--app-secondary-foreground)] text-[0.8em] hover:text-[var(--app-primary-foreground)] cursor-pointer bg-transparent border-none px-2 py-1 rounded hover:bg-[var(--app-input-background)] transition-colors", children: isExpanded ? '▲ Collapse' : '▼ Show more' }) }))] }));
};
//# sourceMappingURL=CollapsibleOutput.js.map