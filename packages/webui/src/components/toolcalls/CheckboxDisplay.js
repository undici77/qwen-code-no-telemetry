import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Display-only checkbox styled via Tailwind classes.
 * - Renders a custom-looking checkbox using appearance-none and pseudo-elements.
 * - Supports indeterminate (middle) state using a data- attribute.
 * - Intended for read-only display (disabled by default).
 */
export const CheckboxDisplay = ({ checked = false, indeterminate = false, disabled = true, className = '', style, title, }) => {
    const showCheck = !!checked && !indeterminate;
    const showInProgress = !!indeterminate;
    return (_jsxs("span", { role: "checkbox", "aria-checked": indeterminate ? 'mixed' : !!checked, "aria-disabled": disabled || undefined, title: title, style: style, className: [
            'q m-[2px] shrink-0 w-4 h-4 relative rounded-[2px] box-border',
            'border border-[var(--app-input-border)] bg-[var(--app-input-background)]',
            'inline-flex items-center justify-center',
            showCheck ? 'opacity-70' : '',
            className,
        ].join(' '), children: [showCheck ? (_jsx("span", { "aria-hidden": true, className: [
                    'absolute block',
                    'left-[3px] top-[3px]',
                    'w-2.5 h-1.5',
                    'border-l-2 border-b-2',
                    'border-[#74c991]',
                    '-rotate-45',
                ].join(' ') })) : null, showInProgress ? (_jsx("span", { "aria-hidden": true, className: [
                    'absolute inline-block',
                    'left-1/2 top-[10px] -translate-x-1/2 -translate-y-1/2',
                    'text-[16px] leading-none text-[#e1c08d] select-none',
                ].join(' '), children: "*" })) : null] }));
};
//# sourceMappingURL=CheckboxDisplay.js.map