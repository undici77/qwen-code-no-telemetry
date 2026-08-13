import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AppearanceSettingsPage
 *
 * Visual customization settings: theme mode, color theme, font,
 * workspace-specific theme overrides, and CLI tool icon mappings.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@craft-agent/shared/i18n';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover';
import { useTheme } from '@/context/ThemeContext';
import { useAppShellContext } from '@/context/AppShellContext';
import { routes } from '@/lib/navigate';
import { FolderOpen, Monitor, RefreshCw, Sun, Moon } from 'lucide-react';
import { SettingsSection, SettingsCard, SettingsRow, SettingsSegmentedControl, SettingsMenuSelect, SettingsToggle, } from '@/components/settings';
import { usePetCompanion } from '@/pets/usePetCompanion';
import { QwenPet } from '@/components/pet/QwenPet';
import { useWorkspaceIcons } from '@/hooks/useWorkspaceIcon';
import { Info_DataTable, SortableHeader } from '@/components/info/Info_DataTable';
import { Info_Badge } from '@/components/info/Info_Badge';
import { getWorkspaceDisplayName } from '@/utils/workspace';
export const meta = {
    navigator: 'settings',
    slug: 'appearance',
};
// ============================================
// Tool Icons Table
// ============================================
/**
 * Column definitions for the tool icon mappings table.
 * Shows a preview icon, tool name, and the CLI commands that trigger it.
 */
