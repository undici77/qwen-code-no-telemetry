import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { SparklesIcon, XIcon } from 'lucide-react';
import { DAEMON_APPROVAL_MODES, useAgents, useMcp, useSettings, useTools, } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '../ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { ManagementNotice } from '../ui/management-notice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { Spinner } from '../ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '../ui/tooltip';
import { selectBuiltInTools, selectDiscoverableMcpServerNames, } from './agent-tool-options';
function parseRecord(value, label) {
    if (!value.trim())
        return undefined;
    const parsed = JSON.parse(value);
    if (!isRecord(parsed))
        throw new Error(`${label} must be a JSON object`);
    return parsed;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function formErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/^[A-Z]+ \/\S+:\s*/, '');
}
function toggleSelection(current, name, checked) {
    const next = new Set(current);
    if (checked)
        next.add(name);
    else
        next.delete(name);
    return next;
}
const approvalModes = ['inherit', ...DAEMON_APPROVAL_MODES];
const MCP_DISCOVERY_POLL_MS = 1_500;
const MCP_DISCOVERY_MAX_ATTEMPTS = 40;
export function AgentCreatePage({ initialScope = 'global', agent, onCancel, onCreated, }) {
    const { t } = useI18n();
    const { createAgent, updateAgent, generateContent } = useAgents({
        autoLoad: false,
    });
    const toolsResource = useTools({ autoLoad: false });
    const mcpResource = useMcp({ autoLoad: false });
    const settingsResource = useSettings({ autoLoad: true });
    const loadMcpTools = mcpResource.loadTools;
    const initializeMcp = mcpResource.initialize;
    const reloadMcpConfig = mcpResource.reloadConfig;
    const reloadMcp = mcpResource.reload;
    const preheatAcp = toolsResource.preheat;
    const reloadTools = toolsResource.reload;
    const existingScope = agent?.level === 'user' ? 'global' : 'workspace';
    const [scope, setScope] = useState(agent ? existingScope : initialScope);
    const [name, setName] = useState(agent?.name ?? '');
    const [description, setDescription] = useState(agent?.description ?? '');
    const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? '');
    const [selectedTools, setSelectedTools] = useState(() => new Set(agent?.tools?.includes('*') ? [] : (agent?.tools ?? [])));
    const [disallowedTools, setDisallowedTools] = useState(() => new Set(agent?.disallowedTools ?? []));
    const [model, setModel] = useState(agent?.model ?? '');
    const [approvalMode, setApprovalMode] = useState(agent?.approvalMode ?? 'inherit');
    const selectableApprovalModes = approvalMode === 'bubble' ? [...approvalModes, 'bubble'] : approvalModes;
    const [maxTurns, setMaxTurns] = useState(agent?.maxTurns?.toString() ?? '');
    const [color, setColor] = useState(agent?.color ?? 'inherit');
    const [selectedMcpServers, setSelectedMcpServers] = useState(() => new Set(Object.keys(agent?.mcpServers ?? {})));
    const [hooks, setHooks] = useState(agent?.hooks ? JSON.stringify(agent.hooks, null, 2) : '');
    const [generationOpen, setGenerationOpen] = useState(false);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [generatedSystemPrompt, setGeneratedSystemPrompt] = useState('');
    const [mcpTools, setMcpTools] = useState({});
    const [mcpToolsLoading, setMcpToolsLoading] = useState(false);
    const [mcpToolsError, setMcpToolsError] = useState(null);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [generatingFields, setGeneratingFields] = useState(() => new Set());
    const [error, setError] = useState(null);
    const [generationError, setGenerationError] = useState(null);
    const generationRunRef = useRef({
        description: 0,
        systemPrompt: 0,
    });
    const abortRef = useRef({});
    const builtInTools = useMemo(() => selectBuiltInTools(toolsResource.tools, mcpTools), [mcpTools, toolsResource.tools]);
    const mcpServers = useMemo(() => mcpResource.status?.servers ?? [], [mcpResource.status?.servers]);
    const effectiveMcpServers = useMemo(() => {
        const values = settingsResource.settings.find((setting) => setting.key === 'mcpServers')?.values;
        const value = scope === 'global' ? values?.user : values?.effective;
        return isRecord(value) ? value : {};
    }, [scope, settingsResource.settings]);
    const selectableMcpServers = useMemo(() => mcpServers.filter((server) => {
        if (isRecord(effectiveMcpServers[server.name]))
            return true;
        if (isRecord(agent?.mcpServers?.[server.name]))
            return true;
        return scope === 'workspace' && isRecord(server.config);
    }), [agent?.mcpServers, effectiveMcpServers, mcpServers, scope]);
    const activeMcpServerNames = useMemo(() => selectDiscoverableMcpServerNames(selectableMcpServers), [selectableMcpServers]);
    const activeMcpServerKey = activeMcpServerNames.join('\0');
    const canSave = Boolean(name.trim() && description.trim() && systemPrompt.trim());
    useEffect(() => () => {
        for (const controller of Object.values(abortRef.current)) {
            controller?.abort();
        }
    }, []);
    useEffect(() => {
        let active = true;
        const initializeCatalogs = async () => {
            setCatalogLoading(true);
            setCatalogError(null);
            try {
                const preheat = await preheatAcp(5_000);
                if (!preheat.ready)
                    throw new Error(t('agent.create.tools.preheatFailed'));
                if (!active)
                    return;
                const tools = await reloadTools();
                if (!tools)
                    throw new Error(t('agent.create.tools.loadFailed'));
                if (tools.errors?.length) {
                    throw new Error(tools.errors
                        .map((item) => item.error || item.hint || item.kind)
                        .join('\n'));
                }
                const initialization = await initializeMcp();
                if (!initialization.accepted)
                    await reloadMcpConfig();
                let discoveryFinished = false;
                for (let attempt = 0; attempt < MCP_DISCOVERY_MAX_ATTEMPTS; attempt += 1) {
                    await new Promise((resolve) => window.setTimeout(resolve, MCP_DISCOVERY_POLL_MS));
                    if (!active)
                        return;
                    const status = await reloadMcp();
                    if (!status)
                        continue;
                    if (status.errors?.length) {
                        throw new Error(status.errors
                            .map((item) => item.error || item.hint || item.kind)
                            .join('\n'));
                    }
                    if (status.discoveryState === 'completed' ||
                        (status.initialized &&
                            status.discoveryState === 'not_started' &&
                            status.servers.length === 0)) {
                        discoveryFinished = true;
                        break;
                    }
                }
                if (!discoveryFinished) {
                    throw new Error(t('mcp.discovery.timeout'));
                }
            }
            catch (nextError) {
                if (active) {
                    setCatalogError(nextError instanceof Error ? nextError.message : String(nextError));
                }
            }
            finally {
                if (active)
                    setCatalogLoading(false);
            }
        };
        void initializeCatalogs();
        return () => {
            active = false;
        };
    }, [initializeMcp, preheatAcp, reloadMcp, reloadMcpConfig, reloadTools, t]);
    useEffect(() => {
        if (catalogLoading)
            return;
        if (!activeMcpServerKey) {
            setMcpTools({});
            return;
        }
        let active = true;
        setMcpToolsLoading(true);
        setMcpToolsError(null);
        Promise.all(activeMcpServerNames.map(async (serverName) => {
            const status = await loadMcpTools(serverName);
            return {
                serverName,
                tools: status.tools.filter((tool) => tool.isValid),
                error: status.errors?.length
                    ? `${serverName}: ${status.errors
                        .map((item) => item.error || item.hint || item.kind)
                        .join(', ')}`
                    : undefined,
            };
        }))
            .then((entries) => {
            if (!active)
                return;
            setMcpTools(Object.fromEntries(entries.map(({ serverName, tools }) => [serverName, tools])));
            const errors = entries.flatMap(({ error }) => (error ? [error] : []));
            setMcpToolsError(errors.length > 0 ? errors.join('\n') : null);
        })
            .catch((nextError) => {
            if (active) {
                setMcpToolsError(nextError instanceof Error ? nextError.message : String(nextError));
            }
        })
            .finally(() => {
            if (active)
                setMcpToolsLoading(false);
        });
        return () => {
            active = false;
        };
    }, [activeMcpServerKey, activeMcpServerNames, catalogLoading, loadMcpTools]);
    function setGenerationDialogOpen(open) {
        if (!open) {
            for (const field of ['description', 'systemPrompt']) {
                generationRunRef.current[field] += 1;
                abortRef.current[field]?.abort();
                delete abortRef.current[field];
            }
            setGeneratingFields(new Set());
        }
        setGenerationOpen(open);
    }
    function openGenerationDialog() {
        setGeneratedDescription(description);
        setGeneratedSystemPrompt(systemPrompt);
        setGenerationError(null);
        setGenerationOpen(true);
    }
    function cancelGeneration(field) {
        generationRunRef.current[field] += 1;
        abortRef.current[field]?.abort();
        delete abortRef.current[field];
        setGeneratingFields((current) => {
            const next = new Set(current);
            next.delete(field);
            return next;
        });
    }
    async function handleGenerate(field) {
        const request = generationPrompt.trim();
        if (!request || abortRef.current[field])
            return;
        const runId = generationRunRef.current[field] + 1;
        generationRunRef.current[field] = runId;
        const controller = new AbortController();
        abortRef.current[field] = controller;
        setGeneratingFields((current) => new Set(current).add(field));
        setGenerationError(null);
        const setGeneratedValue = field === 'description'
            ? setGeneratedDescription
            : setGeneratedSystemPrompt;
        setGeneratedValue('');
        try {
            const suffix = field === 'description'
                ? 'Return only a concise one-sentence subagent description explaining when this subagent should be used. Do not return JSON, Markdown, a label, or commentary.'
                : 'Return only the complete subagent system prompt. Do not return JSON, a Markdown code block, a name, a description, or commentary.';
            let generated = '';
            for await (const event of generateContent(`${request}\n\n${suffix}`, {
                signal: controller.signal,
            })) {
                if (generationRunRef.current[field] !== runId)
                    return;
                if (event.type === 'delta') {
                    generated += event.text;
                    setGeneratedValue(generated);
                }
                else if (event.type === 'error') {
                    throw new Error(event.message);
                }
            }
            if (generationRunRef.current[field] !== runId)
                return;
            setGeneratedValue(generated.trim());
        }
        catch (nextError) {
            if (generationRunRef.current[field] !== runId ||
                controller.signal.aborted)
                return;
            setGenerationError(t('agent.create.generateFailed', {
                error: nextError instanceof Error ? nextError.message : String(nextError),
            }));
        }
        finally {
            if (generationRunRef.current[field] === runId) {
                setGeneratingFields((current) => {
                    const next = new Set(current);
                    next.delete(field);
                    return next;
                });
                if (abortRef.current[field] === controller) {
                    delete abortRef.current[field];
                }
            }
        }
    }
    function useGeneratedDraft() {
        setDescription(generatedDescription.trim());
        setSystemPrompt(generatedSystemPrompt.trim());
        setGenerationDialogOpen(false);
    }
    function mcpServerConfig(serverName) {
        const existing = agent?.mcpServers?.[serverName];
        if (isRecord(existing))
            return existing;
        const effective = effectiveMcpServers[serverName];
        if (isRecord(effective))
            return effective;
        const statusConfig = scope === 'workspace'
            ? mcpServers.find((server) => server.name === serverName)?.config
            : undefined;
        return isRecord(statusConfig) ? statusConfig : undefined;
    }
    async function handleSave() {
        if (!canSave) {
            setError(t('agent.create.required'));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const parsedMaxTurns = maxTurns.trim()
                ? Number(maxTurns.trim())
                : undefined;
            if (parsedMaxTurns !== undefined &&
                (!Number.isSafeInteger(parsedMaxTurns) || parsedMaxTurns <= 0)) {
                throw new Error(t('agent.create.maxTurnsInvalid'));
            }
            const allowed = [...selectedTools];
            const denied = [...disallowedTools];
            const parsedHooks = parseRecord(hooks, 'hooks');
            const selectedServerConfigs = Object.fromEntries([...selectedMcpServers].flatMap((serverName) => {
                const config = mcpServerConfig(serverName);
                return config ? [[serverName, config]] : [];
            }));
            const fields = {
                description: description.trim(),
                systemPrompt: systemPrompt.trim(),
                tools: agent ? allowed : allowed.length > 0 ? allowed : undefined,
                disallowedTools: agent
                    ? denied
                    : denied.length > 0
                        ? denied
                        : undefined,
                mcpServers: agent
                    ? selectedServerConfigs
                    : Object.keys(selectedServerConfigs).length > 0
                        ? selectedServerConfigs
                        : undefined,
                hooks: agent ? (parsedHooks ?? {}) : parsedHooks,
            };
            const result = agent
                ? await updateAgent(agent.name, {
                    ...fields,
                    model: model.trim() || null,
                    approvalMode: approvalMode === 'inherit' ? null : approvalMode,
                    maxTurns: parsedMaxTurns ?? null,
                    color: color === 'inherit' ? null : color,
                }, scope)
                : await createAgent({
                    name: name.trim(),
                    scope,
                    ...fields,
                    model: model.trim() || undefined,
                    approvalMode: approvalMode === 'inherit' ? undefined : approvalMode,
                    maxTurns: parsedMaxTurns,
                    color: color === 'inherit' ? undefined : color,
                });
            onCreated(result.agent.name);
        }
        catch (nextError) {
            setError(formErrorMessage(nextError));
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "flex w-full max-w-5xl flex-col gap-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsx("h1", { className: "text-xl font-semibold text-balance", children: agent ? t('agent.edit') : t('agent.create') }), _jsxs(Button, { type: "button", variant: "outline", onClick: openGenerationDialog, children: [_jsx(SparklesIcon, { "data-icon": "inline-start" }), t('agent.create.modelGenerate')] })] }), error ? (_jsx(ManagementNotice, { tone: "error", noticeKey: error, closeLabel: t('common.close'), onDismiss: () => setError(null), children: error })) : null, _jsxs(Tabs, { defaultValue: "overview", children: [_jsxs(TabsList, { className: "max-w-full overflow-x-auto", children: [_jsx(TabsTrigger, { value: "overview", children: t('agent.detail.overview') }), _jsx(TabsTrigger, { value: "prompt", children: t('agent.detail.systemPrompt') }), _jsx(TabsTrigger, { value: "tools", children: t('agent.detail.tools') }), _jsx(TabsTrigger, { value: "mcp", children: t('agent.detail.mcp') }), _jsx(TabsTrigger, { value: "hooks", children: t('agent.detail.hooks') })] }), _jsx(TabsContent, { value: "overview", className: "pt-4", children: _jsxs(FieldGroup, { className: "grid grid-cols-1 gap-5 lg:grid-cols-2", children: [_jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-scope", children: t('agent.create.scope') }), _jsxs(Select, { value: scope, disabled: Boolean(agent), onValueChange: (value) => setScope(value), children: [_jsx(SelectTrigger, { id: "agent-scope", className: "w-full", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "workspace", children: t('agent.create.project.cli') }), _jsx(SelectItem, { value: "global", children: t('agent.create.user.cli') })] })] })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-name", children: t('agent.create.name') }), _jsx(Input, { id: "agent-name", value: name, onChange: (event) => setName(event.target.value), placeholder: t('agent.create.namePlaceholder'), disabled: Boolean(agent) }), _jsx(FieldDescription, { children: t('agent.create.nameHelp') })] }), _jsxs(Field, { className: "lg:col-span-2", children: [_jsx(FieldLabel, { htmlFor: "agent-description", children: t('agent.create.description') }), _jsx(Textarea, { id: "agent-description", value: description, onChange: (event) => setDescription(event.target.value), placeholder: t('agent.create.manualDescPlaceholder'), rows: 3 })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-model", children: t('agent.create.model') }), _jsx(Input, { id: "agent-model", value: model, onChange: (event) => setModel(event.target.value), placeholder: "inherit / fast / provider:model" })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-approval", children: t('agent.create.approvalMode') }), _jsxs(Select, { value: approvalMode, onValueChange: setApprovalMode, children: [_jsx(SelectTrigger, { id: "agent-approval", className: "w-full", children: _jsx(SelectValue, { children: approvalModeLabel(approvalMode, t) }) }), _jsx(SelectContent, { children: selectableApprovalModes.map((value) => (_jsx(SelectItem, { value: value, disabled: value === 'bubble', children: approvalModeLabel(value, t) }, value))) })] }), _jsx(FieldDescription, { children: approvalModeDescription(approvalMode, t) })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-max-turns", children: t('agent.create.maxTurns') }), _jsx(Input, { id: "agent-max-turns", type: "number", min: "1", step: "1", value: maxTurns, onChange: (event) => setMaxTurns(event.target.value) }), _jsx(FieldDescription, { children: t('agent.create.maxTurnsHelp') })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-color", children: t('agent.create.color') }), _jsxs(Select, { value: color, onValueChange: setColor, children: [_jsx(SelectTrigger, { id: "agent-color", className: "w-full", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: [
                                                        'inherit',
                                                        'auto',
                                                        'red',
                                                        'blue',
                                                        'green',
                                                        'yellow',
                                                        'purple',
                                                        'orange',
                                                        'pink',
                                                        'cyan',
                                                    ].map((value) => (_jsx(SelectItem, { value: value, children: value }, value))) })] })] })] }) }), _jsx(TabsContent, { value: "prompt", className: "pt-4", children: _jsxs(Field, { children: [_jsx(Textarea, { id: "agent-prompt", "aria-label": t('agent.create.prompt'), value: systemPrompt, onChange: (event) => setSystemPrompt(event.target.value), placeholder: t('agent.create.promptPlaceholder.cli'), rows: 16, className: "min-h-80 max-h-[60vh] overflow-y-auto" }), _jsx(FieldDescription, { children: t('agent.create.promptHelp') })] }) }), _jsx(TabsContent, { value: "tools", className: "pt-4", children: _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { children: t('agent.create.tools') }), _jsx(FieldDescription, { children: t('agent.create.toolsSelectHelp') }), _jsx(ToolPicker, { idPrefix: "agent-allowed-tool", selection: selectedTools, onSelectionChange: setSelectedTools, builtInTools: builtInTools, mcpServers: selectableMcpServers, mcpTools: mcpTools, t: t }), catalogLoading || mcpToolsLoading ? (_jsx(LoadingRow, { label: t('agent.create.tools.initializing') })) : null, catalogError || mcpToolsError ? (_jsx("div", { className: "whitespace-pre-wrap text-sm text-destructive", children: catalogError || mcpToolsError })) : null] }), _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('agent.create.disallowedTools') }), _jsx(ToolPicker, { idPrefix: "agent-disallowed-tool", selection: disallowedTools, onSelectionChange: setDisallowedTools, builtInTools: builtInTools, mcpServers: selectableMcpServers, mcpTools: mcpTools, t: t })] })] }) }), _jsx(TabsContent, { value: "mcp", className: "pt-4", children: _jsxs(Field, { children: [_jsx(FieldLabel, { children: t('agent.create.mcpServers') }), _jsx(McpServerPicker, { selection: selectedMcpServers, onSelectionChange: setSelectedMcpServers, servers: selectableMcpServers, t: t }), settingsResource.loading ? (_jsx(LoadingRow, { label: t('common.loading') })) : settingsResource.error ? (_jsx(ErrorRow, { error: settingsResource.error })) : null] }) }), _jsx(TabsContent, { value: "hooks", className: "pt-4", children: _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-hooks", children: "Hooks" }), _jsx(Textarea, { id: "agent-hooks", value: hooks, onChange: (event) => setHooks(event.target.value), placeholder: '{"PreToolUse":[...] }', rows: 10, className: "min-h-64 max-h-[60vh] overflow-y-auto font-mono text-xs" }), _jsx(FieldDescription, { children: t('agent.create.jsonObjectHelp') })] }) })] }), _jsxs("div", { className: "flex justify-end gap-2 border-t pt-4", children: [_jsx(Button, { variant: "outline", onClick: onCancel, disabled: busy, children: t('common.cancel') }), _jsxs(Button, { onClick: () => void handleSave(), disabled: !canSave || busy, children: [busy ? _jsx(Spinner, { "data-icon": "inline-start" }) : null, agent ? t('agent.edit.save') : t('agent.create.save')] })] }), _jsx(Dialog, { open: generationOpen, onOpenChange: setGenerationDialogOpen, children: _jsxs(DialogContent, { className: "max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('agent.create.modelGenerate') }), _jsx(DialogDescription, { children: t('agent.create.modelGenerate.description') })] }), generationError ? (_jsx(ManagementNotice, { tone: "error", noticeKey: generationError, closeLabel: t('common.close'), onDismiss: () => setGenerationError(null), children: generationError })) : null, _jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "agent-generation-requirements", children: t('agent.create.describeAgent') }), _jsx(Textarea, { id: "agent-generation-requirements", value: generationPrompt, onChange: (event) => setGenerationPrompt(event.target.value), placeholder: t('agent.create.qwenPlaceholder'), rows: 4 }), _jsx(FieldDescription, { children: t('agent.create.qwenHint') })] }), _jsxs(Field, { children: [_jsx(GenerationFieldLabel, { htmlFor: "agent-generated-description", label: t('agent.create.generatedDescription'), active: generatingFields.has('description'), disabled: !generationPrompt.trim(), onGenerate: () => void handleGenerate('description'), onCancel: () => cancelGeneration('description'), t: t }), _jsx(Textarea, { id: "agent-generated-description", value: generatedDescription, onChange: (event) => setGeneratedDescription(event.target.value), rows: 3, readOnly: generatingFields.has('description') })] }), _jsxs(Field, { children: [_jsx(GenerationFieldLabel, { htmlFor: "agent-generated-prompt", label: t('agent.create.generatedSystemPrompt'), active: generatingFields.has('systemPrompt'), disabled: !generationPrompt.trim(), onGenerate: () => void handleGenerate('systemPrompt'), onCancel: () => cancelGeneration('systemPrompt'), t: t }), _jsx(Textarea, { id: "agent-generated-prompt", value: generatedSystemPrompt, onChange: (event) => setGeneratedSystemPrompt(event.target.value), rows: 10, readOnly: generatingFields.has('systemPrompt'), className: "min-h-64 max-h-64 overflow-y-auto" })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setGenerationDialogOpen(false), children: t('common.cancel') }), _jsx(Button, { type: "button", onClick: useGeneratedDraft, disabled: generatingFields.size > 0 ||
                                        !generatedDescription.trim() ||
                                        !generatedSystemPrompt.trim(), children: t('agent.create.useGenerated') })] })] }) })] }));
}
function GenerationFieldLabel({ htmlFor, label, active, disabled, onGenerate, onCancel, t, }) {
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FieldLabel, { htmlFor: htmlFor, children: label }), active ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [_jsx(Spinner, { className: "size-3" }), t('agent.create.generatingPrompt')] }), _jsx(Button, { type: "button", variant: "outline", size: "sm", className: "ml-auto", onClick: onCancel, children: t('common.cancel') })] })) : (_jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "ml-auto", disabled: disabled, onClick: onGenerate, children: [_jsx(SparklesIcon, { "data-icon": "inline-start" }), t('agent.create.generate')] }))] }));
}
function ToolPicker({ idPrefix, selection, onSelectionChange, builtInTools, mcpServers, mcpTools, t, }) {
    const [kind, setKind] = useState('builtin');
    const [serverName, setServerName] = useState('');
    const availableMcpServers = mcpServers.filter((server) => !server.disabled);
    const availableTools = kind === 'builtin' ? builtInTools : (mcpTools[serverName] ?? []);
    const selectedLabels = new Map();
    for (const tool of builtInTools) {
        selectedLabels.set(tool.name, tool.displayName || tool.name);
    }
    for (const [currentServer, tools] of Object.entries(mcpTools)) {
        for (const tool of tools) {
            selectedLabels.set(tool.name, `${currentServer} / ${tool.serverToolName || tool.name}`);
        }
    }
    return (_jsxs("div", { className: "grid gap-3 rounded-lg border p-4", children: [_jsxs("div", { className: `grid gap-3 ${kind === 'mcp'
                    ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
                    : 'sm:grid-cols-[minmax(0,1fr)]'}`, children: [_jsxs(Select, { value: kind, onValueChange: (value) => {
                            setKind(value);
                            setServerName('');
                        }, children: [_jsx(SelectTrigger, { id: `${idPrefix}-kind`, className: "w-full", "aria-label": t('agent.create.tools.type'), children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "builtin", children: t('agent.create.tools.builtin') }), _jsx(SelectItem, { value: "mcp", children: t('agent.create.tools.mcp') })] })] }), kind === 'mcp' ? (_jsxs(Select, { value: serverName || undefined, onValueChange: setServerName, children: [_jsx(SelectTrigger, { id: `${idPrefix}-server`, className: "w-full", "aria-label": t('agent.create.tools.selectServer'), children: _jsx(SelectValue, { placeholder: t('agent.create.tools.selectServer') }) }), _jsx(SelectContent, { children: availableMcpServers.map((server) => (_jsxs(SelectItem, { value: server.name, disabled: server.mcpStatus !== 'connected' &&
                                        (mcpTools[server.name]?.length ?? 0) === 0, children: [server.name, server.mcpStatus
                                            ? ` · ${t(`mcp.status.${server.mcpStatus}`)}`
                                            : ''] }, server.name))) })] })) : null] }), _jsx("div", { className: "max-h-64 overflow-y-auto rounded-md border", children: availableTools.length > 0 ? (_jsx(TooltipProvider, { delayDuration: 300, children: _jsx("div", { className: "divide-y", children: availableTools.map((tool) => {
                            const displayName = kind === 'builtin'
                                ? tool.displayName ||
                                    tool.name
                                : tool.serverToolName ||
                                    tool.name;
                            return (_jsxs("label", { className: "flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-accent/30", children: [_jsx(Checkbox, { id: `${idPrefix}-${tool.name}`, checked: selection.has(tool.name), onCheckedChange: (checked) => onSelectionChange(toggleSelection(selection, tool.name, checked === true)) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-sm font-medium", children: displayName }), tool.description ? (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { className: "mt-0.5 block truncate text-xs text-muted-foreground", children: tool.description }) }), _jsx(TooltipContent, { className: "max-w-sm whitespace-normal", children: tool.description })] })) : null] })] }, tool.name));
                        }) }) })) : (_jsx("div", { className: "px-3 py-6 text-center text-sm text-muted-foreground", children: t('agent.create.tools.empty') })) }), selection.size > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2", children: [...selection].map((name) => (_jsxs("span", { className: "inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm", title: name, children: [_jsx("span", { className: "truncate", children: selectedLabels.get(name) || name }), _jsx("button", { type: "button", className: "rounded-sm text-muted-foreground hover:text-foreground", "aria-label": t('agent.create.removeSelection', { name }), onClick: () => onSelectionChange(toggleSelection(selection, name, false)), children: _jsx(XIcon, { className: "size-3.5" }) })] }, name))) })) : (_jsx("div", { className: "text-sm text-muted-foreground", children: t('agent.create.tools.noneSelected') }))] }));
}
function McpServerPicker({ selection, onSelectionChange, servers, t, }) {
    return (_jsx("div", { className: "max-h-64 overflow-y-auto rounded-lg border", children: servers.length > 0 ? (_jsx("div", { className: "divide-y", children: servers.map((server) => (_jsxs("label", { className: "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/30", children: [_jsx(Checkbox, { id: `agent-mcp-server-${server.name}`, checked: selection.has(server.name), onCheckedChange: (checked) => onSelectionChange(toggleSelection(selection, server.name, checked === true)) }), _jsx("span", { className: "min-w-0 flex-1 truncate text-sm font-medium", children: server.name }), server.mcpStatus ? (_jsx(Badge, { variant: "secondary", className: server.mcpStatus === 'connected'
                            ? 'bg-[var(--success-bg)] text-[var(--success-color)]'
                            : undefined, children: t(`mcp.status.${server.mcpStatus}`) })) : null] }, server.name))) })) : (_jsx("div", { className: "px-3 py-6 text-center text-sm text-muted-foreground", children: t('agent.create.mcpServers.empty') })) }));
}
function approvalModeLabel(value, t) {
    if (value === 'inherit' || value === 'bubble') {
        return t(`agent.approval.${value}`);
    }
    return t(`mode.listLabel.${value}`);
}
function approvalModeDescription(value, t) {
    if (value === 'inherit' || value === 'bubble') {
        return t(`agent.approval.desc.${value}`);
    }
    return t(`mode.desc.${value}`);
}
function LoadingRow({ label }) {
    return (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Spinner, {}), label] }));
}
function ErrorRow({ error }) {
    return _jsx("div", { className: "text-sm text-destructive", children: error?.message });
}
//# sourceMappingURL=AgentCreatePage.js.map