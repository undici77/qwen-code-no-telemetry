import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WhatsAppConnectDialog — drives the Baileys QR-scan pairing flow from the UI.
 */
import * as React from 'react';
import { Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { Spinner } from '@craft-agent/ui';
import { useActiveWorkspace } from '@/context/AppShellContext';
export function WhatsAppConnectDialog({ open, onOpenChange, onConnected }) {
    const { t } = useTranslation();
    const activeWorkspace = useActiveWorkspace();
    const activeWorkspaceId = activeWorkspace?.id;
    const [phase, setPhase] = React.useState({ kind: 'idle' });
    React.useEffect(() => {
        if (!open || !activeWorkspaceId)
            return;
        // The main process broadcasts WhatsApp UI events to every renderer. If
        // multiple workspaces are open and another one starts a QR flow, we'd
        // receive its `qr`/`connected` frames and paint them here. Filter by
        // workspaceId at the dialog boundary.
        const off = window.electronAPI.onWhatsAppEvent(({ workspaceId, event }) => {
            if (workspaceId !== activeWorkspaceId)
                return;
            handleEvent(event);
        });
        return off;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, activeWorkspaceId]);
    React.useEffect(() => {
        if (!open || phase.kind !== 'idle')
            return;
        setPhase({ kind: 'starting' });
        window.electronAPI
            .startWhatsAppConnect()
            .catch((err) => setPhase({ kind: 'error', message: errorMsg(err) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    React.useEffect(() => {
        if (!open) {
            setPhase({ kind: 'idle' });
        }
    }, [open]);
    const handleEvent = (event) => {
        switch (event.type) {
            case 'qr':
                setPhase({ kind: 'show_qr', qr: event.qr });
                return;
            case 'connected':
                setPhase({ kind: 'connected', name: event.name });
                setTimeout(() => {
                    if (onConnected) {
                        onConnected();
                    }
                    else {
                        onOpenChange(false);
                    }
                }, 1200);
                return;
            case 'disconnected':
                if (event.loggedOut) {
                    setPhase({ kind: 'error', message: t('dialog.whatsapp.loggedOut') });
                }
                return;
            case 'unavailable':
                setPhase({ kind: 'error', message: event.message });
                return;
            case 'error':
                setPhase({ kind: 'error', message: event.message });
                return;
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[480px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dialog.whatsapp.title') }), _jsx(DialogDescription, { children: t('dialog.whatsapp.description') })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: t('dialog.whatsapp.selfChatHint') }), _jsxs("div", { className: "flex flex-col gap-4 py-2", children: [phase.kind === 'starting' && (_jsx(StatusRow, { icon: _jsx(Spinner, { className: "text-[16px]" }), children: t('dialog.whatsapp.starting') })), phase.kind === 'show_qr' && (_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "rounded-lg bg-white p-4", children: _jsx(QRCodeSVG, { value: phase.qr, size: 240, level: "M" }) }), _jsx("p", { className: "whitespace-pre-line text-center text-sm text-muted-foreground", children: t('dialog.whatsapp.qrInstructions') })] })), phase.kind === 'connected' && (_jsx(StatusRow, { icon: _jsx(Check, { className: "h-4 w-4 text-emerald-500" }), children: phase.name
                                ? t('dialog.whatsapp.connectedAs', { name: phase.name })
                                : t('dialog.whatsapp.connected') })), phase.kind === 'error' && (_jsx("div", { className: "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive", children: phase.message }))] })] }) }));
}
function StatusRow({ icon, children }) {
    return (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [icon, _jsx("span", { children: children })] }));
}
function errorMsg(err) {
    return err instanceof Error ? err.message : String(err);
}
//# sourceMappingURL=WhatsAppConnectDialog.js.map