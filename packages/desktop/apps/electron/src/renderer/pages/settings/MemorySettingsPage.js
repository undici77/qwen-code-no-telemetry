import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { routes } from '@/lib/navigate';
import { useAppShellContext } from '@/context/AppShellContext';
import { SettingsCard, SettingsRow, SettingsSection, SettingsToggle, } from '@/components/settings';
export const meta = {
    navigator: 'settings',
    slug: 'memory',
};
const DEFAULT_MEMORY_SETTINGS = {
    enableManagedAutoMemory: true,
    enableManagedAutoDream: false,
    enableAutoSkill: false,
};
export default function MemorySettingsPage() {
    const { t } = useTranslation();
    const { activeWorkspaceId } = useAppShellContext();
    const [settings, setSettings] = useState(DEFAULT_MEMORY_SETTINGS);
    const [memoryPaths, setMemoryPaths] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            if (!window.electronAPI) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [loadedSettings, loadedPaths] = await Promise.all([
                    window.electronAPI.getQwenMemorySettings(activeWorkspaceId ?? undefined),
                    window.electronAPI.getQwenMemoryPaths(activeWorkspaceId ?? undefined),
                ]);
                setSettings(loadedSettings);
                setMemoryPaths(loadedPaths);
            }
            catch {
                toast.error(t('settings.memory.failedToLoad'));
            }
            finally {
                setIsLoading(false);
            }
        };
        load();
    }, [activeWorkspaceId, t]);
    const openMemoryPath = useCallback(async (target) => {
        try {
            await window.electronAPI.openQwenMemoryPath(target, activeWorkspaceId ?? undefined);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : t('common.unknown');
            toast.error(t('settings.memory.failedToOpen'), {
                description: message,
            });
        }
    }, [activeWorkspaceId, t]);
    const updateMemorySetting = useCallback(async (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        try {
            const saved = await window.electronAPI.setQwenMemorySettings({
                [key]: value,
            }, activeWorkspaceId ?? undefined);
            setSettings(saved);
        }
        catch (error) {
            setSettings((prev) => ({ ...prev, [key]: !value }));
            const message = error instanceof Error ? error.message : t('common.unknown');
            toast.error(t('settings.memory.failedToSave'), {
                description: message,
            });
        }
    }, [activeWorkspaceId, t]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t('settings.memory.title'), actions: _jsx(HeaderMenu, { route: routes.view.settings('memory') }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsx("div", { className: "space-y-8", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) })) : (_jsxs(_Fragment, { children: [_jsx(SettingsSection, { title: t('settings.memory.autoMemory'), description: t('settings.memory.autoMemoryDesc'), children: _jsxs(SettingsCard, { children: [_jsx(SettingsToggle, { label: t('settings.memory.enableManagedAutoMemory'), description: t('settings.memory.enableManagedAutoMemoryDesc'), checked: settings.enableManagedAutoMemory, onCheckedChange: (checked) => updateMemorySetting('enableManagedAutoMemory', checked) }), _jsx(SettingsToggle, { label: t('settings.memory.enableManagedAutoDream'), description: t('settings.memory.enableManagedAutoDreamDesc'), checked: settings.enableManagedAutoDream, onCheckedChange: (checked) => updateMemorySetting('enableManagedAutoDream', checked) }), _jsx(SettingsToggle, { label: t('settings.memory.enableAutoSkill'), description: t('settings.memory.enableAutoSkillDesc'), checked: settings.enableAutoSkill, onCheckedChange: (checked) => updateMemorySetting('enableAutoSkill', checked) })] }) }), _jsx(SettingsSection, { title: t('settings.memory.management'), description: t('settings.memory.managementDesc'), children: _jsxs(SettingsCard, { children: [_jsx(SettingsRow, { label: t('settings.memory.userMemoryFile'), description: memoryPaths?.userMemoryFile ||
                                                        t('settings.memory.pathUnavailable'), action: _jsx("button", { type: "button", onClick: () => openMemoryPath('user'), disabled: !memoryPaths?.userMemoryFile, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors disabled:opacity-50", children: t('common.open') }) }), _jsx(SettingsRow, { label: t('settings.memory.projectMemoryFile'), description: memoryPaths?.projectMemoryFile ||
                                                        t('settings.memory.pathUnavailable'), action: _jsx("button", { type: "button", onClick: () => openMemoryPath('project'), disabled: !memoryPaths?.projectMemoryFile, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors disabled:opacity-50", children: t('common.open') }) }), _jsx(SettingsRow, { label: t('settings.memory.autoMemoryFolder'), description: memoryPaths?.autoMemoryDir ||
                                                        t('settings.memory.pathUnavailable'), action: _jsx("button", { type: "button", onClick: () => openMemoryPath('auto'), disabled: !memoryPaths?.autoMemoryDir, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors disabled:opacity-50", children: t('common.open') }) })] }) })] })) }) }) }) })] }));
}
//# sourceMappingURL=MemorySettingsPage.js.map