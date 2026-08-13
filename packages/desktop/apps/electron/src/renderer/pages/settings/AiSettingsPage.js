import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AiSettingsPage
 *
 * The local ACP backend is the only supported backend. This page focuses on the
 * settings users can still change: model and provider connection.
 */
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigate';
import { useAppShellContext } from '@/context/AppShellContext';
import { ProviderConnectDialog } from '@/components/apisetup';
import { SettingsSection, SettingsCard, SettingsRow, SettingsMenuSelectRow, } from '@/components/settings';
import { getModelShortName } from '@config/models';
export const meta = {
    navigator: 'settings',
    slug: 'ai',
};
function getModelOptionsForConnection(connection) {
    if (!connection)
        return [];
    if (connection.models && connection.models.length > 0) {
        return connection.models.map((model) => {
            if (typeof model === 'string') {
                return { value: model, label: getModelShortName(model) };
            }
            const definition = model;
            return {
                value: definition.id,
                label: definition.name,
                description: definition.description,
                descriptionKey: definition.descriptionKey,
            };
        });
    }
    if (connection.defaultModel) {
        return [
            {
                value: connection.defaultModel,
                label: getModelShortName(connection.defaultModel),
            },
        ];
    }
    return [];
}
export default function AiSettingsPage() {
    const { t } = useTranslation();
    const { llmConnections, refreshLlmConnections } = useAppShellContext();
    const [providerDialogOpen, setProviderDialogOpen] = useState(false);
    const qwenConnection = useMemo(() => llmConnections.find((connection) => connection.providerType === 'qwen') ??
        llmConnections[0], [llmConnections]);
    const modelOptions = useMemo(() => getModelOptionsForConnection(qwenConnection).map((option) => ({
        ...option,
        description: option.descriptionKey
            ? t(option.descriptionKey)
            : option.description,
    })), [qwenConnection, t]);
    const defaultModel = qwenConnection?.defaultModel || modelOptions[0]?.value || '';
    const modelCount = modelOptions.length;
    const providerConnectionLabel = qwenConnection?.providerType === 'qwen'
        ? t('settings.ai.providerConnectionName')
        : qwenConnection?.name || t('settings.ai.providerConnectionName');
    const handleDefaultModelChange = useCallback(async (model) => {
        if (!window.electronAPI || !qwenConnection)
            return;
        const { isAuthenticated: _isAuthenticated, authError: _authError, isDefault: _isDefault, ...connectionData } = {
            ...qwenConnection,
            defaultModel: model,
        };
        await window.electronAPI.saveLlmConnection(connectionData);
        await refreshLlmConnections();
    }, [qwenConnection, refreshLlmConnections]);
    const handleProviderConnected = useCallback(async () => {
        await refreshLlmConnections();
    }, [refreshLlmConnections]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t('settings.ai.title'), actions: _jsx(HeaderMenu, { route: routes.view.settings('ai') }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsx(SettingsSection, { title: t('settings.ai.defaultSection'), description: t('settings.ai.defaultSectionDesc'), children: _jsx(SettingsCard, { children: _jsx(SettingsMenuSelectRow, { label: t('settings.ai.model'), description: t('settings.ai.modelDesc'), value: defaultModel, onValueChange: handleDefaultModelChange, options: modelOptions, disabled: modelOptions.length === 0, placeholder: t('common.loading'), searchable: modelOptions.length > 8 }) }) }), _jsx(SettingsSection, { title: t('settings.ai.modelProvider'), description: t('settings.ai.modelProviderDesc'), children: _jsx(SettingsCard, { children: _jsx(SettingsRow, { label: providerConnectionLabel, description: modelCount > 0
                                                ? t('settings.ai.modelsAvailable', {
                                                    count: modelCount,
                                                })
                                                : t('settings.ai.noProviderModels'), action: _jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => setProviderDialogOpen(true), children: [_jsx(Plus, { className: "size-3.5" }), t('auth.connect')] }) }) }) })] }) }) }) }), _jsx(ProviderConnectDialog, { open: providerDialogOpen, onOpenChange: setProviderDialogOpen, onConnected: handleProviderConnected })] }));
}
//# sourceMappingURL=AiSettingsPage.js.map