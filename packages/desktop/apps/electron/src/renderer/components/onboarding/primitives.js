import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@craft-agent/ui";
const iconVariantStyles = {
    primary: {
        container: '',
        icon: 'text-foreground',
    },
    success: {
        container: '',
        icon: 'text-success',
    },
    error: {
        container: '',
        icon: 'text-destructive',
    },
    loading: {
        container: '',
        icon: 'text-foreground',
    },
    none: {
        container: '',
        icon: '',
    },
};
/**
 * StepIcon - Circular icon container for step headers
 *
 * Use at the top of centered step layouts to provide visual context.
 */
export function StepIcon({ children, variant = 'primary', className }) {
    const styles = iconVariantStyles[variant];
    return (_jsx("div", { className: cn("step-icon", "mb-6 flex size-16 items-center justify-center", styles.container, className), children: _jsx("div", { className: cn("size-8 [&>svg]:size-full", styles.icon), children: children }) }));
}
/**
 * StepHeader - Title and description for steps
 *
 * Works for both centered layouts (with icon) and form layouts.
 */
export function StepHeader({ title, description, centered = true, className }) {
    return (_jsxs("div", { className: cn(centered && "text-center", className), children: [_jsx("h1", { className: "step-title text-lg font-semibold tracking-tight", children: title }), description && (_jsx("p", { className: "step-description mt-2 text-sm max-w-sm text-muted-foreground", children: description }))] }));
}
/**
 * StepFormLayout - Unified layout for onboarding steps
 *
 * Use for all steps. Supports:
 * - Optional icon at top (wrapped in StepIcon, or raw via iconElement)
 * - Centered header (title + description)
 * - Full-width content below (forms, lists, etc.)
 * - Flex action buttons at bottom
 */
export function StepFormLayout({ icon, iconVariant = 'primary', iconElement, title, description, actions, children, grow = false, fillHeight = false, className }) {
    return (_jsxs("div", { className: cn("flex w-[28rem] flex-col items-center", grow && !fillHeight && "h-full max-h-[600px]", fillHeight && "h-full", className), children: [iconElement && (_jsx("div", { className: "mb-6 shrink-0", children: iconElement })), icon && !iconElement && (_jsx(StepIcon, { variant: iconVariant, children: icon })), _jsx("div", { className: "shrink-0", children: _jsx(StepHeader, { title: title, description: description }) }), children && (_jsx("div", { className: cn("mt-6 w-full", (grow || fillHeight) && "flex-1 min-h-0"), children: children })), actions && (_jsx(StepActions, { variant: "flex", className: "mt-6 w-full shrink-0", children: actions }))] }));
}
/**
 * StepActions - Container for action buttons
 *
 * - 'stack' variant: Vertical stack, used for centered layouts with multiple CTAs
 * - 'flex' variant: Horizontal with flex-1 buttons, used for Back/Continue patterns
 */
export function StepActions({ children, variant = 'stack', className }) {
    return (_jsx("div", { className: cn("step-actions mt-8", variant === 'stack' && "flex flex-col gap-3", variant === 'flex' && "flex gap-3 justify-center", className), children: children }));
}
/**
 * BackButton - Consistent back/cancel button
 */
export function BackButton({ children = 'Back', className, ...props }) {
    return (_jsx(Button, { variant: "ghost", className: cn("flex-1 max-w-[320px] bg-foreground-2 shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", className), ...props, children: children }));
}
/**
 * ContinueButton - Consistent primary action button
 */
export function ContinueButton({ children = 'Continue', loading, loadingText = 'Loading...', className, disabled, ...props }) {
    return (_jsx(Button, { className: cn("flex-1 max-w-[320px] bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", className), disabled: disabled || loading, ...props, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Spinner, { className: "mr-2" }), loadingText] })) : (children) }));
}
//# sourceMappingURL=primitives.js.map