import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@craft-agent/ui";
/**
 * AddWorkspaceContainer - Main container for workspace creation steps
 *
 * Provides:
 * - Fixed width (28rem)
 * - Background with rounded corners
 * - Strong shadow for elevation
 * - Consistent padding
 */
export function AddWorkspaceContainer({ children, className }) {
    return (_jsx("div", { className: cn("flex w-full max-w-[28rem] flex-col items-center", "bg-background rounded-[20px] shadow-strong p-8", className), children: children }));
}
/**
 * AddWorkspaceStepHeader - Title and description for workspace steps
 *
 * Always center-aligned with tight spacing for visual consistency.
 */
export function AddWorkspaceStepHeader({ title, description, className }) {
    return (_jsxs("div", { className: cn("text-center", className), children: [_jsx("h1", { className: "text-lg font-semibold tracking-tight", children: title }), description && (_jsx("p", { className: "mt-1 text-sm max-w-sm text-muted-foreground mx-auto", children: description }))] }));
}
/**
 * AddWorkspacePrimaryButton - Primary action button for workspace flow
 *
 * Used for main actions like "Create", "Open", etc.
 * Includes loading state with spinner.
 */
export function AddWorkspacePrimaryButton({ children = 'Continue', loading, loadingText, className, disabled, ...props }) {
    return (_jsx(Button, { className: cn("w-full", className), disabled: disabled || loading, ...props, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Spinner, { className: "mr-2" }), loadingText || children] })) : (children) }));
}
/**
 * AddWorkspaceSecondaryButton - Secondary action button for workspace flow
 *
 * Used for actions like "Browse", or inline actions within forms.
 */
export function AddWorkspaceSecondaryButton({ children, className, ...props }) {
    return (_jsx(Button, { variant: "secondary", size: "sm", className: cn("bg-background shadow-minimal", className), ...props, children: children }));
}
//# sourceMappingURL=primitives.js.map