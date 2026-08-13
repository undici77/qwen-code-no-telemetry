import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AutoRulesDataTable
 *
 * Flat data table displaying all auto-label rules across all labels.
 * Each row shows which label a rule belongs to, the regex pattern, flags,
 * value template, and description.
 *
 * Rules are collected by recursively traversing the label tree and flattening
 * all autoRules into a single list.
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import { Info_DataTable, SortableHeader } from './Info_DataTable';
import { Info_Badge } from './Info_Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { DataTableOverlay } from '@craft-agent/ui';
import { LabelIcon } from '@/components/ui/label-icon';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
/**
 * PatternBadge - Monospace regex pattern with click-to-copy and tooltip.
 * Mirrors the PatternBadge from PermissionsDataTable for consistency.
 */
function PatternBadge({ pattern }) {
    const { t } = useTranslation();
    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(pattern);
            toast.success(t('toast.patternCopied'));
        }
        catch {
            toast.error(t('toast.failedToCopyPattern'));
        }
    };
    const badge = (_jsx("button", { type: "button", onClick: handleClick, className: "text-left", children: _jsx(Info_Badge, { color: "muted", className: "font-mono select-none", children: _jsx("span", { className: "block overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]", children: pattern }) }) }));
    if (pattern.length >= 25) {
        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: badge }), _jsx(TooltipContent, { className: "font-mono max-w-md break-all", children: pattern })] }));
    }
    return badge;
}
// Column definitions for the auto-rules flat table
function getColumns(t) {
    return [
        {
            id: 'label',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.label") }),
            accessorFn: (row) => row.label.name,
            cell: ({ row }) => (_jsxs("div", { className: "p-1.5 pl-2.5 flex items-center gap-1.5", children: [_jsx(LabelIcon, { label: row.original.label, size: "xs" }), _jsx("span", { className: "text-sm truncate", children: row.original.label.name })] })),
            minSize: 100,
        },
        {
            id: 'pattern',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.pattern") }),
            accessorFn: (row) => row.rule.pattern,
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(PatternBadge, { pattern: row.original.rule.pattern }) })),
            minSize: 120,
        },
        {
            id: 'flags',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("table.flags") }),
            accessorFn: (row) => row.rule.flags ?? 'gi',
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx("span", { className: "text-xs text-muted-foreground font-mono", children: row.original.rule.flags ?? 'gi' }) })),
            minSize: 50,
        },
        {
            id: 'template',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("table.template") }),
            accessorFn: (row) => row.rule.valueTemplate ?? '',
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: row.original.rule.valueTemplate ? (_jsx(Info_Badge, { color: "muted", className: "font-mono whitespace-nowrap", children: row.original.rule.valueTemplate })) : (_jsx("span", { className: "text-muted-foreground/50 text-sm", children: "\u2014" })) })),
            minSize: 80,
        },
        {
            id: 'description',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("common.description") }),
            accessorFn: (row) => row.rule.description ?? '',
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 min-w-0", children: _jsx("span", { className: "truncate block text-sm", children: row.original.rule.description || '—' }) })),
            meta: { fillWidth: true, truncate: true },
        },
    ];
}
/**
 * Recursively collect all auto-rules from the label tree,
 * associating each rule with its parent label.
 */
function collectAutoRules(labels) {
    const rows = [];
    function traverse(nodes) {
        for (const label of nodes) {
            if (label.autoRules?.length) {
                for (const rule of label.autoRules) {
                    rows.push({ label, rule });
                }
            }
            if (label.children?.length) {
                traverse(label.children);
            }
        }
    }
    traverse(labels);
    return rows;
}
export function AutoRulesDataTable({ data, searchable = false, maxHeight = 400, fullscreen = false, fullscreenTitle = 'Auto-Apply Rules', className, }) {
    const { t } = useTranslation();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { isDark } = useTheme();
    const columns = useMemo(() => getColumns(t), [t]);
    // Flatten label tree into auto-rule rows
    const rows = useMemo(() => collectAutoRules(data), [data]);
    // Fullscreen button (shown on hover)
    const fullscreenButton = fullscreen ? (_jsx("button", { onClick: () => setIsFullscreen(true), className: cn('p-1 rounded-[6px] transition-all', 'opacity-0 group-hover:opacity-100', 'bg-background/80 backdrop-blur-sm shadow-minimal', 'text-muted-foreground/50 hover:text-foreground', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100'), title: t("table.viewFullscreen"), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) })) : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(Info_DataTable, { columns: columns, data: rows, searchable: searchable ? { placeholder: t("table.searchRules") } : false, maxHeight: maxHeight, emptyContent: t("settings.labels.noAutoApplyRules"), floatingAction: fullscreenButton, className: cn(fullscreen && 'group', className) }), fullscreen && (_jsx(DataTableOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), title: fullscreenTitle, subtitle: t("table.ruleCount", { count: rows.length }), theme: isDark ? 'dark' : 'light', children: _jsx(Info_DataTable, { columns: columns, data: rows, searchable: searchable ? { placeholder: t("table.searchRules") } : false, emptyContent: t("settings.labels.noAutoApplyRules") }) }))] }));
}
//# sourceMappingURL=AutoRulesDataTable.js.map