import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../../keyMatchers.js';
import {} from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
export const AgentSelectionStep = ({ availableAgents, onAgentSelect, }) => {
    const [navigation, setNavigation] = useState({
        currentBlock: 'project',
        projectIndex: 0,
        userIndex: 0,
        builtinIndex: 0,
        extensionIndex: 0,
    });
    // Group agents by level
    const projectAgents = useMemo(() => availableAgents.filter((agent) => agent.level === 'project'), [availableAgents]);
    const userAgents = useMemo(() => availableAgents.filter((agent) => agent.level === 'user'), [availableAgents]);
    const builtinAgents = useMemo(() => availableAgents.filter((agent) => agent.level === 'builtin'), [availableAgents]);
    const extensionAgents = useMemo(() => availableAgents.filter((agent) => agent.level === 'extension'), [availableAgents]);
    const projectNames = useMemo(() => new Set(projectAgents.map((agent) => agent.name)), [projectAgents]);
    // Initialize navigation state when agents are loaded (only once)
    useEffect(() => {
        if (projectAgents.length > 0) {
            setNavigation((prev) => ({ ...prev, currentBlock: 'project' }));
        }
        else if (userAgents.length > 0) {
            setNavigation((prev) => ({ ...prev, currentBlock: 'user' }));
        }
        else if (builtinAgents.length > 0) {
            setNavigation((prev) => ({ ...prev, currentBlock: 'builtin' }));
        }
        else if (extensionAgents.length > 0) {
            setNavigation((prev) => ({ ...prev, currentBlock: 'extension' }));
        }
    }, [projectAgents, userAgents, builtinAgents, extensionAgents]);
    // Custom keyboard navigation
    useKeypress((key) => {
        const { name } = key;
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setNavigation((prev) => {
                if (prev.currentBlock === 'project') {
                    if (prev.projectIndex > 0) {
                        return { ...prev, projectIndex: prev.projectIndex - 1 };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to last item in builtin block
                        return {
                            ...prev,
                            currentBlock: 'builtin',
                            builtinIndex: builtinAgents.length - 1,
                        };
                    }
                    else if (userAgents.length > 0) {
                        // Move to last item in user block
                        return {
                            ...prev,
                            currentBlock: 'user',
                            userIndex: userAgents.length - 1,
                        };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to last item in extension block
                        return {
                            ...prev,
                            currentBlock: 'extension',
                            extensionIndex: extensionAgents.length - 1,
                        };
                    }
                    else {
                        // Wrap to last item in project block
                        return { ...prev, projectIndex: projectAgents.length - 1 };
                    }
                }
                else if (prev.currentBlock === 'user') {
                    if (prev.userIndex > 0) {
                        return { ...prev, userIndex: prev.userIndex - 1 };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to last item in project block
                        return {
                            ...prev,
                            currentBlock: 'project',
                            projectIndex: projectAgents.length - 1,
                        };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to last item in builtin block
                        return {
                            ...prev,
                            currentBlock: 'builtin',
                            builtinIndex: builtinAgents.length - 1,
                        };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to last item in extension block
                        return {
                            ...prev,
                            currentBlock: 'extension',
                            extensionIndex: extensionAgents.length - 1,
                        };
                    }
                    else {
                        // Wrap to last item in user block
                        return { ...prev, userIndex: userAgents.length - 1 };
                    }
                }
                else if (prev.currentBlock === 'builtin') {
                    // builtin block
                    if (prev.builtinIndex > 0) {
                        return { ...prev, builtinIndex: prev.builtinIndex - 1 };
                    }
                    else if (userAgents.length > 0) {
                        // Move to last item in user block
                        return {
                            ...prev,
                            currentBlock: 'user',
                            userIndex: userAgents.length - 1,
                        };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to last item in project block
                        return {
                            ...prev,
                            currentBlock: 'project',
                            projectIndex: projectAgents.length - 1,
                        };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to last item in extension block
                        return {
                            ...prev,
                            currentBlock: 'extension',
                            extensionIndex: extensionAgents.length - 1,
                        };
                    }
                    else {
                        // Wrap to last item in builtin block
                        return { ...prev, builtinIndex: builtinAgents.length - 1 };
                    }
                }
                else {
                    // extension block
                    if (prev.extensionIndex > 0) {
                        return { ...prev, extensionIndex: prev.extensionIndex - 1 };
                    }
                    else if (userAgents.length > 0) {
                        // Move to last item in user block
                        return {
                            ...prev,
                            currentBlock: 'user',
                            userIndex: userAgents.length - 1,
                        };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to last item in project block
                        return {
                            ...prev,
                            currentBlock: 'project',
                            projectIndex: projectAgents.length - 1,
                        };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to last item in builtin block
                        return {
                            ...prev,
                            currentBlock: 'builtin',
                            builtinIndex: builtinAgents.length - 1,
                        };
                    }
                    else {
                        // Wrap to last item in extension block
                        return { ...prev, extensionIndex: extensionAgents.length - 1 };
                    }
                }
            });
        }
        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setNavigation((prev) => {
                if (prev.currentBlock === 'project') {
                    if (prev.projectIndex < projectAgents.length - 1) {
                        return { ...prev, projectIndex: prev.projectIndex + 1 };
                    }
                    else if (userAgents.length > 0) {
                        // Move to first item in user block
                        return { ...prev, currentBlock: 'user', userIndex: 0 };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to first item in builtin block
                        return { ...prev, currentBlock: 'builtin', builtinIndex: 0 };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to first item in extension block
                        return { ...prev, currentBlock: 'extension', extensionIndex: 0 };
                    }
                    else {
                        // Wrap to first item in project block
                        return { ...prev, projectIndex: 0 };
                    }
                }
                else if (prev.currentBlock === 'user') {
                    if (prev.userIndex < userAgents.length - 1) {
                        return { ...prev, userIndex: prev.userIndex + 1 };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to first item in builtin block
                        return { ...prev, currentBlock: 'builtin', builtinIndex: 0 };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to first item in extension block
                        return { ...prev, currentBlock: 'extension', extensionIndex: 0 };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to first item in project block
                        return { ...prev, currentBlock: 'project', projectIndex: 0 };
                    }
                    else {
                        // Wrap to first item in user block
                        return { ...prev, userIndex: 0 };
                    }
                }
                else if (prev.currentBlock === 'builtin') {
                    // builtin block
                    if (prev.builtinIndex < builtinAgents.length - 1) {
                        return { ...prev, builtinIndex: prev.builtinIndex + 1 };
                    }
                    else if (extensionAgents.length > 0) {
                        // Move to first item in extension block
                        return { ...prev, currentBlock: 'extension', extensionIndex: 0 };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to first item in project block
                        return { ...prev, currentBlock: 'project', projectIndex: 0 };
                    }
                    else if (userAgents.length > 0) {
                        // Move to first item in user block
                        return { ...prev, currentBlock: 'user', userIndex: 0 };
                    }
                    else {
                        // Wrap to first item in builtin block
                        return { ...prev, builtinIndex: 0 };
                    }
                }
                else {
                    // extension block
                    if (prev.extensionIndex < extensionAgents.length - 1) {
                        return { ...prev, extensionIndex: prev.extensionIndex + 1 };
                    }
                    else if (projectAgents.length > 0) {
                        // Move to first item in project block
                        return { ...prev, currentBlock: 'project', projectIndex: 0 };
                    }
                    else if (userAgents.length > 0) {
                        // Move to first item in user block
                        return { ...prev, currentBlock: 'user', userIndex: 0 };
                    }
                    else if (builtinAgents.length > 0) {
                        // Move to first item in builtin block
                        return { ...prev, currentBlock: 'builtin', builtinIndex: 0 };
                    }
                    else {
                        // Wrap to first item in extension block
                        return { ...prev, extensionIndex: 0 };
                    }
                }
            });
        }
        else if (name === 'return' || name === 'space') {
            // Calculate global index and select current item
            let globalIndex;
            if (navigation.currentBlock === 'project') {
                globalIndex = navigation.projectIndex;
            }
            else if (navigation.currentBlock === 'user') {
                // User agents come after project agents in the availableAgents array
                globalIndex = projectAgents.length + navigation.userIndex;
            }
            else if (navigation.currentBlock === 'builtin') {
                // Builtin agents come after project and user agents in the availableAgents array
                globalIndex =
                    projectAgents.length + userAgents.length + navigation.builtinIndex;
            }
            else {
                // Extension agents come after project, user, and builtin agents
                globalIndex =
                    projectAgents.length +
                        userAgents.length +
                        builtinAgents.length +
                        navigation.extensionIndex;
            }
            if (globalIndex >= 0 && globalIndex < availableAgents.length) {
                onAgentSelect(globalIndex);
            }
        }
    }, { isActive: true });
    if (availableAgents.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('No subagents found.') }), _jsx(Text, { color: theme.text.secondary, children: t("Use '/agents create' to create your first subagent.") })] }));
    }
    // Render custom radio button items
    const renderAgentItem = (agent, index, isSelected) => {
        const textColor = isSelected ? theme.text.accent : theme.text.primary;
        return (_jsxs(Box, { alignItems: "center", children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '●' : ' ' }) }), _jsxs(Text, { color: textColor, wrap: "truncate", children: [agent.name, agent.isBuiltin && (_jsxs(Text, { color: isSelected ? theme.text.accent : theme.text.secondary, children: [' ', t('(built-in)')] })), agent.level === 'user' && projectNames.has(agent.name) && (_jsxs(Text, { color: isSelected ? theme.status.warning : theme.text.secondary, children: [' ', t('(overridden by project level agent)')] }))] })] }, `${agent.name}-${agent.level}`));
    };
    // Calculate enabled agents count (excluding conflicted user-level agents)
    const enabledAgentsCount = projectAgents.length +
        userAgents.filter((agent) => !projectNames.has(agent.name)).length +
        builtinAgents.length +
        extensionAgents.length;
    return (_jsxs(Box, { flexDirection: "column", children: [projectAgents.length > 0 && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Project Level ({{path}})', {
                            path: projectAgents[0].filePath?.replace(/\/[^/]+$/, '') || '',
                        }) }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: projectAgents.map((agent, index) => {
                            const isSelected = navigation.currentBlock === 'project' &&
                                navigation.projectIndex === index;
                            return renderAgentItem(agent, index, isSelected);
                        }) })] })), userAgents.length > 0 && (_jsxs(Box, { flexDirection: "column", marginBottom: builtinAgents.length > 0 ? 1 : 0, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('User Level ({{path}})', {
                            path: userAgents[0].filePath?.replace(/\/[^/]+$/, '') || '',
                        }) }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: userAgents.map((agent, index) => {
                            const isSelected = navigation.currentBlock === 'user' &&
                                navigation.userIndex === index;
                            return renderAgentItem(agent, index, isSelected);
                        }) })] })), builtinAgents.length > 0 && (_jsxs(Box, { flexDirection: "column", marginBottom: extensionAgents.length > 0 ? 1 : 0, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Built-in Agents') }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: builtinAgents.map((agent, index) => {
                            const isSelected = navigation.currentBlock === 'builtin' &&
                                navigation.builtinIndex === index;
                            return renderAgentItem(agent, index, isSelected);
                        }) })] })), extensionAgents.length > 0 && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Extension Agents') }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: extensionAgents.map((agent, index) => {
                            const isSelected = navigation.currentBlock === 'extension' &&
                                navigation.extensionIndex === index;
                            return renderAgentItem(agent, index, isSelected);
                        }) })] })), (projectAgents.length > 0 ||
                userAgents.length > 0 ||
                builtinAgents.length > 0 ||
                extensionAgents.length > 0) && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Using: {{count}} agents', {
                        count: enabledAgentsCount.toString(),
                    }) }) }))] }));
};
//# sourceMappingURL=AgentSelectionStep.js.map