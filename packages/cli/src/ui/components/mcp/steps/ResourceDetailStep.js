import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
import { buildMcpResourceRef } from '../../../hooks/mcpResourceRef.js';
const LABEL_WIDTH = 15;
export const ResourceDetailStep = ({ resource, onBack, isActive = true, }) => {
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
    }, { isActive });
    if (!resource) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No resource selected') }) }));
    }
    // 与 URI 不同时才展示友好名称，避免重复信息。
    const friendlyName = resource.title || resource.name;
    const showName = friendlyName && friendlyName !== resource.uri;
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('URI:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: resource.uri }) })] }), showName && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Name:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: friendlyName }) })] })), resource.mimeType && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('MIME Type:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "truncate", children: resource.mimeType }) })] })), typeof resource.size === 'number' && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Size:') }) }), _jsx(Box, { children: _jsx(Text, { children: t('{{count}} bytes', { count: String(resource.size) }) }) })] }))] }), resource.description && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.text.primary, bold: true, children: [t('Description'), ":"] }), _jsx(Text, { wrap: "wrap", children: resource.description })] })), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: theme.text.primary, bold: true, children: [t('Reference in chat'), ":"] }), _jsxs(Text, { color: theme.text.accent, children: ["@", buildMcpResourceRef(resource.serverName, resource.uri)] })] })] }));
};
//# sourceMappingURL=ResourceDetailStep.js.map