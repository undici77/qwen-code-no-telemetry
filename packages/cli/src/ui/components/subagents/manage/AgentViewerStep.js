import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { shouldShowColor, getColorForDisplay } from '../utils.js';
import {} from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
export const AgentViewerStep = ({ selectedAgent }) => {
    if (!selectedAgent) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No agent selected') }) }));
    }
    const agent = selectedAgent;
    const toolsDisplay = agent.tools ? agent.tools.join(', ') : '*';
    return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('File Path: ') }), _jsx(Text, { children: agent.filePath })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Tools: ') }), _jsx(Text, { children: toolsDisplay })] }), agent.model && (_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Model: ') }), _jsx(Text, { children: agent.model })] })), shouldShowColor(agent.color) && (_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, children: t('Color: ') }), _jsx(Text, { color: getColorForDisplay(agent.color), children: agent.color })] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Description:') }) }), _jsx(Box, { padding: 1, paddingBottom: 0, children: _jsx(Text, { wrap: "wrap", children: agent.description }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.primary, children: t('System Prompt:') }) }), _jsx(Box, { padding: 1, paddingBottom: 0, children: _jsx(Text, { wrap: "wrap", children: agent.systemPrompt }) })] }) }));
};
//# sourceMappingURL=AgentViewerStep.js.map