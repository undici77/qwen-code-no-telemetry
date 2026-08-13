import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AppSettingsPage
 *
 * Global app-level settings that apply across all workspaces.
 *
 * Settings:
 * - Notifications
 * - Network (proxy)
 * - Updates
 *
 * Note: AI settings (connections, model, thinking) have been moved to AiSettingsPage.
 * Note: Appearance settings (theme, font) have been moved to AppearanceSettingsPage.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { routes } from '@/lib/navigate';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { Spinner } from '@craft-agent/ui';
import { APP_VERSION } from '@craft-agent/shared/branding';
import { SettingsSection, SettingsCard, SettingsCardFooter, SettingsRow, SettingsToggle, SettingsInput, } from '@/components/settings';
export const meta = {
    navigator: 'settings',
    slug: 'app',
};
const EMPTY_PROXY_FORM = {
    enabled: false,
    httpProxy: '',
    httpsProxy: '',
    noProxy: '',
};
function toProxyFormState(settings) {
    if (!settings)
        return EMPTY_PROXY_FORM;
    return {
        enabled: settings.enabled,
        httpProxy: settings.httpProxy ?? '',
        httpsProxy: settings.httpsProxy ?? '',
        noProxy: settings.noProxy ?? '',
    };
}
function toNetworkProxySettings(form) {
    return {
        enabled: form.enabled,
        httpProxy: form.httpProxy.trim() || undefined,
        httpsProxy: form.httpsProxy.trim() || undefined,
        noProxy: form.noProxy.trim() || undefined,
    };
}
function validateProxyUrl(url) {
    if (!url.trim())
        return undefined;
    try {
        const parsed = new URL(url.trim());
        if (!['http:', 'https:', 'socks4:', 'socks5:'].includes(parsed.protocol)) {
            return 'proxyErrorProtocol';
        }
        return undefined;
    }
    catch {
        return 'proxyErrorFormat';
    }
}
// ============================================
// Main Component
// ============================================
export default function AppSettingsPage() {
    const { t } = useTranslation();
    // Notifications state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    // Power state
    const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(false);
    // Tools state
    const [browserToolEnabled, setBrowserToolEnabled] = useState(true);
    const { updateInfo, isChecking, isDownloading, isReadyToInstall, downloadProgress, checkForUpdates, installUpdate, } = useUpdateChecker();
    // Proxy state
    const [proxyForm, setProxyForm] = useState(EMPTY_PROXY_FORM);
    const [savedProxyForm, setSavedProxyForm] = useState(EMPTY_PROXY_FORM);
    const [proxyError, setProxyError] = useState();
    const [isSavingProxy, setIsSavingProxy] = useState(false);
    // Load settings on mount
    const loadSettings = useCallback(async () => {
        if (!window.electronAPI)
            return;
        try {
            const [notificationsOn, keepAwakeOn, browserToolOn, proxySettings] = await Promise.all([
                window.electronAPI.getNotificationsEnabled(),
                window.electronAPI.getKeepAwakeWhileRunning(),
                window.electronAPI.getBrowserToolEnabled(),
                window.electronAPI.getNetworkProxySettings(),
            ]);
            setNotificationsEnabled(notificationsOn);
            setKeepAwakeEnabled(keepAwakeOn);
            setBrowserToolEnabled(browserToolOn);
            const form = toProxyFormState(proxySettings);
            setProxyForm(form);
            setSavedProxyForm(form);
        }
        catch (error) {
            console.error('Failed to load settings:', error);
        }
    }, []);
    useEffect(() => {
        loadSettings();
    }, []);
    const handleNotificationsEnabledChange = useCallback(async (enabled) => {
        setNotificationsEnabled(enabled);
        await window.electronAPI.setNotificationsEnabled(enabled);
    }, []);
    const handleKeepAwakeEnabledChange = useCallback(async (enabled) => {
        setKeepAwakeEnabled(enabled);
        await window.electronAPI.setKeepAwakeWhileRunning(enabled);
    }, []);
    const handleBrowserToolEnabledChange = useCallback(async (enabled) => {
        setBrowserToolEnabled(enabled);
        await window.electronAPI.setBrowserToolEnabled(enabled);
    }, []);
    // Proxy handlers
    const isProxyDirty = useMemo(() => {
        return JSON.stringify(proxyForm) !== JSON.stringify(savedProxyForm);
    }, [proxyForm, savedProxyForm]);
    const handleSaveProxy = useCallback(async () => {
        // Validate URLs
        const httpErr = validateProxyUrl(proxyForm.httpProxy);
        const httpsErr = validateProxyUrl(proxyForm.httpsProxy);
        if (httpErr || httpsErr) {
            setProxyError(httpErr || httpsErr);
            return;
        }
        setProxyError(undefined);
        setIsSavingProxy(true);
        try {
            const settings = toNetworkProxySettings(proxyForm);
            await window.electronAPI.setNetworkProxySettings(settings);
            // Re-read persisted state to confirm
            const persisted = await window.electronAPI.getNetworkProxySettings();
            const form = toProxyFormState(persisted);
            setProxyForm(form);
            setSavedProxyForm(form);
        }
        catch (error) {
            setProxyError(error instanceof Error ? error.message : t('toast.unknownError'));
        }
        finally {
            setIsSavingProxy(false);
        }
    }, [proxyForm, t]);
    const handleResetProxy = useCallback(() => {
        setProxyForm(savedProxyForm);
        setProxyError(undefined);
    }, [savedProxyForm]);
    const currentVersion = updateInfo?.currentVersion ?? APP_VERSION;
    const latestVersion = updateInfo?.latestVersion;
    const isInstallingUpdate = updateInfo?.downloadState === 'installing';
    const updateActionDisabled = isChecking || isDownloading || isInstallingUpdate;
    const updateStatusDescription = (() => {
        if (updateInfo?.downloadState === 'error') {
            return updateInfo.error || t("settings.updates.errorDesc");
        }
        if (isInstallingUpdate) {
            return t("settings.updates.installingDesc");
        }
        if (isReadyToInstall) {
            return t("settings.updates.readyDesc", { version: latestVersion ?? '' });
        }
        if (isDownloading) {
            return t("settings.updates.downloadingDesc", { progress: downloadProgress });
        }
        if (updateInfo?.available && latestVersion) {
            return t("settings.updates.availableDesc", { version: latestVersion });
        }
        if (latestVersion) {
            return t("settings.updates.upToDateDesc", { version: currentVersion });
        }
        return t("settings.updates.idleDesc");
    })();
    const handleUpdateAction = useCallback(async () => {
        if (isReadyToInstall) {
            await installUpdate();
            return;
        }
        await checkForUpdates();
    }, [checkForUpdates, installUpdate, isReadyToInstall]);
    const updateActionLabel = (() => {
        if (isInstallingUpdate)
            return t("settings.updates.installing");
        if (isReadyToInstall)
            return t("settings.updates.restartToUpdate");
        if (isDownloading)
            return t("settings.updates.downloading");
        if (isChecking)
            return t("settings.updates.checking");
        return t("settings.updates.check");
    })();
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.app.title"), actions: _jsx(HeaderMenu, { route: routes.view.settings('app'), helpFeature: "app-settings" }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsx(SettingsSection, { title: t("settings.notifications.title"), children: _jsx(SettingsCard, { children: _jsx(SettingsToggle, { label: t("settings.notifications.desktopNotifications"), description: t("settings.notifications.desktopNotificationsDesc"), checked: notificationsEnabled, onCheckedChange: handleNotificationsEnabledChange }) }) }), _jsx(SettingsSection, { title: t("settings.power.title"), children: _jsx(SettingsCard, { children: _jsx(SettingsToggle, { label: t("settings.power.keepScreenAwake"), description: t("settings.power.keepScreenAwakeDesc"), checked: keepAwakeEnabled, onCheckedChange: handleKeepAwakeEnabledChange }) }) }), _jsx(SettingsSection, { title: t("settings.tools.title"), children: _jsx(SettingsCard, { children: _jsx(SettingsToggle, { label: t("settings.tools.builtInBrowser"), description: t("settings.tools.builtInBrowserDesc"), checked: browserToolEnabled, onCheckedChange: handleBrowserToolEnabledChange }) }) }), _jsx(SettingsSection, { title: t("settings.network.title"), children: _jsxs(SettingsCard, { children: [_jsx(SettingsToggle, { label: t("settings.network.httpProxy"), description: t("settings.network.httpProxyDesc"), checked: proxyForm.enabled, onCheckedChange: (enabled) => setProxyForm(prev => ({ ...prev, enabled })) }), proxyForm.enabled && (_jsxs(_Fragment, { children: [_jsx(SettingsInput, { label: t("settings.network.httpProxyLabel"), value: proxyForm.httpProxy, onChange: (value) => setProxyForm(prev => ({ ...prev, httpProxy: value })), placeholder: t("settings.network.proxyPlaceholder"), inCard: true }), _jsx(SettingsInput, { label: t("settings.network.httpsProxyLabel"), value: proxyForm.httpsProxy, onChange: (value) => setProxyForm(prev => ({ ...prev, httpsProxy: value })), placeholder: t("settings.network.proxyPlaceholder"), inCard: true }), _jsx(SettingsInput, { label: t("settings.network.bypassRules"), value: proxyForm.noProxy, onChange: (value) => setProxyForm(prev => ({ ...prev, noProxy: value })), placeholder: t("settings.network.bypassPlaceholder"), inCard: true })] })), (isProxyDirty || proxyError) && (_jsxs(SettingsCardFooter, { children: [proxyError && (_jsx("span", { className: "text-destructive text-sm mr-auto", children: proxyError === 'proxyErrorProtocol' ? t("settings.network.proxyErrorProtocol") : proxyError === 'proxyErrorFormat' ? t("settings.network.proxyErrorFormat") : proxyError })), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleResetProxy, disabled: !isProxyDirty || isSavingProxy, children: t("common.reset") }), _jsx(Button, { size: "sm", onClick: handleSaveProxy, disabled: !isProxyDirty || isSavingProxy, children: isSavingProxy ? (_jsxs(_Fragment, { children: [_jsx(Spinner, { className: "mr-1.5" }), t("common.saving")] })) : (t("common.save")) })] }))] }) }), _jsx(SettingsSection, { title: t("settings.updates.title"), children: _jsxs(SettingsCard, { children: [_jsx(SettingsRow, { label: t("settings.updates.currentVersion"), description: updateStatusDescription, action: _jsxs(Button, { size: "sm", onClick: handleUpdateAction, disabled: updateActionDisabled, children: [(isChecking || isDownloading || isInstallingUpdate) && (_jsx(Spinner, { className: "mr-1.5" })), updateActionLabel] }), children: _jsx("span", { className: "text-muted-foreground", children: currentVersion }) }), latestVersion && latestVersion !== currentVersion && (_jsx(SettingsRow, { label: t("settings.updates.latestVersion"), children: _jsx("span", { className: "text-muted-foreground", children: latestVersion }) })), isDownloading && (_jsx(SettingsRow, { label: t("settings.updates.downloadProgress"), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-1.5 w-28 overflow-hidden rounded-full bg-muted", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": downloadProgress, children: _jsx("div", { className: "h-full rounded-full bg-primary transition-[width] duration-150", style: { width: `${Math.max(0, Math.min(100, downloadProgress))}%` } }) }), _jsxs("span", { className: "w-10 text-right text-sm text-muted-foreground", children: [downloadProgress, "%"] })] }) }))] }) })] }) }) }) })] }));
}
//# sourceMappingURL=AppSettingsPage.js.map