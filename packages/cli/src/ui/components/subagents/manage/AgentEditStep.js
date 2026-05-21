import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { MANAGEMENT_STEPS } from '../types.js';
import { theme } from '../../../semantic-colors.js';
import { useLaunchEditor } from '../../../hooks/useLaunchEditor.js';
import {} from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
const editOptions = [
    {
        id: 'editor',
        get label() {
            return t('Open in editor');
        },
    },
    {
        id: 'tools',
        get label() {
            return t('Edit tools');
        },
    },
    {
        id: 'color',
        get label() {
            return t('Edit color');
        },
    },
];
/**
 * Edit options selection step - choose what to edit about the agent.
 */
export function EditOptionsStep({ selectedAgent, onNavigateToStep, }) {
    const [selectedOption, setSelectedOption] = useState('editor');
    const [error, setError] = useState(null);
    const launchEditor = useLaunchEditor();
    const handleHighlight = (selectedValue) => {
        setSelectedOption(selectedValue);
    };
    const handleSelect = useCallback(async (selectedValue) => {
        if (!selectedAgent)
            return;
        setError(null);
        if (selectedValue === 'editor') {
            // Launch editor directly
            try {
                if (!selectedAgent.filePath) {
                    throw new Error('Agent has no file path');
                }
                await launchEditor(selectedAgent.filePath);
            }
            catch (err) {
                setError(t('Failed to launch editor: {{error}}', {
                    error: err instanceof Error ? err.message : 'Unknown error',
                }));
            }
        }
        else if (selectedValue === 'tools') {
            onNavigateToStep(MANAGEMENT_STEPS.EDIT_TOOLS);
        }
        else if (selectedValue === 'color') {
            onNavigateToStep(MANAGEMENT_STEPS.EDIT_COLOR);
        }
    }, [selectedAgent, onNavigateToStep, launchEditor]);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { flexDirection: "column", children: _jsx(RadioButtonSelect, { items: editOptions.map((option) => ({
                        key: option.id,
                        label: option.label,
                        value: option.id,
                    })), initialIndex: editOptions.findIndex((opt) => opt.id === selectedOption), onSelect: handleSelect, onHighlight: handleHighlight, isFocused: true }) }), error && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.status.error, children: t('❌ Error:') }), _jsx(Box, { flexDirection: "column", padding: 1, paddingBottom: 0, children: _jsx(Text, { color: theme.status.error, wrap: "wrap", children: error }) })] }))] }));
}
//# sourceMappingURL=AgentEditStep.js.map