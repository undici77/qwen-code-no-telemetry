import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useContext, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { AuthType, ModelSlashCommandEvent, logModelSlashCommand, MAINLINE_CODER_MODEL, resolveModelId, } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
import { DescriptiveRadioButtonSelect } from './shared/DescriptiveRadioButtonSelect.js';
import { ConfigContext } from '../contexts/ConfigContext.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { getPersistScopeForModelSelection } from '../../config/modelProvidersScope.js';
import { t } from '../../i18n/index.js';
function formatModalities(modalities) {
    if (!modalities)
        return t('text-only');
    const parts = [];
    if (modalities.image)
        parts.push(t('image'));
    if (modalities.pdf)
        parts.push(t('pdf'));
    if (modalities.audio)
        parts.push(t('audio'));
    if (modalities.video)
        parts.push(t('video'));
    if (parts.length === 0)
        return t('text-only');
    return `${t('text')} · ${parts.join(' · ')}`;
}
/**
 * Build a unique selection key for a model entry in the model dialog.
 * When baseUrl is present, it's appended after a \0 separator to ensure
 * entries with the same model id but different baseUrls get distinct keys.
 */
function buildModelSelectionKey(authType, modelId, baseUrl) {
    const base = `${authType}::${modelId}`;
    return baseUrl ? `${base}\0${baseUrl}` : base;
}
/**
 * Parse a model selection key back into its components.
 */
