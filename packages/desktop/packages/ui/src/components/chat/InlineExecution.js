import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * InlineExecution - Compact execution view for EditPopover
 *
 * Shows mini agent execution progress inline within a popover,
 * transitioning through: executing → success | error states.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@craft-agent/ui';
import { ActivityStatusIcon, SIZE_CONFIG } from './TurnCard';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { Markdown } from '../markdown';
// ============================================================================
// Simple Activity Row for Inline View
// ============================================================================
function InlineActivityRow({ activity }) {
    return (_jsxs("div", { className: cn("flex items-center gap-2 py-0.5 text-muted-foreground", SIZE_CONFIG.fontSize), children: [_jsx(ActivityStatusIcon, { status: activity.status, toolName: activity.name }), _jsx("span", { className: "shrink-0", children: activity.name }), activity.description && (_jsxs(_Fragment, { children: [_jsx("span", { className: "opacity-60 shrink-0", children: "\u00B7" }), _jsx("span", { className: "truncate min-w-0 flex-1", children: activity.description })] }))] }));
}
// ============================================================================
// Main Component
// ============================================================================
export function InlineExecution({ status, activities, result, error, onCancel, onDismiss, onRetry, className, }) {
    const { t } = useTranslation();
    // Executing state
    if (status === 'executing') {
        return (_jsxs("div", { className: cn("space-y-3", className), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(LoadingIndicator, { animated: true, showElapsed: true }), _jsx("span", { className: cn("text-foreground/80", SIZE_CONFIG.fontSize), children: t('common.editing') })] }), activities.length > 0 && (_jsx("div", { className: "space-y-0.5 pl-1", children: activities.slice(-3).map((activity) => (_jsx(InlineActivityRow, { activity: activity }, activity.id))) })), _jsx("div", { className: "flex items-center justify-start pt-1 border-t border-border/30", children: _jsx("button", { type: "button", onClick: onCancel, className: cn("text-muted-foreground hover:text-foreground transition-colors", SIZE_CONFIG.fontSize), children: t('common.cancel') }) })] }));
    }
    // Success state
    if (status === 'success') {
        return (_jsxs("div", { className: cn("space-y-3", className), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-success" }), _jsx("span", { className: cn("text-foreground font-medium", SIZE_CONFIG.fontSize), children: t('common.done') })] }), result && (_jsx("div", { className: cn("text-muted-foreground leading-relaxed prose-compact", SIZE_CONFIG.fontSize), children: _jsx(Markdown, { children: result }) })), _jsx("div", { className: "flex items-center justify-end pt-1 border-t border-border/30", children: _jsxs("button", { type: "button", onClick: onDismiss, className: cn("flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors", SIZE_CONFIG.fontSize), children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), t('common.done')] }) })] }));
    }
    // Error state
    return (_jsxs("div", { className: cn("space-y-3", className), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(XCircle, { className: "w-4 h-4 text-destructive" }), _jsx("span", { className: cn("text-foreground font-medium", SIZE_CONFIG.fontSize), children: t('common.failed') })] }), error && (_jsx("div", { className: cn("text-destructive/80 leading-relaxed prose-compact", SIZE_CONFIG.fontSize), children: _jsx(Markdown, { children: error }) })), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-1 border-t border-border/30", children: [_jsxs("button", { type: "button", onClick: onDismiss, className: cn("flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors", SIZE_CONFIG.fontSize), children: [_jsx(X, { className: "w-3 h-3" }), t('common.dismiss')] }), onRetry && (_jsx("button", { type: "button", onClick: onRetry, className: cn("px-2 py-1 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors", SIZE_CONFIG.fontSize), children: t('common.retry') }))] })] }));
}
// ============================================================================
// Utility: Map SessionEvent to InlineActivityItem
// ============================================================================
/**
 * Map a tool event to an InlineActivityItem.
 * Use this when processing session events in EditPopover.
 */
export function mapToolEventToActivity(toolName, toolUseId, status, description) {
    // Clean up tool names (strip MCP prefixes for display)
    const displayName = toolName
        .replace(/^mcp__[^_]+__/, '') // Remove mcp__server__ prefix
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, c => c.toUpperCase()); // Title case
    return {
        id: toolUseId,
        name: displayName,
        status,
        description,
    };
}
//# sourceMappingURL=InlineExecution.js.map