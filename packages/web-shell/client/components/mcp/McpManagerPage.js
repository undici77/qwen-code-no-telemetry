import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  DatabaseIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  Trash2Icon,
  WrenchIcon,
} from 'lucide-react';
import { useMcp, useSettings } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { extractErrorDetail } from '../../utils/errorDetail';
import styles from './McpManagerPage.module.css';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ManagementNotice } from '../ui/management-notice';
import { Badge } from '../ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Button } from '../ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Textarea } from '../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
const DEFAULT_MCP_SERVER_CONFIG = '{\n  "command": "",\n  "args": []\n}';
function configOriginValue(server) {
  if (server.configOrigin) return server.configOrigin;
  if (server.extensionName || server.source === 'extension') return 'extension';
  const legacySource = server.source;
  if (legacySource === 'project' && server.removable === false) {
    return 'project_mcp_json';
  }
  if (legacySource === 'workspace' || legacySource === 'project') {
    return 'workspace_settings';
  }
  return server.removable ? 'user_settings' : undefined;
}
function sourceValue(server) {
  const origin = configOriginValue(server);
  if (origin === 'workspace_settings') return 'workspace';
  if (origin === 'extension') return 'extension';
  return 'user';
}
function isManagedServerVisible(server) {
  const origin = configOriginValue(server);
  return (
    origin === 'extension' ||
    origin === 'workspace_settings' ||
    origin === 'user_settings'
  );
}
function sourceLabel(server, t) {
  const source = sourceValue(server);
  return source === 'workspace'
    ? t('mcp.source.workspace')
    : source === 'extension'
      ? t('mcp.source.extension')
      : t('mcp.source.user');
}
function mcpServersForScope(settings, scope) {
  const value = settings.settings.find(
    (setting) => setting.key === 'mcpServers',
  )?.values[scope];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value));
}
function statusLabel(server, t) {
  if (server.disabled) return t('mcp.status.disabled');
  if (server.approvalState === 'pending') {
    return t('mcp.status.needsApproval');
  }
  if (server.approvalState === 'rejected') {
    return t('mcp.status.rejected');
  }
  if (server.authenticationState === 'pending') {
    return t('mcp.status.authenticating');
  }
  if (server.mcpStatus === 'connected') return t('mcp.status.connected');
  if (server.mcpStatus === 'connecting') return t('mcp.status.connecting');
  return t('mcp.status.disconnectedTitle');
}
function statusBadgeClass(server) {
  return !server.disabled &&
    !server.approvalState &&
    server.mcpStatus === 'connected'
    ? styles.connectedBadge
    : '';
}
function formatServerCommand(server, t) {
  const config = server.config;
  if (config?.httpUrl) return `${config.httpUrl} (http)`;
  if (config?.url) return `${config.url} (sse)`;
  if (config?.command) {
    return `${config.command} ${config.args?.join(' ') ?? ''} (stdio)`.trim();
  }
  return server.transport ? `(${server.transport})` : t('mcp.status.unknown');
}
function serverActions(server, t) {
  const actions = [];
  const awaitingApproval = Boolean(server.approvalState);
  const origin = configOriginValue(server);
  if (origin === 'user_settings' || origin === 'workspace_settings') {
    actions.push({ id: 'edit', label: t('mcp.action.edit') });
  }
  if (
    !server.disabled &&
    !awaitingApproval &&
    !server.requiresAuth &&
    server.mcpStatus === 'disconnected'
  ) {
    actions.push({ id: 'reconnect', label: t('mcp.action.reconnect') });
  }
  if (!server.disabled && awaitingApproval) {
    actions.push({ id: 'approve', label: t('mcp.action.approve') });
  }
  if (origin !== 'extension' || server.disabled) {
    actions.push({
      id: server.disabled ? 'enable' : 'disable',
      label: server.disabled ? t('mcp.action.enable') : t('mcp.action.disable'),
    });
  }
  if (
    !server.disabled &&
    !awaitingApproval &&
    (server.mcpStatus !== 'disconnected' || server.requiresAuth)
  ) {
    actions.push({
      id: 'authenticate',
      label: server.hasOAuthTokens
        ? t('mcp.action.reauth')
        : t('mcp.action.auth'),
    });
    if (server.hasOAuthTokens) {
      actions.push({ id: 'clear-auth', label: t('mcp.action.clearAuth') });
    }
  }
  if (server.removable) {
    actions.push({ id: 'remove', label: t('mcp.action.remove') });
  }
  return actions;
}
function oauthMessage(serverName, t, detail) {
  return [
    `${t('mcp.oauth.server')}: ${serverName}`,
    t('mcp.oauth.starting', { name: serverName }),
    detail,
  ]
    .filter(Boolean)
    .join('\n');
}
function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
function toolAnnotationText(tool, t) {
  const annotations = tool.annotations ?? {};
  const labels = [];
  if (annotations['destructiveHint']) {
    labels.push(t('mcp.annotation.destructive'));
  }
  if (annotations['readOnlyHint']) labels.push(t('mcp.annotation.readOnly'));
  if (annotations['openWorldHint']) labels.push(t('mcp.annotation.openWorld'));
  if (annotations['idempotentHint']) {
    labels.push(t('mcp.annotation.idempotent'));
  }
  return labels.join(', ');
}
function DetailField({ label, value }) {
  return _jsxs('div', {
    className: 'flex flex-col gap-1',
    children: [
      _jsx('div', { className: 'text-sm font-medium', children: label }),
      _jsx('div', {
        className: 'break-words text-sm text-muted-foreground',
        children: value,
      }),
    ],
  });
}
function ToolDetail({ tool, t }) {
  const annotations = toolAnnotationText(tool, t);
  const schema = tool.schema;
  const schemaContent =
    schema?.parametersJsonSchema ?? schema?.parameters ?? schema;
  return _jsxs('div', {
    className: 'flex flex-col gap-5',
    children: [
      !tool.isValid
        ? _jsxs(Alert, {
            variant: 'destructive',
            children: [
              _jsx(AlertCircleIcon, {}),
              _jsx(AlertTitle, { children: t('mcp.invalidToolWarning') }),
              _jsxs(AlertDescription, {
                children: [
                  tool.invalidReason || t('mcp.status.unknown'),
                  _jsx('span', {
                    className: 'mt-1 block',
                    children: t('mcp.invalidToolHelp'),
                  }),
                ],
              }),
            ],
          })
        : null,
      _jsx(DetailField, {
        label: t('mcp.description'),
        value: tool.description?.trim() || t('mcp.noDescription'),
      }),
      annotations
        ? _jsx(DetailField, { label: t('mcp.annotations'), value: annotations })
        : null,
      _jsxs('div', {
        className: 'flex flex-col gap-2',
        children: [
          _jsx('div', {
            className: 'text-sm font-medium',
            children: t('mcp.inputSchema'),
          }),
          schemaContent
            ? _jsx('pre', {
                className:
                  'max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed',
                children: JSON.stringify(schemaContent, null, 2),
              })
            : _jsx('div', {
                className: 'text-sm text-muted-foreground',
                children: t('mcp.noSchema'),
              }),
        ],
      }),
    ],
  });
}
function ResourceDetail({ resource, t }) {
  const friendlyName = resource.title || resource.name || '';
  return _jsxs('div', {
    className: 'flex flex-col gap-5',
    children: [
      _jsx(DetailField, {
        label: t('mcp.resource.uriLabel'),
        value: resource.uri,
      }),
      friendlyName && friendlyName !== resource.uri
        ? _jsx(DetailField, {
            label: t('mcp.resource.nameLabel'),
            value: friendlyName,
          })
        : null,
      resource.mimeType
        ? _jsx(DetailField, {
            label: t('mcp.resource.mimeTypeLabel'),
            value: resource.mimeType,
          })
        : null,
      typeof resource.size === 'number'
        ? _jsx(DetailField, {
            label: t('mcp.resource.sizeLabel'),
            value: t('mcp.resource.bytes', { count: resource.size }),
          })
        : null,
      resource.description
        ? _jsx(DetailField, {
            label: t('mcp.description'),
            value: resource.description.trim(),
          })
        : null,
    ],
  });
}
export function McpManagerPage({ message, onClose, embedded }) {
  const { t } = useI18n();
  const mcp = useMcp({ autoLoad: false });
  const settings = useSettings({ autoLoad: false });
  const [status, setStatus] = useState(message.status);
  const [toolsByServer, setToolsByServer] = useState(message.toolsByServer);
  const [resourcesByServer, setResourcesByServer] = useState(
    message.resourcesByServer ?? {},
  );
  const [selectedServerName, setSelectedServerName] = useState(null);
  const [selectedToolName, setSelectedToolName] = useState(null);
  const [selectedResourceUri, setSelectedResourceUri] = useState(null);
  const [selectedServerTab, setSelectedServerTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [busyServer, setBusyServer] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [serverScope, setServerScope] = useState('workspace');
  const [serverConfig, setServerConfig] = useState(DEFAULT_MCP_SERVER_CONFIG);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [serverToRemove, setServerToRemove] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTone = notice?.error
    ? 'error'
    : notice?.success
      ? 'success'
      : notice?.progress
        ? 'progress'
        : 'info';
  const [loadErrorsByServer, setLoadErrorsByServer] = useState({});
  const hasInitializedDiscovery = useRef(
    message.status.discoveryState === 'completed',
  );
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const waitForPoll = useCallback(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 1_500));
    return mountedRef.current;
  }, []);
  const startDiscovery = useCallback(
    async (operation, showProgress = true, deferStatus = false) => {
      await (operation === 'initialize'
        ? mcp.initialize()
        : mcp.reloadConfig());
      if (!mountedRef.current) return false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (!(await waitForPoll())) return false;
        const nextStatus = await mcp.reload();
        if (!mountedRef.current) return false;
        if (!nextStatus) continue;
        if (!deferStatus || nextStatus.discoveryState === 'completed') {
          setStatus((current) =>
            showProgress &&
            nextStatus.servers.length === 0 &&
            current.servers.length > 0
              ? { ...nextStatus, servers: current.servers }
              : nextStatus,
          );
        }
        if (nextStatus.errors?.length) {
          if (showProgress) {
            setNotice({
              text: nextStatus.errors
                .map((error) => error.error || error.hint || error.kind)
                .join('\n'),
              error: true,
            });
          }
          return false;
        }
        if (nextStatus.discoveryState === 'completed') {
          if (showProgress) setNotice(null);
          return true;
        }
        if (
          nextStatus.initialized &&
          nextStatus.discoveryState === 'not_started' &&
          nextStatus.servers.length === 0
        ) {
          if (deferStatus) setStatus(nextStatus);
          if (showProgress) setNotice({ text: t('mcp.discovery.empty') });
          return true;
        }
      }
      if (showProgress) {
        setNotice({ text: t('mcp.discovery.timeout'), error: true });
      }
      return false;
    },
    [mcp, t, waitForPoll],
  );
  useEffect(() => {
    if (hasInitializedDiscovery.current) return;
    hasInitializedDiscovery.current = true;
    setInitializing(true);
    void startDiscovery('initialize')
      .catch((error) => {
        if (mountedRef.current) {
          setNotice({ text: extractErrorDetail(error), error: true });
        }
      })
      .finally(() => {
        if (mountedRef.current) setInitializing(false);
      });
  }, [startDiscovery]);
  const servers = useMemo(
    () => (status.servers ?? []).filter(isManagedServerVisible),
    [status.servers],
  );
  const selectedServer =
    servers.find((server) => server.name === selectedServerName) ?? null;
  const selectedTools = selectedServer
    ? (toolsByServer[selectedServer.name]?.tools ?? [])
    : [];
  const selectedResources = selectedServer
    ? (resourcesByServer[selectedServer.name]?.resources ?? [])
    : [];
  const selectedTool =
    selectedTools.find((tool) => tool.name === selectedToolName) ?? null;
  const selectedResource =
    selectedResources.find(
      (resource) => resource.uri === selectedResourceUri,
    ) ?? null;
  useEffect(() => {
    embedded?.onDetailChange(Boolean(selectedServer));
  }, [embedded, selectedServer]);
  const filteredServers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesSource =
        sourceFilter === 'all' || sourceValue(server) === sourceFilter;
      const matchesQuery =
        !normalized ||
        server.name.toLowerCase().includes(normalized) ||
        server.description?.toLowerCase().includes(normalized) ||
        server.extensionName?.toLowerCase().includes(normalized);
      return matchesSource && Boolean(matchesQuery);
    });
  }, [query, servers, sourceFilter]);
  const loadServerData = useCallback(
    async (server) => {
      const failures = [];
      const [toolsResult, resourcesResult] = await Promise.allSettled([
        mcp.loadTools(server.name),
        server.resourceCount
          ? mcp.loadResources(server.name)
          : Promise.resolve(null),
      ]);
      if (toolsResult.status === 'fulfilled') {
        setToolsByServer((current) => ({
          ...current,
          [server.name]: toolsResult.value,
        }));
        setLoadErrorsByServer((current) => ({
          ...current,
          [server.name]: { ...current[server.name], tools: undefined },
        }));
      } else {
        failures.push(toolsResult.reason);
        const error = extractErrorDetail(toolsResult.reason);
        setLoadErrorsByServer((current) => ({
          ...current,
          [server.name]: { ...current[server.name], tools: error },
        }));
      }
      if (
        resourcesResult.status === 'fulfilled' &&
        resourcesResult.value !== null
      ) {
        const resources = resourcesResult.value;
        setResourcesByServer((current) => ({
          ...current,
          [server.name]: resources,
        }));
        setLoadErrorsByServer((current) => ({
          ...current,
          [server.name]: { ...current[server.name], resources: undefined },
        }));
      } else if (resourcesResult.status === 'rejected') {
        failures.push(resourcesResult.reason);
        const error = extractErrorDetail(resourcesResult.reason);
        setLoadErrorsByServer((current) => ({
          ...current,
          [server.name]: { ...current[server.name], resources: error },
        }));
      } else {
        setResourcesByServer((current) => {
          if (!(server.name in current)) return current;
          const next = { ...current };
          delete next[server.name];
          return next;
        });
        setLoadErrorsByServer((current) => ({
          ...current,
          [server.name]: { ...current[server.name], resources: undefined },
        }));
      }
      if (failures.length > 0) {
        throw new AggregateError(
          failures,
          `${server.name}: ${failures.map(extractErrorDetail).join('; ')}`,
        );
      }
    },
    [mcp],
  );
  const refreshAll = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setNotice(null);
    try {
      const nextStatus = await mcp.reload();
      if (!nextStatus) return;
      setStatus(nextStatus);
    } catch (error) {
      setNotice({ text: extractErrorDetail(error), error: true });
    } finally {
      setRefreshing(false);
    }
  }, [mcp, refreshing]);
  const addServer = useCallback(async () => {
    const name = serverName.trim();
    const editing = editingServer !== null;
    if (!name) {
      setAddError(t('mcp.add.nameRequired'));
      return;
    }
    let config;
    try {
      const parsed = JSON.parse(serverConfig);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(t('mcp.add.configInvalid'));
      }
      const description = serverDescription.trim();
      config = {
        ...parsed,
        ...(description ? { description } : {}),
      };
    } catch (error) {
      setAddError(extractErrorDetail(error));
      return;
    }
    setAddError(null);
    setAdding(true);
    let persisted = false;
    try {
      await settings.setValue(serverScope, 'mcpServers', config, {
        mcpServerMutation: { operation: 'set', name },
      });
      persisted = true;
      setNotice(null);
      const runtimeUpdated = await startDiscovery('reload', false).catch(
        () => false,
      );
      setNotice({
        ...(editing ? { serverName: name } : {}),
        text: runtimeUpdated
          ? t(editing ? 'mcp.edit.done' : 'mcp.add.done', { name })
          : t('mcp.runtime.notUpdated'),
        error: !runtimeUpdated,
        success: runtimeUpdated,
      });
      setAddDialogOpen(false);
      setEditingServer(null);
      setServerName('');
      setServerDescription('');
      setServerConfig(DEFAULT_MCP_SERVER_CONFIG);
    } catch (error) {
      if (persisted) {
        setNotice({
          ...(editing ? { serverName: name } : {}),
          text: t('mcp.runtime.notUpdated'),
          error: true,
        });
        setAddDialogOpen(false);
        setEditingServer(null);
        setServerName('');
        setServerDescription('');
        setServerConfig(DEFAULT_MCP_SERVER_CONFIG);
      } else {
        setAddError(extractErrorDetail(error));
      }
    } finally {
      setAdding(false);
    }
  }, [
    mcp,
    editingServer,
    serverConfig,
    serverDescription,
    serverName,
    serverScope,
    settings,
    startDiscovery,
    t,
  ]);
  const removeServer = useCallback(async () => {
    if (!serverToRemove) return;
    setBusyServer(serverToRemove.name);
    let persisted = false;
    try {
      const currentSettings = await settings.reload();
      if (!currentSettings) {
        setNotice({
          serverName: serverToRemove.name,
          text: t('mcp.add.settingsUnavailable'),
          error: true,
        });
        return;
      }
      const scope =
        sourceValue(serverToRemove) === 'workspace' ? 'workspace' : 'user';
      const servers = mcpServersForScope(currentSettings, scope);
      if (!(serverToRemove.name in servers)) {
        setNotice({
          serverName: serverToRemove.name,
          text: t('mcp.remove.notWorkspace'),
          error: true,
        });
        return;
      }
      await settings.setValue(
        scope,
        'mcpServers',
        {},
        {
          mcpServerMutation: {
            operation: 'remove',
            name: serverToRemove.name,
          },
        },
      );
      persisted = true;
      setServerToRemove(null);
      setNotice({
        serverName: serverToRemove.name,
        text: t('mcp.action.running', { action: t('mcp.action.remove') }),
        progress: true,
      });
      const runtimeUpdated = await startDiscovery('reload', false, true).catch(
        () => false,
      );
      if (runtimeUpdated) {
        setSelectedServerName(null);
        setSelectedToolName(null);
        setSelectedResourceUri(null);
        setNotice(null);
      } else {
        setNotice({
          serverName: serverToRemove.name,
          text: t('mcp.runtime.removeNotUpdated'),
          error: true,
        });
      }
    } catch (error) {
      setNotice({
        serverName: serverToRemove.name,
        text: persisted
          ? t('mcp.runtime.removeNotUpdated')
          : t('mcp.action.failed', { error: extractErrorDetail(error) }),
        error: true,
      });
    } finally {
      setBusyServer(null);
    }
  }, [serverToRemove, settings, startDiscovery, t]);
  const openEditServer = useCallback(
    async (server) => {
      if (busyServer) return;
      const origin = configOriginValue(server);
      if (origin !== 'user_settings' && origin !== 'workspace_settings') {
        return;
      }
      const scope = origin === 'workspace_settings' ? 'workspace' : 'user';
      setBusyServer(server.name);
      setNotice(null);
      try {
        const currentSettings = await settings.reload();
        if (!currentSettings) {
          throw new Error(t('mcp.add.settingsUnavailable'));
        }
        const storedConfig = mcpServersForScope(currentSettings, scope)[
          server.name
        ];
        if (
          !storedConfig ||
          typeof storedConfig !== 'object' ||
          Array.isArray(storedConfig)
        ) {
          throw new Error(t('mcp.edit.notFound'));
        }
        const editableConfig = {
          ...storedConfig,
        };
        const description = editableConfig['description'];
        delete editableConfig['description'];
        setEditingServer(server);
        setServerName(server.name);
        setServerScope(scope);
        setServerDescription(
          typeof description === 'string' ? description : '',
        );
        setServerConfig(JSON.stringify(editableConfig, null, 2));
        setAddError(null);
        setAddDialogOpen(true);
      } catch (error) {
        setNotice({
          serverName: server.name,
          text: t('mcp.action.failed', { error: extractErrorDetail(error) }),
          error: true,
        });
      } finally {
        setBusyServer(null);
      }
    },
    [busyServer, settings, t],
  );
  const runAction = useCallback(
    async (server, action) => {
      if (busyServer) return;
      if (action.id === 'remove') {
        setServerToRemove(server);
        return;
      }
      if (action.id === 'edit') {
        await openEditServer(server);
        return;
      }
      setBusyServer(server.name);
      setNotice({
        serverName: server.name,
        text:
          action.id === 'authenticate'
            ? oauthMessage(server.name, t)
            : t('mcp.action.running', { action: action.label }),
        progress: true,
      });
      try {
        let detail = '';
        let authUrl;
        let pendingAuthentication = false;
        if (action.id === 'reconnect') {
          const result = await mcp.restartServer(server.name);
          if (!mountedRef.current) return;
          if ('restarted' in result && !result.restarted) {
            if (result.reason === 'authentication_required') {
              throw new Error(t('mcp.reconnect.authenticationRequired'));
            }
            throw new Error(
              t('mcp.reconnect.skipped', { reason: result.reason }),
            );
          }
          if (
            'entries' in result &&
            (result.entries.length === 0 ||
              result.entries.every((entry) => !entry.restarted))
          ) {
            throw new Error(
              t('mcp.reconnect.skipped', {
                reason:
                  result.entries
                    .map((entry) => entry.reason)
                    .filter(Boolean)
                    .join(', ') || 'not connected',
              }),
            );
          }
        } else {
          const result = await mcp.manageServer(server.name, action.id);
          if (!mountedRef.current) return;
          authUrl = result.authUrl;
          detail = [...(result.messages ?? [])].join('\n');
          pendingAuthentication =
            action.id === 'authenticate' && result.pending === true;
          if (pendingAuthentication) {
            setNotice({
              serverName: server.name,
              text: oauthMessage(server.name, t, detail),
              progress: true,
              ...(authUrl ? { authUrl } : {}),
            });
          }
        }
        let nextStatus;
        if (pendingAuthentication) {
          for (let attempt = 0; attempt < 400; attempt += 1) {
            if (!(await waitForPoll())) return;
            const candidate = await mcp.reload();
            if (!mountedRef.current) return;
            if (!candidate) continue;
            setStatus(candidate);
            const statusError = candidate.errors?.[0];
            if (statusError) {
              throw new Error(
                statusError.error ||
                  statusError.hint ||
                  t('mcp.oauth.statusFailed'),
              );
            }
            const candidateServer = candidate.servers?.find(
              (item) => item.name === server.name,
            );
            if (!candidateServer) {
              throw new Error(t('mcp.oauth.serverRemoved'));
            }
            if (candidateServer.authenticationState === 'failed') {
              throw new Error(
                candidateServer.authenticationError ||
                  t('mcp.oauth.authenticationFailed'),
              );
            }
            if (
              candidateServer.authenticationState === 'succeeded' ||
              (candidateServer.authenticationState === undefined &&
                candidateServer.mcpStatus === 'connected')
            ) {
              nextStatus = candidate;
              break;
            }
          }
          if (!nextStatus) throw new Error(t('mcp.oauth.timeout'));
        } else {
          nextStatus = await mcp.reload();
          if (!mountedRef.current) return;
          for (
            let attempt = 0;
            nextStatus?.discoveryState !== undefined &&
            nextStatus.discoveryState !== 'completed' &&
            !nextStatus.errors?.length &&
            attempt < 40;
            attempt += 1
          ) {
            if (!(await waitForPoll())) return;
            const candidate = await mcp.reload();
            if (!mountedRef.current) return;
            if (!candidate) continue;
            nextStatus = candidate;
            setStatus(candidate);
          }
        }
        if (nextStatus) {
          setStatus(nextStatus);
          const nextServer = nextStatus.servers?.find(
            (candidate) => candidate.name === server.name,
          );
          if (
            nextServer &&
            (nextStatus.discoveryState === undefined ||
              nextStatus.discoveryState === 'completed')
          ) {
            try {
              await loadServerData(nextServer);
            } catch {
              // Tool and resource refresh errors are recorded by loadServerData.
            }
            if (!mountedRef.current) return;
          }
        }
        setNotice({
          serverName: server.name,
          text: pendingAuthentication
            ? t('mcp.action.done', { action: action.label })
            : action.id === 'authenticate' && detail
              ? oauthMessage(server.name, t, detail)
              : detail || t('mcp.action.done', { action: action.label }),
          success: true,
          ...(!pendingAuthentication && authUrl ? { authUrl } : {}),
        });
      } catch (error) {
        if (mountedRef.current) {
          setNotice({
            serverName: server.name,
            text: t('mcp.action.failed', {
              error: extractErrorDetail(error),
            }),
            error: true,
          });
        }
      } finally {
        if (mountedRef.current) setBusyServer(null);
      }
    },
    [busyServer, loadServerData, mcp, openEditServer, t, waitForPoll],
  );
  const openServer = (server) => {
    setSelectedServerName(server.name);
    setSelectedServerTab('overview');
    setSelectedToolName(null);
    setSelectedResourceUri(null);
    setNotice(null);
    if (server.approvalState) return;
    void loadServerData(server).catch((error) => {
      setNotice({
        serverName: server.name,
        text: t('mcp.action.failed', { error: extractErrorDetail(error) }),
        error: true,
      });
    });
  };
  const showServerList = () => {
    if (busyServer !== null) return;
    setSelectedServerName(null);
    setSelectedToolName(null);
    setSelectedResourceUri(null);
    setRefreshing(true);
    void mcp
      .reload()
      .then((nextStatus) => {
        if (nextStatus) setStatus(nextStatus);
      })
      .catch((error) => {
        setNotice({ text: extractErrorDetail(error), error: true });
      })
      .finally(() => setRefreshing(false));
  };
  const showSelectedServer = () => {
    setSelectedToolName(null);
    setSelectedResourceUri(null);
  };
  const standaloneNavigation = _jsx(Breadcrumb, {
    className:
      'sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3',
    children: _jsxs(BreadcrumbList, {
      className: 'text-base',
      children: [
        _jsx(BreadcrumbItem, {
          children: _jsx(Button, {
            variant: 'ghost',
            size: 'icon',
            disabled: busyServer !== null,
            onClick: onClose,
            'aria-label': t('common.back'),
            children: _jsx(ArrowLeftIcon, {}),
          }),
        }),
        _jsx(BreadcrumbItem, {
          children: selectedServer
            ? _jsx(BreadcrumbLink, {
                asChild: true,
                children: _jsx('button', {
                  type: 'button',
                  disabled: busyServer !== null,
                  onClick: showServerList,
                  children: t('mcp.title'),
                }),
              })
            : _jsx(BreadcrumbPage, { children: t('mcp.title') }),
        }),
        selectedServer ? _jsx(BreadcrumbSeparator, {}) : null,
        selectedServer
          ? _jsx(BreadcrumbItem, {
              children:
                selectedTool || selectedResource
                  ? _jsx(BreadcrumbLink, {
                      asChild: true,
                      children: _jsx('button', {
                        type: 'button',
                        onClick: showSelectedServer,
                        children: selectedServer.name,
                      }),
                    })
                  : _jsx(BreadcrumbPage, { children: selectedServer.name }),
            })
          : null,
        selectedTool || selectedResource ? _jsx(BreadcrumbSeparator, {}) : null,
        selectedTool
          ? _jsx(BreadcrumbItem, {
              children: _jsx(BreadcrumbPage, { children: selectedTool.name }),
            })
          : null,
        selectedResource
          ? _jsx(BreadcrumbItem, {
              children: _jsx(BreadcrumbPage, {
                children:
                  selectedResource.title ||
                  selectedResource.name ||
                  selectedResource.uri,
              }),
            })
          : null,
      ],
    }),
  });
  const detailLabel = selectedTool
    ? selectedTool.name
    : selectedResource
      ? selectedResource.title || selectedResource.name || selectedResource.uri
      : selectedServer?.name;
  const navigation = embedded
    ? selectedServer
      ? _jsx(Breadcrumb, {
          className:
            'sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3',
          children: _jsxs(BreadcrumbList, {
            className: 'h-8 text-sm',
            children: [
              _jsx(BreadcrumbItem, {
                children: _jsx(BreadcrumbLink, {
                  asChild: true,
                  children: _jsx('button', {
                    type: 'button',
                    disabled: busyServer !== null,
                    onClick: showServerList,
                    children: t('mcp.title'),
                  }),
                }),
              }),
              _jsx(BreadcrumbSeparator, {}),
              _jsx(BreadcrumbItem, {
                children:
                  selectedTool || selectedResource
                    ? _jsx(BreadcrumbLink, {
                        asChild: true,
                        children: _jsx('button', {
                          type: 'button',
                          onClick: showSelectedServer,
                          children: selectedServer.name,
                        }),
                      })
                    : _jsx(BreadcrumbPage, { children: selectedServer.name }),
              }),
              selectedTool || selectedResource
                ? _jsx(BreadcrumbSeparator, {})
                : null,
              selectedTool || selectedResource
                ? _jsx(BreadcrumbItem, {
                    children: _jsx(BreadcrumbPage, { children: detailLabel }),
                  })
                : null,
            ],
          }),
        })
      : null
    : standaloneNavigation;
  const removeDialog = _jsx(Dialog, {
    open: serverToRemove !== null,
    onOpenChange: (open) => !open && setServerToRemove(null),
    children: _jsxs(DialogContent, {
      showCloseButton: false,
      children: [
        _jsxs(DialogHeader, {
          children: [
            _jsx(DialogTitle, { children: t('mcp.remove.title') }),
            _jsx(DialogDescription, {
              children: t(
                serverToRemove && sourceValue(serverToRemove) === 'workspace'
                  ? 'mcp.remove.description'
                  : 'mcp.remove.description.global',
                {
                  name: serverToRemove?.name ?? '',
                },
              ),
            }),
          ],
        }),
        _jsxs(DialogFooter, {
          children: [
            _jsx(Button, {
              variant: 'outline',
              onClick: () => setServerToRemove(null),
              disabled: busyServer !== null,
              children: t('common.cancel'),
            }),
            _jsxs(Button, {
              variant: 'destructive',
              onClick: () => void removeServer(),
              disabled: busyServer !== null,
              children: [
                busyServer
                  ? _jsx(Spinner, { 'data-icon': 'inline-start' })
                  : _jsx(Trash2Icon, { 'data-icon': 'inline-start' }),
                t('mcp.action.remove'),
              ],
            }),
          ],
        }),
      ],
    }),
  });
  const editorDialog = _jsx(Dialog, {
    open: addDialogOpen,
    onOpenChange: (open) => {
      if (!adding) {
        setAddDialogOpen(open);
        if (!open) setEditingServer(null);
      }
    },
    children: _jsxs(DialogContent, {
      className: 'sm:max-w-lg',
      showCloseButton: false,
      children: [
        _jsxs(DialogHeader, {
          children: [
            _jsx(DialogTitle, {
              children: t(editingServer ? 'mcp.edit.title' : 'mcp.add.title'),
            }),
            _jsx(DialogDescription, {
              children: t(
                editingServer ? 'mcp.edit.description' : 'mcp.add.description',
              ),
            }),
          ],
        }),
        _jsxs('div', {
          className: 'grid gap-4',
          children: [
            addError
              ? _jsxs(Alert, {
                  variant: 'destructive',
                  children: [
                    _jsx(AlertCircleIcon, {}),
                    _jsx(AlertDescription, { children: addError }),
                  ],
                })
              : null,
            _jsxs('label', {
              className: 'grid gap-2 text-sm font-medium',
              children: [
                t('mcp.add.name'),
                _jsx(Input, {
                  value: serverName,
                  onChange: (event) => setServerName(event.target.value),
                  placeholder: 'my-mcp-server',
                  disabled: adding || editingServer !== null,
                }),
              ],
            }),
            _jsxs('label', {
              className: 'grid gap-2 text-sm font-medium',
              children: [
                t('mcp.add.serverDescription'),
                _jsx(Input, {
                  value: serverDescription,
                  onChange: (event) => setServerDescription(event.target.value),
                  placeholder: t('mcp.add.serverDescriptionPlaceholder'),
                  disabled: adding,
                }),
              ],
            }),
            _jsxs('label', {
              className: 'grid gap-2 text-sm font-medium',
              children: [
                t('mcp.add.scope'),
                _jsxs(Select, {
                  value: serverScope,
                  onValueChange: (value) => setServerScope(value),
                  disabled: adding || editingServer !== null,
                  children: [
                    _jsx(SelectTrigger, {
                      className: 'w-full',
                      children: _jsx(SelectValue, {}),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: 'workspace',
                          children: t('settings.scope.workspace'),
                        }),
                        _jsx(SelectItem, {
                          value: 'user',
                          children: t('mcp.add.scope.global'),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('label', {
              className: 'grid gap-2 text-sm font-medium',
              children: [
                t('mcp.add.config'),
                _jsx(Textarea, {
                  className: 'min-h-44 font-mono text-xs',
                  value: serverConfig,
                  onChange: (event) => setServerConfig(event.target.value),
                  disabled: adding,
                }),
              ],
            }),
          ],
        }),
        _jsxs(DialogFooter, {
          children: [
            _jsx(Button, {
              variant: 'outline',
              onClick: () => {
                setAddDialogOpen(false);
                setEditingServer(null);
              },
              disabled: adding,
              children: t('common.cancel'),
            }),
            _jsxs(Button, {
              onClick: () => void addServer(),
              disabled: adding,
              children: [
                adding ? _jsx(Spinner, { 'data-icon': 'inline-start' }) : null,
                adding
                  ? t(editingServer ? 'mcp.edit.saving' : 'mcp.add.adding')
                  : t(editingServer ? 'mcp.edit.save' : 'mcp.add.button'),
              ],
            }),
          ],
        }),
      ],
    }),
  });
  if (selectedTool && selectedServer) {
    return _jsxs(_Fragment, {
      children: [
        _jsxs('div', {
          className: 'flex w-full flex-col gap-6 pb-8',
          children: [
            navigation,
            _jsxs('div', {
              className: 'flex w-full flex-col gap-6',
              children: [
                _jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    _jsx('div', {
                      className:
                        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted',
                      children: _jsx(WrenchIcon, {}),
                    }),
                    _jsxs('div', {
                      className: 'min-w-0',
                      children: [
                        _jsx('h1', {
                          className: 'break-words text-xl font-semibold',
                          children: selectedTool.name,
                        }),
                        _jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children:
                            selectedTool.serverToolName || selectedServer.name,
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    children: _jsx(ToolDetail, { tool: selectedTool, t: t }),
                  }),
                }),
              ],
            }),
          ],
        }),
        editorDialog,
      ],
    });
  }
  if (selectedResource && selectedServer) {
    return _jsxs(_Fragment, {
      children: [
        _jsxs('div', {
          className: 'flex w-full flex-col gap-6 pb-8',
          children: [
            navigation,
            _jsxs('div', {
              className: 'flex w-full flex-col gap-6',
              children: [
                _jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    _jsx('div', {
                      className:
                        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted',
                      children: _jsx(DatabaseIcon, {}),
                    }),
                    _jsx('h1', {
                      className: 'min-w-0 break-words text-xl font-semibold',
                      children:
                        selectedResource.title ||
                        selectedResource.name ||
                        selectedResource.uri,
                    }),
                  ],
                }),
                _jsx(Card, {
                  children: _jsx(CardContent, {
                    children: _jsx(ResourceDetail, {
                      resource: selectedResource,
                      t: t,
                    }),
                  }),
                }),
              ],
            }),
          ],
        }),
        editorDialog,
      ],
    });
  }
  if (selectedServer) {
    const tools = selectedTools;
    const resources = selectedResources;
    const loadErrors = loadErrorsByServer[selectedServer.name];
    const actions = serverActions(selectedServer, t);
    return _jsxs(_Fragment, {
      children: [
        _jsxs('div', {
          className: 'flex w-full flex-col gap-6 pb-8',
          children: [
            navigation,
            _jsxs('div', {
              className: 'flex w-full flex-col gap-6',
              children: [
                _jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    _jsx('div', {
                      className:
                        'flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted',
                      children: _jsx(ServerIcon, {}),
                    }),
                    _jsx('div', {
                      className: 'min-w-0 flex-1',
                      children: _jsxs('div', {
                        className: 'flex flex-wrap items-center gap-2',
                        children: [
                          _jsx('h1', {
                            className: 'break-words text-xl font-semibold',
                            children: selectedServer.name,
                          }),
                          _jsx(Badge, {
                            variant: 'secondary',
                            className: statusBadgeClass(selectedServer),
                            children: statusLabel(selectedServer, t),
                          }),
                          _jsx(Badge, {
                            variant: 'outline',
                            children: sourceLabel(selectedServer, t),
                          }),
                        ],
                      }),
                    }),
                    _jsxs(DropdownMenu, {
                      children: [
                        _jsx(DropdownMenuTrigger, {
                          asChild: true,
                          children: _jsx(Button, {
                            variant: 'ghost',
                            size: 'icon',
                            disabled: busyServer !== null,
                            'aria-label': t('mcp.actions'),
                            'data-testid': 'mcp-server-actions',
                            children:
                              busyServer === selectedServer.name
                                ? _jsx(Spinner, {})
                                : _jsx(EllipsisVerticalIcon, {}),
                          }),
                        }),
                        _jsx(DropdownMenuContent, {
                          align: 'end',
                          onCloseAutoFocus: (event) => event.preventDefault(),
                          children: _jsx(DropdownMenuGroup, {
                            children: actions.map((action) =>
                              _jsx(
                                DropdownMenuItem,
                                {
                                  'data-testid': `mcp-server-action-${action.id}`,
                                  variant:
                                    action.id === 'remove'
                                      ? 'destructive'
                                      : 'default',
                                  disabled: busyServer !== null,
                                  onSelect: () =>
                                    void runAction(selectedServer, action),
                                  children: action.label,
                                },
                                action.id,
                              ),
                            ),
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                notice?.serverName === selectedServer.name
                  ? _jsxs(ManagementNotice, {
                      tone: noticeTone,
                      noticeKey: notice.text,
                      closeLabel: t('common.close'),
                      onDismiss: () => setNotice(null),
                      className: 'whitespace-pre-wrap break-words',
                      children: [
                        _jsx('p', { children: notice.text }),
                        notice.authUrl && isHttpUrl(notice.authUrl)
                          ? _jsx('a', {
                              className:
                                'mt-2 inline-block underline underline-offset-3',
                              href: notice.authUrl,
                              target: '_blank',
                              rel: 'noreferrer',
                              children: t('mcp.oauth.open'),
                            })
                          : null,
                      ],
                    })
                  : null,
                _jsxs(Tabs, {
                  value: selectedServerTab,
                  onValueChange: setSelectedServerTab,
                  children: [
                    _jsxs(TabsList, {
                      children: [
                        _jsx(TabsTrigger, {
                          value: 'overview',
                          children: t('mcp.basicInfo'),
                        }),
                        _jsxs(TabsTrigger, {
                          value: 'tools',
                          children: [t('mcp.tools'), ' ', tools.length],
                        }),
                        _jsxs(TabsTrigger, {
                          value: 'resources',
                          children: [
                            t('mcp.resources'),
                            ' ',
                            selectedServer.resourceCount ?? resources.length,
                          ],
                        }),
                      ],
                    }),
                    _jsx(TabsContent, {
                      value: 'overview',
                      className: 'pt-4',
                      children: _jsxs(Card, {
                        children: [
                          _jsxs(CardHeader, {
                            children: [
                              _jsx(CardTitle, {
                                className: 'text-sm',
                                children: t('mcp.descriptionTitle'),
                              }),
                              _jsx(CardDescription, {
                                children:
                                  selectedServer.description?.trim() || '-',
                              }),
                            ],
                          }),
                          _jsxs(CardContent, {
                            className: 'grid gap-6 sm:grid-cols-2',
                            children: [
                              _jsx(DetailField, {
                                label: t('mcp.source'),
                                value: sourceLabel(selectedServer, t),
                              }),
                              _jsx(DetailField, {
                                label: t('mcp.transport'),
                                value: selectedServer.transport,
                              }),
                              _jsx(DetailField, {
                                label: t('mcp.command'),
                                value: formatServerCommand(selectedServer, t),
                              }),
                              _jsx(DetailField, {
                                label: t('mcp.workingDirectory'),
                                value:
                                  selectedServer.config?.cwd ||
                                  status.workspaceCwd,
                              }),
                              selectedServer.error
                                ? _jsx(DetailField, {
                                    label: t('mcp.invalidReasonLabel'),
                                    value: selectedServer.error,
                                  })
                                : null,
                              selectedServer.hint
                                ? _jsx(DetailField, {
                                    label: t('mcp.description'),
                                    value: selectedServer.hint,
                                  })
                                : null,
                            ],
                          }),
                        ],
                      }),
                    }),
                    _jsx(TabsContent, {
                      value: 'tools',
                      className: 'pt-4',
                      children: loadErrors?.tools
                        ? _jsxs(Alert, {
                            variant: 'destructive',
                            children: [
                              _jsx(AlertCircleIcon, {}),
                              _jsx(AlertTitle, {
                                children: t('mcp.loadingTools'),
                              }),
                              _jsx(AlertDescription, {
                                children: loadErrors.tools,
                              }),
                            ],
                          })
                        : tools.length
                          ? _jsx('div', {
                              className: 'grid gap-3 md:grid-cols-2',
                              children: tools.map((tool) =>
                                _jsx(
                                  Card,
                                  {
                                    size: 'sm',
                                    role: 'button',
                                    tabIndex: 0,
                                    className:
                                      'cursor-pointer transition-colors hover:bg-accent/50',
                                    onClick: () =>
                                      setSelectedToolName(tool.name),
                                    onKeyDown: (event) => {
                                      if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                      ) {
                                        event.preventDefault();
                                        setSelectedToolName(tool.name);
                                      }
                                    },
                                    children: _jsxs(CardHeader, {
                                      children: [
                                        _jsx(CardTitle, {
                                          className: 'break-words',
                                          children: tool.name,
                                        }),
                                        _jsx(CardDescription, {
                                          className: 'line-clamp-2 text-xs',
                                          children:
                                            tool.description ||
                                            t('mcp.noDescription'),
                                        }),
                                        !tool.isValid
                                          ? _jsx(CardAction, {
                                              children: _jsx(Badge, {
                                                variant: 'destructive',
                                                children:
                                                  t('mcp.status.blocked'),
                                              }),
                                            })
                                          : null,
                                      ],
                                    }),
                                  },
                                  tool.name,
                                ),
                              ),
                            })
                          : _jsx(Empty, {
                              className: 'rounded-xl border border-dashed',
                              children: _jsxs(EmptyHeader, {
                                children: [
                                  _jsx(EmptyMedia, {
                                    variant: 'icon',
                                    children: _jsx(WrenchIcon, {}),
                                  }),
                                  _jsx(EmptyTitle, {
                                    children: t('mcp.emptyTools'),
                                  }),
                                ],
                              }),
                            }),
                    }),
                    _jsx(TabsContent, {
                      value: 'resources',
                      className: 'pt-4',
                      children: loadErrors?.resources
                        ? _jsxs(Alert, {
                            variant: 'destructive',
                            children: [
                              _jsx(AlertCircleIcon, {}),
                              _jsx(AlertTitle, {
                                children: t('mcp.resourcesUnavailable'),
                              }),
                              _jsx(AlertDescription, {
                                children: loadErrors.resources,
                              }),
                            ],
                          })
                        : resources.length
                          ? _jsx('div', {
                              className: 'grid gap-3 md:grid-cols-2',
                              children: resources.map((resource) =>
                                _jsx(
                                  Card,
                                  {
                                    size: 'sm',
                                    role: 'button',
                                    tabIndex: 0,
                                    className:
                                      'cursor-pointer transition-colors hover:bg-accent/50',
                                    onClick: () =>
                                      setSelectedResourceUri(resource.uri),
                                    onKeyDown: (event) => {
                                      if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                      ) {
                                        event.preventDefault();
                                        setSelectedResourceUri(resource.uri);
                                      }
                                    },
                                    children: _jsxs(CardHeader, {
                                      children: [
                                        _jsx(CardTitle, {
                                          className: 'break-words',
                                          children:
                                            resource.title ||
                                            resource.name ||
                                            resource.uri,
                                        }),
                                        _jsx(CardDescription, {
                                          className: 'break-all',
                                          children: resource.uri,
                                        }),
                                      ],
                                    }),
                                  },
                                  resource.uri,
                                ),
                              ),
                            })
                          : _jsx(Empty, {
                              className: 'rounded-xl border border-dashed',
                              children: _jsxs(EmptyHeader, {
                                children: [
                                  _jsx(EmptyMedia, {
                                    variant: 'icon',
                                    children: _jsx(DatabaseIcon, {}),
                                  }),
                                  _jsx(EmptyTitle, {
                                    children: t('mcp.noResources'),
                                  }),
                                ],
                              }),
                            }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        removeDialog,
        editorDialog,
      ],
    });
  }
  const connectingCount = servers.filter(
    (server) => !server.disabled && server.mcpStatus === 'connecting',
  ).length;
  const sourceOptions = [
    { value: 'all', label: t('mcp.source.all') },
    { value: 'user', label: t('mcp.source.user') },
    { value: 'workspace', label: t('mcp.source.workspace') },
    { value: 'extension', label: t('mcp.source.extension') },
  ];
  return _jsxs('div', {
    className: 'flex w-full flex-col gap-6 pb-8',
    children: [
      navigation,
      _jsxs('div', {
        className: 'flex w-full flex-col gap-6',
        children: [
          _jsxs('div', {
            className: 'flex items-start justify-between gap-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h1', {
                    className: 'text-xl font-semibold text-balance',
                    children: t('mcp.title'),
                  }),
                  _jsx('p', {
                    className:
                      'mt-1 text-sm text-muted-foreground tabular-nums',
                    children: t('mcp.servers', { count: servers.length }),
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  _jsxs(Button, {
                    variant: 'outline',
                    onClick: () => void refreshAll(),
                    disabled: refreshing,
                    children: [
                      refreshing
                        ? _jsx(Spinner, { 'data-icon': 'inline-start' })
                        : _jsx(RefreshCwIcon, { 'data-icon': 'inline-start' }),
                      t('common.refresh'),
                    ],
                  }),
                  _jsxs(Button, {
                    onClick: () => {
                      setEditingServer(null);
                      setServerName('');
                      setServerDescription('');
                      setServerScope('workspace');
                      setServerConfig(DEFAULT_MCP_SERVER_CONFIG);
                      setAddError(null);
                      setAddDialogOpen(true);
                    },
                    disabled: adding,
                    children: [
                      _jsx(PlusIcon, { 'data-icon': 'inline-start' }),
                      t('mcp.add.button'),
                    ],
                  }),
                ],
              }),
            ],
          }),
          initializing && connectingCount === 0
            ? _jsx(ManagementNotice, {
                tone: 'progress',
                noticeKey: 'mcp-initializing',
                closeLabel: t('common.close'),
                onDismiss: () => undefined,
                children: _jsxs('span', {
                  className: 'grid gap-1',
                  children: [
                    _jsx('span', {
                      className: 'font-medium',
                      children: t('mcp.discovery.initializing'),
                    }),
                    _jsx('span', { children: t('mcp.startingNote') }),
                  ],
                }),
              })
            : connectingCount > 0
              ? _jsx(ManagementNotice, {
                  tone: 'progress',
                  noticeKey: `mcp-connecting-${connectingCount}`,
                  closeLabel: t('common.close'),
                  onDismiss: () => undefined,
                  children: _jsxs('span', {
                    className: 'grid gap-1',
                    children: [
                      _jsx('span', {
                        className: 'font-medium',
                        children: t('mcp.starting', { count: connectingCount }),
                      }),
                      _jsx('span', { children: t('mcp.startingNote') }),
                    ],
                  }),
                })
              : null,
          notice && !notice.serverName
            ? _jsx(ManagementNotice, {
                tone: noticeTone,
                noticeKey: notice.text,
                closeLabel: t('common.close'),
                onDismiss: () => setNotice(null),
                children: notice.text,
              })
            : null,
          (status.errors ?? []).map((error, index) =>
            _jsxs(
              Alert,
              {
                variant: 'destructive',
                children: [
                  _jsx(AlertCircleIcon, {}),
                  _jsx(AlertTitle, { children: error.kind }),
                  _jsx(AlertDescription, {
                    children:
                      error.error || error.hint || t('mcp.status.unknown'),
                  }),
                ],
              },
              `${error.kind}-${index}`,
            ),
          ),
          status.budgetMode && status.budgetMode !== 'off'
            ? _jsxs(Alert, {
                children: [
                  _jsx(AlertCircleIcon, {}),
                  _jsx(AlertDescription, {
                    children: t('mcp.clientBudget', {
                      count: status.clientCount ?? 0,
                      budget: status.clientBudget ?? '∞',
                    }),
                  }),
                ],
              })
            : null,
          _jsxs('div', {
            className: 'relative',
            children: [
              _jsx(SearchIcon, {
                className:
                  'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
              }),
              _jsx(Input, {
                className: 'pl-9',
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: `${t('common.search')} MCP…`,
              }),
            ],
          }),
          _jsx(ToggleGroup, {
            type: 'single',
            value: sourceFilter,
            onValueChange: (value) => {
              if (value) setSourceFilter(value);
            },
            variant: 'outline',
            size: 'sm',
            'aria-label': t('mcp.source'),
            children: sourceOptions.map((option) =>
              _jsx(
                ToggleGroupItem,
                { value: option.value, children: option.label },
                option.value,
              ),
            ),
          }),
          filteredServers.length
            ? _jsx('div', {
                className: styles.serverGrid,
                'data-column-count': Math.min(filteredServers.length, 4),
                children: filteredServers.map((server) =>
                  _jsx(
                    Card,
                    {
                      size: 'sm',
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': server.name,
                      className:
                        'cursor-pointer transition-colors hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      onClick: () => openServer(server),
                      onKeyDown: (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openServer(server);
                        }
                      },
                      children: _jsx(CardHeader, {
                        className: 'block',
                        children: _jsxs('div', {
                          className: 'flex items-start gap-3',
                          children: [
                            _jsx('div', {
                              className:
                                'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted',
                              children: _jsx(ServerIcon, {
                                className: 'size-5',
                              }),
                            }),
                            _jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                _jsxs('div', {
                                  className:
                                    'flex min-w-0 items-start justify-between gap-2',
                                  children: [
                                    _jsx(CardTitle, {
                                      className: 'min-w-0 flex-1 truncate',
                                      children: server.name,
                                    }),
                                    _jsx(Badge, {
                                      variant: 'secondary',
                                      className: `${statusBadgeClass(server)} shrink-0 text-[10px]`,
                                      children: statusLabel(server, t),
                                    }),
                                  ],
                                }),
                                _jsx(CardDescription, {
                                  className: 'mt-1 min-w-0 text-xs',
                                  children: _jsx(TooltipProvider, {
                                    delayDuration: 300,
                                    children: _jsxs(Tooltip, {
                                      children: [
                                        _jsx(TooltipTrigger, {
                                          asChild: true,
                                          children: _jsx('span', {
                                            className: 'block truncate',
                                            children:
                                              server.description?.trim() || '-',
                                          }),
                                        }),
                                        _jsx(TooltipContent, {
                                          children:
                                            server.description?.trim() || '-',
                                        }),
                                      ],
                                    }),
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    },
                    server.name,
                  ),
                ),
              })
            : _jsx(Empty, {
                className: 'border',
                children: _jsxs(EmptyHeader, {
                  children: [
                    _jsx(EmptyMedia, {
                      variant: 'icon',
                      children:
                        query || sourceFilter !== 'all'
                          ? _jsx(SearchIcon, {})
                          : _jsx(ServerIcon, {}),
                    }),
                    _jsx(EmptyTitle, {
                      children:
                        query || sourceFilter !== 'all'
                          ? t('mcp.noMatches')
                          : t('mcp.empty'),
                    }),
                    !query && sourceFilter === 'all'
                      ? _jsx(EmptyDescription, {
                          children: t('mcp.emptyDescription'),
                        })
                      : null,
                  ],
                }),
              }),
        ],
      }),
      editorDialog,
    ],
  });
}
//# sourceMappingURL=McpManagerPage.js.map
