import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AutomationActionPreview
 *
 * Compact action list for expanded rows in AutomationCard and AutomationsListPanel.
 * Shows MessageSquare/Webhook icon + truncated text.
 *
 * For the full-size info page with index numbering and @mention highlighting,
 * use AutomationActionRow instead.
 */
import { cn } from '@/lib/utils';
import { ActionTypeIcon } from './ActionTypeIcon';
import { DEFAULT_WEBHOOK_METHOD } from './constants';
export function AutomationActionPreview({ actions, className }) {
    return (_jsx("div", { className: cn('space-y-1', className), children: actions.map((action, i) => (_jsxs("div", { className: "flex items-start gap-2 text-xs", children: [_jsx(ActionTypeIcon, { type: action.type, className: "h-3 w-3 mt-0.5 shrink-0" }), _jsx("span", { className: "text-foreground/70 break-words line-clamp-2", children: action.type === 'webhook'
                        ? `${action.method ?? DEFAULT_WEBHOOK_METHOD} ${action.url}`
                        : action.prompt })] }, i))) }));
}
//# sourceMappingURL=AutomationActionPreview.js.map