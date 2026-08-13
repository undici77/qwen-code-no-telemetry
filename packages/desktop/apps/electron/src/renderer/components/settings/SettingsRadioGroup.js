import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SettingsRadioGroup & SettingsRadioCard
 *
 * Full-width radio card selection pattern (Amie-style).
 * Each option is a separate card with radio indicator on the left.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { settingsUI } from './SettingsUIConstants';
const RadioGroupContext = React.createContext(null);
function useRadioGroupContext() {
    return React.useContext(RadioGroupContext);
}
/**
 * SettingsRadioGroup - Container for radio card options
 *
 * @example
 * <SettingsRadioGroup value={model} onValueChange={setModel}>
 *   <SettingsRadioCard value="opus" label="Opus 4.6" description="Most capable" />
 *   <SettingsRadioCard value="sonnet" label="Sonnet 4.6" description="Balanced" />
 * </SettingsRadioGroup>
 */
export function SettingsRadioGroup({ value, onValueChange, children, className, }) {
    const childArray = React.Children.toArray(children).filter(Boolean);
    return (_jsx(RadioGroupContext.Provider, { value: {
            value,
            onValueChange: onValueChange,
        }, children: _jsx("div", { role: "radiogroup", className: cn('rounded-xl bg-background shadow-minimal overflow-hidden', className), children: childArray.map((child, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx("div", { className: "h-px bg-border/50 mx-4" }), child] }, index))) }) }));
}
/**
 * SettingsRadioCard - Full-width radio option card
 *
 * @example
 * <SettingsRadioCard
 *   value="api_key"
 *   label="API Key"
 *   description="Use your local Qwen Code setup"
 *   expandedContent={<ApiKeyInput />}
 * />
 */
export function SettingsRadioCard({ value, label, description, icon, badge, disabled, expandedContent, className, selected, onClick, inCard, }) {
    const context = useRadioGroupContext();
    // Support both context-based and standalone usage
    const isSelected = context ? context.value === value : (selected ?? false);
    const handleClick = context ? () => context.onValueChange(value) : onClick;
    const id = React.useId();
    // Apply card styling only in standalone mode and not inside a SettingsCard
    const needsCardStyling = !context && !inCard;
    return (_jsxs("div", { className: cn('overflow-hidden transition-colors', needsCardStyling && 'rounded-xl shadow-minimal bg-background', !disabled && 'hover:bg-foreground-3', disabled && 'opacity-50 cursor-not-allowed', className), children: [_jsxs("button", { type: "button", role: "radio", id: id, "aria-checked": isSelected, disabled: disabled, onClick: () => !disabled && handleClick?.(), className: cn('w-full px-4 py-3.5 text-left flex items-start gap-3', !disabled && 'cursor-pointer'), children: [_jsx("div", { className: cn('w-4 h-4 rounded-full border-[1.5px] mt-[3px] shrink-0', 'grid place-items-center transition-colors', isSelected
                            ? 'border-foreground bg-foreground'
                            : 'border-muted-foreground/40'), children: isSelected && (_jsx("div", { className: "w-2 h-2 rounded-full bg-background" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: settingsUI.label, children: label }), badge] }), description && (_jsx("div", { className: cn(settingsUI.description, settingsUI.labelDescriptionGap), children: description }))] }), icon && _jsx("div", { className: "shrink-0 ml-2", children: icon })] }), _jsx(AnimatePresence, { initial: false, children: isSelected && expandedContent && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { type: 'spring', stiffness: 500, damping: 40 }, className: "overflow-hidden", children: _jsx("div", { className: "px-4 pb-4 pt-0", children: _jsx("div", { className: "pl-[30px]", children: expandedContent }) }) })) })] }));
}
/**
 * SettingsRadioOption - Simple inline radio option (no card background)
 *
 * Use inside a SettingsCard for grouped options without individual backgrounds.
 */
export function SettingsRadioOption({ value, label, description, disabled, className, }) {
    const context = useRadioGroupContext();
    if (!context) {
        throw new Error('SettingsRadioOption must be used within SettingsRadioGroup');
    }
    const { value: selectedValue, onValueChange } = context;
    const isSelected = selectedValue === value;
    const id = React.useId();
    return (_jsxs("button", { type: "button", role: "radio", id: id, "aria-checked": isSelected, disabled: disabled, onClick: () => !disabled && onValueChange(value), className: cn('w-full px-4 py-3 text-left flex items-center gap-3', 'hover:bg-muted/50 transition-colors', disabled && 'opacity-50 cursor-not-allowed', !disabled && 'cursor-pointer', className), children: [_jsx("div", { className: cn('w-4 h-4 rounded-full border-[1.5px] shrink-0', 'grid place-items-center transition-colors', isSelected
                    ? 'border-foreground bg-foreground'
                    : 'border-muted-foreground/40'), children: isSelected && (_jsx("div", { className: "w-2 h-2 rounded-full bg-background" })) }), _jsxs("div", { className: "flex-1 min-w-0 flex items-center", children: [_jsx("span", { className: "text-sm", children: label }), description && (_jsxs("span", { className: "text-sm text-muted-foreground ml-1.5", children: ["\u00B7 ", description] }))] })] }));
}
//# sourceMappingURL=SettingsRadioGroup.js.map