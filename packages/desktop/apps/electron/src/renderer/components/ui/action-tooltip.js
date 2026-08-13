import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionLabel } from '@/actions';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
export function ActionTooltip({ action, children }) {
    const { label, hotkey } = useActionLabel(action);
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: children }), _jsxs(TooltipContent, { children: [label, hotkey && _jsx("kbd", { className: "ml-2 text-xs opacity-60", children: hotkey })] })] }));
}
//# sourceMappingURL=action-tooltip.js.map