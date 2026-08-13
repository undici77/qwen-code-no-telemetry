import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMcp } from '@qwen-code/webui/daemon-react-sdk';
import { useDelayedGlobalKeyDown } from '../../hooks/useDelayedGlobalKeyDown';
import { useI18n } from '../../i18n';
import { extractErrorDetail } from '../../utils/errorDetail';
import { createSentinelSerializer } from '../../utils/sentinelMessage';
import styles from './McpStatusMessage.module.css';
const ACTIVE_EVENT = 'web-shell:mcp-panel-active';
const VISIBLE_TOOLS_COUNT = 10;
const { serialize: serializeMcpStatusMessage, parse: parseRawMcpStatusMessage, } = createSentinelSerializer('web-shell:mcp-status:v1:');
function parseMcpStatusMessage(content) {
    const parsed = parseRawMcpStatusMessage(content);
    if (!parsed || !parsed.status)
        return null;
    return parsed;
}
export { serializeMcpStatusMessage, parseMcpStatusMessage, };
function statusDisplay(server, t) {
    if (server.disabled) {
        return {
            icon: '✗',
            text: t('mcp.status.disabled'),
            className: styles.error,
        };
    }
    if (server.approvalState === 'pending') {
        return {
            icon: '!',
            text: t('mcp.status.needsApproval'),
            className: styles.warning,
        };
    }
    if (server.approvalState === 'rejected') {
        return {
            icon: '✗',
            text: t('mcp.status.rejected'),
            className: styles.warning,
        };
    }
    switch (server.mcpStatus) {
        case 'connected':
            return {
                icon: '✓',
                text: t('mcp.status.connected'),
                className: styles.success,
            };
        case 'connecting':
            return {
                icon: '🔄',
                text: t('mcp.status.starting'),
                className: styles.warning,
            };
        case 'disconnected':
        default:
            return {
                icon: '🔴',
                text: t('mcp.status.disconnectedTitle'),
                className: styles.error,
            };
    }
}
function schemaObject(tool) {
    const schema = tool.schema;
    const content = schema?.parametersJsonSchema ?? schema?.parameters ?? schema;
    return content && typeof content === 'object'
        ? content
        : null;
}
function schemaContent(tool) {
    const schema = schemaObject(tool);
    return schema ? JSON.stringify(schema, null, 2) : '';
}
function serverGroupLabel(server, t) {
    return server.extensionName ? t('mcp.extensionMcp') : t('mcp.userMcp');
}
function sourceLabel(server, t) {
    const legacySource = server.source;
    if (server.configOrigin === 'project_mcp_json' ||
        (legacySource === 'project' && server.removable === false)) {
        return t('mcp.source.project');
    }
    if (server.configOrigin === 'workspace_settings' ||
        legacySource === 'workspace' ||
        legacySource === 'project') {
        return t('mcp.source.workspace');
    }
    if (server.configOrigin === 'extension' || server.extensionName) {
        return t('mcp.source.extension');
    }
    return t('mcp.source.user');
}
function formatServerCommand(server, t) {
    const config = server.config;
    if (config?.httpUrl)
        return `${config.httpUrl} (http)`;
    if (config?.url)
        return `${config.url} (sse)`;
    if (config?.command) {
        const args = config.args?.join(' ') ?? '';
        return `${config.command} ${args} (stdio)`.trim();
    }
    return server.transport ? `(${server.transport})` : t('mcp.status.unknown');
}
function toolAnnotationText(tool, t) {
    const annotations = tool.annotations ?? {};
    const labels = [];
    if (annotations['destructiveHint'])
        labels.push(t('mcp.annotation.destructive'));
    if (annotations['readOnlyHint'])
        labels.push(t('mcp.annotation.readOnly'));
    if (annotations['openWorldHint'])
        labels.push(t('mcp.annotation.openWorld'));
    if (annotations['idempotentHint'])
        labels.push(t('mcp.annotation.idempotent'));
    return labels.join(', ');
}
function dispatchActive(id, active) {
    window.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: { id, active } }));
}
function oauthAuthMessage(serverName, t, detail) {
    return [
        `${t('mcp.oauth.server')}: ${serverName}`,
        '',
        t('mcp.oauth.starting', { name: serverName }),
        ...(detail ? ['', detail] : []),
    ].join('\n');
}
function requiredMarker(required, t) {
    return required ? t('mcp.required') : '';
}
function schemaSummary(tool, t) {
    const schema = schemaObject(tool);
    const properties = schema?.['properties'];
    const required = Array.isArray(schema?.['required'])
        ? new Set(schema['required'].filter((name) => typeof name === 'string'))
        : new Set();
    if (!properties || typeof properties !== 'object') {
        const raw = schemaContent(tool);
        return raw ? _jsx("pre", { className: styles.schema, children: raw }) : null;
    }
    const entries = Object.entries(properties);
    if (entries.length === 0)
        return null;
    return (_jsxs("div", { className: styles.parameters, children: [_jsx("div", { className: styles.sectionTitle, children: t('mcp.parameters') }), entries.map(([name, param]) => {
                const details = param && typeof param === 'object'
                    ? param
                    : {};
                const type = typeof details['type'] === 'string' ? details['type'] : 'any';
                const description = typeof details['description'] === 'string'
                    ? details['description']
                    : '';
                return (_jsx("div", { className: styles.parameterRow, children: `• ${name}${requiredMarker(required.has(name), t)}: ${type}${description ? ` - ${description}` : ''}` }, name));
            })] }));
}
export function McpStatusMessage({ message, }) {
    const { t } = useI18n();
    const mcp = useMcp({ autoLoad: false });
    const [localStatus, setLocalStatus] = useState(message.status);
    const [localToolsByServer, setLocalToolsByServer] = useState(message.toolsByServer);
    const [actionMessage, setActionMessage] = useState(null);
    const [busy, setBusy] = useState(false);
    const panelIdRef = useRef(`mcp-${Math.random().toString(36).slice(2)}`);
    const [isOpen, setIsOpen] = useState(true);
    const [step, setStep] = useState('servers');
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    const [selectedServerActionIndex, setSelectedServerActionIndex] = useState(0);
    const [selectedToolIndex, setSelectedToolIndex] = useState(0);
    const servers = useMemo(() => localStatus.servers ?? [], [localStatus.servers]);
    const selectedServer = servers[selectedServerIndex] ?? null;
    const selectedTools = useMemo(() => selectedServer
        ? (localToolsByServer[selectedServer.name]?.tools ?? [])
        : [], [selectedServer, localToolsByServer]);
    const selectedTool = selectedTools[selectedToolIndex] ?? null;
    const toolScrollOffset = useMemo(() => {
        if (selectedTools.length <= VISIBLE_TOOLS_COUNT)
            return 0;
        if (selectedToolIndex < VISIBLE_TOOLS_COUNT - 1)
            return 0;
        return Math.min(selectedToolIndex - VISIBLE_TOOLS_COUNT + 1, selectedTools.length - VISIBLE_TOOLS_COUNT);
    }, [selectedToolIndex, selectedTools.length]);
    const visibleTools = useMemo(() => selectedTools.slice(toolScrollOffset, toolScrollOffset + VISIBLE_TOOLS_COUNT), [selectedTools, toolScrollOffset]);
    const connectingCount = servers.filter((server) => !server.disabled && server.mcpStatus === 'connecting').length;
    const groupedServers = useMemo(() => {
        const groups = [];
        for (const server of servers) {
            const label = serverGroupLabel(server, t);
            const group = groups.find((candidate) => candidate.label === label);
            if (group) {
                group.servers.push(server);
            }
            else {
                groups.push({ label, servers: [server] });
            }
        }
        return groups;
    }, [servers, t]);
    const serverNameWidth = useMemo(() => {
        if (servers.length === 0)
            return 20;
        return Math.min(Math.max(...servers.map((server) => server.name.length)) + 2, 35);
    }, [servers]);
    const toolNameWidth = useMemo(() => {
        if (selectedTools.length === 0)
            return 30;
        return Math.min(Math.max(...selectedTools.map((tool) => tool.name.length)) + 2, 50);
    }, [selectedTools]);
    const serverActions = useMemo(() => {
        if (!selectedServer)
            return [];
        const actions = [];
        const awaitingApproval = Boolean(selectedServer.approvalState);
        if (!selectedServer.disabled &&
            !awaitingApproval &&
            selectedTools.length > 0) {
            actions.push({ id: 'view-tools', label: t('mcp.action.tools') });
        }
        if (!selectedServer.disabled &&
            !awaitingApproval &&
            selectedServer.mcpStatus === 'disconnected') {
            actions.push({ id: 'reconnect', label: t('mcp.action.reconnect') });
        }
        if (!selectedServer.disabled && awaitingApproval) {
            actions.push({ id: 'approve', label: t('mcp.action.approve') });
        }
        const extensionManaged = selectedServer.configOrigin === 'extension' ||
            selectedServer.source === 'extension' ||
            Boolean(selectedServer.extensionName);
        if (!extensionManaged || selectedServer.disabled) {
            actions.push({
                id: selectedServer.disabled ? 'enable' : 'disable',
                label: selectedServer.disabled
                    ? t('mcp.action.enable')
                    : t('mcp.action.disable'),
            });
        }
        if (!selectedServer.disabled && !awaitingApproval) {
            actions.push({
                id: 'authenticate',
                label: selectedServer.hasOAuthTokens
                    ? t('mcp.action.reauth')
                    : t('mcp.action.auth'),
            });
            if (selectedServer.hasOAuthTokens) {
                actions.push({
                    id: 'clear-auth',
                    label: t('mcp.action.clearAuth'),
                });
            }
        }
        return actions;
    }, [selectedServer, selectedTools.length, t]);
    const reloadSelectedServer = useCallback(async () => {
        const nextStatus = await mcp.reload();
        if (nextStatus) {
            setLocalStatus(nextStatus);
            const nextServer = nextStatus.servers?.find((server) => server.name === selectedServer?.name) ?? null;
            if (nextServer) {
                if (nextServer.approvalState)
                    return;
                const nextTools = await mcp.loadTools(nextServer.name);
                setLocalToolsByServer((current) => ({
                    ...current,
                    [nextServer.name]: nextTools,
                }));
            }
        }
    }, [mcp, selectedServer?.name]);
    const runServerAction = useCallback(async (action) => {
        if (!selectedServer || action.disabled || busy)
            return;
        if (action.id === 'view-tools') {
            setStep('tools');
            setSelectedToolIndex(0);
            setActionMessage(null);
            return;
        }
        setBusy(true);
        if (action.id === 'authenticate') {
            setStep('oauth');
        }
        setActionMessage(action.id === 'authenticate'
            ? oauthAuthMessage(selectedServer.name, t)
            : t('mcp.action.running', { action: action.label }));
        try {
            let nextActionMessage = null;
            if (action.id === 'reconnect') {
                const result = await mcp.restartServer(selectedServer.name);
                if ('restarted' in result && !result.restarted) {
                    throw new Error(t('mcp.reconnect.skipped', { reason: result.reason }));
                }
                if ('entries' in result &&
                    (result.entries.length === 0 ||
                        result.entries.every((entry) => !entry.restarted))) {
                    throw new Error(t('mcp.reconnect.skipped', {
                        reason: result.entries
                            .map((entry) => entry.reason)
                            .filter(Boolean)
                            .join(', ') || 'not connected',
                    }));
                }
            }
            else {
                const result = await mcp.manageServer(selectedServer.name, action.id);
                const details = [
                    ...(result.messages ?? []),
                    ...(result.authUrl ? [result.authUrl] : []),
                ].join('\n');
                if (details) {
                    nextActionMessage =
                        action.id === 'authenticate'
                            ? oauthAuthMessage(selectedServer.name, t, details)
                            : details;
                }
            }
            await reloadSelectedServer();
            setActionMessage(nextActionMessage ?? t('mcp.action.done', { action: action.label }));
        }
        catch (err) {
            setActionMessage(action.id === 'authenticate'
                ? oauthAuthMessage(selectedServer.name, t, extractErrorDetail(err))
                : t('mcp.action.failed', { error: extractErrorDetail(err) }));
        }
        finally {
            setBusy(false);
        }
    }, [busy, mcp, reloadSelectedServer, selectedServer, t]);
    useEffect(() => {
        const id = panelIdRef.current;
        dispatchActive(id, isOpen);
        return () => dispatchActive(id, false);
    }, [isOpen]);
    useEffect(() => {
        const onActiveChange = (event) => {
            const detail = event.detail;
            if (detail?.active && detail.id && detail.id !== panelIdRef.current) {
                setIsOpen(false);
            }
        };
        window.addEventListener(ACTIVE_EVENT, onActiveChange);
        return () => window.removeEventListener(ACTIVE_EVENT, onActiveChange);
    }, []);
    useDelayedGlobalKeyDown((event) => {
        if (!isOpen)
            return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (step === 'servers') {
                setIsOpen(false);
            }
            else if (step === 'server') {
                setStep('servers');
                setSelectedServerActionIndex(0);
                setActionMessage(null);
            }
            else if (step === 'oauth') {
                setStep('server');
                setActionMessage(null);
            }
            else if (step === 'tools') {
                setStep('server');
                setSelectedToolIndex(0);
            }
            else {
                setStep('tools');
            }
            return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            const delta = event.key === 'ArrowUp' ? -1 : 1;
            if (step === 'servers') {
                setSelectedServerIndex((current) => Math.min(Math.max(current + delta, 0), servers.length - 1));
                setSelectedServerActionIndex(0);
            }
            else if (step === 'server') {
                setSelectedServerActionIndex((current) => Math.min(Math.max(current + delta, 0), serverActions.length - 1));
            }
            else if (step === 'tools') {
                setSelectedToolIndex((current) => Math.min(Math.max(current + delta, 0), selectedTools.length - 1));
            }
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (step === 'servers' && servers.length > 0) {
                setStep('server');
                setSelectedServerActionIndex(0);
            }
            else if (step === 'server' && serverActions.length > 0) {
                const action = serverActions[selectedServerActionIndex];
                if (action) {
                    void runServerAction(action);
                }
            }
            else if (step === 'tools' && selectedTools.length > 0) {
                setStep('tool');
            }
        }
    }, [
        isOpen,
        selectedServerActionIndex,
        selectedTools.length,
        serverActions,
        runServerAction,
        servers.length,
        step,
    ]);
    if (!isOpen)
        return null;
    if (servers.length === 0) {
        return (_jsxs("div", { className: styles.panel, "data-keyboard-scope": true, children: [_jsxs("div", { className: styles.header, children: [_jsx("div", { className: styles.title, children: t('mcp.manageServers') }), _jsx("div", { className: styles.secondary, children: t('mcp.servers', { count: 0 }) })] }), _jsx("div", { className: styles.secondary, children: t('mcp.empty') }), _jsx("div", { className: styles.shortcuts, children: t('mcp.shortcut.close') })] }));
    }
    const title = step === 'servers'
        ? t('mcp.manageServers')
        : step === 'server'
            ? (selectedServer?.name ?? t('mcp.manageServers'))
            : step === 'oauth'
                ? t('mcp.oauth.title')
                : step === 'tools'
                    ? t('mcp.toolsForServer', {
                        name: selectedServer?.name ?? t('common.server'),
                    })
                    : (selectedTool?.name ?? t('mcp.toolDetail'));
    const subtitle = step === 'servers'
        ? t('mcp.servers', { count: servers.length })
        : step === 'server'
            ? ''
            : step === 'oauth'
                ? ''
                : step === 'tools'
                    ? t(selectedTools.length === 1 ? 'mcp.toolCount' : 'mcp.toolsCount', {
                        count: selectedTools.length,
                    })
                    : (selectedTool?.serverToolName ?? selectedServer?.name ?? '');
    return (_jsxs("div", { className: styles.panel, "data-keyboard-scope": true, children: [connectingCount > 0 && (_jsxs("div", { children: [_jsx("div", { className: styles.startup, children: t('mcp.starting', { count: connectingCount }) }), _jsx("div", { className: styles.note, children: t('mcp.startingNote') })] })), _jsxs("div", { className: styles.header, children: [_jsx("div", { className: styles.title, children: title }), subtitle && _jsx("div", { className: styles.secondary, children: subtitle })] }), step === 'servers' && (_jsx("div", { className: styles.list, children: groupedServers.map((group) => {
                    let offset = 0;
                    for (const previous of groupedServers) {
                        if (previous === group)
                            break;
                        offset += previous.servers.length;
                    }
                    return (_jsxs("div", { className: styles.group, children: [_jsx("div", { className: styles.groupTitle, children: group.label }), group.servers.map((server, index) => {
                                const globalIndex = offset + index;
                                const selected = globalIndex === selectedServerIndex;
                                const display = statusDisplay(server, t);
                                return (_jsxs("div", { className: selected
                                        ? `${styles.row} ${styles.selected}`
                                        : styles.row, onClick: () => {
                                        setSelectedServerIndex(globalIndex);
                                        setStep('server');
                                        setSelectedServerActionIndex(0);
                                    }, onMouseEnter: () => setSelectedServerIndex(globalIndex), children: [_jsx("span", { className: styles.pointer, children: selected ? '❯' : '' }), _jsx("span", { className: styles.nameCell, style: { width: `${serverNameWidth}ch` }, children: server.name }), _jsx("span", { className: styles.separator, children: "\u00B7" }), _jsxs("span", { className: display.className, children: [display.icon, " ", display.text] })] }, server.name));
                            })] }, group.label));
                }) })), step === 'server' && selectedServer && (_jsxs("div", { className: styles.detail, children: [_jsxs("div", { className: styles.serverFields, children: [_jsxs("div", { className: styles.serverField, children: [_jsxs("span", { className: styles.serverFieldLabel, children: [t('mcp.status'), ":"] }), _jsxs("span", { className: statusDisplay(selectedServer, t).className, children: [statusDisplay(selectedServer, t).icon, ' ', statusDisplay(selectedServer, t).text] })] }), _jsxs("div", { className: styles.serverField, children: [_jsxs("span", { className: styles.serverFieldLabel, children: [t('mcp.source'), ":"] }), _jsx("span", { children: sourceLabel(selectedServer, t) })] }), _jsxs("div", { className: styles.serverField, children: [_jsxs("span", { className: styles.serverFieldLabel, children: [t('mcp.command'), ":"] }), _jsx("span", { className: styles.truncate, children: formatServerCommand(selectedServer, t) })] }), selectedServer.config?.cwd && (_jsxs("div", { className: styles.serverField, children: [_jsxs("span", { className: styles.serverFieldLabel, children: [t('mcp.workingDirectory'), ":"] }), _jsx("span", { className: styles.truncate, children: selectedServer.config.cwd })] })), !selectedServer.disabled && (_jsxs("div", { className: styles.serverField, children: [_jsxs("span", { className: styles.serverFieldLabel, children: [t('mcp.tools'), ":"] }), _jsx("span", { children: t(selectedTools.length === 1
                                            ? 'mcp.toolCount'
                                            : 'mcp.toolsCount', { count: selectedTools.length }) })] }))] }), _jsx("div", { className: styles.list, children: serverActions.map((action, index) => {
                            const selected = index === selectedServerActionIndex;
                            const className = [
                                styles.row,
                                selected ? styles.selected : '',
                                action.disabled ? styles.disabled : '',
                            ]
                                .filter(Boolean)
                                .join(' ');
                            return (_jsxs("div", { className: className, onClick: () => {
                                    setSelectedServerActionIndex(index);
                                    void runServerAction(action);
                                }, children: [_jsx("span", { className: styles.pointer, children: selected ? '❯' : '' }), _jsx("span", { children: action.label })] }, action.id));
                        }) }), actionMessage && (_jsx("pre", { className: styles.actionMessage, children: actionMessage }))] })), step === 'oauth' && (_jsx("div", { className: styles.oauthPage, children: _jsx("pre", { className: styles.actionMessage, children: actionMessage ??
                        (selectedServer
                            ? oauthAuthMessage(selectedServer.name, t)
                            : t('mcp.status.unknown')) }) })), step === 'tools' && (_jsx("div", { className: styles.list, children: selectedTools.length === 0 ? (_jsx("div", { className: styles.secondary, children: t('mcp.emptyTools') })) : (visibleTools.map((tool, index) => {
                    const actualIndex = toolScrollOffset + index;
                    const selected = actualIndex === selectedToolIndex;
                    const annotations = toolAnnotationText(tool, t);
                    return (_jsxs("div", { className: selected ? `${styles.row} ${styles.selected}` : styles.row, onClick: () => {
                            setSelectedToolIndex(actualIndex);
                            setStep('tool');
                        }, onMouseEnter: () => setSelectedToolIndex(actualIndex), children: [_jsx("span", { className: styles.pointer, children: selected ? '❯' : '' }), _jsx("span", { className: styles.nameCell, style: { width: `${toolNameWidth}ch` }, children: tool.name }), !tool.isValid ? (_jsx("span", { className: styles.warning, children: t('mcp.invalidReason', {
                                    reason: tool.invalidReason || t('mcp.status.unknown'),
                                }) })) : annotations ? (_jsx("span", { className: styles.secondary, children: annotations })) : null] }, tool.name));
                })) })), step === 'tools' && selectedTools.length > VISIBLE_TOOLS_COUNT && (_jsxs("div", { className: styles.scrollHint, children: [toolScrollOffset > 0 ? '↑ ' : '  ', t('mcp.scrollPosition', {
                        current: selectedToolIndex + 1,
                        total: selectedTools.length,
                    }), toolScrollOffset + VISIBLE_TOOLS_COUNT < selectedTools.length
                        ? ' ↓'
                        : ''] })), step === 'tool' && selectedTool && (_jsxs("div", { className: styles.detail, children: [!selectedTool.isValid && (_jsxs("div", { className: styles.invalidBlock, children: [_jsx("div", { className: styles.sectionTitle, children: t('mcp.invalidToolWarning') }), _jsxs("div", { children: [t('mcp.invalidReasonLabel'), ' ', selectedTool.invalidReason || t('mcp.status.unknown')] }), _jsx("div", { className: styles.secondary, children: t('mcp.invalidToolHelp') })] })), selectedTool.description && (_jsxs("div", { className: styles.detailBlock, children: [_jsx("div", { className: styles.sectionTitle, children: t('mcp.description') }), _jsx("div", { className: styles.description, children: selectedTool.description.trim() })] })), toolAnnotationText(selectedTool, t) && (_jsxs("div", { className: styles.detailBlock, children: [_jsx("span", { className: styles.sectionTitle, children: t('mcp.annotations') }), ' ', _jsx("span", { children: toolAnnotationText(selectedTool, t) })] })), schemaSummary(selectedTool, t)] })), _jsx("div", { className: styles.shortcuts, children: step === 'servers'
                    ? t('mcp.shortcut.selectClose')
                    : step === 'server' || step === 'tools'
                        ? t('mcp.shortcut.selectBack')
                        : t('mcp.shortcut.back') })] }));
}
//# sourceMappingURL=McpStatusMessage.js.map