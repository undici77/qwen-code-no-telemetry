import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState, } from 'react';
import { BotIcon, DatabaseIcon, FlaskConicalIcon, PaletteIcon, ServerIcon, Settings2Icon, ShieldIcon, SlidersHorizontalIcon, WrenchIcon, } from 'lucide-react';
import { WEB_SHELL_LANGUAGES, languageLabel, languageSettingToWebShellLanguage, useI18n, } from '../../i18n';
import { LiveVoiceSettingsCard } from '../../live/LiveVoiceSettingsCard';
import { WEB_SHELL_THEMES, WebShellThemeId, THEME_SETTING_KEY, LANGUAGE_SETTING_KEY, themeSettingToWebShellTheme, useTheme, webShellThemeToSettingValue, } from '../../themeContext';
import { ModelManagementSection, } from './ModelManagementSection';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '../ui/empty';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle, } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
const SUB_DIALOG_KEYS = new Set([
    'fastModel',
    'visionModel',
    'voiceModel',
    'modelFallbacks',
]);
const HIDDEN_SETTING_KEYS = new Set([
    'ui.hideTips',
    'ui.enableUserFeedback',
    'ui.compactMode',
    'ui.compactInline',
    'mcpServers',
]);
const LIVE_SETTING_KEYS = new Set([
    'experimental.liveVoice.enabled',
    'experimental.liveVoice.shortcut',
]);
function translateSettingText(t, key, fallback) {
    const translated = t(key);
    return translated === key ? fallback : translated;
}
function formatSettingCategory(category, t) {
    return translateSettingText(t, `settings.category.${category}`, category);
}
export function formatSettingLabel(setting, t) {
    return translateSettingText(t, `settings.label.${setting.key}`, setting.label);
}
function formatSettingDescription(setting, t) {
    if (!setting.description)
        return undefined;
    return translateSettingText(t, `settings.description.${setting.key}`, setting.description);
}
function formatSettingOption(setting, value, label, t) {
    return translateSettingText(t, `settings.option.${setting.key}.${String(value)}`, label);
}
function formatValue(setting, scope, t) {
    const effective = resolveValue(setting, scope);
    if (effective === undefined || effective === null)
        return '';
    if (setting.key === THEME_SETTING_KEY) {
        const theme = themeSettingToWebShellTheme(effective, WebShellThemeId.Dark);
        return t(`theme.${theme}`);
    }
    if (setting.key === LANGUAGE_SETTING_KEY) {
        const language = languageSettingToWebShellLanguage(effective);
        return language ? languageLabel(language) : String(effective);
    }
    if (setting.type === 'boolean')
        return effective === true
            ? t('settings.value.on')
            : t('settings.value.off');
    if (setting.type === 'enum' && setting.options) {
        const opt = setting.options.find((o) => o.value === effective);
        return opt
            ? formatSettingOption(setting, opt.value, opt.label, t)
            : String(effective);
    }
    const s = String(effective);
    return s.length > 24 ? `${s.slice(0, 21)}…` : s;
}
function scopeHasValue(setting, scope) {
    const val = scope === 'user' ? setting.values.user : setting.values.workspace;
    return val !== undefined;
}
/* Mirrors the native CLI's getScopeMessageForSetting(): "(Modified in X)"
   when only the other scope has a value, "(Also modified in X)" when both
   do. Returns the i18n key; undefined when the other scope is untouched. */
