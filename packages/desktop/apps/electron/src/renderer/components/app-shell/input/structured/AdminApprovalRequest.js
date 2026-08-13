import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
/**
 * AdminApprovalRequest - Friendly admin-elevation approval card for non-technical users.
 *
 * Goal: make privileged escalation understandable and safe.
 */
export function AdminApprovalRequest({ request, onApprove, onCancel, unstyled = false, }) {
    const { t } = useTranslation();
    const [rememberChoice, setRememberChoice] = React.useState(false);
    const rememberForMinutes = request.rememberForMinutes ?? 10;
    const handleApprove = () => {
        onApprove({ rememberForMinutes: rememberChoice ? rememberForMinutes : undefined });
    };
    return (_jsxs("div", { className: cn('overflow-hidden h-full flex flex-col bg-info/5', unstyled
            ? 'border-0'
            : 'border border-info/30 rounded-[8px] shadow-middle'), children: [_jsxs("div", { className: "p-4 space-y-3 flex-1 min-h-0 flex flex-col", children: [_jsxs("div", { className: "space-y-2 pb-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium text-foreground", children: [_jsx(ShieldAlert, { className: "h-3.5 w-3.5 text-info" }), _jsx("span", { children: t('chat.adminApprovalRequired') })] }), _jsxs("div", { className: "text-xs leading-[18px] text-muted-foreground", children: ["Installing ", _jsx("span", { className: "font-medium text-foreground", children: request.appName }), " needs your Mac admin approval.", request.requiresSystemPrompt ? " You’ll see your regular macOS password/Touch ID prompt." : '', _jsx("br", {}), _jsx("span", { className: "font-medium text-foreground", children: "Why:" }), " ", request.reason, request.impact && (_jsxs(_Fragment, { children: [_jsx("br", {}), _jsx("span", { className: "font-medium text-foreground", children: "Impact:" }), " ", request.impact] }))] })] }), _jsx("div", { className: "bg-foreground/5 rounded-md p-3 font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all max-h-24 overflow-y-auto", children: request.command })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: [_jsxs(Button, { size: "sm", variant: "default", className: "h-7 gap-1.5 cursor-pointer", onClick: handleApprove, children: [_jsx(Check, { className: "h-3.5 w-3.5" }), "Approve"] }), _jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5 text-destructive hover:text-destructive border border-dashed border-destructive/50 hover:bg-destructive/10 hover:border-destructive/70 active:bg-destructive/20", onClick: onCancel, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Cancel"] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Switch, { checked: rememberChoice, onCheckedChange: setRememberChoice, "aria-label": `Remember this exact command for ${rememberForMinutes} minutes` }), _jsxs(Label, { className: "text-[11px] text-muted-foreground cursor-pointer", onClick: () => setRememberChoice(!rememberChoice), children: ["Remember for ", rememberForMinutes, " min"] })] })] })] }));
}
//# sourceMappingURL=AdminApprovalRequest.js.map