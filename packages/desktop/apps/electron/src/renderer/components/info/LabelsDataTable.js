import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * LabelsDataTable
 *
 * Hierarchical data table for displaying label configurations.
 * Uses TanStack Table's built-in expand/collapse for tree rendering.
 * Columns: Color, Name (indented + chevron), Value Type.
 */
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Maximize2 } from 'lucide-react';
import { Info_DataTable, SortableHeader } from './Info_DataTable';
import { Info_Badge } from './Info_Badge';
import { DataTableOverlay } from '@craft-agent/ui';
import { LabelIcon } from '@/components/ui/label-icon';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
/**
 * ExpandableNameCell - Renders label name with indentation and expand/collapse chevron.
 * Depth-based indentation with a rotating chevron for parent nodes.
 */
function ExpandableNameCell({ row }) {
    const canExpand = row.getCanExpand();
    const isExpanded = row.getIsExpanded();
    return (_jsxs("div", { className: "flex items-center gap-1.5 p-1.5 pl-2.5", 
        // Indent based on depth: 16px per level
        style: { paddingLeft: `${row.depth * 16 + 10}px` }, children: [canExpand ? (_jsx("button", { type: "button", onClick: (e) => {
                    e.stopPropagation();
                    row.toggleExpanded();
                }, className: "p-0.5 rounded hover:bg-foreground/5 transition-colors", children: _jsx(ChevronRight, { className: cn('w-3 h-3 text-muted-foreground transition-transform duration-150', isExpanded && 'rotate-90') }) })) : (
            // Spacer to keep alignment consistent with expandable rows
            _jsx("span", { className: "w-4" })), _jsx("span", { className: "text-sm truncate", children: row.original.name })] }));
}
// Column definitions for the labels tree table
function getColumns(t) {
    return [
        {
            id: 'color',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("common.color") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(LabelIcon, { label: row.original, size: "sm", hasChildren: !!row.original.children?.length }) })),
            minSize: 60,
            maxSize: 60,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("common.name") }),
            cell: ({ row }) => _jsx(ExpandableNameCell, { row: row }),
            meta: { fillWidth: true },
        },
        {
            id: 'valueType',
            accessorKey: 'valueType',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("common.type") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: row.original.valueType ? (_jsx(Info_Badge, { color: "muted", className: "capitalize whitespace-nowrap", children: t(`sidebar.labelValueType.${row.original.valueType}`) })) : (_jsx("span", { className: "text-muted-foreground/50 text-sm", children: "\u2014" })) })),
            minSize: 120,
        },
    ];
}
/**
 * Extract children from a LabelConfig for tree expansion.
 * Returns undefined if no children (tells TanStack this is a leaf node).
 */
function getSubRows(row) {
    return row.children?.length ? row.children : undefined;
}
export function LabelsDataTable({ data, searchable = false, maxHeight = 400, fullscreen = false, fullscreenTitle = 'Labels', className, }) {
    const { t } = useTranslation();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { isDark } = useTheme();
    const columns = useMemo(() => getColumns(t), [t]);
    // Fullscreen button (shown on hover via group class)
    const fullscreenButton = fullscreen ? (_jsx("button", { onClick: () => setIsFullscreen(true), className: cn('p-1 rounded-[6px] transition-all', 'opacity-0 group-hover:opacity-100', 'bg-background/80 backdrop-blur-sm shadow-minimal', 'text-muted-foreground/50 hover:text-foreground', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100'), title: t("table.viewFullscreen"), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) })) : undefined;
    // Count all labels recursively for the subtitle
    const countLabels = (labels) => labels.reduce((sum, l) => sum + 1 + countLabels(l.children || []), 0);
    const totalCount = countLabels(data);
    return (_jsxs(_Fragment, { children: [_jsx(Info_DataTable, { columns: columns, data: data, searchable: searchable ? { placeholder: t("table.searchLabels") } : false, maxHeight: maxHeight, emptyContent: t("table.noLabelsConfigured"), floatingAction: fullscreenButton, className: cn(fullscreen && 'group', className), getSubRows: getSubRows }), fullscreen && (_jsx(DataTableOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), title: fullscreenTitle, subtitle: t("table.labelCount", { count: totalCount }), theme: isDark ? 'dark' : 'light', children: _jsx(Info_DataTable, { columns: columns, data: data, searchable: searchable ? { placeholder: t("table.searchLabels") } : false, emptyContent: t("table.noLabelsConfigured"), getSubRows: getSubRows }) }))] }));
}
//# sourceMappingURL=LabelsDataTable.js.map