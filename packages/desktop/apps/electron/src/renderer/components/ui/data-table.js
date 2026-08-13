import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, getExpandedRowModel, useReactTable, } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { cn } from '@/lib/utils';
export function DataTable({ columns, data, globalFilter, filterValue, filterColumn, className, emptyContent, onTableReady, noBorder = false, noWrapper = false, pagination: paginationEnabled = false, pageSize = 50, getSubRows, defaultExpanded = true, }) {
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [columnSizing, setColumnSizing] = React.useState({});
    const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('');
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize,
    });
    // Tree expand state: default to all expanded when getSubRows is provided
    const [expanded, setExpanded] = React.useState(getSubRows && defaultExpanded ? true : {});
    // Sync external global filter and reset pagination
    React.useEffect(() => {
        if (globalFilter !== undefined) {
            setInternalGlobalFilter(globalFilter);
            // Reset to first page when filter changes
            if (paginationEnabled) {
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }
        }
    }, [globalFilter, paginationEnabled]);
    // Update column filter when filterValue changes
    React.useEffect(() => {
        if (filterColumn && filterValue !== undefined) {
            setColumnFilters([{ id: filterColumn, value: filterValue }]);
        }
        else if (filterColumn) {
            setColumnFilters([]);
        }
    }, [filterValue, filterColumn]);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        ...(paginationEnabled && { getPaginationRowModel: getPaginationRowModel() }),
        // Tree/expand support: only enabled when getSubRows is provided
        ...(getSubRows && { getExpandedRowModel: getExpandedRowModel(), getSubRows }),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnSizingChange: setColumnSizing,
        onGlobalFilterChange: setInternalGlobalFilter,
        ...(paginationEnabled && { onPaginationChange: setPagination }),
        ...(getSubRows && { onExpandedChange: setExpanded }),
        globalFilterFn: 'includesString',
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        state: {
            sorting,
            columnFilters,
            columnSizing,
            globalFilter: internalGlobalFilter,
            ...(paginationEnabled && { pagination }),
            ...(getSubRows && { expanded }),
        },
    });
    // Expose table instance
    React.useEffect(() => {
        onTableReady?.(table);
    }, [table, onTableReady]);
    const tableContent = (_jsxs(Table, { noWrapper: noWrapper, children: [_jsx(TableHeader, { children: table.getHeaderGroups().map((headerGroup) => (_jsx(TableRow, { children: headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta;
                        const minSize = header.column.columnDef.minSize;
                        const currentSize = header.getSize();
                        // Only apply explicit width if user has resized or there's a minSize
                        const hasResized = columnSizing[header.id] !== undefined;
                        return (_jsx(TableHead, { className: cn(meta?.fillWidth && 'w-full'), style: {
                                width: hasResized ? currentSize : undefined,
                                minWidth: minSize,
                                maxWidth: meta?.maxWidth,
                            }, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-1", children: header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext()) }), header.column.getCanResize() && (_jsx("div", { onMouseDown: header.getResizeHandler(), onTouchStart: header.getResizeHandler(), className: cn('absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none', 'opacity-0 hover:opacity-100 transition-opacity', 'bg-border', header.column.getIsResizing() && 'opacity-100 bg-accent') }))] }) }, header.id));
                    }) }, headerGroup.id))) }), _jsx(TableBody, { children: table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (_jsx(TableRow, { "data-state": row.getIsSelected() && 'selected', children: row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
                        const minSize = cell.column.columnDef.minSize;
                        const currentSize = cell.column.getSize();
                        const hasResized = columnSizing[cell.column.id] !== undefined;
                        return (_jsx(TableCell, { className: cn(meta?.fillWidth && 'w-full', meta?.truncate && 'overflow-hidden'), style: {
                                width: hasResized ? currentSize : undefined,
                                minWidth: minSize,
                                maxWidth: meta?.maxWidth,
                            }, children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id));
                    }) }, row.id)))) : (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length, className: "h-24 text-center", children: emptyContent ?? 'No results.' }) })) })] }));
    const paginationControls = paginationEnabled && table.getPageCount() > 1 && (_jsxs("div", { className: "flex items-center justify-between px-2 py-3 border-t border-border", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: [table.getFilteredRowModel().rows.length, " total"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: "Previous" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["Page ", table.getState().pagination.pageIndex + 1, " of ", table.getPageCount()] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: "Next" })] })] }));
    if (noBorder) {
        return (_jsxs("div", { className: cn('w-full', className), children: [tableContent, paginationControls] }));
    }
    return (_jsx("div", { className: cn('w-full', className), children: _jsxs("div", { className: "rounded-md border", children: [tableContent, paginationControls] }) }));
}
export function SortableHeader({ column, title, className, }) {
    return (_jsx(Button, { variant: "ghost", onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'), className: cn('w-full justify-start p-1.5 pl-2.5', className), children: title }));
}
//# sourceMappingURL=data-table.js.map