function parseModelSelectionKey(key) {
    const sep = '::';
    const idx = key.indexOf(sep);
    if (idx < 0)
        return { authType: '', modelId: key };
    const authType = key.slice(0, idx);
    const rest = key.slice(idx + sep.length);
    const nullIdx = rest.indexOf('\0');
    if (nullIdx >= 0) {
        return {
            authType,
            modelId: rest.slice(0, nullIdx),
            baseUrl: rest.slice(nullIdx + 1),
        };
    }
    return { authType, modelId: rest };
}
function maskApiKey(apiKey) {
    if (!apiKey)
        return `(${t('not set')})`;
    const trimmed = apiKey.trim();
    if (trimmed.length === 0)
        return `(${t('not set')})`;
    if (trimmed.length <= 6)
        return '***';
    const head = trimmed.slice(0, 3);
    const tail = trimmed.slice(-4);
    return `${head}…${tail}`;
}
function persistModelSelection(settings, modelId) {
    const scope = getPersistScopeForModelSelection(settings);
    settings.setValue(scope, 'model.name', modelId);
}
function persistAuthTypeSelection(settings, authType) {
    const scope = getPersistScopeForModelSelection(settings);
    settings.setValue(scope, 'security.auth.selectedType', authType);
}
function handleModelSwitchSuccess({ settings, uiState, after, effectiveAuthType, effectiveModelId, isRuntime, }) {
    persistModelSelection(settings, effectiveModelId);
    if (effectiveAuthType) {
        persistAuthTypeSelection(settings, effectiveAuthType);
    }
    const baseUrl = after?.baseUrl ?? t('(default)');
    const maskedKey = maskApiKey(after?.apiKey);
    uiState?.historyManager.addItem({
        type: 'info',
        text: `authType: ${effectiveAuthType ?? `(${t('none')})`}` +
            `\n` +
            `Using ${isRuntime ? 'runtime ' : ''}model: ${effectiveModelId}` +
            `\n` +
            `Base URL: ${baseUrl}` +
            `\n` +
            `API key: ${maskedKey}`,
    }, Date.now());
}
function formatContextWindow(size) {
    if (!size)
        return `(${t('unknown')})`;
    return `${size.toLocaleString('en-US')} tokens`;
}
function DetailRow({ label, value, }) {
    return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 16, flexShrink: 0, children: _jsxs(Text, { color: theme.text.secondary, children: [label, ":"] }) }), _jsx(Box, { flexGrow: 1, flexDirection: "row", flexWrap: "wrap", children: _jsx(Text, { children: value }) })] }));
}
export function ModelDialog({ onClose, isFastModelMode, }) {
    const config = useContext(ConfigContext);
    const uiState = useContext(UIStateContext);
    const settings = useSettings();
    // Local error state for displaying errors within the dialog
    const [errorMessage, setErrorMessage] = useState(null);
    const [highlightedValue, setHighlightedValue] = useState(null);
    const authType = config?.getAuthType();
    const availableModelEntries = useMemo(() => {
        const allModels = config ? config.getAllConfiguredModels() : [];
        // Separate runtime models from registry models
        const runtimeModels = allModels.filter((m) => m.isRuntimeModel);
        const registryModels = allModels.filter((m) => !m.isRuntimeModel);
        // Group registry models by authType
        const modelsByAuthTypeMap = new Map();
        for (const model of registryModels) {
            const authType = model.authType;
            if (!modelsByAuthTypeMap.has(authType)) {
                modelsByAuthTypeMap.set(authType, []);
            }
            modelsByAuthTypeMap.get(authType).push(model);
        }
        // Fixed order: qwen-oauth first, then others in a stable order
        const authTypeOrder = [
            AuthType.QWEN_OAUTH,
            AuthType.USE_OPENAI,
            AuthType.USE_ANTHROPIC,
            AuthType.USE_GEMINI,
            AuthType.USE_VERTEX_AI,
        ];
        // Filter to only include authTypes that have registry models and maintain order
        const availableAuthTypes = new Set(modelsByAuthTypeMap.keys());
        const orderedAuthTypes = authTypeOrder.filter((t) => availableAuthTypes.has(t));
        // Build ordered list: runtime models first, then registry models grouped by authType
        const result = [];
        // Add all runtime models first
        for (const runtimeModel of runtimeModels) {
            result.push({
                authType: runtimeModel.authType,
                model: runtimeModel,
                isRuntime: true,
                snapshotId: runtimeModel.runtimeSnapshotId,
            });
        }
        // Add registry models grouped by authType
        for (const t of orderedAuthTypes) {
            for (const model of modelsByAuthTypeMap.get(t) ?? []) {
                result.push({ authType: t, model, isRuntime: false });
            }
        }
        return result;
    }, [config]);
    const MODEL_OPTIONS = useMemo(() => availableModelEntries.map(({ authType: t2, model, isRuntime, snapshotId }) => {
        const value = isRuntime && snapshotId
            ? snapshotId
            : buildModelSelectionKey(t2, model.id, model.baseUrl);
        const isQwenOAuth = t2 === AuthType.QWEN_OAUTH;
        const title = (_jsxs(Text, { children: [_jsxs(Text, { bold: true, color: isQwenOAuth
                        ? theme.status.warning
                        : isRuntime
                            ? theme.status.warning
                            : theme.text.accent, children: ["[", t2, "]"] }), _jsx(Text, { children: ` ${model.label}` }), isRuntime && (_jsx(Text, { color: theme.status.warning, children: " (Runtime)" })), isQwenOAuth && !isRuntime && (_jsxs(Text, { color: theme.status.warning, children: [" (", t('Discontinued'), ")"] }))] }));
        // Include runtime / discontinued indicator in description
        let description = model.description || '';
        if (isRuntime) {
            description = description
                ? `${description} (Runtime)`
                : 'Runtime model';
        }
        if (isQwenOAuth && !isRuntime) {
            description = t('Discontinued — switch to Coding Plan or API Key');
        }
        return {
            value,
            title,
            description,
            key: value,
        };
    }), [availableModelEntries]);
    // In fast model mode, default to the currently configured fast model
    const fastModelSetting = settings?.merged?.fastModel;
    const parsedFastModelSetting = useMemo(() => {
        if (!isFastModelMode)
            return undefined;
        try {
            return resolveModelId(fastModelSetting);
        }
        catch {
            return undefined;
        }
    }, [fastModelSetting, isFastModelMode]);
    const preferredModelId = isFastModelMode && parsedFastModelSetting
        ? parsedFastModelSetting.modelId
        : config?.getModel() || MAINLINE_CODER_MODEL;
    // Check if current model is a runtime model
    // Runtime snapshot ID is already in $runtime|${authType}|${modelId} format
    const activeRuntimeSnapshot = isFastModelMode
        ? undefined // fast model is never a runtime model
        : config?.getActiveRuntimeModelSnapshot?.();
    const currentBaseUrl = config
        ?.getModelsConfig()
        .getGenerationConfig()?.baseUrl;
    // When `/model --fast <bare-id>` validated the model across all providers,
    // the setting persists as a bare model ID (no authType prefix) so that
    // runtime cross-auth lookups still work. Highlight the row that owns it
    // regardless of which provider that turns out to be — otherwise the
    // dialog would default to the current auth's first row and Enter would
    // silently overwrite the user's fast-model setting.
    const preferredFastModelEntry = isFastModelMode && parsedFastModelSetting
        ? parsedFastModelSetting.authType
            ? availableModelEntries.find(({ authType: t2, model }) => t2 === parsedFastModelSetting.authType &&
                model.id === parsedFastModelSetting.modelId)
            : availableModelEntries.find(({ model }) => model.id === parsedFastModelSetting.modelId)
        : undefined;
    const preferredKey = activeRuntimeSnapshot
        ? activeRuntimeSnapshot.id
        : preferredFastModelEntry
            ? buildModelSelectionKey(preferredFastModelEntry.authType, preferredFastModelEntry.model.id, preferredFastModelEntry.model.baseUrl)
            : authType
                ? buildModelSelectionKey(authType, preferredModelId, currentBaseUrl)
                : '';
    useKeypress((key) => {
        if (key.name === 'escape' || (key.name === 'left' && isFastModelMode)) {
            onClose();
        }
    }, { isActive: true });
    const initialIndex = useMemo(() => {
        const index = MODEL_OPTIONS.findIndex((option) => option.value === preferredKey);
        return index === -1 ? 0 : index;
    }, [MODEL_OPTIONS, preferredKey]);
    const handleHighlight = useCallback((value) => {
        setHighlightedValue(value);
    }, []);
    const highlightedEntry = useMemo(() => {
        const key = highlightedValue ?? preferredKey;
        return availableModelEntries.find(({ authType: t2, model, isRuntime, snapshotId }) => {
            const v = isRuntime && snapshotId
                ? snapshotId
                : buildModelSelectionKey(t2, model.id, model.baseUrl);
            return v === key;
        });
    }, [highlightedValue, preferredKey, availableModelEntries]);
    const handleSelect = useCallback(async (selected) => {
        setErrorMessage(null);
        // Fast model mode: save authType:modelId so duplicate model ids across
        // providers remain unambiguous. baseUrl is intentionally discarded.
        if (isFastModelMode) {
            let fastModel;
            if (selected.includes('::')) {
                const parsed = parseModelSelectionKey(selected);
                fastModel = `${parsed.authType}:${parsed.modelId}`;
            }
            else if (selected.startsWith('$runtime|')) {
                const parts = selected.split('|');
                fastModel =
                    parts[1] && parts[2] ? `${parts[1]}:${parts[2]}` : selected;
            }
            else {
                fastModel = selected;
            }
            const scope = getPersistScopeForModelSelection(settings);
            settings.setValue(scope, 'fastModel', fastModel);
            // Sync the runtime Config so forked agents pick up the change immediately.
            config?.setFastModel(fastModel);
            uiState?.historyManager.addItem({
                type: 'success',
                text: `${t('Fast Model')}: ${fastModel}`,
            }, Date.now());
            onClose();
            return;
        }
        // Block selection of discontinued qwen-oauth models
        // (only block non-runtime OAuth; runtime OAuth models from existing
        //  cached tokens are still allowed to work until the server rejects them)
        const isQwenOAuthSelection = selected.startsWith(`${AuthType.QWEN_OAUTH}::`) ||
            (selected.startsWith('$runtime|') &&
                selected.split('|')[1] === AuthType.QWEN_OAUTH);
        const isRuntimeOAuthSelection = selected.startsWith(`$runtime|${AuthType.QWEN_OAUTH}|`);
        if (isQwenOAuthSelection && !isRuntimeOAuthSelection) {
            setErrorMessage(t('Qwen OAuth free tier was discontinued on 2026-04-15. Please select a model from another provider or run /auth to switch.'));
            return;
        }
        let after;
        let effectiveAuthType;
        let effectiveModelId = selected;
        let isRuntime = false;
        if (!config) {
            onClose();
            return;
        }
        try {
            // Determine if this is a runtime model selection
            // Runtime model format: $runtime|${authType}|${modelId}
            isRuntime = selected.startsWith('$runtime|');
            let selectedAuthType;
            let modelId;
            let selectedBaseUrl;
            if (isRuntime) {
                // For runtime models, extract authType from the snapshot ID
                // Format: $runtime|${authType}|${modelId}
                const parts = selected.split('|');
                if (parts.length >= 2 && parts[0] === '$runtime') {
                    selectedAuthType = parts[1];
                }
                else {
                    selectedAuthType = authType;
                }
                modelId = selected; // Pass the full snapshot ID to switchModel
            }
            else {
                const parsed = parseModelSelectionKey(selected);
                selectedAuthType = (parsed.authType || authType);
                modelId = parsed.modelId;
                selectedBaseUrl = parsed.baseUrl;
            }
            await config.switchModel(selectedAuthType, modelId, {
                ...(selectedAuthType !== authType &&
                    selectedAuthType === AuthType.QWEN_OAUTH
                    ? { requireCachedCredentials: true }
                    : {}),
                baseUrl: selectedBaseUrl,
            });
            if (!isRuntime) {
                const event = new ModelSlashCommandEvent(modelId);
                logModelSlashCommand(config, event);
            }
            after = config.getContentGeneratorConfig?.();
            effectiveAuthType = after?.authType ?? selectedAuthType ?? authType;
            effectiveModelId = after?.model ?? modelId;
        }
        catch (e) {
            const baseErrorMessage = e instanceof Error ? e.message : String(e);
            const errorPrefix = isRuntime
                ? 'Failed to switch to runtime model.'
                : `Failed to switch model to '${effectiveModelId ?? selected}'.`;
            setErrorMessage(`${errorPrefix}\n\n${baseErrorMessage}`);
            return;
        }
        handleModelSwitchSuccess({
            settings,
            uiState,
            after,
            effectiveAuthType,
            effectiveModelId,
            isRuntime,
        });
        onClose();
    }, [
        authType,
        config,
        onClose,
        settings,
        uiState,
        setErrorMessage,
        isFastModelMode,
    ]);
    const hasModels = MODEL_OPTIONS.length > 0;
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Select Model') }), !hasModels ? (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.status.warning, children: t('No models available for the current authentication type ({{authType}}).', {
                            authType: authType ? String(authType) : t('(none)'),
                        }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Please configure models in settings.modelProviders or use environment variables.') }) })] })) : (_jsx(Box, { marginTop: 1, children: _jsx(DescriptiveRadioButtonSelect, { items: MODEL_OPTIONS, onSelect: handleSelect, onHighlight: handleHighlight, initialIndex: initialIndex, showNumbers: true }) })), highlightedEntry && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { borderStyle: "single", borderTop: true, borderBottom: false, borderLeft: false, borderRight: false, borderColor: theme.border.default }), highlightedEntry.authType === AuthType.QWEN_OAUTH &&
                        !highlightedEntry.isRuntime && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.status.warning, children: ["\u26A0 ", t('Discontinued — switch to Coding Plan or API Key')] }) })), _jsx(DetailRow, { label: t('Modality'), value: formatModalities(highlightedEntry.model.modalities) }), _jsx(DetailRow, { label: t('Context Window'), value: formatContextWindow(highlightedEntry.model.contextWindowSize) }), highlightedEntry.authType !== AuthType.QWEN_OAUTH && (_jsxs(_Fragment, { children: [_jsx(DetailRow, { label: "Base URL", value: highlightedEntry.model.baseUrl ?? t('(default)') }), _jsx(DetailRow, { label: "API Key", value: highlightedEntry.model.envKey ?? t('(not set)') })] }))] })), errorMessage && (_jsx(Box, { marginTop: 1, flexDirection: "column", paddingX: 1, children: _jsxs(Text, { color: theme.status.error, wrap: "wrap", children: ["\u2715 ", errorMessage] }) })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to select, ↑↓ to navigate, Esc to close') }) })] }));
}
//# sourceMappingURL=ModelDialog.js.map