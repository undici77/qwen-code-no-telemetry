import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MCPServerStatus } from '@qwen-code/qwen-code-core';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
export const McpStatus = ({ servers, tools, prompts, blockedServers, serverStatus, authStatus, discoveryInProgress, connectingServers, showDescriptions, showSchema, showTips, }) => {
    const serverNames = Object.keys(servers);
    if (serverNames.length === 0 && blockedServers.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(Text, { children: t('No MCP servers configured.') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [discoveryInProgress && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: theme.status.warning, children: t('⏳ MCP servers are starting up ({{count}} initializing)...', {
                            count: String(connectingServers.length),
                        }) }), _jsx(Text, { color: theme.text.primary, children: t('Note: First startup may take longer. Tool availability will update automatically.') })] })), _jsx(Text, { bold: true, children: t('Configured MCP servers:') }), _jsx(Box, { height: 1 }), serverNames.map((serverName) => {
                const server = servers[serverName];
                const serverTools = tools.filter((tool) => tool.serverName === serverName);
                const serverPrompts = prompts.filter((prompt) => prompt.serverName === serverName);
                const originalStatus = serverStatus(serverName);
                const hasCachedItems = serverTools.length > 0 || serverPrompts.length > 0;
                const status = originalStatus === MCPServerStatus.DISCONNECTED && hasCachedItems
                    ? MCPServerStatus.CONNECTED
                    : originalStatus;
                let statusIndicator = '';
                let statusText = '';
                let statusColor = theme.text.primary;
                switch (status) {
                    case MCPServerStatus.CONNECTED:
                        statusIndicator = '🟢';
                        statusText = t('Ready');
                        statusColor = theme.status.success;
                        break;
                    case MCPServerStatus.CONNECTING:
                        statusIndicator = '🔄';
                        statusText = t('Starting... (first startup may take longer)');
                        statusColor = theme.status.warning;
                        break;
                    case MCPServerStatus.DISCONNECTED:
                    default:
                        statusIndicator = '🔴';
                        statusText = t('Disconnected');
                        statusColor = theme.status.error;
                        break;
                }
                let serverDisplayName = serverName;
                if (server.extensionName) {
                    serverDisplayName += ` ${t('(from {{extensionName}})', {
                        extensionName: server.extensionName,
                    })}`;
                }
                const toolCount = serverTools.length;
                const promptCount = serverPrompts.length;
                const parts = [];
                if (toolCount > 0) {
                    parts.push(toolCount === 1
                        ? t('{{count}} tool', { count: String(toolCount) })
                        : t('{{count}} tools', { count: String(toolCount) }));
                }
                if (promptCount > 0) {
                    parts.push(promptCount === 1
                        ? t('{{count}} prompt', { count: String(promptCount) })
                        : t('{{count}} prompts', { count: String(promptCount) }));
                }
                const serverAuthStatus = authStatus[serverName];
                let authStatusNode = null;
                if (serverAuthStatus === 'authenticated') {
                    authStatusNode = _jsxs(Text, { children: [" (", t('OAuth'), ")"] });
                }
                else if (serverAuthStatus === 'expired') {
                    authStatusNode = (_jsxs(Text, { color: theme.status.error, children: [" (", t('OAuth expired'), ")"] }));
                }
                else if (serverAuthStatus === 'unauthenticated') {
                    authStatusNode = (_jsxs(Text, { color: theme.status.warning, children: [' ', "(", t('OAuth not authenticated'), ")"] }));
                }
                return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: statusColor, children: [statusIndicator, " "] }), _jsx(Text, { bold: true, children: serverDisplayName }), _jsxs(Text, { children: [' - ', statusText, status === MCPServerStatus.CONNECTED &&
                                            parts.length > 0 &&
                                            ` (${parts.join(', ')})`] }), authStatusNode] }), status === MCPServerStatus.CONNECTING && (_jsxs(Text, { children: [" (", t('tools and prompts will appear when ready'), ")"] })), status === MCPServerStatus.DISCONNECTED && toolCount > 0 && (_jsxs(Text, { children: ["(", t('{{count}} tools cached', { count: String(toolCount) }), ")"] })), showDescriptions && server?.description && (_jsx(Text, { color: theme.text.secondary, children: server.description.trim() })), serverTools.length > 0 && (_jsxs(Box, { flexDirection: "column", marginLeft: 2, children: [_jsx(Text, { color: theme.text.primary, children: t('Tools:') }), serverTools.map((tool) => {
                                    const schemaContent = showSchema &&
                                        tool.schema &&
                                        (tool.schema.parametersJsonSchema || tool.schema.parameters)
                                        ? JSON.stringify(tool.schema.parametersJsonSchema ??
                                            tool.schema.parameters, null, 2)
                                        : null;
                                    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["- ", _jsx(Text, { color: theme.text.primary, children: tool.name })] }), showDescriptions && tool.description && (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: theme.text.secondary, children: tool.description.trim() }) })), schemaContent && (_jsxs(Box, { flexDirection: "column", marginLeft: 4, children: [_jsx(Text, { color: theme.text.secondary, children: t('Parameters:') }), _jsx(Text, { color: theme.text.secondary, children: schemaContent })] }))] }, tool.name));
                                })] })), serverPrompts.length > 0 && (_jsxs(Box, { flexDirection: "column", marginLeft: 2, children: [_jsx(Text, { color: theme.text.primary, children: t('Prompts:') }), serverPrompts.map((prompt) => (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["- ", _jsx(Text, { color: theme.text.primary, children: prompt.name })] }), showDescriptions && prompt.description && (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: theme.text.primary, children: prompt.description.trim() }) }))] }, prompt.name)))] }))] }, serverName));
            }), blockedServers.map((server) => (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: theme.status.error, children: "\uD83D\uDD34 " }), _jsxs(Text, { bold: true, children: [server.name, server.extensionName
                                ? ` ${t('(from {{extensionName}})', {
                                    extensionName: server.extensionName,
                                })}`
                                : ''] }), _jsxs(Text, { children: [" - ", t('Blocked')] })] }, server.name))), showTips && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.accent, children: t('💡 Tips:') }), _jsxs(Text, { children: ['  ', "- ", t('Use'), " ", _jsx(Text, { color: theme.text.accent, children: "/mcp desc" }), ' ', t('to show server and tool descriptions')] }), _jsxs(Text, { children: ['  ', "- ", t('Use'), ' ', _jsx(Text, { color: theme.text.accent, children: "/mcp schema" }), ' ', t('to show tool parameter schemas')] }), _jsxs(Text, { children: ['  ', "- ", t('Use'), ' ', _jsx(Text, { color: theme.text.accent, children: "/mcp nodesc" }), ' ', t('to hide descriptions')] }), _jsxs(Text, { children: ['  ', "- ", t('Use'), ' ', _jsx(Text, { color: theme.text.accent, children: "/mcp auth <server-name>" }), ' ', t('to authenticate with OAuth-enabled servers')] }), _jsxs(Text, { children: ['  ', "- ", t('Press'), " ", _jsx(Text, { color: theme.text.accent, children: "Ctrl+T" }), ' ', t('to toggle tool descriptions on/off')] })] }))] }));
};
//# sourceMappingURL=McpStatus.js.map