import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MessagingDialogHost
 *
 * Global host that owns the messaging pairing/connect dialogs so they survive
 * the close of the triggering context menu or dropdown.
 */
import { useAtom } from 'jotai';
import { messagingDialogAtom } from '@/atoms/messaging';
import { PairingCodeDialog } from './PairingCodeDialog';
import { WhatsAppConnectDialog } from './WhatsAppConnectDialog';
export function MessagingDialogHost() {
    const [state, setState] = useAtom(messagingDialogAtom);
    const close = () => setState({ kind: 'closed' });
    const openPairing = async (sessionId, platform) => {
        setState({
            kind: 'pairing',
            platform,
            sessionId,
            code: null,
            expiresAt: null,
        });
        try {
            const result = await window.electronAPI.generateMessagingPairingCode(sessionId, platform);
            setState({
                kind: 'pairing',
                platform,
                sessionId,
                code: result.code,
                expiresAt: result.expiresAt,
                botUsername: result.botUsername,
            });
        }
        catch (err) {
            setState({
                kind: 'pairing',
                platform,
                sessionId,
                code: null,
                expiresAt: null,
                error: classifyMessagingError(err),
            });
        }
    };
    const handleWhatsAppConnected = () => {
        if (state.kind === 'wa_connect' && state.continueToPairingSessionId) {
            void openPairing(state.continueToPairingSessionId, 'whatsapp');
            return;
        }
        close();
    };
    return (_jsxs(_Fragment, { children: [_jsx(PairingCodeDialog, { open: state.kind === 'pairing', onOpenChange: (o) => { if (!o)
                    close(); }, platform: state.kind === 'pairing' ? state.platform : 'telegram', code: state.kind === 'pairing' ? state.code : null, expiresAt: state.kind === 'pairing' ? state.expiresAt : null, botUsername: state.kind === 'pairing' ? state.botUsername : undefined, error: state.kind === 'pairing' ? state.error : undefined }), _jsx(WhatsAppConnectDialog, { open: state.kind === 'wa_connect', onOpenChange: (o) => { if (!o)
                    close(); }, onConnected: handleWhatsAppConnected })] }));
}
function classifyMessagingError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not connected/i.test(msg)) {
        return 'WhatsApp is not connected yet. Reconnect it in Settings → Messaging and try again.';
    }
    if (/rate.?limit/i.test(msg)) {
        return 'Too many pairing code requests. Please wait a moment and try again.';
    }
    return msg;
}
//# sourceMappingURL=MessagingDialogHost.js.map