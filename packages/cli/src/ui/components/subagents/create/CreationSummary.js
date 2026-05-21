import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { theme } from '../../../semantic-colors.js';
import { shouldShowColor, getColorForDisplay } from '../utils.js';
import { useLaunchEditor } from '../../../hooks/useLaunchEditor.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
const debugLogger = createDebugLogger('SUBAGENT_CREATION_SUMMARY');
/**
 * Step 6: Final confirmation and actions.
 */
export function CreationSummary({ state, onPrevious: _onPrevious, onCancel, config, }) {
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const launchEditor = useLaunchEditor();
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    };
    // Check for warnings
    useEffect(() => {
        const checkWarnings = async () => {
            if (!config || !state.generatedName)
                return;
            const allWarnings = [];
            try {
                // Get project root from config
                const subagentManager = config.getSubagentManager();
                // Check for name conflicts
                const isAvailable = await subagentManager.isNameAvailable(state.generatedName);
                if (!isAvailable) {
                    const existing = await subagentManager.loadSubagent(state.generatedName);
                    if (existing) {
                        const conflictLevel = existing.level === 'project' ? 'project' : 'user';
                        const targetLevel = state.location;
                        if (conflictLevel === targetLevel) {
                            allWarnings.push(t('Name "{{name}}" already exists at {{level}} level - will overwrite existing subagent', { name: state.generatedName, level: conflictLevel }));
                        }
                        else if (targetLevel === 'project') {
                            allWarnings.push(t('Name "{{name}}" exists at user level - project level will take precedence', { name: state.generatedName }));
                        }
                        else {
                            allWarnings.push(t('Name "{{name}}" exists at project level - existing subagent will take precedence', { name: state.generatedName }));
                        }
                    }
                }
            }
            catch (error) {
                // Silently handle errors in warning checks
                debugLogger.warn('Error checking subagent name availability:', error);
            }
            // Check length warnings
            if (state.generatedDescription.length > 1000) {
                allWarnings.push(t('Description is over {{length}} characters', {
                    length: state.generatedDescription.length.toString(),
                }));
            }
            if (state.generatedSystemPrompt.length > 10000) {
                allWarnings.push(t('System prompt is over {{length}} characters', {
                    length: state.generatedSystemPrompt.length.toString(),
                }));
            }
            setWarnings(allWarnings);
        };
        checkWarnings();
    }, [
        config,
        state.generatedName,
        state.generatedDescription,
        state.generatedSystemPrompt,
        state.location,
    ]);
    // If no tools explicitly selected, it means "all tools" for this agent
    const toolsDisplay = state.selectedTools.length === 0 ? '*' : state.selectedTools.join(', ');
    // Common method to save subagent configuration
    const saveSubagent = useCallback(async () => {
        // Create SubagentManager instance
        if (!config) {
            throw new Error('Configuration not available');
        }
        const subagentManager = config.getSubagentManager();
        // Build subagent configuration
        const subagentConfig = {
            name: state.generatedName,
            description: state.generatedDescription,
            systemPrompt: state.generatedSystemPrompt,
            level: state.location,
            filePath: '', // Will be set by manager
            tools: Array.isArray(state.selectedTools)
                ? state.selectedTools
                : undefined,
            color: state.color,
        };
        // Create the subagent
        await subagentManager.createSubagent(subagentConfig, {
            level: state.location,
            overwrite: true,
        });
        return subagentManager;
    }, [state, config]);
    // Common method to show success and auto-close
    const showSuccessAndClose = useCallback(() => {
        setSaveSuccess(true);
        // Auto-close after successful save
        setTimeout(() => {
            onCancel();
        }, 2000);
    }, [onCancel]);
    const handleSave = useCallback(async () => {
        setSaveError(null);
        try {
            await saveSubagent();
            showSuccessAndClose();
        }
        catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }, [saveSubagent, showSuccessAndClose]);
    const handleEdit = useCallback(async () => {
        // Clear any previous error messages
        setSaveError(null);
        try {
            // Save the subagent to file first using shared logic
            const subagentManager = await saveSubagent();
            // Get the file path of the created subagent
            const subagentFilePath = subagentManager.getSubagentPath(state.generatedName, state.location);
            // Launch editor with the actual subagent file
            await launchEditor(subagentFilePath);
            // Show success UI and auto-close after successful edit
            showSuccessAndClose();
        }
        catch (error) {
            setSaveError(t('Failed to save and edit subagent: {{error}}', {
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
        }
    }, [
        saveSubagent,
        showSuccessAndClose,
        state.generatedName,
        state.location,
        launchEditor,
    ]);
    // Handle keyboard input
    useKeypress((key) => {
        if (saveSuccess)
            return;
        if (key.name === 'return' || key.sequence === 's') {
            handleSave();
            return;
        }
        if (key.sequence === 'e') {
            handleEdit();
            return;
        }
    }, { isActive: true });
    if (saveSuccess) {
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { children: _jsx(Text, { bold: true, color: theme.status.success, children: t('✅ Subagent Created Successfully!') }) }), _jsx(Box, { children: _jsx(Text, { children: t('Subagent "{{name}}" has been saved to {{level}} level.', {
                            name: state.generatedName,
                            level: state.location,
                        }) }) })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Name: ') }), _jsx(Text, { color: getColorForDisplay(state.color), children: state.generatedName })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Location: ') }), _jsx(Text, { children: state.location === 'project'
                                    ? t('Project Level (.qwen/agents/)')
                                    : t('User Level (~/.qwen/agents/)') })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Tools: ') }), _jsx(Text, { children: toolsDisplay })] }), shouldShowColor(state.color) && (_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Color: ') }), _jsx(Text, { color: getColorForDisplay(state.color), children: state.color })] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Description:') }) }), _jsx(Box, { padding: 1, paddingBottom: 0, children: _jsx(Text, { wrap: "wrap", children: truncateText(state.generatedDescription, 250) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('System Prompt:') }) }), _jsx(Box, { padding: 1, paddingBottom: 0, children: _jsx(Text, { wrap: "wrap", children: truncateText(state.generatedSystemPrompt, 250) }) })] }), saveError && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.status.error, children: t('❌ Error saving subagent:') }), _jsx(Box, { flexDirection: "column", padding: 1, paddingBottom: 0, children: _jsx(Text, { color: theme.status.error, wrap: "wrap", children: saveError }) })] })), warnings.length > 0 && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.status.warning, children: t('Warnings:') }), _jsx(Box, { flexDirection: "column", padding: 1, paddingBottom: 0, children: warnings.map((warning, index) => (_jsxs(Text, { color: theme.status.warning, wrap: "wrap", children: ["\u2022 ", warning] }, index))) })] }))] }));
}
//# sourceMappingURL=CreationSummary.js.map