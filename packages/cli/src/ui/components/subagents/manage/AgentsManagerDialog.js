import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Text } from 'ink';
import { AgentSelectionStep } from './AgentSelectionStep.js';
import { ActionSelectionStep } from './ActionSelectionStep.js';
import { AgentViewerStep } from './AgentViewerStep.js';
import { EditOptionsStep } from './AgentEditStep.js';
import { AgentDeleteStep } from './AgentDeleteStep.js';
import { ToolSelector } from '../create/ToolSelector.js';
import { ColorSelector } from '../create/ColorSelector.js';
import { MANAGEMENT_STEPS } from '../types.js';
import { theme } from '../../../semantic-colors.js';
import { getColorForDisplay, shouldShowColor } from '../utils.js';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
const debugLogger = createDebugLogger('AGENTS_MANAGER_DIALOG');
/**
 * Main orchestrator component for the agents management dialog.
 */
export function AgentsManagerDialog({ onClose, config, }) {
    // Simple state management with useState hooks
    const [availableAgents, setAvailableAgents] = useState([]);
    const [selectedAgentIndex, setSelectedAgentIndex] = useState(-1);
    const [navigationStack, setNavigationStack] = useState([
        MANAGEMENT_STEPS.AGENT_SELECTION,
    ]);
    // Memoized selectedAgent based on index
    const selectedAgent = useMemo(() => selectedAgentIndex >= 0 ? availableAgents[selectedAgentIndex] : null, [availableAgents, selectedAgentIndex]);
    // Function to load agents
    const loadAgents = useCallback(async () => {
        if (!config)
            return;
        const manager = config.getSubagentManager();
        // Load agents from all levels separately to show all agents including conflicts
        const allAgents = await manager.listSubagents({ force: true });
        setAvailableAgents(allAgents);
    }, [config]);
    // Load agents when component mounts or config changes
    useEffect(() => {
        loadAgents();
    }, [loadAgents]);
    // Helper to get current step
    const getCurrentStep = useCallback(() => navigationStack[navigationStack.length - 1] ||
        MANAGEMENT_STEPS.AGENT_SELECTION, [navigationStack]);
    const handleSelectAgent = useCallback((agentIndex) => {
        setSelectedAgentIndex(agentIndex);
        setNavigationStack((prev) => [...prev, MANAGEMENT_STEPS.ACTION_SELECTION]);
    }, []);
    const handleNavigateToStep = useCallback((step) => {
        setNavigationStack((prev) => [...prev, step]);
    }, []);
    const handleNavigateBack = useCallback(() => {
        setNavigationStack((prev) => {
            if (prev.length <= 1) {
                return prev; // Can't go back from root step
            }
            return prev.slice(0, -1);
        });
    }, []);
    const handleDeleteAgent = useCallback(async (agent) => {
        if (!config)
            return;
        try {
            const subagentManager = config.getSubagentManager();
            await subagentManager.deleteSubagent(agent.name, agent.level, agent.extensionName);
            // Reload agents to get updated state
            await loadAgents();
            // Navigate back to agent selection after successful deletion
            setNavigationStack([MANAGEMENT_STEPS.AGENT_SELECTION]);
            setSelectedAgentIndex(-1);
        }
        catch (error) {
            debugLogger.error('Failed to delete agent:', error);
            throw error; // Re-throw to let the component handle the error state
        }
    }, [config, loadAgents]);
    // Centralized ESC key handling for the entire dialog
    useKeypress((key) => {
        if (key.name !== 'escape') {
            return;
        }
        const currentStep = getCurrentStep();
        if (currentStep === MANAGEMENT_STEPS.AGENT_SELECTION) {
            // On first step, ESC cancels the entire dialog
            onClose();
        }
        else {
            // On other steps, ESC goes back to previous step in navigation stack
            handleNavigateBack();
        }
    }, { isActive: true });
    // Props for child components - now using direct state and callbacks
    const commonProps = useMemo(() => ({
        onNavigateToStep: handleNavigateToStep,
        onNavigateBack: handleNavigateBack,
    }), [handleNavigateToStep, handleNavigateBack]);
    const renderStepHeader = useCallback(() => {
        const currentStep = getCurrentStep();
        const getStepHeaderText = () => {
            switch (currentStep) {
                case MANAGEMENT_STEPS.AGENT_SELECTION:
                    return t('Agents');
                case MANAGEMENT_STEPS.ACTION_SELECTION:
                    return t('Choose Action');
                case MANAGEMENT_STEPS.AGENT_VIEWER:
                    return selectedAgent?.name;
                case MANAGEMENT_STEPS.EDIT_OPTIONS:
                    return t('Edit {{name}}', { name: selectedAgent?.name || '' });
                case MANAGEMENT_STEPS.EDIT_TOOLS:
                    return t('Edit Tools: {{name}}', { name: selectedAgent?.name || '' });
                case MANAGEMENT_STEPS.EDIT_COLOR:
                    return t('Edit Color: {{name}}', { name: selectedAgent?.name || '' });
                case MANAGEMENT_STEPS.DELETE_CONFIRMATION:
                    return t('Delete {{name}}', { name: selectedAgent?.name || '' });
                default:
                    return t('Unknown Step');
            }
        };
        // Use agent color for the Agent Viewer header
        const headerColor = currentStep === MANAGEMENT_STEPS.AGENT_VIEWER &&
            selectedAgent &&
            shouldShowColor(selectedAgent.color)
            ? getColorForDisplay(selectedAgent.color)
            : undefined;
        return (_jsx(Box, { children: _jsx(Text, { bold: true, color: headerColor, children: getStepHeaderText() }) }));
    }, [getCurrentStep, selectedAgent]);
    const renderStepFooter = useCallback(() => {
        const currentStep = getCurrentStep();
        const getNavigationInstructions = () => {
            if (currentStep === MANAGEMENT_STEPS.AGENT_SELECTION) {
                if (availableAgents.length === 0) {
                    return t('Esc to close');
                }
                return t('Enter to select, ↑↓ to navigate, Esc to close');
            }
            if (currentStep === MANAGEMENT_STEPS.AGENT_VIEWER) {
                return t('Esc to go back');
            }
            if (currentStep === MANAGEMENT_STEPS.DELETE_CONFIRMATION) {
                return t('Enter to confirm, Esc to cancel');
            }
            return t('Enter to select, ↑↓ to navigate, Esc to go back');
        };
        return (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: getNavigationInstructions() }) }));
    }, [getCurrentStep, availableAgents]);
    const renderStepContent = useCallback(() => {
        const currentStep = getCurrentStep();
        switch (currentStep) {
            case MANAGEMENT_STEPS.AGENT_SELECTION:
                return (_jsx(AgentSelectionStep, { availableAgents: availableAgents, onAgentSelect: handleSelectAgent, ...commonProps }));
            case MANAGEMENT_STEPS.ACTION_SELECTION:
                return (_jsx(ActionSelectionStep, { selectedAgent: selectedAgent, ...commonProps }));
            case MANAGEMENT_STEPS.AGENT_VIEWER:
                return (_jsx(AgentViewerStep, { selectedAgent: selectedAgent, ...commonProps }));
            case MANAGEMENT_STEPS.EDIT_OPTIONS:
                return (_jsx(EditOptionsStep, { selectedAgent: selectedAgent, ...commonProps }));
            case MANAGEMENT_STEPS.EDIT_TOOLS:
                return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(ToolSelector, { tools: selectedAgent?.tools || [], onSelect: async (tools) => {
                            if (selectedAgent && config) {
                                try {
                                    // Save the changes using SubagentManager
                                    const subagentManager = config.getSubagentManager();
                                    await subagentManager.updateSubagent(selectedAgent.name, { tools }, selectedAgent.level);
                                    // Reload agents to get updated state
                                    await loadAgents();
                                    handleNavigateBack();
                                }
                                catch (error) {
                                    debugLogger.error('Failed to save agent changes:', error);
                                }
                            }
                        }, config: config }) }));
            case MANAGEMENT_STEPS.EDIT_COLOR:
                return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(ColorSelector, { color: selectedAgent?.color || 'auto', agentName: selectedAgent?.name || 'Agent', onSelect: async (color) => {
                            // Save changes and reload agents
                            if (selectedAgent && config) {
                                try {
                                    // Save the changes using SubagentManager
                                    const subagentManager = config.getSubagentManager();
                                    await subagentManager.updateSubagent(selectedAgent.name, { color }, selectedAgent.level);
                                    // Reload agents to get updated state
                                    await loadAgents();
                                    handleNavigateBack();
                                }
                                catch (error) {
                                    debugLogger.error('Failed to save color changes:', error);
                                }
                            }
                        } }) }));
            case MANAGEMENT_STEPS.DELETE_CONFIRMATION:
                return (_jsx(AgentDeleteStep, { selectedAgent: selectedAgent, onDelete: handleDeleteAgent, ...commonProps }));
            default:
                return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('Invalid step: {{step}}', { step: currentStep }) }) }));
        }
    }, [
        getCurrentStep,
        availableAgents,
        selectedAgent,
        commonProps,
        config,
        loadAgents,
        handleNavigateBack,
        handleSelectAgent,
        handleDeleteAgent,
    ]);
    return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", gap: 1, children: [renderStepHeader(), renderStepContent(), renderStepFooter()] }) }));
}
//# sourceMappingURL=AgentsManagerDialog.js.map