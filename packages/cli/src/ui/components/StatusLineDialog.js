import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { SettingScope } from '../../config/settings.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { theme } from '../semantic-colors.js';
import { MessageType } from '../types.js';
import { MultiSelect } from './shared/MultiSelect.js';
import { aggregateModelTokens, buildStatusLinePresetData, buildStatusLinePresetLines, DEFAULT_STATUS_LINE_PRESET_CONFIG, normalizeStatusLinePresetConfig, STATUS_LINE_PRESET_ITEMS, } from '../statusLinePresets.js';
const THEME_COLORS_KEY = 'theme-colors';
const DESCRIPTION_COLUMN = 24;
function buildInitialSelectedKeys(settings) {
    const preset = normalizeStatusLinePresetConfig(settings.merged.ui?.statusLine) ??
        DEFAULT_STATUS_LINE_PRESET_CONFIG;
    return [
        ...(preset.useThemeColors ? [THEME_COLORS_KEY] : []),
        ...preset.items,
    ];
}
function buildConfigFromKeys(keys) {
    const selected = new Set(keys);
    const validItemIds = new Set(STATUS_LINE_PRESET_ITEMS.map((item) => item.id));
    const items = [
        ...new Set(keys.filter((key) => validItemIds.has(key))),
    ];
    return {
        type: 'preset',
        useThemeColors: selected.has(THEME_COLORS_KEY),
        items,
    };
}
function getEffectiveStatusLineScope(settings) {
    if (settings.forScope(SettingScope.System).settings.ui?.statusLine) {
        return SettingScope.System;
    }
    if (settings.isTrusted &&
        settings.forScope(SettingScope.Workspace).settings.ui?.statusLine) {
        return SettingScope.Workspace;
    }
    return SettingScope.User;
}
function getOptionSearchText(option) {
    const value = option.value.kind === 'theme-colors'
        ? 'theme colors active theme'
        : option.value.kind === 'separator'
            ? ''
            : option.value.id;
    return `${option.label} ${value}`.toLowerCase();
}
function getPreviewData(config, uiState) {
    const stats = uiState.sessionStats;
    const metrics = stats.metrics;
    const { totalInputTokens, totalOutputTokens } = aggregateModelTokens(metrics);
    return buildStatusLinePresetData({
        sessionId: stats.sessionId,
        version: config.getCliVersion(),
        modelDisplayName: uiState.currentModel || config.getModel(),
        currentDir: config.getTargetDir(),
        branch: uiState.branchName,
        contextWindowSize: config.getContentGeneratorConfig()?.contextWindowSize || 0,
        currentUsage: stats.lastPromptTokenCount,
        totalInputTokens,
        totalOutputTokens,
        totalLinesAdded: metrics.files.totalLinesAdded,
        totalLinesRemoved: metrics.files.totalLinesRemoved,
        streamingState: uiState.streamingState,
    });
}
export function StatusLineDialog({ settings, config, uiState, addItem, onSaved, onClose, availableTerminalHeight, }) {
    const [query, setQuery] = useState('');
    const [selectedKeys, setSelectedKeys] = useState(() => buildInitialSelectedKeys(settings));
    const options = useMemo(() => [
        {
            key: THEME_COLORS_KEY,
            value: { kind: 'theme-colors' },
            label: `${'Use theme colors'.padEnd(DESCRIPTION_COLUMN)} Apply colors from the active /theme`,
        },
        {
            key: 'statusline-separator',
            value: { kind: 'separator' },
            label: '───────────────────────',
            disabled: true,
            separator: true,
        },
        ...STATUS_LINE_PRESET_ITEMS.map((item) => ({
            key: item.id,
            value: { kind: 'item', id: item.id },
            label: `${item.label.padEnd(DESCRIPTION_COLUMN)} ${item.description}`,
        })),
    ], []);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return options;
        }
        return options.filter((option) => getOptionSearchText(option).includes(normalizedQuery));
    }, [options, query]);
    const presetConfig = useMemo(() => buildConfigFromKeys(selectedKeys), [selectedKeys]);
    const previewData = useMemo(() => getPreviewData(config, uiState), [config, uiState]);
    const previewLines = useMemo(() => buildStatusLinePresetLines(presetConfig, previewData), [presetConfig, previewData]);
    const handleConfirm = useCallback(() => {
        const effectiveScope = getEffectiveStatusLineScope(settings);
        settings.setValue(effectiveScope, 'ui.statusLine', presetConfig);
        onSaved?.(presetConfig);
        addItem({
            type: MessageType.INFO,
            text: `Status line preset saved to ${effectiveScope.toLowerCase()} settings.`,
        }, Date.now());
        onClose();
    }, [addItem, onClose, onSaved, presetConfig, settings]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            if (query) {
                setQuery('');
                return;
            }
            onClose();
            return;
        }
        if (key.name === 'backspace' || key.name === 'delete') {
            setQuery((current) => current.slice(0, -1));
            return;
        }
        if (key.name === 'j' ||
            key.name === 'k' ||
            key.name === 'up' ||
            key.name === 'down' ||
            key.name === 'return') {
            return;
        }
        if (!key.ctrl &&
            !key.meta &&
            key.sequence.length === 1 &&
            key.sequence >= '!' &&
            key.sequence <= '~') {
            setQuery((current) => `${current}${key.sequence}`);
        }
    }, { isActive: true });
    const maxItemsToShow = Math.max(5, Math.min(10, (availableTerminalHeight ?? 18) - 8));
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 1, paddingY: 1, width: "100%", children: [_jsx(Text, { bold: true, children: "Configure Status Line" }), _jsx(Text, { color: theme.text.secondary, children: "Select which items to display in the status line." }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Type to search" }), _jsx(Text, { children: query ? `> ${query}` : '>' })] }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: filteredOptions.length > 0 ? (_jsx(MultiSelect, { items: filteredOptions, selectedKeys: selectedKeys, onSelectedKeysChange: setSelectedKeys, onConfirm: handleConfirm, showNumbers: false, checkedText: "[x]", showActiveMarker: true, maxItemsToShow: maxItemsToShow })) : (_jsx(Text, { color: theme.text.secondary, children: "No preset items match." })) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Preview" }), previewLines.length > 0 ? (previewLines.map((line, index) => (_jsx(Text, { color: presetConfig.useThemeColors ? theme.text.accent : undefined, dimColor: !presetConfig.useThemeColors, wrap: "truncate", children: line }, `${line}-${index}`)))) : (_jsx(Text, { color: theme.text.secondary, children: "Select at least one item to show a status line." }))] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: "Use up/down to navigate, space to select, enter to confirm, esc to cancel" }) })] }));
}
//# sourceMappingURL=StatusLineDialog.js.map