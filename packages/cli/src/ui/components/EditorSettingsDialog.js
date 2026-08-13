import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { EDITOR_DISPLAY_NAMES, editorSettingsManager, } from '../editors/editorSettingsManager.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { ScopeSelector } from './shared/ScopeSelector.js';
import { SettingScope } from '../../config/settings.js';
import { createDebugLogger, isEditorAvailable, } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
const debugLogger = createDebugLogger('EDITOR_SETTINGS_DIALOG');
export function EditorSettingsDialog({ onSelect, settings, onExit, }) {
    const [selectedScope, setSelectedScope] = useState(SettingScope.User);
    const [mode, setMode] = useState('editor');
    useKeypress((key) => {
        if (key.name === 'tab') {
            setMode((prev) => (prev === 'editor' ? 'scope' : 'editor'));
        }
        if (key.name === 'escape') {
            onExit();
        }
    }, { isActive: true });
    const editorItems = editorSettingsManager.getAvailableEditorDisplays();
    const currentPreference = settings.forScope(selectedScope).settings.general?.preferredEditor;
    let editorIndex = currentPreference
        ? editorItems.findIndex((item) => item.type === currentPreference)
        : 0;
    if (editorIndex === -1) {
        debugLogger.error(`Editor is not supported: ${currentPreference}`);
        editorIndex = 0;
    }
    const handleEditorSelect = (editorType) => {
        if (editorType === 'not_set') {
            onSelect(undefined, selectedScope);
            return;
        }
        onSelect(editorType, selectedScope);
    };
    const handleScopeSelect = (scope) => {
        setSelectedScope(scope);
        setMode('editor');
    };
    const handleScopeHighlight = (scope) => {
        setSelectedScope(scope);
    };
    let otherScopeModifiedMessage = '';
    const otherScope = selectedScope === SettingScope.User
        ? SettingScope.Workspace
        : SettingScope.User;
    if (settings.forScope(otherScope).settings.general?.preferredEditor !==
        undefined) {
        otherScopeModifiedMessage =
            settings.forScope(selectedScope).settings.general?.preferredEditor !==
                undefined
                ? `(Also modified in ${otherScope})`
                : `(Modified in ${otherScope})`;
    }
    let mergedEditorName = 'None';
    if (settings.merged.general?.preferredEditor &&
        isEditorAvailable(settings.merged.general?.preferredEditor)) {
        mergedEditorName =
            EDITOR_DISPLAY_NAMES[settings.merged.general?.preferredEditor];
    }
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "row", padding: 1, width: "100%", children: [_jsxs(Box, { flexDirection: "column", width: "45%", paddingRight: 2, children: [mode === 'editor' ? (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: mode === 'editor', wrap: "truncate", children: [mode === 'editor' ? '> ' : '  ', t('Select Editor'), ' ', _jsx(Text, { color: theme.text.secondary, children: otherScopeModifiedMessage })] }), _jsx(Box, { height: 1 }), _jsx(RadioButtonSelect, { items: editorItems.map((item) => ({
                                    label: item.name,
                                    value: item.type,
                                    disabled: item.disabled,
                                    key: item.type,
                                })), initialIndex: editorIndex, onSelect: handleEditorSelect, isFocused: mode === 'editor' }, selectedScope)] })) : (_jsx(ScopeSelector, { onSelect: handleScopeSelect, onHighlight: handleScopeHighlight, isFocused: mode === 'scope', initialScope: selectedScope })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: mode === 'editor'
                                ? t('(Use Enter to select, Tab to configure scope)')
                                : t('(Use Enter to apply scope, Tab to go back)') }) })] }), _jsxs(Box, { flexDirection: "column", width: "55%", paddingLeft: 2, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Editor Preference') }), _jsxs(Box, { flexDirection: "column", gap: 1, marginTop: 1, children: [_jsx(Text, { color: theme.text.secondary, children: t('These editors are currently supported. Please note that some editors cannot be used in sandbox mode.') }), _jsxs(Text, { color: theme.text.secondary, children: [t('Your preferred editor is:'), ' ', _jsx(Text, { color: mergedEditorName === 'None'
                                            ? theme.status.error
                                            : theme.text.link, bold: true, children: mergedEditorName }), "."] })] })] })] }));
}
//# sourceMappingURL=EditorSettingsDialog.js.map