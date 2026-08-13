import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PermissionsDataTable
 *
 * Typed Data Table for displaying source permissions.
 * Features: searchable patterns, sortable columns, max-height scroll, fullscreen view.
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import { Info_DataTable, SortableHeader } from './Info_DataTable';
import { Info_Badge } from './Info_Badge';
import { Info_StatusBadge } from './Info_StatusBadge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui';
import { DataTableOverlay } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
/**
 * PatternBadge - Clickable pattern badge with truncation and tooltip
 * - Dynamic width with max-width of 240px
 * - CSS truncation via text-ellipsis
 * - Tooltip shows full pattern on hover (only for patterns 30+ chars)
 * - Click to copy pattern to clipboard with toast notification
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
    const badge = (_jsx("button", { type: "button", onClick: handleClick, className: "text-left", children: _jsx(Info_Badge, { color: "muted", className: "font-mono select-none", children: _jsx("span", { className: "block overflow-hidden whitespace-nowrap text-ellipsis max-w-[240px]", children: pattern }) }) }));
    // Only show tooltip for longer patterns (30+ chars)
    if (pattern.length >= 30) {
        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: badge }), _jsx(TooltipContent, { className: "font-mono max-w-md break-all", children: pattern })] }));
    }
    return badge;
}
// Column definitions with sorting
function getColumnsWithType(t) {
    return [
        {
            accessorKey: 'access',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.access") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(Info_StatusBadge, { status: row.original.access, className: "whitespace-nowrap" }) })),
            minSize: 80,
        },
        {
            accessorKey: 'type',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("common.type") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(Info_Badge, { color: "muted", className: "capitalize whitespace-nowrap", children: row.original.type }) })),
            minSize: 80,
        },
        {
            accessorKey: 'pattern',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.pattern") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(PatternBadge, { pattern: row.original.pattern }) })),
            minSize: 100,
        },
        {
            id: 'comment',
            accessorKey: 'comment',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("table.comment") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 min-w-0", children: _jsx("span", { className: "truncate block", children: row.original.comment || '—' }) })),
            meta: { fillWidth: true, truncate: true },
        },
    ];
}
function getColumnsWithoutType(t) {
    return [
        {
            accessorKey: 'access',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.access") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(Info_StatusBadge, { status: row.original.access, className: "whitespace-nowrap" }) })),
            minSize: 80,
        },
        {
            accessorKey: 'pattern',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.pattern") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(PatternBadge, { pattern: row.original.pattern }) })),
            minSize: 100,
        },
        {
            id: 'comment',
            accessorKey: 'comment',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("table.comment") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 min-w-0", children: _jsx("span", { className: "truncate block", children: row.original.comment || '—' }) })),
            meta: { fillWidth: true, truncate: true },
        },
    ];
}
export function PermissionsDataTable({ data, hideTypeColumn = false, searchable = false, maxHeight = 400, fullscreen = false, fullscreenTitle = 'Permissions', className, }) {
    const { t } = useTranslation();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { isDark } = useTheme();
    const columnsWithType = useMemo(() => getColumnsWithType(t), [t]);
    const columnsWithoutType = useMemo(() => getColumnsWithoutType(t), [t]);
    const columns = hideTypeColumn ? columnsWithoutType : columnsWithType;
    // Fullscreen button for toolbar - shown on hover
    const fullscreenButton = fullscreen ? (_jsx("button", { onClick: () => setIsFullscreen(true), className: cn('p-1 rounded-[6px] transition-all', 'opacity-0 group-hover:opacity-100', 'bg-background/80 backdrop-blur-sm shadow-minimal', 'text-muted-foreground/50 hover:text-foreground', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100'), title: t("table.viewFullscreen"), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) })) : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(Info_DataTable, { columns: columns, data: data, searchable: searchable ? { placeholder: t("table.searchPatterns") } : false, maxHeight: maxHeight, emptyContent: t("table.noPermissionsConfigured"), floatingAction: fullscreenButton, className: cn(fullscreen && 'group', className) }), fullscreen && (_jsx(DataTableOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), title: fullscreenTitle, subtitle: t("table.ruleCount", { count: data.length }), theme: isDark ? 'dark' : 'light', children: _jsx(Info_DataTable, { columns: columns, data: data, searchable: searchable ? { placeholder: t("table.searchPatterns") } : false, emptyContent: t("table.noPermissionsConfigured") }) }))] }));
}
//# sourceMappingURL=PermissionsDataTable.js.map