function scopeHintKey(setting, scope) {
    const otherHasValue = scope === 'workspace'
        ? setting.values.user !== undefined
        : setting.values.workspace !== undefined;
    if (!otherHasValue)
        return undefined;
    return scopeHasValue(setting, scope)
        ? 'settings.alsoModifiedIn'
        : 'settings.modifiedIn';
}
function resolveValue(setting, scope) {
    const scopeVal = scope === 'user' ? setting.values.user : setting.values.workspace;
    return scopeVal !== undefined ? scopeVal : setting.values.effective;
}
function groupByCategory(settings) {
    const map = new Map();
    for (const s of settings) {
        let group = map.get(s.category);
        if (!group) {
            group = [];
            map.set(s.category, group);
        }
        group.push(s);
    }
    return Array.from(map.entries()).map(([category, items]) => ({
        category,
        items,
    }));
}
function CategoryIcon({ category }) {
    const normalized = category.toLowerCase();
    const Icon = normalized.includes('ui')
        ? PaletteIcon
        : normalized.includes('tool')
            ? WrenchIcon
            : normalized.includes('context')
                ? DatabaseIcon
                : normalized.includes('privacy')
                    ? ShieldIcon
                    : normalized.includes('model')
                        ? BotIcon
                        : normalized.includes('daemon')
                            ? ServerIcon
                            : normalized.includes('advanced')
                                ? SlidersHorizontalIcon
                                : normalized.includes('experimental')
                                    ? FlaskConicalIcon
                                    : Settings2Icon;
    return _jsx(Icon, { "data-icon": "inline-start", "aria-hidden": "true" });
}
function SettingsRow({ title, description, metadata, control, }) {
    return (_jsxs(Field, { orientation: "responsive", className: "min-h-20 gap-6 px-5 py-4 max-md:px-4", children: [_jsxs(FieldContent, { className: "min-w-0", children: [_jsxs(FieldTitle, { children: [title, metadata] }), description && (_jsx(FieldDescription, { className: "max-w-3xl", children: description }))] }), _jsx("div", { className: "flex min-w-0 justify-end max-md:justify-start", children: control })] }));
}
function SettingInput({ name, label, type, value, disabled, onCommit, onInvalid, }) {
    const currentValue = String(value ?? '');
    const [draft, setDraft] = useState(currentValue);
    useEffect(() => setDraft(currentValue), [currentValue]);
    const commit = () => {
        if (type === 'number') {
            const trimmed = draft.trim();
            const parsed = Number(trimmed);
            if (!trimmed || !Number.isFinite(parsed)) {
                setDraft(currentValue);
                onInvalid();
                return;
            }
            if (parsed !== value)
                onCommit(parsed);
            return;
        }
        if (draft !== currentValue)
            onCommit(draft);
    };
    return (_jsx(Input, { type: type, name: name, autoComplete: "off", "aria-label": label, value: draft, disabled: disabled, className: "w-[min(80px,50vw)] max-md:w-full", onChange: (event) => setDraft(event.target.value), onBlur: commit, onKeyDown: (event) => {
            if (event.key === 'Enter')
                event.currentTarget.blur();
            if (event.key === 'Escape') {
                setDraft(currentValue);
                event.currentTarget.blur();
            }
        } }));
}
/* Wraps around at both ends (matching the native CLI) while skipping
   category-header rows. Exported for tests. */
