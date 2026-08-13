import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ConnectionIcon
 *
 * Displays the provider logo for an LLM connection.
 * Falls back to the first letter of the connection name if no icon is available.
 *
 * Used in:
 * - AI Settings (connections list)
 * - FreeFormInput (model display)
 * - Session List (connection badge)
 * - New Session (model selector group names)
 */
import { SquareTerminal } from 'lucide-react';
import { getModelDisplayName } from '@config/models';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
export function ConnectionIcon({ connection, size = 16, className = '', showTooltip = false }) {
    const iconElement = (_jsx("div", { className: `rounded-[3px] bg-foreground/10 flex items-center justify-center flex-shrink-0 ${className}`, style: { width: size, height: size }, children: _jsx(SquareTerminal, { className: "text-foreground/50 flex-shrink-0", style: { width: Math.round(size * 0.7), height: Math.round(size * 0.7) } }) }));
    if (!showTooltip)
        return iconElement;
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: iconElement }), _jsx(TooltipContent, { side: "bottom", sideOffset: 4, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { children: connection.name }), connection.defaultModel && _jsx("div", { className: "text-[10px] opacity-60", children: getModelDisplayName(connection.defaultModel) })] }) })] }));
}
//# sourceMappingURL=ConnectionIcon.js.map