import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ServerSettingsPage
 *
 * Configure the Electron app to act as a remote server,
 * accessible from other machines on the network.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Eye, EyeOff, AlertTriangle, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Spinner } from '@craft-agent/ui';
import { SettingsSection, SettingsCard, SettingsCardFooter, SettingsRow, SettingsToggle, SettingsInputRow, } from '@/components/settings';
export const meta = {
    navigator: 'settings',
    slug: 'server',
};
function configToForm(config) {
    return {
        enabled: config.enabled,
        port: String(config.port),
        tlsCertPath: config.tlsCertPath ?? '',
        tlsKeyPath: config.tlsKeyPath ?? '',
        token: config.token ?? '',
    };
}
function formToConfig(form) {
    return {
        enabled: form.enabled,
        port: parseInt(form.port, 10) || 9100,
        tlsCertPath: form.tlsCertPath.trim() || undefined,
        tlsKeyPath: form.tlsKeyPath.trim() || undefined,
        token: form.token || undefined,
    };
}
export default function ServerSettingsPage() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        enabled: false,
        port: '9100',
        tlsCertPath: '',
        tlsKeyPath: '',
        token: '',
    });
    const [savedForm, setSavedForm] = useState(form);
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tokenVisible, setTokenVisible] = useState(false);
    const [error, setError] = useState();
    const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
    const loadSettings = useCallback(async () => {
        try {
            const [config, serverStatus] = await Promise.all([
                window.electronAPI.getServerConfig(),
                window.electronAPI.getServerStatus(),
            ]);
            const formState = configToForm(config);
            setForm(formState);
            setSavedForm(formState);
            setStatus(serverStatus);
        }
        catch (err) {
            console.error('Failed to load server settings:', err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);
    const handleSave = async () => {
        setError(undefined);
        const port = parseInt(form.port, 10);
        if (isNaN(port) || port < 1024 || port > 65535) {
            setError(t('settings.server.portValidation'));
            return;
        }
        if (form.tlsCertPath && !form.tlsKeyPath) {
            setError(t('settings.server.privateKeyRequired'));
            return;
        }
        if (form.tlsKeyPath && !form.tlsCertPath) {
            setError(t('settings.server.certificateRequired'));
            return;
        }
        setIsSaving(true);
        try {
            await window.electronAPI.setServerConfig(formToConfig(form));
            setSavedForm(form);
            const newStatus = await window.electronAPI.getServerStatus();
            setStatus(newStatus);
            toast.success(t('settings.server.saved'));
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast.error(t('settings.server.failedToSave', { message: msg }));
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleReset = () => {
        setForm(savedForm);
        setError(undefined);
    };
    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(t('settings.server.copiedToClipboard', { label }));
    };
    const handleBrowseCert = async () => {
        const paths = await window.electronAPI.openFileDialog();
        if (paths.length > 0) {
            setForm(f => ({ ...f, tlsCertPath: paths[0] }));
        }
    };
    const handleBrowseKey = async () => {
        const paths = await window.electronAPI.openFileDialog();
        if (paths.length > 0) {
            setForm(f => ({ ...f, tlsKeyPath: paths[0] }));
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Spinner, {}) }));
    }
    const hasTls = !!(form.tlsCertPath && form.tlsKeyPath);
    const needsRestart = status?.needsRestart ?? false;
    const showServerDetails = form.enabled || savedForm.enabled;
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx(PanelHeader, { title: t("settings.server.title") }), _jsx(ScrollArea, { className: "flex-1", children: _jsxs("div", { className: "px-5 py-7 max-w-3xl mx-auto space-y-5", children: [_jsxs(SettingsSection, { title: t("settings.server.remoteAccess"), children: [_jsx(SettingsCard, { children: _jsx(SettingsToggle, { label: t("settings.server.enableServerMode"), description: t("settings.server.allowRemoteConnections"), checked: form.enabled, onCheckedChange: (enabled) => setForm(f => ({ ...f, enabled })) }) }), needsRestart && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning", children: [_jsx(RotateCw, { className: "h-3.5 w-3.5 shrink-0" }), _jsx("span", { className: "flex-1", children: t("settings.server.restartRequired") }), _jsx(Button, { variant: "outline", size: "sm", className: "h-6 text-[11px] px-2", onClick: () => window.electronAPI.relaunchApp(), children: t("settings.server.restartNow") })] }))] }), showServerDetails && (_jsxs(SettingsSection, { title: t("settings.server.connectionSection"), children: [_jsxs(SettingsCard, { children: [_jsx(SettingsInputRow, { label: t("settings.server.port"), value: form.port, onChange: (port) => setForm(f => ({ ...f, port })), placeholder: "9100" }), status && form.enabled && (_jsxs(_Fragment, { children: [_jsx(SettingsRow, { label: t("common.url"), children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("code", { className: "text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded", children: status.url }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: () => handleCopy(status.url, t("common.url")), children: _jsx(Copy, { className: "h-3 w-3" }) })] }) }), _jsx(SettingsRow, { label: t("settings.server.token"), children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("code", { className: "text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded max-w-[180px] truncate", children: tokenVisible ? status.token : '••••••••••••••••' }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: () => setTokenVisible(v => !v), children: tokenVisible ? _jsx(EyeOff, { className: "h-3 w-3" }) : _jsx(Eye, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: () => handleCopy(status.token, t("settings.server.token")), children: _jsx(Copy, { className: "h-3 w-3" }) })] }) })] })), _jsx(SettingsRow, { label: t("settings.server.certificate"), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[200px]", children: form.tlsCertPath || t("settings.server.notConfigured") }), _jsx(Button, { variant: "outline", size: "sm", className: "h-6 text-[11px] px-2 shrink-0", onClick: handleBrowseCert, children: t("common.browse") })] }) }), _jsx(SettingsRow, { label: t("settings.server.privateKey"), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[200px]", children: form.tlsKeyPath || t("settings.server.notConfigured") }), _jsx(Button, { variant: "outline", size: "sm", className: "h-6 text-[11px] px-2 shrink-0", onClick: handleBrowseKey, children: t("common.browse") })] }) })] }), form.enabled && !hasTls && (_jsxs("div", { className: "flex items-start gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning", children: [_jsx(AlertTriangle, { className: "h-3.5 w-3.5 shrink-0 mt-0.5" }), _jsx("span", { children: status?.insecureWarning
                                                ? t("settings.server.insecureWarning")
                                                : t("settings.server.noTlsWarning") })] }))] })), error && (_jsx("p", { className: "text-xs text-destructive px-1", children: error })), (isDirty || error) && (_jsxs(SettingsCardFooter, { children: [_jsx(Button, { variant: "outline", size: "sm", onClick: handleReset, disabled: isSaving, children: t("common.reset") }), _jsxs(Button, { size: "sm", onClick: handleSave, disabled: isSaving, children: [isSaving ? _jsx(Spinner, { className: "mr-1.5" }) : null, t("common.save")] })] }))] }) })] }));
}
//# sourceMappingURL=ServerSettingsPage.js.map