const getToolIconColumns = (t) => [
    {
        accessorKey: 'iconDataUrl',
        header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("settings.appearance.iconHeader") }),
        cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5", children: _jsx("img", { src: row.original.iconDataUrl, alt: row.original.displayName, className: "w-5 h-5 object-contain" }) })),
        size: 60,
        enableSorting: false,
    },
    {
        accessorKey: 'displayName',
        header: ({ column }) => _jsx(SortableHeader, { column: column, title: t("settings.appearance.toolHeader") }),
        cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 font-medium", children: row.original.displayName })),
        size: 150,
    },
    {
        accessorKey: 'commands',
        header: () => _jsx("span", { className: "p-1.5 pl-2.5", children: t("settings.appearance.commandsHeader") }),
        cell: ({ row }) => (_jsx("div", { className: "p-1.5 pl-2.5 flex flex-wrap gap-1", children: row.original.commands.map(cmd => (_jsx(Info_Badge, { color: "muted", className: "font-mono", children: cmd }, cmd))) })),
        meta: { fillWidth: true },
        enableSorting: false,
    },
];
// ============================================
// Main Component
// ============================================
export default function AppearanceSettingsPage() {
    const { t, i18n } = useTranslation();
    const toolIconColumns = useMemo(() => getToolIconColumns(t), [t]);
    const { mode, setMode, colorTheme, setColorTheme, font, setFont, activeWorkspaceId, setWorkspaceColorTheme, themeLoadError, themeResolvedFrom, } = useTheme();
    const { workspaces } = useAppShellContext();
    // Fetch workspace icons as data URLs (file:// URLs don't work in renderer)
    const workspaceIconMap = useWorkspaceIcons(workspaces);
    // Preset themes for the color theme dropdown
    const [presetThemes, setPresetThemes] = useState([]);
    // Per-workspace theme overrides (workspaceId -> themeId or undefined)
    const [workspaceThemes, setWorkspaceThemes] = useState({});
    // Tool icon mappings loaded from main process
    const [toolIcons, setToolIcons] = useState([]);
    // Resolved path to tool-icons.json (needed for EditPopover and "Edit File" action)
    const [toolIconsJsonPath, setToolIconsJsonPath] = useState(null);
    // Rich tool descriptions toggle (persisted in config.json, read by SDK subprocess)
    const [richToolDescriptions, setRichToolDescriptions] = useState(true);
    useEffect(() => {
        window.electronAPI?.getRichToolDescriptions?.().then(setRichToolDescriptions);
    }, []);
    const handleRichToolDescriptionsChange = useCallback(async (checked) => {
        setRichToolDescriptions(checked);
        await window.electronAPI?.setRichToolDescriptions?.(checked);
    }, []);
    // Pet companion settings + custom pets (synced via shared Jotai atoms)
    const { pets, selectedPetId, setSelectedPetId, petEnabled, setPetEnabled, refreshCustomPets, } = usePetCompanion();
    const [petsFolder, setPetsFolder] = useState(null);
    useEffect(() => {
        window.electronAPI?.getHomeDir?.().then((home) => setPetsFolder(`${home}/.qwen/pets`));
    }, []);
    const handleOpenPetsFolder = useCallback(async () => {
        try {
            const path = await window.electronAPI?.openPetsFolder?.();
            if (path)
                setPetsFolder(path);
        }
        catch {
            // Keep the settings page usable if the OS folder open request fails.
        }
    }, []);
    // Load preset themes on mount
    useEffect(() => {
        const loadThemes = async () => {
            if (!window.electronAPI) {
                setPresetThemes([]);
                return;
            }
            try {
                const themes = await window.electronAPI.loadPresetThemes();
                setPresetThemes(themes);
            }
            catch (error) {
                console.error('Failed to load preset themes:', error);
                setPresetThemes([]);
            }
        };
        loadThemes();
    }, []);
    // Load workspace themes on mount
    useEffect(() => {
        const loadWorkspaceThemes = async () => {
            if (!window.electronAPI?.getAllWorkspaceThemes)
                return;
            try {
                const themes = await window.electronAPI.getAllWorkspaceThemes();
                setWorkspaceThemes(themes);
            }
            catch (error) {
                console.error('Failed to load workspace themes:', error);
            }
        };
        loadWorkspaceThemes();
    }, []);
    // Load tool icon mappings and resolve the config file path on mount
    useEffect(() => {
        const load = async () => {
            if (!window.electronAPI)
                return;
            try {
                const [mappings, homeDir] = await Promise.all([
                    window.electronAPI.getToolIconMappings(),
                    window.electronAPI.getHomeDir(),
                ]);
                setToolIcons(mappings.filter(mapping => mapping.id !== 'craft-agent'));
                setToolIconsJsonPath(`${homeDir}/.craft-agent/tool-icons/tool-icons.json`);
            }
            catch (error) {
                console.error('Failed to load tool icon mappings:', error);
            }
        };
        load();
    }, []);
    // Handler for workspace theme change
    // Uses ThemeContext for the active workspace (immediate visual update) and IPC for other workspaces
    const handleWorkspaceThemeChange = useCallback(async (workspaceId, value) => {
        // 'default' means inherit from app default (null in storage)
        const themeId = value === 'default' ? null : value;
        // If changing the current workspace, use context for immediate update
        if (workspaceId === activeWorkspaceId) {
            setWorkspaceColorTheme(themeId);
        }
        else {
            // For other workspaces, just persist via IPC
            await window.electronAPI?.setWorkspaceColorTheme?.(workspaceId, themeId);
        }
        // Update local state for UI
        setWorkspaceThemes(prev => ({
            ...prev,
            [workspaceId]: themeId ?? undefined
        }));
    }, [activeWorkspaceId, setWorkspaceColorTheme]);
    // Theme options for dropdowns
    const themeOptions = useMemo(() => [
        { value: 'default', label: t("settings.appearance.useDefault") },
        ...presetThemes
            .filter(t => t.id !== 'default')
            .map(t => ({
            value: t.id,
            label: t.theme.name || t.id,
        })),
    ], [presetThemes, t]);
    // Get current app default theme label for display (null when using 'default' to avoid redundant "Use Default (Default)")
    const appDefaultLabel = useMemo(() => {
        if (colorTheme === 'default')
            return null;
        const preset = presetThemes.find(t => t.id === colorTheme);
        return preset?.theme.name || colorTheme;
    }, [colorTheme, presetThemes]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.appearance.title"), actions: _jsx(HeaderMenu, { route: routes.view.settings('appearance'), helpFeature: "themes" }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsxs(SettingsSection, { title: t("settings.appearance.defaultTheme"), children: [_jsxs(SettingsCard, { children: [_jsx(SettingsRow, { label: t("settings.appearance.mode"), children: _jsx(SettingsSegmentedControl, { value: mode, onValueChange: setMode, options: [
                                                            { value: 'system', label: t("settings.appearance.system"), icon: _jsx(Monitor, { className: "w-4 h-4" }) },
                                                            { value: 'light', label: t("settings.appearance.light"), icon: _jsx(Sun, { className: "w-4 h-4" }) },
                                                            { value: 'dark', label: t("settings.appearance.dark"), icon: _jsx(Moon, { className: "w-4 h-4" }) },
                                                        ] }) }), _jsx(SettingsRow, { label: t("settings.appearance.colorTheme"), children: _jsx(SettingsMenuSelect, { value: colorTheme, onValueChange: setColorTheme, options: themeOptions }) }), _jsx(SettingsRow, { label: t("settings.appearance.font"), children: _jsx(SettingsSegmentedControl, { value: font, onValueChange: setFont, options: [
                                                            { value: 'inter', label: t("settings.appearance.fontInter") },
                                                            { value: 'system', label: t("settings.appearance.fontSystem") },
                                                        ] }) }), _jsx(SettingsRow, { label: t("settings.appearance.language"), children: _jsx(SettingsMenuSelect, { value: (i18n.resolvedLanguage ?? i18n.language), onValueChange: (value) => {
                                                            i18n.changeLanguage(value);
                                                            window.electronAPI?.changeLanguage?.(value);
                                                        }, options: Object.entries(LANGUAGES).map(([code, config]) => ({
                                                            value: code,
                                                            label: config.nativeName,
                                                        })) }) })] }), themeLoadError && (_jsxs("p", { className: "mt-2 text-xs text-info", children: [t("settings.appearance.themeWarning"), " ", themeLoadError, " (", themeResolvedFrom === 'fallback' ? t("settings.appearance.usingBundledFallback") : t("settings.appearance.usingDefaultTheme"), ")"] }))] }), workspaces.length > 0 && (_jsx(SettingsSection, { title: t("settings.appearance.workspaceThemes"), description: t("settings.appearance.workspaceThemesDesc"), children: _jsx(SettingsCard, { children: workspaces.map((workspace) => {
                                            const wsTheme = workspaceThemes[workspace.id];
                                            const hasCustomTheme = wsTheme !== undefined;
                                            const displayName = getWorkspaceDisplayName(workspace, t);
                                            return (_jsx(SettingsRow, { label: _jsxs("div", { className: "flex items-center gap-2", children: [workspaceIconMap.get(workspace.id) ? (_jsx("img", { src: workspaceIconMap.get(workspace.id), alt: "", className: "w-4 h-4 rounded object-cover" })) : (_jsx("div", { className: "w-4 h-4 rounded bg-foreground/10" })), _jsx("span", { children: displayName })] }), children: _jsx(SettingsMenuSelect, { value: hasCustomTheme ? wsTheme : 'default', onValueChange: (value) => handleWorkspaceThemeChange(workspace.id, value), options: [
                                                        { value: 'default', label: appDefaultLabel ? t("settings.appearance.useDefaultWithTheme", { theme: appDefaultLabel }) : t("settings.appearance.useDefault") },
                                                        ...presetThemes
                                                            .filter(t => t.id !== 'default')
                                                            .map(t => ({
                                                            value: t.id,
                                                            label: t.theme.name || t.id,
                                                        })),
                                                    ] }) }, workspace.id));
                                        }) }) })), _jsx(SettingsSection, { title: t("settings.appearance.interface"), children: _jsx(SettingsCard, { children: _jsx(SettingsToggle, { label: t("settings.appearance.richToolDescriptions"), description: t("settings.appearance.richToolDescriptionsDesc"), checked: richToolDescriptions, onCheckedChange: handleRichToolDescriptionsChange }) }) }), _jsx(SettingsSection, { title: t("settings.appearance.pet"), description: t("settings.appearance.petDesc"), children: _jsxs(SettingsCard, { children: [_jsx(SettingsToggle, { label: t("settings.appearance.petEnabled"), description: t("settings.appearance.petEnabledDesc"), checked: petEnabled, onCheckedChange: setPetEnabled }), petEnabled && pets.map((pet) => (_jsx(SettingsRow, { label: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/[0.04]", children: _jsx(QwenPet, { spritesheetUrl: pet.spritesheetUrl, state: "idle", size: 40 }) }), _jsxs("div", { className: "space-y-0.5", children: [_jsx("div", { className: "text-sm font-medium", children: pet.displayName }), _jsx("div", { className: "text-sm text-muted-foreground", children: pet.description })] })] }), action: selectedPetId === pet.id ? (_jsx("span", { className: "px-3 text-sm text-muted-foreground", children: t("settings.appearance.petSelected") })) : (_jsx("button", { type: "button", onClick: () => setSelectedPetId(pet.id), className: "inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: t("settings.appearance.petSelect") })) }, pet.id))), petEnabled && (_jsx(SettingsRow, { label: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { children: t("settings.appearance.petCustom") }), _jsx("div", { className: "text-xs font-normal leading-4 text-muted-foreground", children: t("settings.appearance.petCustomHint") })] }), description: petsFolder ?? '~/.qwen/pets', action: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { type: "button", onClick: handleOpenPetsFolder, className: "inline-flex items-center h-8 gap-1.5 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: [_jsx(FolderOpen, { className: "h-3.5 w-3.5" }), t("settings.appearance.petOpenFolder")] }), _jsxs("button", { type: "button", onClick: () => { void refreshCustomPets(); }, className: "inline-flex items-center h-8 gap-1.5 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors", children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), t("settings.appearance.petRefresh")] })] }) }))] }) }), _jsx(SettingsSection, { title: t("settings.appearance.toolIcons"), description: t("settings.appearance.toolIconsDesc"), action: toolIconsJsonPath ? (_jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('edit-tool-icons', toolIconsJsonPath), secondaryAction: {
                                            label: t("settings.appearance.editFile"),
                                            filePath: toolIconsJsonPath,
                                        } })) : undefined, children: _jsx(SettingsCard, { children: _jsx(Info_DataTable, { columns: toolIconColumns, data: toolIcons, searchable: { placeholder: t("settings.appearance.searchTools") }, maxHeight: 480, emptyContent: t("settings.appearance.noToolIcons") }) }) })] }) }) }) })] }));
}
//# sourceMappingURL=AppearanceSettingsPage.js.map