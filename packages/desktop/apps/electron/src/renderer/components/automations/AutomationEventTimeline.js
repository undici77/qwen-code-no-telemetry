import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AutomationEventTimeline
 *
 * Compact timeline showing recent automation executions.
 * Displayed as a section within AutomationInfoPage.
 * Webhook entries are expandable to show execution details.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ShieldAlert, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';
import {} from './types';
import { formatShortRelativeTime } from './utils';
// ============================================================================
// Helpers
// ============================================================================
const statusConfig = {
    success: { icon: CheckCircle2, classes: 'text-success' },
    error: { icon: XCircle, classes: 'text-destructive' },
    blocked: { icon: ShieldAlert, classes: 'text-warning' },
};
function formatStatusCode(code, t) {
    if (code === 0)
        return t('automations.noResponse');
    return String(code);
}
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
function CopyButton({ details }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback((e) => {
        e.stopPropagation();
        const meta = {
            method: details.method,
            url: details.url,
            statusCode: details.statusCode,
            durationMs: details.durationMs,
        };
        if (details.attempts && details.attempts > 1)
            meta.attempts = details.attempts;
        if (details.error)
            meta.error = details.error;
        // Build copy text: structured metadata + raw response body (which may be truncated / not valid JSON)
        let text = JSON.stringify(meta, null, 2);
        if (details.responseBody) {
            text += '\n\n--- Response Body ---\n' + details.responseBody;
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [details]);
    const Icon = copied ? Check : Copy;
    return (_jsx("button", { className: cn('shrink-0 p-1 rounded hover:bg-foreground/10 transition-colors', copied ? 'text-success' : 'text-foreground/40 hover:text-foreground/60'), onClick: handleCopy, title: t('automations.copyPayload'), children: _jsx(Icon, { className: "h-3 w-3" }) }));
}
export function AutomationEventTimeline({ entries, className, onReplay }) {
    const { t } = useTranslation();
    const { navigateToSession } = useNavigation();
    const [expandedId, setExpandedId] = useState(null);
    if (entries.length === 0) {
        return (_jsx("div", { className: "px-4 py-6 text-center text-sm text-muted-foreground", children: t('automations.noActivityYet') }));
    }
    return (_jsx("div", { className: cn('divide-y divide-border/30', className), children: entries.map((entry) => {
            const config = statusConfig[entry.status];
            const StatusIcon = config.icon;
            const isWebhook = !!entry.webhookDetails;
            const isExpanded = expandedId === entry.id;
            const handleToggle = isWebhook ? () => setExpandedId(isExpanded ? null : entry.id) : undefined;
            const handleKeyDown = isWebhook ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : entry.id);
                }
            } : undefined;
            return (_jsxs("div", { children: [_jsxs("div", { className: cn('flex items-center gap-3 px-4 py-2.5 text-sm', isWebhook && 'cursor-pointer hover:bg-foreground/[0.03] transition-colors'), onClick: handleToggle, onKeyDown: handleKeyDown, role: isWebhook ? 'button' : undefined, tabIndex: isWebhook ? 0 : undefined, children: [_jsx(StatusIcon, { className: cn('h-3.5 w-3.5 shrink-0', config.classes) }), _jsx("span", { className: "text-xs text-muted-foreground w-16 shrink-0 tabular-nums", children: formatShortRelativeTime(entry.timestamp) }), _jsx("span", { className: "flex-1 min-w-0 truncate text-xs text-foreground/70", children: entry.actionSummary || entry.error || '—' }), entry.sessionId && (_jsx("button", { className: "shrink-0 text-[11px] text-accent hover:underline cursor-pointer", onClick: (e) => { e.stopPropagation(); navigateToSession(entry.sessionId); }, children: t('automations.openSession') })), entry.status === 'error' && isWebhook && onReplay && (_jsx("button", { className: "shrink-0 text-[11px] text-accent hover:underline cursor-pointer", onClick: (e) => { e.stopPropagation(); onReplay(entry.automationId, entry.event); }, children: t('automations.retry') })), isWebhook && (_jsx(ChevronDown, { className: cn('h-3 w-3 shrink-0 text-foreground/40 transition-transform duration-150', isExpanded && 'rotate-180') }))] }), isExpanded && entry.webhookDetails && (_jsxs("div", { className: "mx-4 mb-3 mt-0.5 rounded-md border border-border/40 bg-foreground/[0.02] px-3 py-2.5 text-xs relative", children: [_jsx("div", { className: "absolute top-2 right-2", children: _jsx(CopyButton, { details: entry.webhookDetails }) }), _jsxs("div", { className: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pr-6", children: [_jsx("span", { className: "text-foreground/50", children: t('automations.webhookMethod') }), _jsx("span", { className: "font-mono text-foreground/80", children: entry.webhookDetails.method }), _jsx("span", { className: "text-foreground/50", children: t('automations.webhookUrl') }), _jsx("span", { className: "font-mono text-foreground/80 break-all", children: entry.webhookDetails.url }), _jsx("span", { className: "text-foreground/50", children: t('automations.webhookStatus') }), _jsx("span", { className: cn('font-mono', entry.webhookDetails.statusCode >= 200 && entry.webhookDetails.statusCode < 300
                                            ? 'text-success'
                                            : 'text-destructive'), children: formatStatusCode(entry.webhookDetails.statusCode, t) }), _jsx("span", { className: "text-foreground/50", children: t('automations.webhookDuration') }), _jsx("span", { className: "font-mono text-foreground/80", children: formatDuration(entry.webhookDetails.durationMs) }), entry.webhookDetails.attempts && entry.webhookDetails.attempts > 1 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-foreground/50", children: t('automations.webhookAttempts') }), _jsx("span", { className: "font-mono text-foreground/80", children: entry.webhookDetails.attempts })] })), entry.webhookDetails.error && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-foreground/50", children: t('automations.webhookError') }), _jsx("span", { className: "font-mono text-destructive", children: entry.webhookDetails.error })] }))] }), entry.webhookDetails.responseBody && (_jsxs("div", { className: "mt-2 pt-2 border-t border-border/30", children: [_jsx("span", { className: "text-foreground/50", children: t('automations.webhookResponse') }), _jsx("pre", { className: "mt-1 max-h-24 overflow-auto rounded bg-foreground/[0.04] p-2 font-mono text-[11px] text-foreground/70 whitespace-pre-wrap break-all", children: entry.webhookDetails.responseBody })] }))] }))] }, entry.id));
        }) }));
}
//# sourceMappingURL=AutomationEventTimeline.js.map