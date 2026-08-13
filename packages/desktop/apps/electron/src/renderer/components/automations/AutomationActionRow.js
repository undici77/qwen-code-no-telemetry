import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AutomationActionRow
 *
 * Inline display of a single automation action (prompt or webhook).
 * Used within the "Then" section of AutomationInfoPage.
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ActionTypeIcon } from './ActionTypeIcon';
import { DEFAULT_WEBHOOK_METHOD } from './constants';
/**
 * Highlight @mentions in prompt strings
 */
function PromptText({ text, t }) {
    if (!text)
        return _jsx("span", { className: "text-sm text-muted-foreground italic", children: t('automations.emptyPrompt') });
    const parts = text.split(/(@\w[\w-]*)/g);
    return (_jsx("span", { className: "text-sm break-words", children: parts.map((part, i) => part.startsWith('@') ? (_jsx("span", { className: "text-accent font-medium", children: part }, i)) : (_jsx("span", { children: part }, i))) }));
}
function WebhookText({ action }) {
    const method = action.method ?? DEFAULT_WEBHOOK_METHOD;
    return (_jsxs("span", { className: "text-sm break-words", children: [_jsx("span", { className: "font-mono font-medium text-accent", children: method }), ' ', _jsx("span", { className: "text-foreground/70", children: action.url }), action.bodyFormat && (_jsxs("span", { className: "text-foreground/40 ml-1", children: ["(", action.bodyFormat, ")"] }))] }));
}
export function AutomationActionRow({ action, index, className }) {
    const { t } = useTranslation();
    const isWebhook = action.type === 'webhook';
    return (_jsxs("div", { className: cn('flex items-start gap-3 px-4 py-3', className), children: [_jsxs("div", { className: "flex items-center gap-2 shrink-0 h-5 mt-[3px]", children: [_jsxs("span", { className: "text-xs text-muted-foreground tabular-nums w-4 text-right", children: [index + 1, "."] }), _jsx(ActionTypeIcon, { type: action.type, className: "h-3.5 w-3.5" })] }), _jsx("div", { className: "flex-1 min-w-0", children: isWebhook ? (_jsx(WebhookText, { action: action })) : (_jsx(PromptText, { text: action.prompt, t: t })) })] }));
}
//# sourceMappingURL=AutomationActionRow.js.map