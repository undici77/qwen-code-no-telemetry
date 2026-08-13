import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsSection, SettingsGroup, SettingsDivider
 *
 * Structural components for organizing settings pages.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
/**
 * SettingsSection - A semantic section with title and description
 *
 * @example
 * <SettingsSection title="Billing" description="Choose how you pay">
 *   <SettingsRadioGroup>...</SettingsRadioGroup>
 * </SettingsSection>
 */
export function SettingsSection({ title, description, children, className, variant = 'default', action, }) {
    return (_jsxs("section", { className: cn('space-y-3', className), children: [_jsxs("div", { className: "flex items-start justify-between gap-4 pl-1", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("h3", { className: cn('text-base font-semibold', variant === 'danger' && 'text-destructive'), children: title }), description && (_jsx("p", { className: "text-sm text-muted-foreground", children: description }))] }), action && _jsx("div", { className: "shrink-0", children: action })] }), children] }));
}
/**
 * SettingsGroup - Top-level divider for major sections (e.g., "App" vs "Workspace")
 *
 * @example
 * <SettingsGroup title="Workspace">
 *   <SettingsSection title="Model">...</SettingsSection>
 *   <SettingsSection title="Permissions">...</SettingsSection>
 * </SettingsGroup>
 */
export function SettingsGroup({ title, children, className }) {
    return (_jsxs("div", { className: cn('space-y-6', className), children: [_jsx("h2", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border", children: title }), _jsx("div", { className: "space-y-8", children: children })] }));
}
/**
 * SettingsDivider - Horizontal separator between sections
 *
 * Use sparingly - vertical spacing is usually enough.
 */
export function SettingsDivider({ className }) {
    return _jsx("div", { className: cn('h-px bg-border', className) });
}
//# sourceMappingURL=SettingsSection.js.map