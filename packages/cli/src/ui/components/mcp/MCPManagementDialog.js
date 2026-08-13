import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { t } from '../../../i18n/index.js';
import { MCP_MANAGEMENT_STEPS } from './types.js';
import { ServerListStep } from './steps/ServerListStep.js';
import { ServerDetailStep } from './steps/ServerDetailStep.js';
import { ToolListStep } from './steps/ToolListStep.js';
import { ToolDetailStep } from './steps/ToolDetailStep.js';
import { ResourceListStep } from './steps/ResourceListStep.js';
import { ResourceDetailStep } from './steps/ResourceDetailStep.js';
import { DisableScopeSelectStep } from './steps/DisableScopeSelectStep.js';
import { AuthenticateStep } from './steps/AuthenticateStep.js';
import { useConfig } from '../../contexts/ConfigContext.js';
import { getMCPServerStatus, removeMCPServerStatus, addMCPStatusChangeListener, removeMCPStatusChangeListener, mcpServerRequiresOAuth, MCPServerStatus, DiscoveredMCPTool, MCPOAuthTokenStorage, isGatedMcpScope, createDebugLogger, matchesAnyServerPattern, } from '@qwen-code/qwen-code-core';
import { loadSettings, SettingScope } from '../../../config/settings.js';
import { loadMcpApprovals } from '../../../config/mcpApprovals.js';
import { isToolValid, getToolInvalidReasons } from './utils.js';
const debugLogger = createDebugLogger('MCP_DIALOG');
export const MCPManagementDialog = ({ onClose, }) => {
    const config = useConfig();
    const [servers, setServers] = useState([]);
    const [selectedServerIndex, setSelectedServerIndex] = useState(-1);
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [navigationStack, setNavigationStack] = useState([
        MCP_MANAGEMENT_STEPS.SERVER_LIST,
    ]);
    const [isLoading, setIsLoading] = useState(true);
    // Load MCP server data - extracted to a separate function for reuse
    const fetchServerData = useCallback(async () => {
        if (!config)
            return [];
        const mcpServers = config.getMcpServers() || {};
        const toolRegistry = config.getToolRegistry();
        const promptRegistry = config.getPromptRegistry();
        const resourceRegistry = config.getResourceRegistry();
        // Approval state is keyed by the same project root the approval dialog
        // writes under — `getWorkingDir()` (see useMcpApproval) — so the lookup
        // matches what discovery gated on.
        const approvals = loadMcpApprovals();
        const approvalRoot = config.getWorkingDir();
        const serverInfos = [];
        for (const [name, serverConfig] of Object.entries(mcpServers)) {
            const status = getMCPServerStatus(name);
            // Get tools for this server
            const allTools = toolRegistry?.getAllTools() || [];
            const serverTools = allTools.filter((t) => t instanceof DiscoveredMCPTool && t.serverName === name);
            // Get prompts for this server
            const allPrompts = promptRegistry?.getAllPrompts() || [];
            const serverPrompts = allPrompts.filter((p) => 'serverName' in p && p.serverName === name);
            // Get resources for this server
            const serverResources = resourceRegistry?.getResourcesByServer(name) || [];
            // Determine source type
            let source = 'user';
            if (serverConfig.extensionName) {
                source = 'extension';
            }
            else if (serverConfig.scope === 'project') {
                source = 'project';
            }
            else if (serverConfig.scope === 'workspace') {
                source = 'workspace';
            }
            else if (serverConfig.scope === 'system') {
                source = 'system';
            }
            // Use config.isMcpServerDisabled() to check if server is disabled
            const isDisabled = config.isMcpServerDisabled(name);
            // Count invalid tools (missing name or description)
            const invalidToolCount = serverTools.filter((t) => !t.name || !t.description).length;
            // Check if OAuth tokens exist for this server
            let hasOAuthTokens = false;
            try {
                const tokenStorage = new MCPOAuthTokenStorage();
                const credentials = await tokenStorage.getCredentials(name);
                hasOAuthTokens = credentials !== null;
            }
            catch {
                // Ignore errors when checking token existence
            }
            // Needs (re-)authentication: a 401 during connect, or OAuth declared
            // with no stored token. Only meaningful while not connected.
            const requiresAuth = status !== MCPServerStatus.CONNECTED &&
                (mcpServerRequiresOAuth.get(name) === true ||
                    (Boolean(serverConfig.oauth?.enabled) && !hasOAuthTokens));
            // Why a gated (#4615) server is skipped by discovery: `pending` (awaiting
            // a first/renewed approval) or `rejected`. Only gated scopes carry this;
            // `approved` (and all non-gated scopes) leave it undefined.
            let approvalState;
            if (isGatedMcpScope(serverConfig.scope)) {
                const state = approvals.getState(approvalRoot, name, serverConfig);
                if (state !== 'approved') {
                    approvalState = state;
                }
            }
            serverInfos.push({
                name,
                status,
                source,
                config: serverConfig,
                toolCount: serverTools.length,
                invalidToolCount,
                promptCount: serverPrompts.length,
                resourceCount: serverResources.length,
                isDisabled,
                hasOAuthTokens,
                requiresAuth,
                approvalState,
            });
        }
        return serverInfos;
    }, [config]);
    // Synchronously refresh status + needs-auth on a fetched snapshot.
    const restampStatus = useCallback((s) => {
        const status = getMCPServerStatus(s.name);
        return {
            ...s,
            status,
            requiresAuth: status === MCPServerStatus.CONNECTED
                ? false
                : mcpServerRequiresOAuth.get(s.name) === true || s.requiresAuth,
        };
    }, []);
    // Load MCP server data on initial render
    useEffect(() => {
        const loadServers = async () => {
            setIsLoading(true);
            try {
                const serverInfos = await fetchServerData();
                // Re-stamp statuses (and the status-derived needs-auth flag)
                // synchronously right before setState: a status change landing
                // during fetch's awaits would fire the listener against the OLD
                // state and then be overwritten by this snapshot.
                setServers(serverInfos.map(restampStatus));
            }
            catch (error) {
                debugLogger.error('Error loading MCP servers:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadServers();
    }, [fetchServerData, restampStatus]);
    // Live-update server rows (and the derived detail view) when a connection
    // status changes, e.g. a "connecting" server finishing.
    useEffect(() => {
        const listener = (serverName, status) => {
            if (status === undefined)
                return; // removals are handled by reloads
            setServers((prev) => prev.map((s) => s.name === serverName
                ? {
                    ...s,
                    status,
                    // Keep needs-auth in step with the live status: a connect
                    // proves auth works; a failure may have just set the 401
                    // marker (it is written before the DISCONNECTED event).
                    requiresAuth: status === MCPServerStatus.CONNECTED
                        ? false
                        : mcpServerRequiresOAuth.get(serverName) === true ||
                            s.requiresAuth,
                }
                : s));
        };
        addMCPStatusChangeListener(listener);
        return () => removeMCPStatusChangeListener(listener);
    }, []);
    // Selected server
    const selectedServer = useMemo(() => {
        if (selectedServerIndex >= 0 && selectedServerIndex < servers.length) {
            return servers[selectedServerIndex];
        }
        return null;
    }, [servers, selectedServerIndex]);
    // Current step
    const getCurrentStep = useCallback(() => navigationStack[navigationStack.length - 1] ||
        MCP_MANAGEMENT_STEPS.SERVER_LIST, [navigationStack]);
    // Navigation handlers
    const handleNavigateToStep = useCallback((step) => {
        setNavigationStack((prev) => [...prev, step]);
    }, []);
    const handleNavigateBack = useCallback(() => {
        setNavigationStack((prev) => {
            if (prev.length <= 1)
                return prev;
            return prev.slice(0, -1);
        });
    }, []);
    // Select server
    const handleSelectServer = useCallback((index) => {
        setSelectedServerIndex(index);
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.SERVER_DETAIL);
    }, [handleNavigateToStep]);
    // Get server tool list
    const getServerTools = useCallback(() => {
        if (!config || !selectedServer)
            return [];
        const toolRegistry = config.getToolRegistry();
        if (!toolRegistry)
            return [];
        const allTools = toolRegistry.getAllTools();
        const mcpTools = [];
        for (const tool of allTools) {
            if (tool instanceof DiscoveredMCPTool &&
                tool.serverName === selectedServer.name) {
                mcpTools.push(tool);
            }
        }
        return mcpTools.map((tool) => {
            // Check if tool is valid (has both name and description required by LLM)
            const isValid = isToolValid(tool.name, tool.description);
            let invalidReason;
            if (!isValid) {
                const reasons = getToolInvalidReasons(tool.name, tool.description);
                invalidReason = reasons.join(', ');
            }
            return {
                name: tool.name || t('(unnamed)'),
                description: tool.description,
                serverName: tool.serverName,
                schema: tool.parameterSchema,
                annotations: tool.annotations,
                isValid,
                invalidReason,
            };
        });
    }, [config, selectedServer]);
    // Get server resource list
    const getServerResources = useCallback(() => {
        if (!config || !selectedServer)
            return [];
        const resourceRegistry = config.getResourceRegistry();
        if (!resourceRegistry)
            return [];
        return resourceRegistry
            .getResourcesByServer(selectedServer.name)
            .map((resource) => ({
            uri: resource.uri,
            name: resource.name,
            title: resource.title,
            description: resource.description,
            mimeType: resource.mimeType,
            size: resource.size,
            serverName: resource.serverName,
        }));
    }, [config, selectedServer]);
    // View tool list
    const handleViewTools = useCallback(() => {
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.TOOL_LIST);
    }, [handleNavigateToStep]);
    // View resource list
    const handleViewResources = useCallback(() => {
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.RESOURCE_LIST);
    }, [handleNavigateToStep]);
    // Authenticate
    const handleAuthenticate = useCallback(() => {
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.AUTHENTICATE);
    }, [handleNavigateToStep]);
    // Select tool
    const handleSelectTool = useCallback((tool) => {
        setSelectedTool(tool);
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.TOOL_DETAIL);
    }, [handleNavigateToStep]);
    // Select resource
    const handleSelectResource = useCallback((resource) => {
        setSelectedResource(resource);
        handleNavigateToStep(MCP_MANAGEMENT_STEPS.RESOURCE_DETAIL);
    }, [handleNavigateToStep]);
    // Reload server data - uses the extracted fetchServerData function
    const reloadServers = useCallback(async () => {
        setIsLoading(true);
        try {
            const serverInfos = await fetchServerData();
            // Same synchronous re-stamp as the initial load (see comment there).
            setServers(serverInfos.map(restampStatus));
        }
        catch (error) {
            debugLogger.error('Error reloading MCP servers:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [fetchServerData, restampStatus]);
    // Clear OAuth authentication tokens and disconnect the server
    const handleClearAuth = useCallback(async () => {
        if (!config || !selectedServer)
            return;
        try {
            setIsLoading(true);
            const tokenStorage = new MCPOAuthTokenStorage();
            await tokenStorage.deleteCredentials(selectedServer.name);
            debugLogger.info(`Cleared OAuth tokens for server '${selectedServer.name}'`);
            // Disconnect the server so it no longer appears as connected
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                await toolRegistry.disconnectServer(selectedServer.name);
            }
            // Reload to update hasOAuthTokens flag and server status
            await reloadServers();
        }
        catch (error) {
            debugLogger.error(`Error clearing OAuth tokens for server '${selectedServer.name}':`, error);
        }
        finally {
            setIsLoading(false);
        }
    }, [config, selectedServer, reloadServers]);
    // Reconnect server
    const handleReconnect = useCallback(async () => {
        if (!config || !selectedServer)
            return;
        try {
            setIsLoading(true);
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                await toolRegistry.discoverToolsForServer(selectedServer.name);
            }
            // Reload server data to update status
            await reloadServers();
        }
        catch (error) {
            debugLogger.error(`Error reconnecting to server '${selectedServer.name}':`, error);
        }
        finally {
            setIsLoading(false);
        }
    }, [config, selectedServer, reloadServers]);
    const handleApprove = useCallback(async () => {
        if (!config || !selectedServer)
            return;
        try {
            setIsLoading(true);
            const approvals = loadMcpApprovals();
            const root = config.getWorkingDir();
            await approvals.setState(root, selectedServer.name, selectedServer.config, 'approved');
            config.approveMcpServerForSession(selectedServer.name);
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                await toolRegistry.discoverToolsForServer(selectedServer.name);
            }
            await reloadServers();
        }
        catch (error) {
            debugLogger.error(`Error approving server '${selectedServer.name}':`, error);
        }
        finally {
            setIsLoading(false);
        }
    }, [config, selectedServer, reloadServers]);
    // Enable server
    const handleEnableServer = useCallback(async () => {
        if (!config || !selectedServer)
            return;
        try {
            setIsLoading(true);
            const server = selectedServer;
            const settings = loadSettings();
            // Clear the extension-scoped disable flag, if any.
            const extensionName = server.config.extensionName;
            if (extensionName) {
                config
                    .getExtensionManager()
                    ?.setMcpServerDisabled(extensionName, server.name, false);
            }
            // Remove from user and workspace exclusion lists
            for (const scope of [SettingScope.User, SettingScope.Workspace]) {
                const scopeSettings = settings.forScope(scope).settings;
                const currentExcluded = scopeSettings.mcp?.excluded || [];
                if (currentExcluded.includes(server.name)) {
                    const newExcluded = currentExcluded.filter((name) => name !== server.name);
                    settings.setValue(scope, 'mcp.excluded', newExcluded);
                }
            }
            // Update runtime config exclusion list
            const currentExcluded = config.getExcludedMcpServers() || [];
            const newExcluded = currentExcluded.filter((name) => name !== server.name);
            config.setExcludedMcpServers(newExcluded);
            // Rediscover tools for this server
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                await toolRegistry.discoverToolsForServer(server.name);
            }
            // Reload server data
            await reloadServers();
        }
        catch (error) {
            debugLogger.error(`Error enabling server '${selectedServer.name}':`, error);
        }
        finally {
            setIsLoading(false);
        }
    }, [config, selectedServer, reloadServers]);
    // Handle disable/enable action
    const handleDisable = useCallback(async () => {
        if (!selectedServer)
            return;
        // If server is already disabled, enable it directly
        if (selectedServer.isDisabled) {
            void handleEnableServer();
        }
        else {
            // Automatically determine the scope and disable without showing selection dialog
            try {
                setIsLoading(true);
                const server = selectedServer;
                const settings = loadSettings();
                // Extension servers are disabled via the extension-scoped preference
                // instead of user/workspace mcp.excluded settings.
                if (server.source === 'extension') {
                    const extensionName = server.config.extensionName;
                    const manager = config.getExtensionManager();
                    if (!extensionName || !manager) {
                        debugLogger.warn(`Cannot disable extension MCP server '${server.name}'`);
                        setIsLoading(false);
                        return;
                    }
                    manager.setMcpServerDisabled(extensionName, server.name, true);
                    await config.getToolRegistry()?.disconnectServer(server.name);
                    // Drop the status entry so the footer health pill doesn't keep
                    // counting an intentionally disabled server as offline.
                    removeMCPServerStatus(server.name);
                    await reloadServers();
                    setIsLoading(false);
                    return;
                }
                // Determine the scope based on server configuration location
                let targetScope = 'user';
                if (server.source === 'project') {
                    targetScope = 'workspace';
                }
                // Get current exclusion list for the target scope
                const scopeSettings = settings.forScope(targetScope === 'user' ? SettingScope.User : SettingScope.Workspace).settings;
                const currentExcluded = scopeSettings.mcp?.excluded || [];
                // If server is not already covered by an exclusion pattern, add it
                if (!matchesAnyServerPattern(server.name, currentExcluded)) {
                    const newExcluded = [...currentExcluded, server.name];
                    settings.setValue(targetScope === 'user' ? SettingScope.User : SettingScope.Workspace, 'mcp.excluded', newExcluded);
                }
                // Use new disableMcpServer method to disable server
                const toolRegistry = config.getToolRegistry();
                if (toolRegistry) {
                    await toolRegistry.disableMcpServer(server.name);
                }
                // Reload server list
                await reloadServers();
            }
            catch (error) {
                debugLogger.error(`Error disabling server '${selectedServer.name}':`, error);
            }
            finally {
                setIsLoading(false);
            }
        }
    }, [selectedServer, handleEnableServer, config, reloadServers]);
    // Execute disable after selecting scope
    const handleSelectDisableScope = useCallback(async (scope) => {
        if (!config || !selectedServer)
            return;
        try {
            setIsLoading(true);
            const server = selectedServer;
            const settings = loadSettings();
            // Get current exclusion list
            const scopeSettings = settings.forScope(scope === 'user' ? SettingScope.User : SettingScope.Workspace).settings;
            const currentExcluded = scopeSettings.mcp?.excluded || [];
            // If server is not already covered by an exclusion pattern, add it
            if (!matchesAnyServerPattern(server.name, currentExcluded)) {
                const newExcluded = [...currentExcluded, server.name];
                settings.setValue(scope === 'user' ? SettingScope.User : SettingScope.Workspace, 'mcp.excluded', newExcluded);
            }
            // Use new disableMcpServer method to disable server
            const toolRegistry = config.getToolRegistry();
            if (toolRegistry) {
                await toolRegistry.disableMcpServer(server.name);
            }
            // Reload server list
            await reloadServers();
            // Return to server detail page
            handleNavigateBack();
        }
        catch (error) {
            debugLogger.error(`Error disabling server '${selectedServer.name}':`, error);
        }
        finally {
            setIsLoading(false);
        }
    }, [config, selectedServer, handleNavigateBack, reloadServers]);
    // Render step header
    const renderStepHeader = useCallback(() => {
        const currentStep = getCurrentStep();
        let headerText = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.accent, bold: true, children: t('Manage MCP servers') }), _jsxs(Text, { color: theme.text.secondary, children: [servers.length, " ", servers.length === 1 ? t('server') : t('servers')] })] }));
        switch (currentStep) {
            case MCP_MANAGEMENT_STEPS.SERVER_DETAIL:
                headerText = (_jsx(Box, { children: _jsx(Text, { color: theme.text.accent, bold: true, children: selectedServer?.name || t('Server Detail') }) }));
                break;
            case MCP_MANAGEMENT_STEPS.TOOL_LIST:
                headerText = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.accent, bold: true, children: t('Tools for {{serverName}}', {
                                serverName: selectedServer?.name || 'Server',
                            }) }), _jsxs(Text, { color: theme.text.secondary, children: ["(", getServerTools().length, ' ', getServerTools().length === 1 ? t('tool') : t('tools'), ")"] })] }));
                break;
            case MCP_MANAGEMENT_STEPS.TOOL_DETAIL:
                headerText = (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.text.accent, bold: true, children: selectedTool?.name || t('Tool Detail') }), selectedTool?.annotations?.destructiveHint && (_jsxs(Text, { color: theme.status.error, children: ["[", t('destructive'), "]"] })), selectedTool?.annotations?.idempotentHint && (_jsxs(Text, { color: theme.status.warning, children: ["[", t('idempotent'), "]"] })), selectedTool?.annotations?.readOnlyHint && (_jsxs(Text, { color: theme.status.success, children: ["[", t('read-only'), "]"] })), selectedTool?.annotations?.openWorldHint && (_jsxs(Text, { color: theme.text.primary, children: ["[", t('open-world'), "]"] }))] }), _jsx(Text, { color: theme.text.secondary, children: selectedTool?.serverName || t('Server') })] }));
                break;
            case MCP_MANAGEMENT_STEPS.RESOURCE_LIST:
                headerText = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.accent, bold: true, children: t('Resources for {{serverName}}', {
                                serverName: selectedServer?.name || 'Server',
                            }) }), _jsxs(Text, { color: theme.text.secondary, children: ["(", getServerResources().length, ' ', getServerResources().length === 1
                                    ? t('resource')
                                    : t('resources'), ")"] })] }));
                break;
            case MCP_MANAGEMENT_STEPS.RESOURCE_DETAIL:
                headerText = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.accent, bold: true, wrap: "truncate", children: selectedResource?.uri || t('Resource Detail') }), _jsx(Text, { color: theme.text.secondary, children: selectedResource?.serverName || t('Server') })] }));
                break;
            case MCP_MANAGEMENT_STEPS.AUTHENTICATE:
                headerText = (_jsx(Box, { children: _jsx(Text, { color: theme.text.accent, bold: true, children: t('OAuth Authentication') }) }));
                break;
            case MCP_MANAGEMENT_STEPS.SERVER_LIST:
            default:
                break;
        }
        return headerText;
    }, [
        getCurrentStep,
        selectedServer,
        selectedTool,
        selectedResource,
        getServerTools,
        getServerResources,
        servers,
    ]);
    // Render step content
    const renderStepContent = useCallback(() => {
        if (isLoading) {
            return _jsx(Text, { color: theme.text.secondary, children: t('Loading...') });
        }
        const currentStep = getCurrentStep();
        switch (currentStep) {
            case MCP_MANAGEMENT_STEPS.SERVER_LIST:
                return (_jsx(ServerListStep, { servers: servers, onSelect: handleSelectServer }));
            case MCP_MANAGEMENT_STEPS.SERVER_DETAIL:
                return (_jsx(ServerDetailStep, { server: selectedServer, onViewTools: handleViewTools, onViewResources: handleViewResources, onApprove: handleApprove, onReconnect: handleReconnect, onDisable: handleDisable, onAuthenticate: handleAuthenticate, onClearAuth: handleClearAuth, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.DISABLE_SCOPE_SELECT:
                return (_jsx(DisableScopeSelectStep, { server: selectedServer, onSelectScope: handleSelectDisableScope, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.TOOL_LIST:
                return (_jsx(ToolListStep, { tools: getServerTools(), serverName: selectedServer?.name || '', onSelect: handleSelectTool, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.TOOL_DETAIL:
                return (_jsx(ToolDetailStep, { tool: selectedTool, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.RESOURCE_LIST:
                return (_jsx(ResourceListStep, { resources: getServerResources(), serverName: selectedServer?.name || '', onSelect: handleSelectResource, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.RESOURCE_DETAIL:
                return (_jsx(ResourceDetailStep, { resource: selectedResource, onBack: handleNavigateBack }));
            case MCP_MANAGEMENT_STEPS.AUTHENTICATE:
                return (_jsx(AuthenticateStep, { server: selectedServer, onBack: () => {
                        handleNavigateBack();
                        void reloadServers();
                    } }));
            default:
                return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('Unknown step') }) }));
        }
    }, [
        isLoading,
        getCurrentStep,
        servers,
        selectedServer,
        selectedTool,
        selectedResource,
        handleSelectServer,
        handleViewTools,
        handleViewResources,
        handleReconnect,
        handleDisable,
        handleApprove,
        handleAuthenticate,
        handleClearAuth,
        handleNavigateBack,
        handleSelectTool,
        handleSelectResource,
        handleSelectDisableScope,
        getServerTools,
        getServerResources,
        reloadServers,
    ]);
    // Render step footer
    const renderStepFooter = useCallback(() => {
        const currentStep = getCurrentStep();
        let footerText = '';
        switch (currentStep) {
            case MCP_MANAGEMENT_STEPS.SERVER_LIST:
                if (servers.length === 0) {
                    footerText = t('Esc to close');
                }
                else {
                    footerText = t('↑↓ to navigate · Enter to select · Esc to close');
                }
                break;
            case MCP_MANAGEMENT_STEPS.SERVER_DETAIL:
                footerText = t('↑↓ to navigate · Enter to select · Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.DISABLE_SCOPE_SELECT:
                footerText = t('↑↓ to navigate · Enter to confirm · Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.TOOL_LIST:
                footerText = t('↑↓ to navigate · Enter to select · Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.TOOL_DETAIL:
                footerText = t('Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.RESOURCE_LIST:
                footerText = t('↑↓ to navigate · Enter to select · Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.RESOURCE_DETAIL:
                footerText = t('Esc to back');
                break;
            case MCP_MANAGEMENT_STEPS.AUTHENTICATE:
                footerText = t('Esc to go back');
                break;
            default:
                footerText = t('Esc to close');
        }
        return (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: footerText }) }));
    }, [getCurrentStep, servers.length]);
    // ESC key handler - only close dialog, child components handle back navigation to avoid duplicate triggers
    useKeypress((key) => {
        if (key.name === 'escape' &&
            getCurrentStep() === MCP_MANAGEMENT_STEPS.SERVER_LIST) {
            onClose();
        }
    }, { isActive: true });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", gap: 1, padding: 1, width: "100%", children: [renderStepHeader(), renderStepContent(), renderStepFooter()] }));
};
//# sourceMappingURL=MCPManagementDialog.js.map