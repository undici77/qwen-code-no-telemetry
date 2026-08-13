import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { DescriptiveRadioButtonSelect } from '../components/shared/DescriptiveRadioButtonSelect.js';
import { TextInput } from '../components/shared/TextInput.js';
import { theme } from '../semantic-colors.js';
import { ICON } from '../constants.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
import { AuthType } from '@qwen-code/qwen-code-core';
import { normalizeModelIds } from './useAuth.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const NAV_HINT_SELECT = () => (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme?.text?.secondary, children: t('Enter to select, ↑↓ to navigate, Esc to go back') }) }));
const NAV_HINT_INPUT = () => (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to submit, Esc to go back') }) }));
function resolveDocumentationUrl(config, baseUrl) {
    if (!config.documentationUrl)
        return undefined;
    return typeof config.documentationUrl === 'function'
        ? config.documentationUrl(baseUrl)
        : config.documentationUrl;
}
// ---------------------------------------------------------------------------
// Step: Select BaseURL from options
// ---------------------------------------------------------------------------
function BaseUrlSelectStep({ config, flow, }) {
    const options = config.baseUrl;
    const items = options.map((opt) => ({
        key: opt.id,
        title: t(opt.label),
        label: t(opt.label),
        description: _jsx(Text, { color: theme.text.secondary, children: opt.url }),
        value: opt.url,
    }));
    return (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(DescriptiveRadioButtonSelect, { items: items, initialIndex: flow.state.baseUrlOptionIndex, onSelect: flow.selectBaseUrl, onHighlight: flow.highlightBaseUrl, itemGap: 1 }) }), _jsx(NAV_HINT_SELECT, {})] }));
}
// ---------------------------------------------------------------------------
// Step: Free-form BaseURL input (custom provider)
// ---------------------------------------------------------------------------
function BaseUrlInputStep({ flow, documentationUrl, }) {
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Enter the API endpoint for this protocol.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: flow.state.baseUrl, onChange: flow.changeBaseUrl, onSubmit: flow.submitBaseUrl, placeholder: flow.state.baseUrlPlaceholder || 'https://api.openai.com/v1' }, "base-url-input") }), flow.state.baseUrlError && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: flow.state.baseUrlError }) })), documentationUrl && (_jsx(Box, { marginTop: 1, children: _jsx(Link, { url: documentationUrl, fallback: false, children: _jsx(Text, { color: theme.text.link, children: t('Documentation') }) }) })), _jsx(NAV_HINT_INPUT, {})] }));
}
// ---------------------------------------------------------------------------
// Step: API Key input
// ---------------------------------------------------------------------------
function ApiKeyStep({ config, flow, }) {
    const docUrl = resolveDocumentationUrl(config, flow.state.baseUrl);
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [docUrl && (_jsx(Box, { marginTop: 1, children: _jsx(Link, { url: docUrl, fallback: false, children: _jsxs(Text, { color: theme.text.link, children: [t('Documentation'), ": ", docUrl] }) }) })), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: flow.state.apiKey, onChange: flow.changeApiKey, onSubmit: () => flow.submitApiKey(flow.state.apiKey), placeholder: config.apiKeyPlaceholder ?? 'sk-...' }, "api-key-input") }), flow.state.apiKeyError && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: flow.state.apiKeyError }) })), _jsx(NAV_HINT_INPUT, {})] }));
}
// ---------------------------------------------------------------------------
// Step: Model IDs input
// ---------------------------------------------------------------------------
const MODEL_DESCRIPTION_COLUMN = 28;
const MODALITY_DISPLAY_ORDER = ['image', 'video', 'audio', 'pdf'];
const MODEL_CUSTOM_INPUT_FOCUS_INDEX = -2;
const MODEL_SEARCH_INPUT_FOCUS_INDEX = -1;
const MAX_RECOMMENDED_MODELS_TO_SHOW = 8;
function formatModelOptionLabel(model) {
    const details = [];
    if (model.contextWindowSize) {
        details.push(`${model.contextWindowSize.toLocaleString('en-US')} tokens`);
    }
    if (model.enableThinking) {
        details.push('thinking');
    }
    const modalities = MODALITY_DISPLAY_ORDER.filter((name) => model.modalities?.[name]);
    details.push(['text', ...modalities].join('/'));
    const suffix = details.length > 0 ? ` ${details.join(', ')}` : '';
    return `${model.id.padEnd(MODEL_DESCRIPTION_COLUMN)}${suffix}`;
}
function modelOptionSearchText(item) {
    return `${item.key} ${item.label} ${item.value}`.toLowerCase();
}
function uniqueModelIds(ids) {
    const seen = new Set();
    const unique = [];
    for (const id of ids) {
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        unique.push(id);
    }
    return unique;
}
function mergeModelIds(customModelIdsText, selectedRecommendationKeys) {
    return uniqueModelIds([
        ...normalizeModelIds(customModelIdsText),
        ...selectedRecommendationKeys,
    ]);
}
function getRecommendedSelections(selectedModelIds, modelOptions) {
    const selectedSet = new Set(selectedModelIds);
    return modelOptions
        .filter((item) => selectedSet.has(item.key))
        .map((item) => item.key);
}
function getCustomModelIdsText(selectedModelIds, recommendedModelIds) {
    return selectedModelIds
        .filter((id) => !recommendedModelIds.has(id))
        .join(', ');
}
function ModelIdsStep({ config, flow, }) {
    const defaultIds = config.models?.map((m) => m.id).join(', ') ?? '';
    const hasSelectableModels = (config.models?.length ?? 0) > 0;
    const selectedModelIds = useMemo(() => normalizeModelIds(flow.state.modelIds), [flow.state.modelIds]);
    const modelOptions = useMemo(() => config.models?.map((model) => ({
        key: model.id,
        value: model.id,
        label: formatModelOptionLabel(model),
    })) ?? [], [config.models]);
    const recommendedModelIds = useMemo(() => new Set(modelOptions.map((item) => item.key)), [modelOptions]);
    const [focusedModelIndex, setFocusedModelIndex] = useState(MODEL_CUSTOM_INPUT_FOCUS_INDEX);
    const [customModelIdsText, setCustomModelIdsText] = useState(() => getCustomModelIdsText(selectedModelIds, recommendedModelIds));
    const [selectedRecommendationKeys, setSelectedRecommendationKeys] = useState(() => getRecommendedSelections(selectedModelIds, modelOptions));
    const [modelSearchQuery, setModelSearchQuery] = useState('');
    const filteredModelOptions = useMemo(() => {
        const normalizedQuery = modelSearchQuery.trim().toLowerCase();
        if (!normalizedQuery) {
            return modelOptions;
        }
        return modelOptions.filter((item) => modelOptionSearchText(item).includes(normalizedQuery));
    }, [modelOptions, modelSearchQuery]);
    const recommendedScrollOffset = focusedModelIndex < 0
        ? 0
        : Math.max(0, Math.min(focusedModelIndex - MAX_RECOMMENDED_MODELS_TO_SHOW + 1, filteredModelOptions.length - MAX_RECOMMENDED_MODELS_TO_SHOW));
    const visibleModelOptions = filteredModelOptions.slice(recommendedScrollOffset, recommendedScrollOffset + MAX_RECOMMENDED_MODELS_TO_SHOW);
    const syncModelIds = useCallback((customText, recommendationKeys) => {
        flow.changeModelIds(mergeModelIds(customText, recommendationKeys).join(', '));
    }, [flow]);
    const handleSubmitModelIds = useCallback(() => {
        flow.submitModelIds({
            modelIds: mergeModelIds(customModelIdsText, selectedRecommendationKeys),
        });
    }, [customModelIdsText, flow, selectedRecommendationKeys]);
    const handleCustomModelIdsChange = useCallback((value) => {
        setCustomModelIdsText(value);
        syncModelIds(value, selectedRecommendationKeys);
    }, [selectedRecommendationKeys, syncModelIds]);
    const toggleRecommendationAtIndex = useCallback((index) => {
        const item = filteredModelOptions[index];
        if (!item) {
            return;
        }
        const nextSet = new Set(selectedRecommendationKeys);
        if (nextSet.has(item.key)) {
            nextSet.delete(item.key);
        }
        else {
            nextSet.add(item.key);
        }
        const nextKeys = modelOptions
            .filter((option) => nextSet.has(option.key))
            .map((option) => option.key);
        setSelectedRecommendationKeys(nextKeys);
        syncModelIds(customModelIdsText, nextKeys);
    }, [
        customModelIdsText,
        filteredModelOptions,
        modelOptions,
        selectedRecommendationKeys,
        syncModelIds,
    ]);
    useKeypress((key) => {
        if (focusedModelIndex < 0) {
            return;
        }
        if (key.name === 'tab') {
            setFocusedModelIndex(MODEL_CUSTOM_INPUT_FOCUS_INDEX);
            return;
        }
        if (key.name === 'up') {
            setFocusedModelIndex((index) => index <= 0 ? MODEL_SEARCH_INPUT_FOCUS_INDEX : index - 1);
            return;
        }
        if (key.name === 'down') {
            setFocusedModelIndex((index) => Math.max(0, Math.min(index + 1, filteredModelOptions.length - 1)));
            return;
        }
        if (key.name === 'space' || key.sequence === ' ') {
            toggleRecommendationAtIndex(focusedModelIndex);
            return;
        }
        if (key.name === 'return') {
            handleSubmitModelIds();
            return;
        }
    }, { isActive: hasSelectableModels && focusedModelIndex >= 0 });
    if (hasSelectableModels) {
        return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter model IDs directly. Use commas to configure multiple models.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: customModelIdsText, onChange: handleCustomModelIdsChange, onSubmit: handleSubmitModelIds, onDown: () => {
                            setFocusedModelIndex(MODEL_SEARCH_INPUT_FOCUS_INDEX);
                        }, onTab: () => {
                            setFocusedModelIndex(MODEL_SEARCH_INPUT_FOCUS_INDEX);
                        }, placeholder: "model-id", height: 3, isActive: focusedModelIndex === MODEL_CUSTOM_INPUT_FOCUS_INDEX }, "model-ids-input") }), _jsx(Box, { marginTop: 0, children: _jsx(Text, { color: theme.text.secondary, children: t('Checked recommended models are applied on submit but not copied into the input.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Recommended models') }) }), _jsxs(Box, { marginTop: 0, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Search') }), _jsx(TextInput, { value: modelSearchQuery, onChange: setModelSearchQuery, onSubmit: handleSubmitModelIds, onUp: () => setFocusedModelIndex(MODEL_CUSTOM_INPUT_FOCUS_INDEX), onDown: () => {
                                if (filteredModelOptions.length > 0) {
                                    setFocusedModelIndex(0);
                                }
                            }, onTab: () => {
                                if (filteredModelOptions.length > 0) {
                                    setFocusedModelIndex(0);
                                }
                            }, placeholder: "search", isActive: focusedModelIndex === MODEL_SEARCH_INPUT_FOCUS_INDEX }, "model-search-input")] }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: visibleModelOptions.length > 0 ? (visibleModelOptions.map((item, visibleIndex) => {
                        const modelIndex = recommendedScrollOffset + visibleIndex;
                        const isFocused = focusedModelIndex === modelIndex;
                        const isSelected = selectedRecommendationKeys.includes(item.key);
                        const textColor = isFocused
                            ? theme.status.success
                            : isSelected
                                ? theme.text.accent
                                : theme.text.primary;
                        return (_jsxs(Box, { alignItems: "flex-start", children: [_jsx(Box, { minWidth: 4, flexShrink: 0, children: _jsx(Text, { color: textColor, children: isSelected ? ICON.RADIO_FILLED : ICON.CIRCLE_EMPTY }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: textColor, children: item.label }) })] }, item.key));
                    })) : (_jsx(Text, { color: theme.text.secondary, children: t('No recommended models match.') })) }), flow.state.modelIdsError && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: flow.state.modelIdsError }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to submit, ↑↓/Tab to switch input, search, and recommendations, Space to toggle recommendations, Esc to go back') }) })] }));
    }
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: defaultIds
                        ? t('Enter model IDs separated by commas. Examples: {{modelIds}}', {
                            modelIds: defaultIds,
                        })
                        : t('Enter model IDs separated by commas.') }) }), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: flow.state.modelIds, onChange: flow.changeModelIds, onSubmit: () => flow.submitModelIds(), placeholder: defaultIds || 'model-id-1, model-id-2' }, "model-ids-input") }), flow.state.modelIdsError && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: flow.state.modelIdsError }) })), _jsx(NAV_HINT_INPUT, {})] }));
}
// ---------------------------------------------------------------------------
// Step: Advanced config
// ---------------------------------------------------------------------------
function AdvancedConfigStep({ flow, }) {
    const { focusedConfigIndex, thinkingEnabled, modalityEnabled, modalityImage, modalityVideo, modalityAudio, modalityPdf, contextWindowSize, } = flow.state;
    const checkmark = (v) => (v ? ICON.RADIO_FILLED : ICON.CIRCLE_EMPTY);
    const cursor = (index) => (focusedConfigIndex === index ? '›' : ' ');
    const ctxIdx = modalityEnabled ? 6 : 2;
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Optional: configure advanced generation settings.') }) }), _jsx(Box, { marginTop: 1, marginLeft: 2, children: _jsxs(Text, { color: focusedConfigIndex === 0 ? theme.status.success : undefined, children: [cursor(0), " ", checkmark(thinkingEnabled), " ", t('Enable thinking')] }) }), _jsx(Box, { marginTop: 0, marginLeft: 4, children: _jsx(Text, { color: theme.text.secondary, children: t('Allows the model to perform extended reasoning before responding.') }) }), _jsx(Box, { marginTop: 1, marginLeft: 2, children: _jsxs(Text, { color: focusedConfigIndex === 1 ? theme.status.success : undefined, children: [cursor(1), " ", checkmark(modalityEnabled), " ", t('Enable modality')] }) }), _jsx(Box, { marginTop: 0, marginLeft: 4, children: _jsx(Text, { color: theme.text.secondary, children: t('Enables multimodal input capabilities (image, video, etc.).') }) }), modalityEnabled && (_jsxs(Box, { marginTop: 0, marginLeft: 6, children: [_jsxs(Text, { color: focusedConfigIndex === 2 ? theme.status.success : undefined, children: [cursor(2), " ", checkmark(modalityImage), " ", 'Image  '] }), _jsxs(Text, { color: focusedConfigIndex === 3 ? theme.status.success : undefined, children: [cursor(3), " ", checkmark(modalityVideo), " ", 'Video  '] }), _jsxs(Text, { color: focusedConfigIndex === 4 ? theme.status.success : undefined, children: [cursor(4), " ", checkmark(modalityAudio), " ", 'Audio  '] }), _jsxs(Text, { color: focusedConfigIndex === 5 ? theme.status.success : undefined, children: [cursor(5), " ", checkmark(modalityPdf), " ", 'PDF'] })] })), _jsxs(Box, { marginTop: 1, marginLeft: 2, children: [_jsxs(Text, { color: focusedConfigIndex === ctxIdx ? theme.status.success : undefined, children: [cursor(ctxIdx), " ", t('Context window'), ":", ' '] }), _jsx(TextInput, { value: contextWindowSize, onChange: flow.changeContextWindowSize, placeholder: "auto", isActive: focusedConfigIndex === ctxIdx })] }), _jsx(Box, { marginTop: 0, marginLeft: 4, children: _jsx(Text, { color: theme.text.secondary, children: t('Max input tokens (leave empty to auto-detect from model name).') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('↑↓ to navigate, Space to toggle, Enter to continue, Esc to go back') }) })] }));
}
// ---------------------------------------------------------------------------
// Step: Review JSON
// ---------------------------------------------------------------------------
function ReviewStep({ flow }) {
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('The following JSON will be saved to settings.json:') }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: flow.state.previewJson }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to save, Esc to go back') }) })] }));
}
// ---------------------------------------------------------------------------
// Protocol options
// ---------------------------------------------------------------------------
const PROTOCOL_ITEMS = [
    {
        key: AuthType.USE_OPENAI,
        title: t('OpenAI-compatible'),
        label: t('OpenAI-compatible'),
        description: t('Standard OpenAI API format (most common)'),
        value: AuthType.USE_OPENAI,
    },
    {
        key: AuthType.USE_ANTHROPIC,
        title: t('Anthropic-compatible'),
        label: t('Anthropic-compatible'),
        description: t('Anthropic Messages API format'),
        value: AuthType.USE_ANTHROPIC,
    },
    {
        key: AuthType.USE_GEMINI,
        title: t('Gemini-compatible'),
        label: t('Gemini-compatible'),
        description: t('Google Gemini API format'),
        value: AuthType.USE_GEMINI,
    },
];
export function ProviderSetupSteps({ flow, }) {
    const { provider, step } = flow.state;
    // Keyboard handling for steps that need it (advancedConfig, review)
    useKeypress((key) => {
        if (step === 'advancedConfig') {
            // The context-window row has an embedded TextInput that's conditionally
            // active. Restrict the focus-row navigation to unambiguous shortcuts —
            // arrow keys and the readline-style Ctrl+P/Ctrl+N — so typing a letter
            // into the context-window field never simultaneously moves the focus.
            const isFocusUp = key.name === 'up' || (key.ctrl && key.name === 'p');
            const isFocusDown = key.name === 'down' || (key.ctrl && key.name === 'n');
            if (isFocusUp) {
                flow.moveAdvancedFocusUp();
                return;
            }
            if (isFocusDown) {
                flow.moveAdvancedFocusDown();
                return;
            }
            if (key.name === 'space') {
                flow.toggleFocusedAdvancedOption();
                return;
            }
            if (key.name === 'return') {
                flow.submitAdvancedConfig();
                return;
            }
        }
        if (step === 'review' && key.name === 'return') {
            flow.submit();
        }
    }, { isActive: step === 'advancedConfig' || step === 'review' });
    if (!provider || !step)
        return null;
    switch (step) {
        case 'protocol': {
            const protocolOpts = provider.protocolOptions ?? [provider.protocol];
            const items = PROTOCOL_ITEMS.filter((p) => protocolOpts.includes(p.value));
            return (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(DescriptiveRadioButtonSelect, { items: items, initialIndex: 0, onSelect: flow.selectProtocol, itemGap: 1 }) }), _jsx(NAV_HINT_SELECT, {})] }));
        }
        case 'baseUrl':
            if (Array.isArray(provider.baseUrl)) {
                return _jsx(BaseUrlSelectStep, { config: provider, flow: flow });
            }
            return (_jsx(BaseUrlInputStep, { flow: flow, documentationUrl: resolveDocumentationUrl(provider, flow.state.baseUrl) }));
        case 'apiKey':
            return _jsx(ApiKeyStep, { config: provider, flow: flow });
        case 'models':
            return _jsx(ModelIdsStep, { config: provider, flow: flow });
        case 'advancedConfig':
            return _jsx(AdvancedConfigStep, { flow: flow });
        case 'review':
            return _jsx(ReviewStep, { flow: flow });
        default:
            return null;
    }
}
//# sourceMappingURL=ProviderSetupSteps.js.map