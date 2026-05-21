import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
/**
 * Button component with multiple variants and sizes
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
const Button = forwardRef(({ children, variant = 'primary', size = 'md', disabled = false, loading = false, leftIcon, rightIcon, fullWidth = false, className = '', type = 'button', ...props }, ref) => {
    const isDisabled = disabled || loading;
    const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
        outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    };
    const sizeClasses = {
        sm: 'px-2 py-1 text-sm gap-1',
        md: 'px-4 py-2 gap-2',
        lg: 'px-6 py-3 text-lg gap-2',
    };
    const disabledClass = isDisabled
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : '';
    const widthClass = fullWidth ? 'w-full' : '';
    return (_jsxs("button", { ref: ref, type: type, className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${widthClass} ${className}`.trim(), disabled: isDisabled, "aria-disabled": isDisabled, "aria-busy": loading, ...props, children: [loading && (_jsxs("svg", { className: "animate-spin h-4 w-4", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] })), !loading && leftIcon, children, !loading && rightIcon] }));
});
Button.displayName = 'Button';
export default Button;
//# sourceMappingURL=Button.js.map