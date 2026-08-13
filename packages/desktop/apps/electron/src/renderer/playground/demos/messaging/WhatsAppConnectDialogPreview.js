import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * WhatsAppConnectDialogPreview
 *
 * The real WhatsAppConnectDialog's internal phase state machine is driven by
 * `onWhatsAppEvent` callbacks — not props — so we can't force the phase via
 * props directly. Instead, when the variant prop changes we fire a synthetic
 * event through the playground messaging handle, which is the same mechanism
 * the mock IPC uses to drive the real state transitions.
 *
 * A small key-on-phase trick remounts the dialog so events fire cleanly
 * without stale timers (the "connected" phase auto-closes after 1.2s).
 */
import * as React from 'react';
import { WhatsAppConnectDialog } from '../../../components/messaging/WhatsAppConnectDialog';
import { playgroundMessagingHandle } from '../../mock-utils';
const SAMPLE_QR = 'playground://whatsapp/qr/2@abcDEF123456ghiJKL789mnoPQR,sampleKeyMaterialBase64encoded==,xxyyzz';
export function WhatsAppConnectDialogPreview({ phase, errorMessage, }) {
    const [open, setOpen] = React.useState(true);
    // Reopen on any prop change so switching variants in the sidebar brings
    // the dialog back up after the user has dismissed it.
    React.useEffect(() => {
        setOpen(true);
    }, [phase, errorMessage]);
    // Re-fire the synthetic event whenever the phase prop changes so the
    // dialog's internal state machine lands in the requested phase.
    React.useEffect(() => {
        if (phase === 'idle' || phase === 'starting')
            return;
        // Defer to next tick so the dialog's own listener is attached.
        const handle = setTimeout(() => {
            switch (phase) {
                case 'show_qr':
                    playgroundMessagingHandle.fireWAEvent({ type: 'qr', qr: SAMPLE_QR });
                    return;
                case 'connected':
                    playgroundMessagingHandle.fireWAEvent({
                        type: 'connected',
                        name: 'Gyula',
                    });
                    return;
                case 'error':
                    playgroundMessagingHandle.fireWAEvent({
                        type: 'error',
                        message: errorMessage || 'Pairing failed: unknown error',
                    });
                    return;
            }
        }, 50);
        return () => clearTimeout(handle);
    }, [phase, errorMessage]);
    // Force remount when phase changes so internal timers don't leak between
    // variants (e.g. the "connected" auto-close would otherwise clobber a
    // subsequent "show_qr" selection after 1.2s).
    return (_jsxs(_Fragment, { children: [_jsx(WhatsAppConnectDialog, { open: open, onOpenChange: setOpen }, phase), !open && (_jsxs("div", { className: "p-6 text-sm text-foreground/60", children: ["Dialog dismissed.", ' ', _jsx("button", { type: "button", className: "underline hover:text-foreground", onClick: () => setOpen(true), children: "Reopen" })] }))] }));
}
//# sourceMappingURL=WhatsAppConnectDialogPreview.js.map