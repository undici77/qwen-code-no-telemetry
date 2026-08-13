import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_Table
 *
 * Clean definition list style key-value display.
 * Use for Connection info, metadata display, etc.
 * No card wrapper - integrates cleanly with page.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
function Info_TableRoot({ children, footer, labelWidth = 120, className, }) {
    return (_jsxs("div", { className: cn('py-2', className), children: [_jsx("dl", { className: "divide-y divide-border/30", style: { '--label-width': `${labelWidth}px` }, children: children }), footer] }));
}
function Info_TableRow({ label, value, children, className }) {
    const content = children ?? value;
    return (_jsxs("div", { className: cn('flex py-2.5 px-4 text-sm', className), children: [_jsx("dt", { className: "text-muted-foreground shrink-0", style: { width: 'var(--label-width)' }, children: label }), _jsx("dd", { className: "flex-1 min-w-0", children: content })] }));
}
export const Info_Table = Object.assign(Info_TableRoot, {
    Row: Info_TableRow,
});
//# sourceMappingURL=Info_Table.js.map