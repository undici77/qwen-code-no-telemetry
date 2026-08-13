import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsSegmentedControl
 *
 * Horizontal button group for selecting between options.
 * Ideal for theme selection, font selection, etc.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
/**
 * SettingsSegmentedControl - Horizontal button group
 *
 * @example
 * <SettingsSegmentedControl
 *   value={theme}
 *   onValueChange={setTheme}
 *   options={[
 *     { value: 'system', label: 'System', icon: <Monitor /> },
 *     { value: 'light', label: 'Light', icon: <Sun /> },
 *     { value: 'dark', label: 'Dark', icon: <Moon /> },
 *   ]}
 * />
 */
export function SettingsSegmentedControl({ value, onValueChange, options, size = 'md', className, }) {
    return (_jsx("div", { role: "radiogroup", className: cn('inline-flex gap-1', className), children: options.map((option) => {
            const isSelected = option.value === value;
            return (_jsxs("button", { type: "button", role: "radio", "aria-checked": isSelected, onClick: () => onValueChange(option.value), className: cn('flex items-center gap-1.5 rounded-lg transition-all', size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm', isSelected
                    ? 'bg-background shadow-minimal'
                    : 'bg-transparent hover:bg-foreground/5'), children: [option.icon && (_jsx("span", { className: cn('w-4 h-4', isSelected ? 'text-foreground' : 'text-muted-foreground'), children: option.icon })), _jsx("span", { className: cn(isSelected ? 'text-foreground' : 'text-muted-foreground'), children: option.label })] }, option.value));
        }) }));
}
export function SettingsSegmentedControlCard({ value, onValueChange, options, columns = 3, className, }) {
    return (_jsx("div", { role: "radiogroup", className: cn('grid gap-2', columns === 2 && 'grid-cols-2', columns === 3 && 'grid-cols-3', columns === 4 && 'grid-cols-4', className), children: options.map((option) => {
            const isSelected = option.value === value;
            return (_jsxs("button", { type: "button", role: "radio", "aria-checked": isSelected, onClick: () => onValueChange(option.value), className: cn('flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors text-left', isSelected ? 'bg-muted' : 'bg-muted/50 hover:bg-muted/70'), children: [_jsx("div", { className: cn('w-[16px] h-[16px] rounded-full border-2 shrink-0', 'flex items-center justify-center transition-colors', isSelected
                            ? 'border-foreground bg-foreground'
                            : 'border-muted-foreground/40'), children: isSelected && (_jsx("div", { className: "w-[6px] h-[6px] rounded-full bg-background" })) }), _jsx("span", { className: "text-sm", children: option.label }), option.icon && (_jsx("span", { className: "ml-auto shrink-0", children: option.icon }))] }, option.value));
        }) }));
}
//# sourceMappingURL=SettingsSegmentedControl.js.map