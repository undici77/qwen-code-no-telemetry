import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * LabelsSettingsPage
 *
 * Displays workspace label configuration in two data tables:
 * 1. Label Hierarchy - tree table with expand/collapse showing all labels
 * 2. Auto-Apply Rules - flat table showing all regex rules across labels
 *
 * Each section has an Edit button that opens an EditPopover for AI-assisted editing
 * of the underlying labels/config.json file.
 *
 * Data is loaded via the useLabels hook which subscribes to live config changes.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover';
import { getDocUrl } from '@craft-agent/shared/docs/doc-links';
import { Loader2 } from 'lucide-react';
import { useAppShellContext, useActiveWorkspace } from '@/context/AppShellContext';
import { useLabels } from '@/hooks/useLabels';
import { LabelsDataTable, AutoRulesDataTable, } from '@/components/info';
import { SettingsSection, SettingsCard, } from '@/components/settings';
import { routes } from '@/lib/navigate';
export const meta = {
    navigator: 'settings',
    slug: 'labels',
};
export default function LabelsSettingsPage() {
    const { t } = useTranslation();
    const { activeWorkspaceId } = useAppShellContext();
    const activeWorkspace = useActiveWorkspace();
    const { labels, isLoading } = useLabels(activeWorkspaceId);
    // Resolve edit configs using the workspace root path
    const rootPath = activeWorkspace?.rootPath || '';
    const labelsEditConfig = getEditConfig('edit-labels', rootPath);
    const autoRulesEditConfig = getEditConfig('edit-auto-rules', rootPath);
    // Secondary action: open the labels config file directly in system editor
    const editFileAction = rootPath ? {
        label: t("common.editFile"),
        filePath: `${rootPath}/labels/config.json`,
    } : undefined;
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.labels.title"), actions: _jsx(HeaderMenu, { route: routes.view.settings('labels') }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsx("div", { className: "space-y-8", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) })) : (_jsxs(_Fragment, { children: [_jsx(SettingsSection, { title: t("settings.labels.aboutLabels"), children: _jsx(SettingsCard, { className: "px-4 py-3.5", children: _jsxs("div", { className: "text-sm text-muted-foreground leading-relaxed space-y-1.5", children: [_jsx("p", { children: t("settings.labels.aboutText1") }), _jsx("p", { children: t("settings.labels.aboutText2") }), _jsx("p", { children: t("settings.labels.aboutText3") }), _jsx("p", { children: _jsx("button", { type: "button", onClick: () => window.electronAPI?.openUrl(getDocUrl('labels')), className: "text-foreground/70 hover:text-foreground underline underline-offset-2", children: t("chat.learnMore") }) })] }) }) }), _jsx(SettingsSection, { title: t("settings.labels.labelHierarchy"), description: t("settings.labels.labelHierarchyDesc"), action: _jsx(EditPopover, { trigger: _jsx(EditButton, {}), context: labelsEditConfig.context, example: labelsEditConfig.example, displayLabel: labelsEditConfig.displayLabel, model: labelsEditConfig.model, systemPromptPreset: labelsEditConfig.systemPromptPreset, secondaryAction: editFileAction }), children: _jsx(SettingsCard, { className: "p-0", children: labels.length > 0 ? (_jsx(LabelsDataTable, { data: labels, searchable: true, maxHeight: 350, fullscreen: true, fullscreenTitle: t("settings.labels.labelHierarchy") })) : (_jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [_jsx("p", { className: "text-sm", children: t("settings.labels.noLabels") }), _jsx("p", { className: "text-xs mt-1 text-foreground/40", children: t("settings.labels.noLabelsDesc") })] })) }) }), _jsx(SettingsSection, { title: t("settings.labels.autoApplyRules"), description: t("settings.labels.autoApplyRulesDesc"), action: _jsx(EditPopover, { trigger: _jsx(EditButton, {}), context: autoRulesEditConfig.context, example: autoRulesEditConfig.example, displayLabel: autoRulesEditConfig.displayLabel, model: autoRulesEditConfig.model, systemPromptPreset: autoRulesEditConfig.systemPromptPreset, secondaryAction: editFileAction }), children: _jsx(SettingsCard, { className: "p-0", children: _jsx(AutoRulesDataTable, { data: labels, searchable: true, maxHeight: 350, fullscreen: true, fullscreenTitle: t("settings.labels.autoApplyRules") }) }) })] })) }) }) }) })] }));
}
//# sourceMappingURL=LabelsSettingsPage.js.map