import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
/**
 * PermissionRequest - Self-contained structured input for permission approval
 *
 * Shows:
 * - Shield icon + "Permission Required" header
 * - Tool name badge
 * - Description of what the tool wants to do
 * - Command preview (scrollable)
 * - Action buttons: Allow, Always Allow, Deny
 */
export function PermissionRequest({ request, onResponse, unstyled = false }) {
    const { t } = useTranslation();
    const handleAllow = () => {
        onResponse({ type: 'permission', allowed: true, alwaysAllow: false });
    };
    const handleAlwaysAllow = () => {
        onResponse({ type: 'permission', allowed: true, alwaysAllow: true });
    };
    const handleDeny = () => {
        onResponse({ type: 'permission', allowed: false, alwaysAllow: false });
    };
    return (_jsxs("div", { className: cn('overflow-hidden h-full flex flex-col bg-info/5', unstyled
            ? 'border-0'
            : 'border border-info/30 rounded-[8px] shadow-middle'), "data-tutorial": "permission-banner", children: [_jsxs("div", { className: "p-4 space-y-3 flex-1 min-h-0 flex flex-col", children: [_jsxs("div", { className: "space-y-2 pb-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium text-foreground", children: [_jsx(ShieldAlert, { className: "h-3.5 w-3.5 text-info" }), _jsx("span", { children: t('chat.permissionRequired') })] }), _jsxs("div", { className: "text-xs leading-[18px] text-muted-foreground", children: [_jsx("span", { className: "font-medium text-foreground", children: "Tool:" }), " ", request.toolName, _jsx("br", {}), request.description] })] }), request.command && (_jsx("div", { className: "bg-foreground/5 rounded-md p-3 font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all max-h-24 overflow-y-auto", children: request.command }))] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: [_jsxs(Button, { size: "sm", variant: "default", className: "h-7 gap-1.5", onClick: handleAllow, "data-tutorial": "permission-allow-button", children: [_jsx(Check, { className: "h-3.5 w-3.5" }), "Allow"] }), _jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5 border border-foreground/10 hover:bg-foreground/5 active:bg-foreground/10", onClick: handleAlwaysAllow, children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), "Always Allow"] }), _jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5 text-destructive hover:text-destructive border border-dashed border-destructive/50 hover:bg-destructive/10 hover:border-destructive/70 active:bg-destructive/20", onClick: handleDeny, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Deny"] }), _jsx("div", { className: "flex-1" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "\"Always Allow\" remembers this command for the session" })] })] }));
}
//# sourceMappingURL=PermissionRequest.js.map