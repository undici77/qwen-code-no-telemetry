import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsRow
 *
 * Generic row component for settings with label on left and content on right.
 * Use for custom layouts that don't fit Toggle/Select patterns.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { settingsUI } from './SettingsUIConstants';
/**
 * SettingsRow - Generic row for custom settings layouts
 *
 * @example
 * <SettingsRow
 *   label="Working Directory"
 *   description="~/Documents"
 *   action={<Button variant="ghost" size="sm">Change</Button>}
 * />
 */
export function SettingsRow({ label, description, children, onClick, action, className, inCard = true, }) {
    const Component = onClick ? 'button' : 'div';
    return (_jsxs(Component, { type: onClick ? 'button' : undefined, onClick: onClick, "data-layout": "settings-row", className: cn('w-full flex items-center justify-between text-left', inCard ? 'px-4 py-3.5' : 'py-3', onClick && 'hover:bg-muted/70 transition-colors cursor-pointer', className), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: settingsUI.label, children: label }), description && (_jsx("div", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap, 'truncate'), children: description }))] }), (children || action) && (_jsxs("div", { "data-layout": "settings-control", className: "flex items-center gap-3 ml-4 shrink-0", children: [children, action] }))] }));
}
/**
 * SettingsRowLabel - Standalone label for use outside SettingsRow
 *
 * @example
 * <SettingsRowLabel label="Theme" />
 * <SettingsSegmentedControl ... />
 */
export function SettingsRowLabel({ label, description, className, }) {
    return (_jsxs("div", { className: cn(settingsUI.labelGroup, className), children: [_jsx("div", { className: settingsUI.label, children: label }), description && (_jsx("div", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] }));
}
//# sourceMappingURL=SettingsRow.js.map