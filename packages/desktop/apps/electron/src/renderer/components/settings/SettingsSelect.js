import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsSelect
 *
 * Dropdown select with label for settings pages.
 * Wraps the shadcn Select component with settings-specific styling.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { settingsUI } from './SettingsUIConstants';
/**
 * SettingsSelect - Dropdown select with label
 *
 * @example
 * <SettingsSelect
 *   label="Timezone"
 *   value={timezone}
 *   onValueChange={setTimezone}
 *   options={timezoneOptions}
 *   placeholder="Select timezone..."
 * />
 */
export function SettingsSelect({ label, description, value, onValueChange, options, placeholder, disabled, className, inCard = false, }) {
    const { t } = useTranslation();
    const id = React.useId();
    const effectivePlaceholder = placeholder ?? t("common.select");
    return (_jsxs("div", { className: cn('space-y-2', inCard && 'px-4 py-3.5', className), children: [label && (_jsxs("div", { className: settingsUI.labelGroup, children: [_jsx(Label, { htmlFor: id, className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] })), _jsxs(Select, { value: value, onValueChange: onValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { id: id, className: "w-full bg-muted/50", children: _jsx(SelectValue, { placeholder: effectivePlaceholder }) }), _jsx(SelectContent, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] }));
}
export function SettingsSelectRow({ label, description, value, onValueChange, options, placeholder, disabled, className, inCard = true, }) {
    const { t } = useTranslation();
    const id = React.useId();
    const effectivePlaceholder = placeholder ?? t("common.select");
    return (_jsxs("div", { "data-layout": "settings-row", className: cn('flex items-center justify-between', inCard ? 'px-4 py-3.5' : 'py-3', className), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Label, { htmlFor: id, className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] }), _jsx("div", { "data-layout": "settings-control", className: "ml-4 shrink-0", children: _jsxs(Select, { value: value, onValueChange: onValueChange, disabled: disabled, children: [_jsx(SelectTrigger, { id: id, className: "w-[180px] bg-muted/50", children: _jsx(SelectValue, { placeholder: effectivePlaceholder }) }), _jsx(SelectContent, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] }) })] }));
}
//# sourceMappingURL=SettingsSelect.js.map