import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Info_Section
 *
 * Section container with title, optional description, and content card.
 * Matches SettingsSection styling pattern.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
export function Info_Section({ title, description, actions, children, className, }) {
    return (_jsxs("section", { className: cn('space-y-3 pt-2', className), children: [_jsxs("div", { className: "flex items-start justify-between pl-1", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("h3", { className: "text-base font-semibold", children: title }), description && (_jsx("p", { className: "text-sm text-muted-foreground", children: description }))] }), actions] }), _jsx("div", { className: "bg-background shadow-minimal rounded-[8px] overflow-hidden", children: children })] }));
}
//# sourceMappingURL=Info_Section.js.map