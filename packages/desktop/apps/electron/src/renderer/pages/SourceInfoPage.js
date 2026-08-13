import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SourceInfoPage
 *
 * Displays source details including connection info, authentication status,
 * documentation (guide.md), and metadata. View-only.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover';
import { SourceAvatar } from '@/components/ui/source-avatar';
import { SourceMenu } from '@/components/app-shell/SourceMenu';
import { cn } from '@/lib/utils';
import { routes, navigate } from '@/lib/navigate';
import { useNavigation } from '@/contexts/NavigationContext';
import { toast } from 'sonner';
import { Info_Page, Info_Section, Info_Table, Info_Alert, Info_Markdown, PermissionsDataTable, ToolsDataTable, } from '@/components/info';
import { isIconUrl } from '@craft-agent/shared/utils/icon-constants';
/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp, t) {
    if (!timestamp)
        return t('common.never');
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return t('common.justNow');
    if (minutes < 60)
        return t('time.minutesAgo', { count: minutes });
    if (hours < 24)
        return t('time.hoursAgo', { count: hours });
    return t('time.daysAgo', { count: days });
}
/**
 * Get source URL for display
 */
function getSourceUrl(source) {
    const { type, mcp, api, local } = source.config;
    if (type === 'mcp' && mcp?.url)
        return mcp.url;
    if (type === 'api' && api?.baseUrl)
        return api.baseUrl;
    if (type === 'local' && local?.path)
        return local.path;
    return null;
}
/**
 * Convert permissions config to PermissionRow[] for API/local sources
 */
function buildApiPermissionsData(config) {
    const rows = [];
    // Blocked Tools
    config.blockedTools?.forEach((item) => {
        const pattern = typeof item === 'string' ? item : item.pattern;
        const comment = typeof item === 'string' ? null : item.comment;
        rows.push({ access: 'blocked', type: 'tool', pattern, comment });
    });
    // Allowed Bash Patterns
    config.allowedBashPatterns?.forEach((item) => {
        const pattern = typeof item === 'string' ? item : item.pattern;
        const comment = typeof item === 'string' ? null : item.comment;
        rows.push({ access: 'allowed', type: 'bash', pattern, comment });
    });
    // Allowed API Endpoints
    config.allowedApiEndpoints?.forEach((item) => {
        const pattern = `${item.method} ${item.path}`;
        const comment = typeof item === 'object' && 'comment' in item ? item.comment : null;
        rows.push({ access: 'allowed', type: 'api', pattern, comment });
    });
    return rows;
}
/**
 * Convert permissions config to PermissionRow[] for MCP sources
 */
function buildMcpPermissionsData(config) {
    const rows = [];
    // Blocked Tools
    config.blockedTools?.forEach((item) => {
        const pattern = typeof item === 'string' ? item : item.pattern;
        const comment = typeof item === 'string' ? null : item.comment;
        rows.push({ access: 'blocked', type: 'mcp', pattern, comment });
    });
    // Allowed MCP Patterns
    config.allowedMcpPatterns?.forEach((item) => {
        const pattern = typeof item === 'string' ? item : item.pattern;
        const comment = typeof item === 'string' ? null : item.comment;
        rows.push({ access: 'allowed', type: 'mcp', pattern, comment });
    });
    return rows;
}
/**
 * Convert MCP tools to ToolRow[]
 */
function buildToolsData(tools) {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '',
        permission: tool.allowed ? 'allowed' : 'requires-permission',
    }));
}
/**
 * Get contextual description for Connection section based on source type
 */
function getConnectionDescription(source, t) {
    const { type, mcp } = source.config;
    if (type === 'mcp') {
        if (mcp?.transport === 'stdio') {
            return t('sourceInfo.localCommand');
        }
        return t('sourceInfo.serverUrl');
    }
    if (type === 'api') {
        return t('sourceInfo.baseUrl');
    }
    if (type === 'local') {
        return t('sourceInfo.filesystemPath');
    }
    return t('sourceInfo.connectionDetails');
}
/**
 * Get contextual description for Permissions section based on source type
 */