export function nextSettingIdx(rows, current, dir) {
    const n = rows.length;
    if (n === 0)
        return current;
    let i = current;
    for (let step = 0; step < n; step++) {
        i = (i + dir + n) % n;
        if (rows[i].type === 'setting' || rows[i].type === 'local')
            return i;
    }
    return current;
}
export function SettingsMessage({ settingsState, onLanguageChange, onSubDialog, onThemeChange, chatWidthMode, onChatWidthModeChange, modelManagement, embedded = false, }) {
    const { language: selectedLanguage, t } = useI18n();
    const selectedTheme = useTheme();
    const { status, settings, loading, error, reload, setValue, liveSetup } = settingsState;
    const [scope, setScope] = useState('workspace');
    const [activeCategory, setActiveCategory] = useState('');
    const [busyKey, setBusyKey] = useState(null);
    const [message, setMessage] = useState(null);
    const [restartPending, setRestartPending] = useState(false);
    const showInitialLoading = loading && !status;
    const categories = useMemo(() => {
        const visibleSettings = settings.filter((setting) => !HIDDEN_SETTING_KEYS.has(setting.key) &&
            !LIVE_SETTING_KEYS.has(setting.key));
        const groups = groupByCategory(visibleSettings).map((group) => ({
            id: group.category,
            label: formatSettingCategory(group.category, t),
            items: group.items.map((setting) => ({
                type: 'setting',
                setting,
            })),
        }));
        const localItem = {
            type: 'local',
            localKey: 'chatWidth',
        };
        const themeGroup = groups.find((group) => group.items.some((item) => item.type === 'setting' && item.setting.key === THEME_SETTING_KEY));
        if (themeGroup) {
            const themeIndex = themeGroup.items.findIndex((item) => item.type === 'setting' && item.setting.key === THEME_SETTING_KEY);
            themeGroup.items.splice(themeIndex + 1, 0, localItem);
        }
        else {
            groups.push({
                id: 'UI',
                label: formatSettingCategory('UI', t),
                items: [localItem],
            });
        }
        if (liveSetup?.supported) {
            const experimental = groups.find((group) => group.id === 'Experimental');
            if (experimental) {
                experimental.items.unshift({ type: 'live' });
            }
            else {
                groups.push({
                    id: 'Experimental',
                    label: formatSettingCategory('Experimental', t),
                    items: [{ type: 'live' }],
                });
            }
        }
        return groups;
    }, [liveSetup, settings, t]);
    useEffect(() => {
        if (categories.length === 0)
            return;
        if (!categories.some((category) => category.id === activeCategory)) {
            setActiveCategory(categories[0].id);
        }
    }, [activeCategory, categories]);
    useEffect(() => {
        if (error)
            setMessage(error.message);
        else if (status?.warnings?.length)
            setMessage(status.warnings
                .map((w) => t('settings.corrupted', {
                recovered: w.recovered ? 'true' : 'false',
            }))
                .join('; '));
        else if (settings.length > 0)
            setMessage(null);
    }, [error, settings, status, t]);
    const handleSetValue = useCallback((key, value) => {
        if (!restartPending)
            setMessage(null);
        setBusyKey(key);
        setValue(scope, key, value)
            .then(async (result) => {
            try {
                await reload();
            }
            catch {
                // reload failure is non-fatal — the value was already saved
            }
            if (result?.requiresRestart && key !== LANGUAGE_SETTING_KEY) {
                setRestartPending(true);
            }
        })
            .catch((err) => {
            setMessage(err instanceof Error ? err.message : String(err));
        })
            .finally(() => setBusyKey(null));
    }, [reload, restartPending, scope, setValue]);
    const activeGroup = categories.find((category) => category.id === activeCategory) ??
        categories[0];
    // The model-management block is surfaced inside the "Model" category, detected
    // by the raw category of its dialog settings (fastModel etc.).
    const isModelCategory = activeGroup?.items.some((item) => item.type === 'setting' && item.setting.category === 'Model');
    const renderSelect = (value, onChange, options, ariaLabel, disabled = false) => (_jsxs(Select, { value: value, disabled: disabled, onValueChange: onChange, children: [_jsx(SelectTrigger, { size: "sm", "aria-label": ariaLabel, className: "w-[min(160px,50vw)] bg-background max-md:w-full", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { position: "popper", align: "end", children: _jsx(SelectGroup, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) }) })] }));
    const renderSettingControl = (setting) => {
        const value = resolveValue(setting, scope);
        const isBusy = busyKey === setting.key;
        // User-scope settings are editable (this PR enables user-scope writes); the
        // daemon rejects disallowed keys regardless of scope.
        const disabled = isBusy;
        // Theme is a daemon-backed setting, so update both the live shell and the
        // settings API. Language is applied through the language callback (which
        // forwards the selected scope to the /language command). Both controls
        // reflect the value for the SELECTED scope, falling back to the live value.
        if (setting.key === THEME_SETTING_KEY) {
            return renderSelect(themeSettingToWebShellTheme(value) ?? selectedTheme, (next) => {
                const theme = next;
                onThemeChange(theme);
                handleSetValue(THEME_SETTING_KEY, webShellThemeToSettingValue(theme));
            }, WEB_SHELL_THEMES.map((theme) => ({
                value: theme,
                label: t(`theme.${theme}`),
            })), formatSettingLabel(setting, t), disabled);
        }
        if (setting.key === LANGUAGE_SETTING_KEY) {
            return renderSelect(languageSettingToWebShellLanguage(value) ?? selectedLanguage, (next) => onLanguageChange(next, scope), WEB_SHELL_LANGUAGES.map((language) => ({
                value: language,
                label: languageLabel(language),
            })), formatSettingLabel(setting, t), disabled);
        }
        if (SUB_DIALOG_KEYS.has(setting.key)) {
            return (_jsx(Button, { type: "button", variant: "outline", size: "sm", disabled: disabled, className: "max-w-[260px] truncate", onClick: () => onSubDialog(setting.key, scope), children: formatValue(setting, scope, t) || t('settings.action.select') }));
        }
        if (setting.type === 'boolean') {
            const checked = value === true;
            return (_jsx(Switch, { checked: checked, disabled: disabled, onCheckedChange: (next) => handleSetValue(setting.key, next), "aria-label": formatSettingLabel(setting, t) }));
        }
        if (setting.type === 'enum' && setting.options?.length) {
            const currentIndex = setting.options.findIndex((option) => option.value === value);
            return renderSelect(currentIndex >= 0 ? String(currentIndex) : '', (next) => {
                const option = setting.options?.[Number(next)];
                if (option)
                    handleSetValue(setting.key, option.value);
            }, setting.options.map((option, index) => ({
                value: String(index),
                label: formatSettingOption(setting, option.value, option.label, t),
            })), formatSettingLabel(setting, t), disabled);
        }
        return (_jsx(SettingInput, { name: setting.key, label: formatSettingLabel(setting, t), type: setting.type === 'number' ? 'number' : 'text', value: value, disabled: disabled, onCommit: (next) => handleSetValue(setting.key, next), onInvalid: () => setMessage(t('settings.invalidNumber')) }));
    };
    return (_jsxs("div", { className: embedded
            ? 'flex min-h-0 flex-1 flex-col text-sm text-foreground'
            : 'flex max-w-[min(var(--chat-regular-content-width,1000px),calc(100vw-64px))] flex-col overflow-hidden rounded-xl border border-border bg-background text-sm text-foreground', "data-keyboard-scope": true, children: [!embedded && (_jsx("div", { className: "flex items-center justify-between border-b border-border px-5 py-4", children: _jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold text-balance", children: t('settings.title') }), _jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: t('settings.scope.workspace') })] }) })), (message || showInitialLoading) && (_jsxs(Alert, { className: "mx-4 mt-3 w-auto", children: [showInitialLoading && _jsx(Spinner, {}), _jsx(AlertDescription, { children: message || t('settings.loading') })] })), _jsxs(Tabs, { value: scope, className: "flex min-h-0 flex-1 flex-col gap-0", onValueChange: (next) => {
                    setScope(next);
                }, children: [_jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border px-3 py-2", children: [_jsxs(TabsList, { className: "p-0", children: [_jsx(TabsTrigger, { value: "workspace", children: t('settings.scope.workspace') }), _jsx(TabsTrigger, { value: "user", children: t('settings.scope.user') })] }), restartPending && (_jsx(Badge, { variant: "secondary", children: t('settings.requiresRestart') }))] }), _jsxs(TabsContent, { value: scope, forceMount: true, className: "grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)] outline-none max-md:grid-cols-1", children: [_jsx("nav", { className: "flex min-h-0 flex-col gap-1 overflow-y-auto border-r border-border bg-muted/20 p-3 max-md:flex-row max-md:overflow-x-auto max-md:border-r-0 max-md:border-b", "aria-label": t('settings.title'), children: categories.map((category) => (_jsxs(Button, { type: "button", variant: category.id === activeCategory ? 'secondary' : 'ghost', size: "sm", "aria-current": category.id === activeCategory ? 'page' : undefined, className: "w-full justify-start gap-2 px-2.5 max-md:w-auto max-md:shrink-0", onClick: () => setActiveCategory(category.id), children: [_jsx(CategoryIcon, { category: category.id }), _jsx("span", { className: "min-w-0 flex-1 truncate text-left", children: category.label }), _jsx("span", { className: "text-xs tabular-nums text-muted-foreground", children: category.items.length })] }, category.id))) }), _jsxs("section", { className: "min-h-0 min-w-0 overflow-y-auto bg-background p-5 max-md:p-3", children: [!loading && !activeGroup && (_jsx(Empty, { className: "min-h-60", children: _jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: _jsx(Settings2Icon, {}) }), _jsx(EmptyTitle, { children: t('settings.empty') }), _jsx(EmptyDescription, { children: t('settings.empty') })] }) })), activeGroup && (_jsxs("div", { className: "mx-auto w-full max-w-5xl", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CategoryIcon, { category: activeGroup.id }), activeGroup.label] }) }), _jsx(CardContent, { className: "-mb-(--card-spacing) p-0", children: _jsx(FieldGroup, { className: "gap-0", children: activeGroup.items.map((item, index) => {
                                                                const separator = index > 0 && (_jsx(Separator, { className: "mx-5 w-auto max-md:mx-4" }));
                                                                if (item.type === 'local') {
                                                                    return (_jsxs("div", { children: [separator, _jsx(SettingsRow, { title: t('settings.label.ui.chatWidth'), description: t('settings.description.ui.chatWidth'), control: renderSelect(chatWidthMode, (next) => onChatWidthModeChange(next), [
                                                                                    {
                                                                                        value: '1000',
                                                                                        label: t('settings.option.ui.chatWidth.1000'),
                                                                                    },
                                                                                    {
                                                                                        value: 'wide',
                                                                                        label: t('settings.option.ui.chatWidth.wide'),
                                                                                    },
                                                                                ], t('settings.label.ui.chatWidth'), false) })] }, item.localKey));
                                                                }
                                                                if (item.type === 'live') {
                                                                    return liveSetup ? (_jsxs("div", { children: [separator, _jsx(LiveVoiceSettingsCard, { setup: liveSetup })] }, "live-voice-setup")) : null;
                                                                }
                                                                const setting = item.setting;
                                                                const description = formatSettingDescription(setting, t);
                                                                const hintKey = scopeHintKey(setting, scope);
                                                                const hasScopeValue = scopeHasValue(setting, scope);
                                                                const scopeHint = hintKey
                                                                    ? t(hintKey, {
                                                                        scope: t(scope === 'workspace'
                                                                            ? 'settings.scope.user'
                                                                            : 'settings.scope.workspace'),
                                                                    })
                                                                    : undefined;
                                                                return (_jsxs("div", { children: [separator, _jsx(SettingsRow, { title: formatSettingLabel(setting, t), description: [description, scopeHint]
                                                                                .filter(Boolean)
                                                                                .join(' · ') || undefined, metadata: hasScopeValue ? (_jsx(Badge, { variant: "secondary", children: scope === 'workspace'
                                                                                    ? t('settings.scope.workspace')
                                                                                    : t('settings.scope.user') })) : undefined, control: busyKey === setting.key ? (_jsx(Spinner, {})) : (renderSettingControl(setting)) })] }, setting.key));
                                                            }) }) })] }), isModelCategory && modelManagement && (_jsx("div", { className: "mt-4", children: _jsx(ModelManagementSection, { ...modelManagement }) }))] }))] })] })] }), !embedded && (_jsx("div", { className: "border-t border-border px-5 py-3 text-xs text-muted-foreground", children: t('settings.footer') }))] }));
}
//# sourceMappingURL=SettingsMessage.js.map