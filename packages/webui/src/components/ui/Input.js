import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
/**
 * Input component with multiple sizes and states
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   error={!!errors.email}
 *   errorMessage={errors.email}
 * />
 * ```
 */
const Input = forwardRef(({ size = 'md', error = false, errorMessage, label, helperText, leftElement, rightElement, fullWidth = false, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const baseClasses = 'border rounded transition-colors focus:outline-none focus:ring-2';
    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2',
        lg: 'px-4 py-3 text-lg',
    };
    const stateClasses = error
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
    const disabledClasses = disabled
        ? 'bg-gray-100 cursor-not-allowed opacity-60'
        : 'bg-white';
    const widthClass = fullWidth ? 'w-full' : '';
    const paddingClasses = [
        leftElement ? 'pl-10' : '',
        rightElement ? 'pr-10' : '',
    ].join(' ');
    return (_jsxs("div", { className: `${fullWidth ? 'w-full' : 'inline-block'}`, children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsxs("div", { className: "relative", children: [leftElement && (_jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500", children: leftElement })), _jsx("input", { ref: ref, id: inputId, disabled: disabled, "aria-invalid": error, "aria-describedby": errorMessage
                            ? `${inputId}-error`
                            : helperText
                                ? `${inputId}-helper`
                                : undefined, className: `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${disabledClasses} ${widthClass} ${paddingClasses} ${className}`.trim(), ...props }), rightElement && (_jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500", children: rightElement }))] }), errorMessage && error && (_jsx("p", { id: `${inputId}-error`, className: "mt-1 text-sm text-red-600", children: errorMessage })), helperText && !error && (_jsx("p", { id: `${inputId}-helper`, className: "mt-1 text-sm text-gray-500", children: helperText }))] }));
});
Input.displayName = 'Input';
export default Input;
//# sourceMappingURL=Input.js.map