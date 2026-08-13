import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info_Badge } from '@/components/info';
import { SettingsSection, SettingsCard, SettingsSegmentedControl, } from '@/components/settings';
import { routes } from '@/lib/navigate';
export const meta = {
    navigator: 'settings',
    slug: 'permissions',
};
const RULE_TYPES = ['allow', 'ask', 'deny'];
const SCOPES = ['user', 'workspace'];
const QWEN_PERMISSIONS_DOC_URL = 'https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/#permissions';
function ruleTypeLabel(type, t) {
    return t(`settings.permissions.ruleType.${type}`);
}
function scopeLabel(scope, t) {
    return t(`settings.permissions.scope.${scope}`);
}
function scopeDescription(scope, t) {
    return t(`settings.permissions.scopeDesc.${scope}`);
}
function ruleTypeDescription(type, t) {
    return t(`settings.permissions.ruleTypeDesc.${type}`);
}
function normalizeRules(rules) {
    return Array.from(new Set(rules.map((rule) => rule.trim()).filter(Boolean)));
}
export default function PermissionsSettingsPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [activeRuleType, setActiveRuleType] = useState('allow');
    const [drafts, setDrafts] = useState({
        user: '',
        workspace: '',
    });
    const [savingKey, setSavingKey] = useState(null);
    const [error, setError] = useState(null);
    const loadSettings = useCallback(async () => {
        if (!window.electronAPI) {
            setSettings(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.getQwenPermissionSettings();
            setSettings(result);
        }
        catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : String(loadError));
            setSettings(null);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);
    const ruleTypeOptions = useMemo(() => RULE_TYPES.map((type) => ({
        value: type,
        label: ruleTypeLabel(type, t),
    })), [t]);
    const saveRules = useCallback(async (scope, ruleType, rules) => {
        if (!window.electronAPI)
            return;
        const key = `${scope}:${ruleType}`;
        setSavingKey(key);
        setError(null);
        try {
            const result = await window.electronAPI.setQwenPermissionRules(scope, ruleType, normalizeRules(rules));
            setSettings(result);
        }
        catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : String(saveError));
        }
        finally {
            setSavingKey(null);
        }
    }, []);
    const addRule = useCallback(async (scope) => {
        if (!settings)
            return;
        const draft = drafts[scope].trim();
        if (!draft)
            return;
        const nextRules = normalizeRules([
            ...settings[scope].rules[activeRuleType],
            draft,
        ]);
        setDrafts((current) => ({ ...current, [scope]: '' }));
        await saveRules(scope, activeRuleType, nextRules);
    }, [activeRuleType, drafts, saveRules, settings]);
    const removeRule = useCallback(async (scope, rule) => {
        if (!settings)
            return;
        const nextRules = settings[scope].rules[activeRuleType].filter((item) => item !== rule);
        await saveRules(scope, activeRuleType, nextRules);
    }, [activeRuleType, saveRules, settings]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t('settings.permissions.title'), actions: _jsx(HeaderMenu, { route: routes.view.settings('permissions'), helpFeature: "permissions" }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsx(SettingsSection, { title: t('settings.permissions.aboutPermissions'), children: _jsx(SettingsCard, { className: "px-4 py-3.5", children: _jsxs("div", { className: "text-sm text-muted-foreground leading-relaxed space-y-2", children: [_jsx("p", { children: t('settings.permissions.cliAlignedIntro') }), _jsx("p", { children: t('settings.permissions.cliAlignedFormat') }), _jsxs("div", { className: "rounded-md border border-border/70 bg-muted/35 px-3 py-2.5 text-xs text-muted-foreground", children: [_jsx("div", { className: "font-medium text-foreground/80", children: t('settings.permissions.quickGuideTitle') }), _jsxs("div", { className: "mt-1.5 space-y-1", children: [_jsx("p", { children: t('settings.permissions.quickGuideTools') }), _jsx("p", { children: t('settings.permissions.quickGuideCommands') }), _jsx("p", { children: t('settings.permissions.quickGuideScopes') })] })] }), _jsx("button", { type: "button", onClick: () => window.electronAPI?.openUrl(QWEN_PERMISSIONS_DOC_URL), className: "text-foreground/70 hover:text-foreground underline underline-offset-2", children: t('common.learnMore') })] }) }) }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) })) : error && !settings ? (_jsx(EmptyState, { title: t('settings.permissions.unavailable'), description: error })) : settings ? (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: t('settings.permissions.ruleEditor'), description: ruleTypeDescription(activeRuleType, t), children: [_jsx("div", { className: "mb-3", children: _jsx(SettingsSegmentedControl, { value: activeRuleType, onValueChange: setActiveRuleType, options: ruleTypeOptions }) }), _jsx("div", { className: "space-y-3", children: SCOPES.map((scope) => (_jsx(RuleScopeCard, { scope: scope, ruleType: activeRuleType, rules: settings[scope].rules[activeRuleType], path: settings[scope].path, draft: drafts[scope], isSaving: savingKey === `${scope}:${activeRuleType}`, onDraftChange: (value) => setDrafts((current) => ({
                                                            ...current,
                                                            [scope]: value,
                                                        })), onAdd: () => void addRule(scope), onRemove: (rule) => void removeRule(scope, rule) }, scope))) }), error ? (_jsxs("div", { className: "mt-3 flex items-start gap-2 text-xs text-destructive", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5 mt-0.5 shrink-0" }), _jsx("span", { children: error })] })) : null] }), _jsx(SettingsSection, { title: t('settings.permissions.effectiveRules'), description: t('settings.permissions.effectiveRulesDesc'), children: _jsx(SettingsCard, { className: "px-4 py-3.5", children: _jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: RULE_TYPES.map((type) => (_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx(ShieldCheck, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { children: ruleTypeLabel(type, t) }), _jsx(Info_Badge, { color: "muted", children: settings.merged[type].length })] }), _jsxs("div", { className: "mt-2 space-y-1", children: [settings.merged[type].slice(0, 4).map((rule) => (_jsx("div", { className: "truncate font-mono text-xs text-muted-foreground", title: rule, children: rule }, rule))), settings.merged[type].length === 0 ? (_jsx("div", { className: "text-xs text-muted-foreground/70", children: t('settings.permissions.noRules') })) : null] })] }, type))) }) }) })] })) : null] }) }) }) })] }));
}
function EmptyState({ title, description, }) {
    return (_jsx(SettingsCard, { className: "px-4 py-8", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium", children: title }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: description })] }) }));
}
function RuleScopeCard({ scope, ruleType, rules, path, draft, isSaving, onDraftChange, onAdd, onRemove, }) {
    const { t } = useTranslation();
    const placeholder = ruleType === 'allow' ? 'Bash(git status)' : 'Bash(rm -rf *)';
    return (_jsxs(SettingsCard, { className: "px-4 py-3.5", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium", children: scopeLabel(scope, t) }), _jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: scopeDescription(scope, t) }), _jsx("div", { className: "text-[11px] text-muted-foreground/70 mt-1 truncate font-mono", children: path })] }), isSaving ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground shrink-0 mt-1" })) : null] }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx(Input, { value: draft, onChange: (event) => onDraftChange(event.target.value), onKeyDown: (event) => {
                            if (event.key === 'Enter')
                                onAdd();
                        }, placeholder: placeholder, className: "h-8 font-mono text-xs" }), _jsx(Button, { type: "button", size: "sm", onClick: onAdd, disabled: !draft.trim() || isSaving, className: "h-8 px-2.5", children: _jsx(Plus, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "mt-1.5 text-[11px] text-muted-foreground", children: t('settings.permissions.inputHint') }), _jsx("div", { className: "mt-3 divide-y divide-border/60", children: rules.length > 0 ? (rules.map((rule) => (_jsxs("div", { className: "flex items-center gap-2 py-2", children: [_jsx("code", { className: "min-w-0 flex-1 truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs", children: rule }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onRemove(rule), disabled: isSaving, className: "h-7 w-7 p-0 text-muted-foreground hover:text-destructive", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] }, rule)))) : (_jsx("div", { className: "py-3 text-xs text-muted-foreground", children: t(`settings.permissions.noRulesInScope.${ruleType}`) })) })] }));
}
//# sourceMappingURL=PermissionsSettingsPage.js.map