function getPermissionsDescription(source, t) {
    const { type } = source.config;
    if (type === 'mcp') {
        return t('sourceInfo.toolPatternsAllowed');
    }
    if (type === 'api') {
        return t('sourceInfo.apiEndpointsAllowed');
    }
    return t('sourceInfo.accessRules');
}
export default function SourceInfoPage({ sourceSlug, workspaceId, onDelete }) {
    const { t } = useTranslation();
    const { navigateToSource } = useNavigation();
    const [source, setSource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissionsConfig, setPermissionsConfig] = useState(null);
    const [mcpTools, setMcpTools] = useState(null);
    const [mcpToolsLoading, setMcpToolsLoading] = useState(false);
    const [mcpToolsError, setMcpToolsError] = useState(null);
    const [localMcpEnabled, setLocalMcpEnabled] = useState(true);
    // Load source data
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        const loadSource = async () => {
            try {
                const sources = await window.electronAPI.getSources(workspaceId);
                if (!isMounted)
                    return;
                const found = sources.find((s) => s.config.slug === sourceSlug);
                if (found) {
                    setSource(found);
                    const config = await window.electronAPI.getSourcePermissionsConfig(workspaceId, sourceSlug);
                    if (isMounted) {
                        setPermissionsConfig(config);
                    }
                }
                else {
                    setError(t('sourceInfo.notFound'));
                }
            }
            catch (err) {
                if (!isMounted)
                    return;
                setError(err instanceof Error ? err.message : t('sourceInfo.failedToLoad'));
            }
            finally {
                if (isMounted)
                    setLoading(false);
            }
        };
        loadSource();
        return () => {
            isMounted = false;
        };
    }, [workspaceId, sourceSlug]);
    // Load MCP tools when source is loaded and is MCP type
    useEffect(() => {
        if (!source || source.config.type !== 'mcp') {
            setMcpTools(null);
            setMcpToolsError(null);
            return;
        }
        let isMounted = true;
        setMcpToolsLoading(true);
        setMcpToolsError(null);
        const loadTools = async () => {
            try {
                const result = await window.electronAPI.getMcpTools(workspaceId, sourceSlug);
                if (!isMounted)
                    return;
                if (result.success && result.tools) {
                    setMcpTools(result.tools);
                }
                else {
                    setMcpToolsError(result.error || t('sourceInfo.failedToLoadTools'));
                }
            }
            catch (err) {
                if (!isMounted)
                    return;
                setMcpToolsError(err instanceof Error ? err.message : t('sourceInfo.failedToLoadTools'));
            }
            finally {
                if (isMounted)
                    setMcpToolsLoading(false);
            }
        };
        loadTools();
        return () => {
            isMounted = false;
        };
    }, [source, workspaceId, sourceSlug]);
    // Load workspace settings (for localMcpEnabled)
    useEffect(() => {
        if (!workspaceId)
            return;
        window.electronAPI.getWorkspaceSettings(workspaceId).then((settings) => {
            if (settings) {
                setLocalMcpEnabled(settings.localMcpEnabled ?? true);
            }
        }).catch((err) => {
            console.error('[SourceInfoPage] Failed to load workspace settings:', err);
        });
    }, [workspaceId]);
    // Listen for source folder changes
    useEffect(() => {
        if (!window.electronAPI?.onSourcesChanged)
            return;
        const cleanup = window.electronAPI.onSourcesChanged((changedWorkspaceId, sources) => {
            if (changedWorkspaceId !== workspaceId)
                return;
            const updated = sources.find((s) => s.config.slug === sourceSlug);
            if (updated) {
                setSource(updated);
                const loadPermissionsConfig = async () => {
                    try {
                        const config = await window.electronAPI.getSourcePermissionsConfig(workspaceId, sourceSlug);
                        setPermissionsConfig(config);
                    }
                    catch (err) {
                        console.error('[SourceInfoPage] Failed to reload permissions config:', err);
                    }
                };
                loadPermissionsConfig();
            }
        });
        return cleanup;
    }, [sourceSlug, workspaceId]);
    // Compute source URL
    const sourceUrl = useMemo(() => source ? getSourceUrl(source) : null, [source]);
    // Build data for PermissionsDataTable
    const apiPermissionsData = useMemo(() => {
        if (!permissionsConfig || source?.config.type === 'mcp')
            return [];
        return buildApiPermissionsData(permissionsConfig);
    }, [permissionsConfig, source]);
    const mcpPermissionsData = useMemo(() => {
        if (!permissionsConfig || source?.config.type !== 'mcp')
            return [];
        return buildMcpPermissionsData(permissionsConfig);
    }, [permissionsConfig, source]);
    // Build data for ToolsDataTable
    const toolsData = useMemo(() => {
        if (!mcpTools)
            return [];
        return buildToolsData(mcpTools);
    }, [mcpTools]);
    // Handle opening URL (website or folder)
    const handleOpenUrl = useCallback(async () => {
        if (!source || !sourceUrl)
            return;
        if (window.electronAPI) {
            if (isIconUrl(sourceUrl)) {
                await window.electronAPI.openUrl(sourceUrl);
            }
            else {
                await window.electronAPI.showInFolder(sourceUrl);
            }
        }
    }, [source, sourceUrl]);
    // Handle opening source folder
    const handleOpenSourceFolder = useCallback(async () => {
        if (!source)
            return;
        if (window.electronAPI) {
            await window.electronAPI.showInFolder(source.folderPath);
        }
    }, [source]);
    // Handle deleting source (navigates to source list, preserving current filter)
    const handleDelete = useCallback(async () => {
        if (!source)
            return;
        try {
            await window.electronAPI.deleteSource(workspaceId, sourceSlug);
            toast.success(t('sourceInfo.deletedSource', { name: source.config.name }));
            navigateToSource(); // Navigate to source list, preserving filter
            onDelete?.();
        }
        catch (err) {
            toast.error(t('sourceInfo.failedToDelete'), {
                description: err instanceof Error ? err.message : undefined,
            });
        }
    }, [source, workspaceId, sourceSlug, onDelete, navigateToSource]);
    // Handle opening in new window
    const handleOpenInNewWindow = useCallback(() => {
        window.electronAPI.openUrl(`craftagents://sources/source/${sourceSlug}?window=focused`);
    }, [sourceSlug]);
    // Get source name for header
    const sourceName = source?.config.name || sourceSlug;
    return (_jsxs(Info_Page, { loading: loading, error: error ?? undefined, empty: !source && !loading && !error ? t('sourceInfo.notFound') : undefined, children: [_jsx(Info_Page.Header, { title: sourceName, titleMenu: _jsx(SourceMenu, { sourceSlug: sourceSlug, sourceName: sourceName, onOpenInNewWindow: handleOpenInNewWindow, onShowInFinder: handleOpenSourceFolder, onDelete: handleDelete }) }), source && (_jsxs(Info_Page.Content, { children: [_jsx(Info_Page.Hero, { avatar: _jsx(SourceAvatar, { source: source, fluid: true }), title: source.config.name, tagline: source.config.tagline }), source.config.mcp?.transport === 'stdio' && !localMcpEnabled && (_jsxs(Info_Alert, { variant: "warning", icon: _jsx(AlertCircle, { className: "h-4 w-4" }), children: [_jsx(Info_Alert.Title, { children: t('sourceInfo.sourceDisabled') }), _jsx(Info_Alert.Description, { children: t('sourceInfo.localMcpDisabled') })] })), _jsx(Info_Section, { title: t('sourceInfo.connection'), description: getConnectionDescription(source, t), actions: 
                        // EditPopover for AI-assisted config.json editing with "Edit File" as secondary action
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('source-config', source.folderPath), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${source.folderPath}/config.json`,
                            } }), children: _jsxs(Info_Table, { footer: source.config.connectionError && (_jsx("div", { className: "px-4 py-2 border-t border-border/30 bg-destructive/5", children: _jsxs("div", { className: "flex items-start gap-2 text-sm text-destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4 shrink-0 mt-0.5" }), _jsx("span", { children: source.config.connectionError })] }) })), children: [_jsx(Info_Table.Row, { label: t('common.type'), value: source.config.type.toUpperCase() }), sourceUrl && (_jsx(Info_Table.Row, { label: t('common.url'), children: _jsx("button", { onClick: handleOpenUrl, className: "truncate hover:underline text-foreground focus:outline-none focus-visible:underline text-left block w-full", children: sourceUrl }) })), _jsx(Info_Table.Row, { label: t('sourceInfo.lastTested'), value: formatRelativeTime(source.config.lastTestedAt, t) })] }) }), source.config.type !== 'mcp' && permissionsConfig && apiPermissionsData.length > 0 && (_jsx(Info_Section, { title: t('sourceInfo.permissions'), description: getPermissionsDescription(source, t), actions: 
                        // EditPopover for AI-assisted permissions.json editing
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('source-permissions', source.folderPath), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${source.folderPath}/permissions.json`,
                            } }), children: _jsx(PermissionsDataTable, { data: apiPermissionsData, fullscreen: true, fullscreenTitle: "Permissions" }) })), source.config.type === 'mcp' && (_jsx(Info_Section, { title: t('sourceInfo.tools'), description: t('sourceInfo.toolsDesc'), actions: 
                        // EditPopover for AI-assisted tool permissions editing
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('source-tool-permissions', source.folderPath), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${source.folderPath}/permissions.json`,
                            } }), children: _jsx(ToolsDataTable, { data: toolsData, loading: mcpToolsLoading, error: mcpToolsError ?? undefined }) })), source.config.type === 'mcp' && permissionsConfig && mcpPermissionsData.length > 0 && (_jsx(Info_Section, { title: t('sourceInfo.permissions'), description: getPermissionsDescription(source, t), actions: 
                        // EditPopover for AI-assisted permissions.json editing
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('source-permissions', source.folderPath), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${source.folderPath}/permissions.json`,
                            } }), children: _jsx(PermissionsDataTable, { data: mcpPermissionsData, hideTypeColumn: true, fullscreen: true, fullscreenTitle: "Permissions" }) })), source.guide?.raw && (_jsx(Info_Section, { title: t('sourceInfo.documentation'), description: t('sourceInfo.documentationDesc'), actions: 
                        // EditPopover for AI-assisted guide.md editing with "Edit File" as secondary action
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('source-guide', source.folderPath), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${source.folderPath}/guide.md`,
                            } }), children: _jsx(Info_Markdown, { maxHeight: 540, fullscreen: true, children: source.guide.raw }) }))] }))] }));
}
//# sourceMappingURL=SourceInfoPage.js.map