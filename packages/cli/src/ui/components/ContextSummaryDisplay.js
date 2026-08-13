import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import {} from '@qwen-code/qwen-code-core';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { t } from '../../i18n/index.js';
export const ContextSummaryDisplay = ({ geminiMdFileCount, contextFileNames, mcpServers, blockedMcpServers, showToolDescriptions, ideContext, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    const mcpServerCount = Object.keys(mcpServers || {}).length;
    const blockedMcpServerCount = blockedMcpServers?.length || 0;
    const openFileCount = ideContext?.workspaceState?.openFiles?.length ?? 0;
    if (geminiMdFileCount === 0 &&
        mcpServerCount === 0 &&
        blockedMcpServerCount === 0 &&
        openFileCount === 0) {
        return _jsx(Text, { children: " " }); // Render an empty space to reserve height
    }
    const openFilesText = (() => {
        if (openFileCount === 0) {
            return '';
        }
        const fileText = openFileCount === 1
            ? t('{{count}} open file', { count: String(openFileCount) })
            : t('{{count}} open files', { count: String(openFileCount) });
        return `${fileText} ${t('(ctrl+g to view)')}`;
    })();
    const geminiMdText = (() => {
        if (geminiMdFileCount === 0) {
            return '';
        }
        const allNamesTheSame = new Set(contextFileNames).size < 2;
        const name = allNamesTheSame ? contextFileNames[0] : 'context';
        return geminiMdFileCount === 1
            ? t('{{count}} {{name}} file', {
                count: String(geminiMdFileCount),
                name,
            })
            : t('{{count}} {{name}} files', {
                count: String(geminiMdFileCount),
                name,
            });
    })();
    const mcpText = (() => {
        if (mcpServerCount === 0 && blockedMcpServerCount === 0) {
            return '';
        }
        const parts = [];
        if (mcpServerCount > 0) {
            const serverText = mcpServerCount === 1
                ? t('{{count}} MCP server', { count: String(mcpServerCount) })
                : t('{{count}} MCP servers', { count: String(mcpServerCount) });
            parts.push(serverText);
        }
        if (blockedMcpServerCount > 0) {
            let blockedText = t('{{count}} Blocked', {
                count: String(blockedMcpServerCount),
            });
            if (mcpServerCount === 0) {
                const serverText = blockedMcpServerCount === 1
                    ? t('{{count}} MCP server', {
                        count: String(blockedMcpServerCount),
                    })
                    : t('{{count}} MCP servers', {
                        count: String(blockedMcpServerCount),
                    });
                blockedText += ` ${serverText}`;
            }
            parts.push(blockedText);
        }
        let text = parts.join(', ');
        // Add ctrl+t hint when MCP servers are available
        if (mcpServers && Object.keys(mcpServers).length > 0) {
            if (showToolDescriptions) {
                text += ` ${t('(ctrl+t to toggle)')}`;
            }
            else {
                text += ` ${t('(ctrl+t to view)')}`;
            }
        }
        return text;
    })();
    const summaryParts = [openFilesText, geminiMdText, mcpText].filter(Boolean);
    if (isNarrow) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Using:') }), summaryParts.map((part, index) => (_jsxs(Text, { color: theme.text.secondary, children: ['  ', "- ", part] }, index)))] }));
    }
    return (_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: [t('Using:'), " ", summaryParts.join(' | ')] }) }));
};
//# sourceMappingURL=ContextSummaryDisplay.js.map