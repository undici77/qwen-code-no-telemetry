import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WorkspaceSettingsPage
 *
 * Workspace-level settings for the active workspace.
 *
 * Settings:
 * - Identity (Name, Icon)
 * - Permissions (Default mode, Mode cycling)
 * - Advanced (Working directory, Local MCP servers)
 *
 * Note: AI settings (model, thinking, connection) have been moved to AiSettingsPage.
 */
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { useAppShellContext } from '@/context/AppShellContext';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/navigate';
import { getWorkspaceDisplayName, isProtectedWorkspace } from '@/utils/workspace';
import { Spinner } from '@craft-agent/ui';
import { RenameDialog } from '@/components/ui/rename-dialog';
import { useDirectoryPicker } from '@/hooks/useDirectoryPicker';
import { ServerDirectoryBrowser } from '@/components/ServerDirectoryBrowser';
import { PERMISSION_MODE_ORDER } from '@craft-agent/shared/agent/mode-types';
import { SourceAvatar } from '@/components/ui/source-avatar';
import { toast } from 'sonner';
import { SettingsSection, SettingsCard, SettingsRow, SettingsToggle, SettingsMenuSelectRow, } from '@/components/settings';
export const meta = {
    navigator: 'settings',
    slug: 'workspace',
};
// ============================================
// Main Component
// ============================================
export default function WorkspaceSettingsPage() {
    const { t } = useTranslation();
    // Get active workspace from context
    const appShellContext = useAppShellContext();
    const activeWorkspaceId = appShellContext.activeWorkspaceId;
    const activeWorkspace = appShellContext.workspaces.find((workspace) => workspace.id === activeWorkspaceId);
    const protectedWorkspace = isProtectedWorkspace(activeWorkspace);
    const workspaceDisplayName = getWorkspaceDisplayName(activeWorkspace, t);
    const onRefreshWorkspaces = appShellContext.onRefreshWorkspaces;
    // Workspace settings state
    const [wsName, setWsName] = useState('');
    const [wsNameEditing, setWsNameEditing] = useState('');
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [wsIconUrl, setWsIconUrl] = useState(null);
    const [isUploadingIcon, setIsUploadingIcon] = useState(false);
    const [permissionMode, setPermissionMode] = useState('allow-all');
    const [workingDirectory, setWorkingDirectory] = useState('');
    const [localMcpEnabled, setLocalMcpEnabled] = useState(true);
    const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
    // Default sources state
    const [availableSources, setAvailableSources] = useState([]);
    const [enabledSourceSlugs, setEnabledSourceSlugs] = useState([]);
    // Mode cycling state
    const [enabledModes, setEnabledModes] = useState([...PERMISSION_MODE_ORDER]);
    const [modeCyclingError, setModeCyclingError] = useState(null);
    // Load workspace settings when active workspace changes
    useEffect(() => {
        const loadWorkspaceSettings = async () => {
            if (!window.electronAPI || !activeWorkspaceId) {
                setIsLoadingWorkspace(false);
                return;
            }
            setIsLoadingWorkspace(true);
            try {
                const [settings, globalMode] = await Promise.all([
                    window.electronAPI.getWorkspaceSettings(activeWorkspaceId),
                    window.electronAPI.getGlobalPermissionMode(),
                ]);
                if (settings) {
                    setWsName(settings.name || '');
                    setWsNameEditing(settings.name || '');
                    setPermissionMode(globalMode);
                    setWorkingDirectory(settings.workingDirectory || '');
                    setLocalMcpEnabled(settings.localMcpEnabled ?? true);
                    // Load cyclable permission modes from workspace settings
                    if (settings.cyclablePermissionModes && settings.cyclablePermissionModes.length >= 2) {
                        setEnabledModes(settings.cyclablePermissionModes);
                    }
                    // Load default source slugs
                    const savedSlugs = settings.enabledSourceSlugs ?? [];
                    // Load available sources and auto-heal stale slugs
                    const sources = await window.electronAPI.getSources(activeWorkspaceId);
                    setAvailableSources(sources);
                    const validSlugs = new Set(sources.map(s => s.config.slug));
                    const healedSlugs = savedSlugs.filter(s => validSlugs.has(s));
                    setEnabledSourceSlugs(healedSlugs);
                    // Persist cleaned list if stale slugs were removed
                    if (healedSlugs.length !== savedSlugs.length) {
                        window.electronAPI.updateWorkspaceSetting(activeWorkspaceId, 'enabledSourceSlugs', healedSlugs);
                    }
                }
                // Try to load workspace icon (check common extensions)
                const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'];
                let iconFound = false;
                for (const ext of ICON_EXTENSIONS) {
                    try {
                        const iconData = await window.electronAPI.readWorkspaceImage(activeWorkspaceId, `./icon.${ext}`);
                        // IPC returns null for missing files - continue to next extension
                        if (!iconData) {
                            continue;
                        }
                        // For SVG, wrap in data URL
                        if (ext === 'svg' && !iconData.startsWith('data:')) {
                            setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`);
                        }
                        else {
                            setWsIconUrl(iconData);
                        }
                        iconFound = true;
                        break;
                    }
                    catch {
                        // Icon not found with this extension, try next
                    }
                }
                if (!iconFound) {
                    setWsIconUrl(null);
                }
            }
            catch (error) {
                console.error('Failed to load workspace settings:', error);
            }
            finally {
                setIsLoadingWorkspace(false);
            }
        };
        loadWorkspaceSettings();
    }, [activeWorkspaceId]);
    // Subscribe to live source changes (additions/removals)
    useEffect(() => {
        if (!window.electronAPI)
            return;
        const cleanup = window.electronAPI.onSourcesChanged((workspaceId, sources) => {
            if (workspaceId !== activeWorkspaceId)
                return;
            setAvailableSources(sources);
            // Auto-heal: remove slugs for sources that no longer exist
            const validSlugs = new Set(sources.map(s => s.config.slug));
            setEnabledSourceSlugs(prev => {
                const healed = prev.filter(s => validSlugs.has(s));
                if (healed.length !== prev.length && activeWorkspaceId) {
                    window.electronAPI.updateWorkspaceSetting(activeWorkspaceId, 'enabledSourceSlugs', healed);
                }
                return healed;
            });
        });
        return cleanup;
    }, [activeWorkspaceId]);
    // Save workspace setting
    const updateWorkspaceSetting = useCallback(async (key, value) => {
        if (!window.electronAPI || !activeWorkspaceId)
            return false;
        try {
            await window.electronAPI.updateWorkspaceSetting(activeWorkspaceId, key, value);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : t('toast.unknownError');
            console.error(`Failed to save ${String(key)}:`, error);
            toast.error(t('settings.workspace.failedToSave', { setting: String(key) }), {
                description: message,
            });
            return false;
        }
    }, [activeWorkspaceId, t]);
    // Workspace icon upload handler
    const handleIconUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file || protectedWorkspace || !activeWorkspaceId || !window.electronAPI)
            return;
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            console.error('Invalid file type:', file.type);
            return;
        }
        setIsUploadingIcon(true);
        try {
            // Read file as base64
            const buffer = await file.arrayBuffer();
            const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            // Determine extension from mime type
            const extMap = {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/svg+xml': 'svg',
                'image/webp': 'webp',
                'image/gif': 'gif',
            };
            const ext = extMap[file.type] || 'png';
            // Upload to workspace
            await window.electronAPI.writeWorkspaceImage(activeWorkspaceId, `./icon.${ext}`, base64, file.type);
            // Reload the icon locally for settings display
            const iconData = await window.electronAPI.readWorkspaceImage(activeWorkspaceId, `./icon.${ext}`);
            if (iconData) {
                if (ext === 'svg' && !iconData.startsWith('data:')) {
                    setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`);
                }
                else {
                    setWsIconUrl(iconData);
                }
            }
            // Refresh workspaces to update sidebar icon
            onRefreshWorkspaces?.();
        }
        catch (error) {
            console.error('Failed to upload icon:', error);
        }
        finally {
            setIsUploadingIcon(false);
            // Reset the input so the same file can be selected again
            e.target.value = '';
        }
    }, [activeWorkspaceId, onRefreshWorkspaces, protectedWorkspace]);
    // Workspace settings handlers
    const handlePermissionModeChange = useCallback(async (newMode) => {
        setPermissionMode(newMode);
        await window.electronAPI.setGlobalPermissionMode(newMode);
    }, []);
    const handleWorkingDirectorySelected = useCallback(async (selectedPath) => {
        const saved = await updateWorkspaceSetting('workingDirectory', selectedPath);
        if (saved) {
            setWorkingDirectory(selectedPath);
        }
    }, [updateWorkspaceSetting]);
    const { pickDirectory: handleChangeWorkingDirectory, showServerBrowser: showWdBrowser, serverBrowserMode: wdBrowserMode, cancelServerBrowser: cancelWdBrowser, confirmServerBrowser: confirmWdBrowser, } = useDirectoryPicker(handleWorkingDirectorySelected);
    const handleClearWorkingDirectory = useCallback(async () => {
        if (!window.electronAPI)
            return;
        const saved = await updateWorkspaceSetting('workingDirectory', undefined);
        if (saved) {
            setWorkingDirectory('');
        }
    }, [updateWorkspaceSetting]);
    const handleLocalMcpEnabledChange = useCallback(async (enabled) => {
        setLocalMcpEnabled(enabled);
        await updateWorkspaceSetting('localMcpEnabled', enabled);
    }, [updateWorkspaceSetting]);
    const handleSourceToggle = useCallback(async (slug, checked) => {
        const newSlugs = checked
            ? [...enabledSourceSlugs, slug]
            : enabledSourceSlugs.filter(s => s !== slug);
        setEnabledSourceSlugs(newSlugs);
        await updateWorkspaceSetting('enabledSourceSlugs', newSlugs);
    }, [enabledSourceSlugs, updateWorkspaceSetting]);
    const handleModeToggle = useCallback(async (mode, checked) => {
        if (!window.electronAPI)
            return;
        // Calculate what the new modes would be
        const newModes = checked
            ? [...enabledModes, mode]
            : enabledModes.filter((m) => m !== mode);
        // Validate: at least 2 modes required
        if (newModes.length < 2) {
            setModeCyclingError(t('settings.workspace.atLeast2Modes'));
            // Auto-dismiss after 2 seconds
            setTimeout(() => {
                setModeCyclingError(null);
            }, 2000);
            return;
        }
        // Update state and persist
        setEnabledModes(newModes);
        setModeCyclingError(null);
        try {
            await updateWorkspaceSetting('cyclablePermissionModes', newModes);
        }
        catch (error) {
            console.error('Failed to save mode cycling settings:', error);
        }
    }, [enabledModes, updateWorkspaceSetting, t]);
    // Show empty state if no workspace is active
    if (!activeWorkspaceId) {
        return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.workspace.workspaceSettings"), actions: _jsx(HeaderMenu, { route: routes.view.settings('workspace'), helpFeature: "workspaces" }) }), _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: t("settings.workspace.noWorkspaceSelected") }) })] }));
    }
    // Show loading state
    if (isLoadingWorkspace) {
        return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.workspace.workspaceSettings"), actions: _jsx(HeaderMenu, { route: routes.view.settings('workspace'), helpFeature: "workspaces" }) }), _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsx(Spinner, { className: "text-muted-foreground" }) })] }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.workspace.workspaceSettings"), actions: _jsx(HeaderMenu, { route: routes.view.settings('workspace'), helpFeature: "workspaces" }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsxs(SettingsSection, { title: t("settings.workspace.workspaceInfo"), children: [_jsxs(SettingsCard, { children: [_jsx(SettingsRow, { label: t("common.name"), description: protectedWorkspace ? workspaceDisplayName : (wsName || t("settings.workspace.untitled")), action: protectedWorkspace ? undefined : (_jsx("button", { type: "button", onClick: () => {
                                                            setWsNameEditing(wsName);
                                                            setRenameDialogOpen(true);
                                                        }, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: t("common.edit") })) }), _jsx(SettingsRow, { label: t("settings.workspace.icon"), action: protectedWorkspace ? undefined : (_jsxs("label", { className: "cursor-pointer", children: [_jsx("input", { type: "file", accept: "image/png,image/jpeg,image/svg+xml,image/webp,image/gif", onChange: handleIconUpload, className: "sr-only", disabled: isUploadingIcon }), _jsx("span", { className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: isUploadingIcon ? t("common.uploading") : t("common.change") })] })), children: _jsx("div", { className: cn('w-6 h-6 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center', 'ring-1 ring-border/50'), children: isUploadingIcon ? (_jsx(Spinner, { className: "text-muted-foreground text-[8px]" })) : wsIconUrl ? (_jsx("img", { src: wsIconUrl, alt: "", className: "w-full h-full object-cover" })) : (_jsx("span", { className: "text-xs font-medium text-muted-foreground", children: (protectedWorkspace ? workspaceDisplayName : wsName)?.charAt(0)?.toUpperCase() || 'W' })) }) })] }), !protectedWorkspace && (_jsx(RenameDialog, { open: renameDialogOpen, onOpenChange: setRenameDialogOpen, title: t("settings.workspace.renameWorkspace"), value: wsNameEditing, onValueChange: setWsNameEditing, onSubmit: () => {
                                                const newName = wsNameEditing.trim();
                                                if (newName && newName !== wsName) {
                                                    setWsName(newName);
                                                    updateWorkspaceSetting('name', newName);
                                                    onRefreshWorkspaces?.();
                                                }
                                                setRenameDialogOpen(false);
                                            }, placeholder: t("settings.workspace.enterWorkspaceName") }))] }), _jsx(SettingsSection, { title: t("settings.workspace.permissionsSection"), children: _jsx(SettingsCard, { children: _jsx(SettingsMenuSelectRow, { label: t("settings.qwen.general.toolApprovalMode"), description: t("settings.qwen.general.toolApprovalModeDesc"), value: permissionMode, onValueChange: (v) => handlePermissionModeChange(v), options: [
                                                { value: 'allow-all', label: t("mode.allow-all"), description: t("mode.yoloDesc") },
                                                { value: 'safe', label: t("mode.safe"), description: t("mode.planDesc") },
                                                { value: 'ask', label: t("mode.ask"), description: t("mode.askDesc") },
                                                { value: 'auto-edit', label: t("mode.auto-edit"), description: t("mode.autoEditDesc") },
                                            ] }) }) }), _jsxs(SettingsSection, { title: t("settings.workspace.modeCycling"), description: t("settings.workspace.modeCyclingDesc"), children: [_jsx(SettingsCard, { children: PERMISSION_MODE_ORDER.map((m) => {
                                                const modeTranslations = {
                                                    'allow-all': { label: t("mode.allow-all"), desc: t("mode.yoloFullDesc") },
                                                    'safe': { label: t("mode.safe"), desc: t("mode.planFullDesc") },
                                                    'ask': { label: t("mode.askToEdit"), desc: t("mode.askFullDesc") },
                                                    'auto-edit': { label: t("mode.auto-edit"), desc: t("mode.autoEditFullDesc") },
                                                };
                                                const isEnabled = enabledModes.includes(m);
                                                return (_jsx(SettingsToggle, { label: modeTranslations[m].label, description: modeTranslations[m].desc, checked: isEnabled, onCheckedChange: (checked) => handleModeToggle(m, checked) }, m));
                                            }) }), _jsx(AnimatePresence, { children: modeCyclingError && (_jsx(motion.p, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }, className: "text-xs text-destructive mt-1 overflow-hidden", children: modeCyclingError })) })] }), _jsx(SettingsSection, { title: t("settings.workspace.defaultSources"), description: t("settings.workspace.defaultSourcesDesc"), children: availableSources.length > 0 ? (_jsx(SettingsCard, { children: availableSources.map((source) => (_jsx(SettingsToggle, { label: _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(SourceAvatar, { source: source, size: "xs" }), source.config.name] }), description: source.config.tagline, checked: enabledSourceSlugs.includes(source.config.slug), onCheckedChange: (checked) => handleSourceToggle(source.config.slug, checked) }, source.config.slug))) })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: t("settings.workspace.noSourcesConfigured") })) }), _jsx(SettingsSection, { title: t("settings.workspace.advanced"), children: _jsxs(SettingsCard, { children: [_jsx(SettingsRow, { label: t("settings.workspace.defaultWorkingDir"), description: workingDirectory || t("settings.workspace.defaultWorkingDirDesc"), action: protectedWorkspace ? undefined : (_jsxs("div", { className: "flex items-center gap-2", children: [workingDirectory && (_jsx("button", { type: "button", onClick: handleClearWorkingDirectory, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors text-foreground/60 hover:text-foreground", children: t("common.clear") })), _jsx("button", { type: "button", onClick: handleChangeWorkingDirectory, className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: t("common.change") })] })) }), _jsx(SettingsToggle, { label: t("settings.workspace.localMcpServers"), description: t("settings.workspace.localMcpServersDesc"), checked: localMcpEnabled, onCheckedChange: handleLocalMcpEnabledChange })] }) })] }) }) }) }), _jsx(ServerDirectoryBrowser, { open: showWdBrowser, mode: wdBrowserMode, onSelect: confirmWdBrowser, onCancel: cancelWdBrowser, initialPath: workingDirectory || undefined })] }));
}
//# sourceMappingURL=WorkspaceSettingsPage.js.map