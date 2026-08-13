import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Cloud, KeyRound, Loader2, Server, SlidersHorizontal, } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
const PROVIDER_GROUPS = ['alibaba', 'third-party', 'custom'];
const PROVIDER_GROUP_ICONS = {
    alibaba: _jsx(Cloud, { className: "size-4" }),
    'third-party': _jsx(Server, { className: "size-4" }),
    custom: _jsx(SlidersHorizontal, { className: "size-4" }),
};
function isProviderGroup(value) {
    return value === 'alibaba' || value === 'third-party' || value === 'custom';
}
function parseModelIds(value) {
    return Array.from(new Set(value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)));
}
function defaultProtocol(provider) {
    return provider.protocolOptions[0] || provider.protocol;
}
function defaultBaseUrl(provider) {
    if (typeof provider.baseUrl === 'string')
        return provider.baseUrl;
    if (Array.isArray(provider.baseUrl))
        return provider.baseUrl[0]?.url ?? '';
    return provider.baseUrlPlaceholder ?? '';
}
function initialModelIds(provider) {
    const existingModelIds = provider.existingConfig?.modelIds ?? [];
    return existingModelIds.length > 0
        ? existingModelIds
        : provider.defaultModelIds;
}
function AnimatedSection({ children, className, subtle = false, }) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        setEntered(false);
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    return (_jsx("div", { className: cn('transition-[opacity,transform] ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none', subtle ? 'duration-100' : 'duration-150', entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0', className), children: children }));
}
export function ProviderConnectForm({ onConnected, onCancel, showHeader = true, className, }) {
    const { t } = useTranslation();
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState('alibaba');
    const [selectedProviderId, setSelectedProviderId] = useState(null);
    const [protocol, setProtocol] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [modelIdsText, setModelIdsText] = useState('');
    const [enableThinking, setEnableThinking] = useState(false);
    const [contextWindowSize, setContextWindowSize] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const groups = useMemo(() => PROVIDER_GROUPS.map((id) => ({
        id,
        title: t(`providerConnect.groups.${id}.title`),
        description: t(`providerConnect.groups.${id}.description`),
        icon: PROVIDER_GROUP_ICONS[id],
    })), [t]);
    const loadCatalog = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const result = await window.electronAPI.listQwenProviders();
            setCatalog(result);
        }
        catch (error) {
            setLoadError(error instanceof Error
                ? error.message
                : t('providerConnect.loadFailed'));
        }
        finally {
            setLoading(false);
        }
    }, [t]);
    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);
    const providersByGroup = useMemo(() => {
        const groups = {
            alibaba: [],
            'third-party': [],
            custom: [],
        };
        for (const provider of catalog?.providers ?? []) {
            const group = isProviderGroup(provider.uiGroup)
                ? provider.uiGroup
                : 'third-party';
            groups[group].push(provider);
        }
        return groups;
    }, [catalog]);
    const activeGroup = groups.find((group) => group.id === selectedGroup);
    const selectedProvider = useMemo(() => catalog?.providers.find((provider) => provider.id === selectedProviderId) ?? null, [catalog, selectedProviderId]);
    const selectProvider = useCallback((provider) => {
        const existingConfig = provider.existingConfig;
        const contextWindowSize = existingConfig?.advancedConfig?.contextWindowSize;
        setSelectedProviderId(provider.id);
        setProtocol(existingConfig?.protocol ?? defaultProtocol(provider));
        setBaseUrl(existingConfig?.baseUrl ?? defaultBaseUrl(provider));
        setApiKey(existingConfig?.apiKey ?? '');
        setModelIdsText(initialModelIds(provider).join(', '));
        setEnableThinking(existingConfig?.advancedConfig?.enableThinking === true);
        setContextWindowSize(typeof contextWindowSize === 'number' ? String(contextWindowSize) : '');
        setFormError(null);
    }, []);
    const handleSubmit = useCallback(async () => {
        if (!selectedProvider)
            return;
        const modelIds = parseModelIds(modelIdsText);
        if (!apiKey.trim()) {
            setFormError(t('providerConnect.errors.apiKeyRequired'));
            return;
        }
        if (modelIds.length === 0) {
            setFormError(t('providerConnect.errors.modelRequired'));
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            const contextSize = Number(contextWindowSize);
            const params = {
                providerId: selectedProvider.id,
                protocol,
                baseUrl,
                apiKey: apiKey.trim(),
                modelIds,
                scope: 'user',
                ...(selectedProvider.showAdvancedConfig
                    ? {
                        advancedConfig: {
                            ...(enableThinking ? { enableThinking: true } : {}),
                            ...(Number.isFinite(contextSize) && contextSize > 0
                                ? { contextWindowSize: contextSize }
                                : {}),
                        },
                    }
                    : {}),
            };
            const result = await window.electronAPI.connectQwenProvider(params);
            if (!result.success) {
                setFormError(result.error || t('providerConnect.errors.connectFailed'));
                return;
            }
            toast.success(t('providerConnect.connectedToast', {
                provider: result.providerLabel || selectedProvider.label,
            }));
            onConnected(result);
        }
        catch (error) {
            setFormError(error instanceof Error
                ? error.message
                : t('providerConnect.errors.connectFailed'));
        }
        finally {
            setSubmitting(false);
        }
    }, [
        apiKey,
        baseUrl,
        contextWindowSize,
        enableThinking,
        modelIdsText,
        onConnected,
        protocol,
        selectedProvider,
        t,
    ]);
    if (loading) {
        return (_jsxs("div", { className: cn('flex items-center justify-center py-12 text-sm text-muted-foreground', className), children: [_jsx(Loader2, { className: "mr-2 size-4 animate-spin" }), t('providerConnect.loading')] }));
    }
    if (loadError) {
        return (_jsxs("div", { className: cn('space-y-4', className), children: [_jsx("div", { className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: loadError }), _jsx(Button, { type: "button", variant: "outline", onClick: loadCatalog, children: t('common.retry') })] }));
    }
    if (!selectedProvider) {
        return (_jsxs(AnimatedSection, { className: cn('space-y-5', className), children: [showHeader && (_jsxs("div", { className: "space-y-1", children: [_jsx("h2", { className: "text-lg font-semibold", children: t('providerConnect.title') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('providerConnect.description') })] })), _jsx("div", { className: "grid grid-cols-3 gap-1 rounded-md bg-muted p-1", children: groups.map((group) => (_jsxs("button", { type: "button", onClick: () => setSelectedGroup(group.id), className: cn('flex h-8 items-center justify-center gap-1.5 rounded px-2 text-xs font-medium transition-colors', selectedGroup === group.id
                            ? 'bg-background text-foreground shadow-minimal'
                            : 'text-muted-foreground hover:text-foreground'), children: [group.icon, _jsx("span", { className: "truncate", children: group.title })] }, group.id))) }), activeGroup && (_jsx("p", { className: "text-xs text-muted-foreground", children: activeGroup.description })), _jsx(AnimatedSection, { subtle: true, className: "space-y-3", children: providersByGroup[selectedGroup].map((provider) => (_jsxs("button", { type: "button", onClick: () => selectProvider(provider), className: "flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground", children: _jsx(KeyRound, { className: "size-4" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-medium", children: provider.label }), _jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: provider.description })] })] }, provider.id))) }, selectedGroup), onCancel && (_jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "button", variant: "ghost", onClick: onCancel, children: t('common.cancel') }) }))] }, "provider-list"));
    }
    const fixedBaseUrl = typeof selectedProvider.baseUrl === 'string';
    const baseUrlOptions = Array.isArray(selectedProvider.baseUrl)
        ? selectedProvider.baseUrl
        : [];
    const showProtocol = selectedProvider.protocolOptions.length > 1;
    const showBaseUrlInput = !fixedBaseUrl || baseUrlOptions.length > 0;
    return (_jsxs(AnimatedSection, { className: cn('space-y-5', className), children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "size-8 shrink-0", onClick: () => setSelectedProviderId(null), disabled: submitting, children: _jsx(ArrowLeft, { className: "size-4" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-lg font-semibold", children: selectedProvider.label }), _jsx("p", { className: "text-sm text-muted-foreground", children: selectedProvider.description })] })] }), _jsxs("div", { className: "space-y-4", children: [showProtocol && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('providerConnect.protocol') }), _jsxs(Select, { value: protocol, onValueChange: setProtocol, disabled: submitting, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: selectedProvider.protocolOptions.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })] })] })), showBaseUrlInput && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: selectedProvider.uiLabels?.baseUrlStepTitle === 'Region'
                                    ? t('providerConnect.region')
                                    : selectedProvider.uiLabels?.baseUrlStepTitle ||
                                        t('providerConnect.baseUrl') }), baseUrlOptions.length > 0 ? (_jsxs(Select, { value: baseUrl, onValueChange: setBaseUrl, disabled: submitting, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: baseUrlOptions.map((option) => (_jsx(SelectItem, { value: option.url, children: option.label }, option.id))) })] })) : (_jsx(Input, { value: baseUrl, onChange: (event) => setBaseUrl(event.target.value), placeholder: selectedProvider.baseUrlPlaceholder ||
                                    'https://api.example.com/v1', disabled: submitting }))] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('providerConnect.apiKey') }), _jsx(Input, { type: "password", value: apiKey, onChange: (event) => setApiKey(event.target.value), placeholder: selectedProvider.apiKeyPlaceholder ||
                                    t('providerConnect.apiKeyPlaceholder'), disabled: submitting })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('providerConnect.models') }), _jsx(Textarea, { value: modelIdsText, onChange: (event) => setModelIdsText(event.target.value), placeholder: t('providerConnect.modelsPlaceholder'), className: "min-h-20", disabled: submitting || !selectedProvider.modelsEditable })] }), selectedProvider.showAdvancedConfig && (_jsxs("div", { className: "grid gap-3 rounded-md border border-border p-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: enableThinking, onChange: (event) => setEnableThinking(event.target.checked), disabled: submitting }), t('providerConnect.enableThinking')] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: t('providerConnect.contextWindow') }), _jsx(Input, { type: "number", min: 1, value: contextWindowSize, onChange: (event) => setContextWindowSize(event.target.value), placeholder: t('providerConnect.optional'), disabled: submitting })] })] }))] }), formError && (_jsx("div", { className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: formError })), _jsxs("div", { className: "flex justify-end gap-2", children: [onCancel && (_jsx(Button, { type: "button", variant: "ghost", onClick: onCancel, disabled: submitting, children: t('common.cancel') })), _jsxs(Button, { type: "button", onClick: handleSubmit, disabled: submitting, children: [submitting ? (_jsx(Loader2, { className: "size-4 animate-spin" })) : (_jsx(Check, { className: "size-4" })), t('auth.connect')] })] })] }, selectedProvider.id));
}
//# sourceMappingURL=ProviderConnectForm.js.map