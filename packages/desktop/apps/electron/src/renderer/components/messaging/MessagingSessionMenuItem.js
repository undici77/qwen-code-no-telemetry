import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MessagingSessionMenuItem
 *
 * The "Connect Messaging → Telegram / WhatsApp" submenu block shared by
 * SessionMenu (real context/dropdown menus) and the playground preview.
 *
 * Behavior:
 *  - If the target platform isn't connected yet, route the user to the right
 *    setup entry point (WhatsApp opens the connect dialog; Telegram defaults
 *    to navigating to messaging settings + toasting — callers can override
 *    that via `onTelegramNotConfigured`).
 *  - If the platform is connected, dispatch `messagingDialogAtom` with a
 *    pairing-code dialog and kick off `generateMessagingPairingCode`.
 *
 * Renders the `<Sub>` block only — the caller decides placement and
 * separators. Reads menu primitives from `useMenuComponents()` so it works
 * identically inside a DropdownMenu or ContextMenu.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSetAtom } from 'jotai';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { navigate, routes } from '@/lib/navigate';
import { useMenuComponents } from '@/components/ui/menu-context';
import { messagingDialogAtom } from '@/atoms/messaging';
export function MessagingSessionMenuItem({ sessionId, onTelegramNotConfigured, classifyError = classifyMessagingError, }) {
    const { t } = useTranslation();
    const setMessagingDialog = useSetAtom(messagingDialogAtom);
    const { MenuItem, Sub, SubTrigger, SubContent } = useMenuComponents();
    const handleConnectMessaging = async (platform) => {
        // First-run check — avoid hitting the server if the platform is not
        // connected. Failure to read config is treated as "unknown" and falls
        // through to attempting pairing so the server surfaces a real error.
        try {
            const cfg = await window.electronAPI.getMessagingConfig();
            const runtime = cfg?.runtime?.[platform];
            const isConnected = Boolean(runtime?.connected);
            if (!isConnected) {
                if (platform === 'whatsapp') {
                    setMessagingDialog({ kind: 'wa_connect', continueToPairingSessionId: sessionId });
                }
                else if (onTelegramNotConfigured) {
                    onTelegramNotConfigured();
                }
                else {
                    navigate(routes.view.settings('messaging'));
                    toast.info(t('toast.telegramNotConfiguredOpenSettings'));
                }
                return;
            }
        }
        catch {
            // Fall through to attempting pairing code generation.
        }
        setMessagingDialog({
            kind: 'pairing',
            platform,
            sessionId,
            code: null,
            expiresAt: null,
        });
        try {
            const result = await window.electronAPI.generateMessagingPairingCode(sessionId, platform);
            setMessagingDialog({
                kind: 'pairing',
                platform,
                sessionId,
                code: result.code,
                expiresAt: result.expiresAt,
                botUsername: result.botUsername,
            });
        }
        catch (err) {
            setMessagingDialog({
                kind: 'pairing',
                platform,
                sessionId,
                code: null,
                expiresAt: null,
                error: classifyError(err, t),
            });
        }
    };
    return (_jsxs(Sub, { children: [_jsxs(SubTrigger, { className: "pr-2", children: [_jsx(MessageSquare, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "flex-1", children: t('sessionMenu.connectMessaging') })] }), _jsxs(SubContent, { children: [_jsx(MenuItem, { onClick: () => handleConnectMessaging('telegram'), children: _jsx("span", { children: "Telegram" }) }), _jsx(MenuItem, { onClick: () => handleConnectMessaging('whatsapp'), children: _jsx("span", { children: "WhatsApp" }) })] })] }));
}
/**
 * Translate raw errors from the pairing-code RPC into user-facing text.
 * Narrow on purpose — only classifies well-known failure modes; anything else
 * is surfaced verbatim so real errors aren't hidden.
 */
export function classifyMessagingError(err, t) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/platform not connected|no adapter|not configured/i.test(msg)) {
        return t('toast.messagingNotConfigured');
    }
    if (/rate.?limit/i.test(msg)) {
        return t('toast.messagingRateLimited');
    }
    return msg;
}
//# sourceMappingURL=MessagingSessionMenuItem.js.map