import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsToggle
 *
 * Toggle switch row with label and optional description.
 * Designed for use inside SettingsCard.
 */
import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { settingsUI } from './SettingsUIConstants';
/**
 * SettingsToggle - Toggle switch with label and description
 *
 * @example
 * <SettingsCard>
 *   <SettingsToggle
 *     label="Desktop notifications"
 *     description="Get notified when AI finishes working"
 *     checked={enabled}
 *     onCheckedChange={setEnabled}
 *   />
 * </SettingsCard>
 */
export function SettingsToggle({ label, description, checked, onCheckedChange, disabled, className, inCard = true, }) {
    const id = React.useId();
    return (_jsxs("div", { "data-layout": "settings-row", className: cn('flex items-center justify-between', inCard ? 'px-4 py-3.5' : 'py-3', disabled && 'opacity-50', className), children: [_jsxs("label", { htmlFor: id, className: "flex-1 min-w-0 cursor-pointer select-none", children: [_jsx("div", { className: settingsUI.label, children: label }), description && (_jsx("div", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] }), _jsx(Switch, { id: id, checked: checked, onCheckedChange: onCheckedChange, disabled: disabled, "data-layout": "settings-control", className: "ml-4 shrink-0" })] }));
}
//# sourceMappingURL=SettingsToggle.js.map