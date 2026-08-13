import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_DataTable
 *
 * Enhanced data table for Info pages with built-in search, sort, and filter UI.
 * Wraps shadcn DataTable with Info-page styling and toolbar controls.
 */
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Spinner } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
/**
 * Info_DataTable - Enhanced data table for Info pages
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<ToolRow>[] = [
 *   {
 *     accessorKey: 'name',
 *     header: ({ column }) => <SortableHeader column={column} title="Name" />,
 *   },
 *   // ...
 * ]
 *
 * <Info_DataTable
 *   columns={columns}
 *   data={tools}
 *   searchable={{ placeholder: 'Search tools...' }}
 *   maxHeight={400}
 * />
 * ```
 */
export function Info_DataTable({ columns, data, searchable = false, maxHeight, loading = false, error, emptyContent, floatingAction, getSubRows, className, }) {
    const { t } = useTranslation();
    const [searchValue, setSearchValue] = React.useState('');
    // Parse searchable prop
    const searchConfig = React.useMemo(() => {
        if (!searchable)
            return null;
        if (searchable === true) {
            return { placeholder: t("common.search"), column: undefined };
        }
        return {
            placeholder: searchable.placeholder ?? t("common.search"),
            column: searchable.column,
        };
    }, [searchable, t]);
    // Loading state
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Spinner, { className: "text-muted-foreground" }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: "px-4 py-6 text-sm text-muted-foreground", children: error === 'Source requires authentication' ? (_jsx("span", { children: t('sourceInfo.authenticateToViewData') })) : (_jsx("span", { children: error })) }));
    }
    return (_jsxs("div", { className: cn(
        // overflow-x-hidden on outer container so the sticky floating action
        // doesn't scroll horizontally with table content. The inner wrapper
        // handles horizontal overflow independently.
        maxHeight && 'overflow-y-auto overflow-x-hidden', className), style: maxHeight ? { maxHeight } : undefined, children: [floatingAction && (_jsx("div", { className: "sticky top-2.5 float-right mr-1.5 z-20 h-0", children: floatingAction })), _jsx("div", { className: "overflow-x-auto", children: _jsx(DataTable, { columns: columns, data: data, globalFilter: searchConfig?.column ? undefined : searchValue, filterColumn: searchConfig?.column, filterValue: searchConfig?.column ? searchValue : undefined, emptyContent: emptyContent, getSubRows: getSubRows, noBorder: true, noWrapper: true }) })] }));
}
// Re-export SortableHeader for convenience
export { SortableHeader } from '@/components/ui/data-table';
//# sourceMappingURL=Info_DataTable.js.map