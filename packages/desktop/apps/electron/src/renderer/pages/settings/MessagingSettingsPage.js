import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MessagingSettingsPage
 *
 * Configure messaging platform connections (Telegram, WhatsApp) and view
 * active session bindings.
 *
 * Layout:
 *  - One SettingsCard per platform (Telegram, WhatsApp)
 *  - Each card renders a PlatformRow: [brand logo] [name] [API · status]
 *    with a Connect button (disconnected) or three-dot menu (connected)
 *  - Active bindings render inline under their platform's row, each with
 *    "Open" (navigate to session) and "Disconnect" actions
 */
import * as React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowUpRight, MoreHorizontal, Plus, PowerOff, RefreshCcw, Settings2, Trash2, } from 'lucide-react';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, } from '@/components/ui/styled-dropdown';
import { SettingsSection, SettingsCard } from '@/components/settings';
import { MessagingPlatformIcon } from '@/components/messaging/MessagingPlatformIcon';
import { TelegramConnectDialog } from '@/components/messaging/TelegramConnectDialog';
import { WhatsAppConnectDialog } from '@/components/messaging/WhatsAppConnectDialog';
import { useActiveWorkspace } from '@/context/AppShellContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { messagingBindingsAtom, setMessagingBindingsAtom, } from '@/atoms/messaging';
import { sessionMetaMapAtom } from '@/atoms/sessions';
import { getSessionTitle } from '@/utils/session';
export const meta = {
    navigator: 'settings',
    slug: 'messaging',
};
export default function MessagingSettingsPage() {
    const { t } = useTranslation();
    const activeWorkspace = useActiveWorkspace();
    const setBindings = useSetAtom(setMessagingBindingsAtom);
    const workspaceId = activeWorkspace?.id;
    // Single fetch + subscription at the page level so both PlatformRows read
    // from the already-populated atom instead of subscribing twice.
    React.useEffect(() => {
        if (!workspaceId)
            return;
        let cancelled = false;
        const load = async () => {
            try {
                const rows = await window.electronAPI.getMessagingBindings();
                if (!cancelled)
                    setBindings(rows);
            }
            catch {
                // Silent — a toast here would be noisy on first load.
            }
        };
        load();
        const off = window.electronAPI.onMessagingBindingChanged((wsId) => {
            if (wsId === workspaceId)
                load();
        });
        return () => {
            cancelled = true;
            off();
        };
    }, [workspaceId, setBindings]);
    if (!activeWorkspace)
        return null;
    return (_jsxs("div", { className: "flex h-full flex-col", children: [_jsx(PanelHeader, { title: t('settings.messaging.title') }), _jsx(ScrollArea, { className: "flex-1", children: _jsx("div", { className: "space-y-6 p-6", children: _jsxs(SettingsSection, { title: t('settings.messaging.title'), children: [_jsx(SettingsCard, { children: _jsx(PlatformRow, { platform: "telegram", workspaceId: activeWorkspace.id }) }), _jsx(SettingsCard, { children: _jsx(PlatformRow, { platform: "whatsapp", workspaceId: activeWorkspace.id }) })] }) }) })] }));
}
const PLATFORM_LABEL_KEYS = {
    telegram: 'settings.messaging.telegram.title',
    whatsapp: 'settings.messaging.whatsapp.title',
};
const PLATFORM_API_DESCRIPTION_KEYS = {
    telegram: 'settings.messaging.telegram.apiDescription',
    whatsapp: 'settings.messaging.whatsapp.apiDescription',
};
function PlatformRow({ platform, workspaceId }) {
    const { t } = useTranslation();
    const allBindings = useAtomValue(messagingBindingsAtom);
    const sessionMetaMap = useAtomValue(sessionMetaMapAtom);
    const { navigateToSession } = useNavigation();
    const [runtime, setRuntime] = React.useState(() => defaultRuntime(platform));
    const [connectOpen, setConnectOpen] = React.useState(false);
    const [reconfigure, setReconfigure] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const platformBindings = React.useMemo(() => allBindings
        .filter((b) => b.platform === platform)
        .sort((a, b) => b.createdAt - a.createdAt), [allBindings, platform]);
    React.useEffect(() => {
        let cancelled = false;
        window.electronAPI.getMessagingConfig().then((cfg) => {
            if (cancelled)
                return;
            const next = cfg?.runtime?.[platform];
            setRuntime((next ?? defaultRuntime(platform)));
        });
        const off = window.electronAPI.onMessagingPlatformStatus((wsId, p, status) => {
            if (wsId !== workspaceId || p !== platform)
                return;
            setRuntime(status);
        });
        return () => {
            cancelled = true;
            off();
        };
    }, [platform, workspaceId]);
    // Mirror AI Settings pattern: close menu first, then fire the action on the
    // next frame — avoids a known menu/dialog teardown race.
    const runAfterMenuClose = React.useCallback((action) => {
        setMenuOpen(false);
        requestAnimationFrame(action);
    }, []);
    const handleConnect = () => {
        setReconfigure(false);
        setConnectOpen(true);
    };
    const handleReconfigure = () => {
        setReconfigure(true);
        setConnectOpen(true);
    };
    const handleDisconnect = async () => {
        try {
            await window.electronAPI.disconnectMessagingPlatform(platform);
            toast.success(t(`settings.messaging.${platform}.disconnected`));
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.error'));
        }
    };
    const handleForget = async () => {
        try {
            await window.electronAPI.forgetMessagingPlatform(platform);
            toast.success(t(`settings.messaging.${platform}.disconnected`));
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.error'));
        }
    };
    const handleUnbind = async (binding) => {
        try {
            await window.electronAPI.unbindMessagingBinding(binding.id);
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.error'));
        }
    };
    const description = buildDescription(platform, runtime, t);
    const label = t(PLATFORM_LABEL_KEYS[platform]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 px-4 py-3.5", children: [_jsx(MessagingPlatformIcon, { platform: platform, size: 22 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-medium", children: label }), _jsxs("div", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: [t(PLATFORM_API_DESCRIPTION_KEYS[platform]), " \u00B7 ", description] })] }), runtime.connected ? (_jsxs(DropdownMenu, { modal: false, open: menuOpen, onOpenChange: setMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: "rounded-md p-1.5 transition-colors hover:bg-foreground/[0.05] data-[state=open]:bg-foreground/[0.05]", "data-state": menuOpen ? 'open' : 'closed', "aria-label": t('common.more'), children: _jsx(MoreHorizontal, { className: "h-4 w-4 text-muted-foreground" }) }) }), _jsx(StyledDropdownMenuContent, { align: "end", children: platform === 'telegram' ? (_jsxs(_Fragment, { children: [_jsxs(StyledDropdownMenuItem, { onClick: () => runAfterMenuClose(handleReconfigure), children: [_jsx(Settings2, { className: "h-3.5 w-3.5" }), _jsx("span", { children: t('settings.messaging.telegram.reconfigure') })] }), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleDisconnect, variant: "destructive", children: [_jsx(PowerOff, { className: "h-3.5 w-3.5" }), _jsx("span", { children: t('settings.messaging.telegram.disconnect') })] })] })) : (_jsxs(_Fragment, { children: [_jsxs(StyledDropdownMenuItem, { onClick: () => runAfterMenuClose(handleConnect), children: [_jsx(RefreshCcw, { className: "h-3.5 w-3.5" }), _jsx("span", { children: t('settings.messaging.whatsapp.reconnect') })] }), _jsxs(StyledDropdownMenuItem, { onClick: handleDisconnect, children: [_jsx(PowerOff, { className: "h-3.5 w-3.5" }), _jsx("span", { children: t('settings.messaging.whatsapp.disable') })] }), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleForget, variant: "destructive", children: [_jsx(Trash2, { className: "h-3.5 w-3.5" }), _jsx("span", { children: t('settings.messaging.whatsapp.forget') })] })] })) })] })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: handleConnect, children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), t('common.connect')] }))] }), platformBindings.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mx-4 h-px bg-border/50" }), _jsx("div", { className: "divide-y divide-border/50", children: platformBindings.map((binding) => {
                                    const sessionMeta = sessionMetaMap.get(binding.sessionId);
                                    const displayName = sessionMeta
                                        ? getSessionTitle(sessionMeta)
                                        : binding.channelName || binding.channelId;
                                    return (_jsxs("div", { className: "flex items-center justify-between gap-4 px-4 py-2.5 pl-[52px]", children: [_jsx("div", { className: "min-w-0", children: _jsx("div", { className: "truncate text-sm", children: displayName }) }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigateToSession(binding.sessionId), children: [_jsx(ArrowUpRight, { className: "h-3.5 w-3.5" }), t('settings.messaging.bindings.openSession')] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:text-destructive", onClick: () => handleUnbind(binding), children: t('settings.messaging.bindings.unbind') })] })] }, binding.id));
                                }) })] }))] }), platform === 'telegram' && (_jsx(TelegramConnectDialog, { open: connectOpen, onOpenChange: setConnectOpen, reconfigure: reconfigure })), platform === 'whatsapp' && (_jsx(WhatsAppConnectDialog, { open: connectOpen, onOpenChange: setConnectOpen }))] }));
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildDescription(platform, runtime, t) {
    if (runtime.connected) {
        if (platform === 'whatsapp' && runtime.identity) {
            return t('dialog.whatsapp.connectedAs', { name: runtime.identity });
        }
        if (platform === 'telegram' && runtime.identity) {
            return t('settings.messaging.telegram.validBot', { username: runtime.identity });
        }
        return t(`settings.messaging.${platform}.connected`);
    }
    if (runtime.state === 'connecting') {
        return t('dialog.whatsapp.starting');
    }
    if (runtime.state === 'error' && runtime.lastError) {
        return runtime.lastError;
    }
    return t(`settings.messaging.${platform}.notConnected`);
}
function defaultRuntime(platform) {
    return {
        platform,
        configured: false,
        connected: false,
        state: 'disconnected',
        updatedAt: Date.now(),
    };
}
//# sourceMappingURL=MessagingSettingsPage.js.map