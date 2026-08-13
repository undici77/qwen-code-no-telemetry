import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsInput
 *
 * Text input with label for settings pages.
 * Supports password type with show/hide toggle.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { settingsUI } from './SettingsUIConstants';
/**
 * SettingsInput - Text input with label
 *
 * @example
 * <SettingsInput
 *   label="Name"
 *   value={name}
 *   onChange={setName}
 *   placeholder="Enter your name..."
 * />
 */
export function SettingsInput({ label, description, value, onChange, placeholder, type = 'text', disabled, error, action, className, inCard = false, onBlur, onKeyDown, }) {
    const { t } = useTranslation();
    const id = React.useId();
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    return (_jsxs("div", { className: cn('space-y-2', inCard && 'px-4 py-3.5', className), children: [label && (_jsxs("div", { className: settingsUI.labelGroup, children: [_jsx(Label, { htmlFor: id, className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] })), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: cn('relative flex-1 rounded-md shadow-minimal has-[:focus-visible]:bg-background', error && 'ring-1 ring-destructive'), children: [_jsx(Input, { id: id, type: inputType, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, disabled: disabled, onBlur: onBlur, onKeyDown: onKeyDown, className: cn('bg-muted/50 border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:bg-transparent', isPassword && 'pr-10') }), isPassword && (_jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), "aria-label": showPassword ? t("common.hidePassword") : t("common.showPassword"), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? (_jsx(EyeOff, { className: "size-4" })) : (_jsx(Eye, { className: "size-4" })) }))] }), action] }), error && _jsx("p", { className: "text-sm text-destructive", children: error })] }));
}
export function SettingsInputRow({ label, description, value, onChange, placeholder, type = 'text', disabled, error, className, inCard = true, }) {
    const id = React.useId();
    return (_jsxs("div", { "data-layout": "settings-row", className: cn('flex items-center justify-between', inCard ? 'px-4 py-3.5' : 'py-3', className), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Label, { htmlFor: id, className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description })), error && _jsx("p", { className: cn('text-sm text-destructive', settingsUI.labelDescriptionGap), children: error })] }), _jsx("div", { "data-layout": "settings-control", className: cn('ml-4 shrink-0 rounded-md shadow-minimal has-[:focus-visible]:bg-background', error && 'ring-1 ring-destructive'), children: _jsx(Input, { id: id, type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, disabled: disabled, className: "w-[200px] bg-muted/50 border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:bg-transparent" }) })] }));
}
export function SettingsSecretInput({ label, description, value, onChange, placeholder, disabled, error, className, inCard = false, onBlur, }) {
    const { t } = useTranslation();
    const id = React.useId();
    const [showValue, setShowValue] = React.useState(false);
    const effectivePlaceholder = placeholder ?? t("common.enterValue");
    return (_jsxs("div", { className: cn('space-y-2', inCard && 'px-4 py-3.5', className), children: [label && (_jsxs("div", { className: settingsUI.labelGroup, children: [_jsx(Label, { htmlFor: id, className: settingsUI.label, children: label }), description && (_jsx("p", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] })), _jsxs("div", { className: cn('relative rounded-md shadow-minimal bg-muted/50 has-[:focus-visible]:bg-background', error && 'ring-1 ring-destructive'), children: [_jsx(Input, { id: id, type: showValue ? 'text' : 'password', value: value, onChange: (e) => onChange(e.target.value), placeholder: effectivePlaceholder, disabled: disabled, onBlur: onBlur, className: "pr-10 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none" }), _jsx("button", { type: "button", onClick: () => setShowValue(!showValue), "aria-label": showValue ? t("common.hideValue") : t("common.showValue"), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showValue ? (_jsx(EyeOff, { className: "size-4" })) : (_jsx(Eye, { className: "size-4" })) })] }), error && _jsx("p", { className: "text-sm text-destructive", children: error })] }));
}
//# sourceMappingURL=SettingsInput.js.map