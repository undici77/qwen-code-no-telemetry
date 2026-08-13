import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ToolsDataTable
 *
 * Typed Data Table for displaying MCP tools.
 * Features: searchable tools, sortable columns, max-height scroll.
 */
import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info_DataTable, SortableHeader } from './Info_DataTable';
import { Info_Badge } from './Info_Badge';
import { Info_StatusBadge } from './Info_StatusBadge';
function getColumns(t) {
    return [
        {
            accessorKey: 'permission',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.access") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(Info_StatusBadge, { status: row.original.permission, className: "whitespace-nowrap" }) })),
            minSize: 80,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("table.tool") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx(Info_Badge, { color: "muted", className: "whitespace-nowrap", children: row.original.name }) })),
            minSize: 100,
        },
        {
            id: 'description',
            accessorKey: 'description',
            header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("common.description") }),
            cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 min-w-0", children: _jsx("span", { className: "truncate block", children: row.original.description }) })),
            meta: { fillWidth: true, truncate: true },
        },
    ];
}
export function ToolsDataTable({ data, loading, error, maxHeight = 400, className, }) {
    const { t } = useTranslation();
    const columns = useMemo(() => getColumns(t), [t]);
    return (_jsx(Info_DataTable, { columns: columns, data: data, loading: loading, error: error, maxHeight: maxHeight, emptyContent: t("table.noToolsAvailable"), className: className }));
}
//# sourceMappingURL=ToolsDataTable.js.map