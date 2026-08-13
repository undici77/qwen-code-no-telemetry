import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AutomationCard
 *
 * Expandable inline row for compact automation display.
 * Collapsed: shows name + summary. Expanded: shows trigger, actions, and controls.
 */
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutomationAvatar } from './AutomationAvatar';
import { AutomationActionPreview } from './AutomationActionPreview';
import { Switch } from '@/components/ui/switch';
import { getEventDisplayName } from './types';
export function AutomationCard({ automation, defaultExpanded = false, onToggleEnabled, onTest, className, }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (_jsxs("div", { className: cn('rounded-[8px] bg-background shadow-minimal overflow-hidden transition-all', !automation.enabled && 'opacity-50', className), children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-foreground/2 transition-colors", children: [expanded ? (_jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" })) : (_jsx(ChevronRight, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" })), _jsx(AutomationAvatar, { event: automation.event, size: "sm" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: automation.name }), _jsx("div", { className: "text-xs text-foreground/50 truncate", children: automation.summary })] }), _jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(Switch, { checked: automation.enabled, onCheckedChange: (checked) => onToggleEnabled?.(checked) }) })] }), expanded && (_jsxs("div", { className: "border-t border-border/30 px-4 py-3 space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h5", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider", children: t('automations.sectionWhen') }), _jsxs("div", { className: "text-xs text-foreground/70", children: [_jsx("span", { className: "font-medium", children: getEventDisplayName(automation.event) }), automation.matcher && (_jsxs("span", { className: "ml-2", children: [t('automations.matching'), " ", _jsx("code", { className: "font-mono bg-foreground/5 px-1 rounded", children: automation.matcher })] })), automation.cron && (_jsxs("span", { className: "ml-2", children: [t('automations.at'), " ", _jsx("code", { className: "font-mono bg-foreground/5 px-1 rounded", children: automation.cron })] }))] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("h5", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider", children: t('automations.sectionThen') }), _jsx(AutomationActionPreview, { actions: automation.actions })] }), _jsx("div", { className: "flex items-center gap-2 pt-1", children: onTest && (_jsx("button", { onClick: onTest, className: "px-2.5 py-1 text-xs font-medium rounded-md bg-foreground/[0.03] shadow-minimal hover:bg-foreground/[0.06] transition-colors", children: t('automations.runTest') })) })] }))] }));
}
//# sourceMappingURL=AutomationCard.js.map