import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
function Table({ className, noWrapper, ...props }) {
    const table = (_jsx("table", { className: cn('w-full caption-bottom text-sm border-separate border-spacing-0', className), ...props }));
    if (noWrapper) {
        return table;
    }
    return (_jsx("div", { className: "relative w-full overflow-x-auto", children: table }));
}
function TableHeader({ className, ...props }) {
    return (_jsx("thead", { className: cn('', className), ...props }));
}
function TableBody({ className, ...props }) {
    return (_jsx("tbody", { className: cn('[&_tr:last-child]:border-0', className), ...props }));
}
function TableFooter({ className, ...props }) {
    return (_jsx("tfoot", { className: cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className), ...props }));
}
function TableRow({ className, ...props }) {
    return (_jsx("tr", { className: cn('transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className), ...props }));
}
function TableHead({ className, ...props }) {
    // Use bg-card for sticky headers - it's always opaque unlike bg-background which may have transparency in scenic mode
    return (_jsx("th", { className: cn('relative p-1.5 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 sticky top-0 z-10 shadow-bottom-border bg-card', className), ...props }));
}
function TableCell({ className, ...props }) {
    return (_jsx("td", { className: cn('p-1.5 align-middle [&:has([role=checkbox])]:pr-0 shadow-bottom-border-thin', className), ...props }));
}
function TableCaption({ className, ...props }) {
    return (_jsx("caption", { className: cn('mt-4 text-sm text-muted-foreground', className), ...props }));
}
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, };
//# sourceMappingURL=table.js.map