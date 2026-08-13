import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PairingCodeDialog — shows a 6-digit pairing code for binding a session
 * to a messaging channel. The user runs `/pair <code>` in their bot chat
 * to complete the binding.
 */
import * as React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
export function PairingCodeDialog({ open, onOpenChange, platform, code, expiresAt, botUsername, error, }) {
    const { t } = useTranslation();
    const [secondsLeft, setSecondsLeft] = React.useState(0);
    React.useEffect(() => {
        if (!expiresAt)
            return;
        const update = () => {
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setSecondsLeft(remaining);
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const pairCommand = code ? `/pair ${code}` : '';
    const botLink = botUsername && platform === 'telegram'
        ? `https://t.me/${botUsername}`
        : null;
    const instructionsKey = `dialog.pairingCode.instructions.${platform}`;
    const sendCommandKey = `dialog.pairingCode.sendCommand.${platform}`;
    const handleCopy = async () => {
        if (!pairCommand)
            return;
        try {
            await navigator.clipboard.writeText(pairCommand);
            toast.success(t('toast.copied'));
        }
        catch {
            toast.error(t('toast.copyFailed'));
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[440px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dialog.pairingCode.title') }), _jsx(DialogDescription, { children: t(instructionsKey) })] }), _jsx("div", { className: "flex flex-col items-center gap-4 py-4", children: error ? (_jsx("p", { className: "text-sm text-destructive text-center", children: error })) : code ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "rounded-lg bg-muted px-6 py-4 font-mono text-3xl font-bold tracking-[0.3em]", children: code }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("code", { className: "rounded bg-muted px-2 py-1 font-mono", children: pairCommand }), _jsx("button", { type: "button", onClick: handleCopy, className: "inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent", title: t('common.copy'), children: _jsx(Copy, { className: "h-3.5 w-3.5" }) })] }), _jsx("p", { className: "text-center text-sm text-muted-foreground", children: t(sendCommandKey) }), platform === 'whatsapp' && (_jsx("p", { className: "text-center text-xs text-muted-foreground", children: t('dialog.pairingCode.whatsappSelfHint') })), botLink && (_jsxs("a", { href: botLink, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [_jsx(ExternalLink, { className: "h-3.5 w-3.5" }), "t.me/", botUsername] })), secondsLeft > 0 && (_jsxs("p", { className: "text-xs text-muted-foreground", children: [t('dialog.pairingCode.expires'), " (", minutes, ":", seconds.toString().padStart(2, '0'), ")"] })), secondsLeft === 0 && expiresAt && (_jsx("p", { className: "text-xs text-destructive", children: t('dialog.pairingCode.expired') }))] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: t('dialog.pairingCode.generating') })) })] }) }));
}
//# sourceMappingURL=PairingCodeDialog.js.map