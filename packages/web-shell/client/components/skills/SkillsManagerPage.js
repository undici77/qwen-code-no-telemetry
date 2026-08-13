import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AlertCircleIcon, ArrowLeftIcon, EllipsisVerticalIcon, PlayIcon, PlusIcon, RefreshCwIcon, SearchIcon, SparklesIcon, } from 'lucide-react';
import { useSkills, useWorkspace, } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { filterSkills, preserveSkillSelection, } from './skills-manager-logic';
import { Alert, AlertDescription } from '../ui/alert';
import { ManagementNotice } from '../ui/management-notice';
import { Badge } from '../ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, } from '../ui/breadcrumb';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '../ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, } from '../ui/dropdown-menu';
import { Spinner } from '../ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '../ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '../ui/tooltip';
import { SkillInstallDialog } from './SkillInstallDialog';
import styles from './SkillsManagerPage.module.css';
function skillLevelLabel(skill, t) {
    return t(`skills.level.${skill.level}`);
}
function skillStatusLabel(skill, t) {
    return t(skill.status === 'disabled'
        ? 'skills.status.disabled'
        : 'skills.status.enabled');
}
function skillStatusBadgeClass(skill) {
    return skill.status === 'disabled'
        ? ''
        : 'bg-[var(--success-bg)] text-[var(--success-color)]';
}
function toggleErrorMessage(error, t) {
    const body = error && typeof error === 'object'
        ? error.body
        : undefined;
    const code = body && typeof body === 'object'
        ? body.code
        : undefined;
    if (code === 'skill_inactive_extension') {
        return t('skills.error.inactiveExtension');
    }
    if (code === 'skill_not_toggleable')
        return t('skills.notToggleable');
    return error instanceof Error ? error.message : t('skills.toggleFailed');
}
function DetailField({ label, value }) {
    return (_jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [_jsx("div", { className: "text-sm font-medium", children: label }), _jsx("div", { className: "break-words text-sm text-muted-foreground", children: value })] }));
}
function ManualReferenceBadge({ compact = false }) {
    const { t } = useI18n();
    return (_jsx(TooltipProvider, { delayDuration: 300, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Badge, { variant: "secondary", className: compact ? 'text-[10px]' : undefined, children: t('skills.manualReference') }) }), _jsx(TooltipContent, { children: t('skills.manualReferenceHint') })] }) }));
}
export function SkillsManagerPage({ onClose, onUseSkill, embedded, }) {
    const { t } = useI18n();
    const workspace = useWorkspace();
    const { status, skills, loading, error, reload, setEnabled, install, remove, } = useSkills({ autoLoad: true });
    const canToggleSkills = workspace.capabilities?.features.includes('workspace_skill_toggle') ===
        true;
    const canManageSkills = workspace.capabilities?.features.includes('workspace_skill_manage') ===
        true;
    const [query, setQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('enabled');
    const [statusOverrides, setStatusOverrides] = useState({});
    const [selectedName, setSelectedName] = useState(null);
    const [busySkill, setBusySkill] = useState(null);
    const [installOpen, setInstallOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [listNotice, setListNotice] = useState(null);
    const [notice, setNotice] = useState(null);
    const displayedSkills = useMemo(() => skills.map((skill) => ({
        ...skill,
        status: statusOverrides[skill.name] ?? skill.status,
    })), [skills, statusOverrides]);
    const selectedSkill = useMemo(() => displayedSkills.find((skill) => skill.name === selectedName), [displayedSkills, selectedName]);
    const filteredSkills = useMemo(() => filterSkills(displayedSkills, query, levelFilter, statusFilter), [displayedSkills, levelFilter, query, statusFilter]);
    const disabledCount = displayedSkills.filter((skill) => skill.status === 'disabled').length;
    const message = error?.message ?? status?.errors?.[0]?.error;
    const levelOptions = [
        { value: 'all', label: t('skills.filter.all') },
        { value: 'user', label: t('skills.filter.user') },
        { value: 'project', label: t('skills.filter.project') },
        { value: 'extension', label: t('skills.filter.extension') },
        { value: 'bundled', label: t('skills.filter.bundled') },
    ];
    useEffect(() => {
        setSelectedName((name) => preserveSkillSelection(name, displayedSkills));
    }, [displayedSkills]);
    useEffect(() => {
        setStatusOverrides((current) => {
            const next = { ...current };
            let changed = false;
            for (const skill of skills) {
                if (next[skill.name] === skill.status) {
                    delete next[skill.name];
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }, [skills]);
    useEffect(() => {
        embedded?.onDetailChange(Boolean(selectedSkill));
    }, [embedded, selectedSkill]);
    async function toggleSkill(skill) {
        const enabled = skill.status === 'disabled';
        setBusySkill(skill.name);
        setNotice(null);
        try {
            await setEnabled(skill.name, enabled);
            setStatusOverrides((current) => ({
                ...current,
                [skill.name]: enabled ? 'ok' : 'disabled',
            }));
            await reload();
            setNotice({
                skillName: skill.name,
                text: t(enabled ? 'skills.enabled' : 'skills.disabled'),
                error: false,
            });
        }
        catch (toggleError) {
            setNotice({
                skillName: skill.name,
                text: toggleErrorMessage(toggleError, t),
                error: true,
            });
        }
        finally {
            setBusySkill(null);
        }
    }
    async function installSkill(request) {
        setListNotice(null);
        await install(request);
        setListNotice(t('skills.install.succeeded', { name: request.name.trim() }));
        await reload().catch(() => undefined);
    }
    async function deleteSkill() {
        if (!selectedSkill)
            return;
        const scope = selectedSkill.level === 'project' ? 'workspace' : 'global';
        setBusySkill(selectedSkill.name);
        try {
            await remove(selectedSkill.name, scope);
            setDeleteOpen(false);
            setSelectedName(null);
            setListNotice(t('skills.delete.succeeded', { name: selectedSkill.name }));
            await reload().catch(() => undefined);
        }
        catch (deleteError) {
            setDeleteOpen(false);
            setNotice({
                skillName: selectedSkill.name,
                text: deleteError instanceof Error
                    ? deleteError.message
                    : t('skills.delete.failed'),
                error: true,
            });
        }
        finally {
            setBusySkill(null);
        }
    }
    function returnToList() {
        setSelectedName(null);
        void reload();
    }
    const standaloneNavigation = (_jsx(Breadcrumb, { className: "sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3", children: _jsxs(BreadcrumbList, { className: "text-base", children: [_jsx(BreadcrumbItem, { children: _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, "aria-label": t('common.back'), children: _jsx(ArrowLeftIcon, {}) }) }), _jsx(BreadcrumbItem, { children: selectedSkill ? (_jsx(BreadcrumbLink, { asChild: true, children: _jsx("button", { type: "button", onClick: returnToList, children: t('skills.title') }) })) : (_jsx(BreadcrumbPage, { children: t('skills.title') })) }), selectedSkill ? _jsx(BreadcrumbSeparator, {}) : null, selectedSkill ? (_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: selectedSkill.name }) })) : null] }) }));
    const navigation = embedded ? (selectedSkill ? (_jsx(Breadcrumb, { className: "sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3", children: _jsxs(BreadcrumbList, { className: "h-8 text-sm", children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { asChild: true, children: _jsx("button", { type: "button", onClick: () => {
                                returnToList();
                                embedded.onDetailChange(false);
                            }, children: t('skills.title') }) }) }), _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: selectedSkill.name }) })] }) })) : null) : (standaloneNavigation);
    if (selectedSkill) {
        const invocation = `/${selectedSkill.name}${selectedSkill.argumentHint ? ` ${selectedSkill.argumentHint}` : ''}`;
        return (_jsxs("div", { className: "flex w-full flex-col gap-6 pb-8", children: [navigation, _jsxs("div", { className: "flex w-full flex-col gap-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted", children: _jsx(SparklesIcon, {}) }), _jsx("div", { className: "min-w-0 flex-1", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h1", { className: "break-words text-xl font-semibold text-balance", children: selectedSkill.name }), _jsx(Badge, { variant: "outline", children: skillLevelLabel(selectedSkill, t) }), _jsx(Badge, { variant: "secondary", className: skillStatusBadgeClass(selectedSkill), children: skillStatusLabel(selectedSkill, t) }), !selectedSkill.modelInvocable ? (_jsx(ManualReferenceBadge, {})) : null] }) }), _jsxs(Button, { disabled: selectedSkill.status === 'disabled', onClick: () => onUseSkill(selectedSkill.name), children: [_jsx(PlayIcon, { "data-icon": "inline-start" }), t('skills.run')] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", disabled: busySkill !== null, "aria-label": t('skills.actions'), "data-testid": "skill-actions", children: busySkill === selectedSkill.name ? (_jsx(Spinner, {})) : (_jsx(EllipsisVerticalIcon, {})) }) }), _jsx(DropdownMenuContent, { align: "end", onCloseAutoFocus: (event) => event.preventDefault(), children: _jsxs(DropdownMenuGroup, { children: [_jsx(DropdownMenuItem, { disabled: busySkill !== null ||
                                                            !canToggleSkills ||
                                                            selectedSkill.userInvocable === false, title: !canToggleSkills
                                                            ? t('skills.toggleUnsupported')
                                                            : selectedSkill.userInvocable === false
                                                                ? t('skills.notToggleable')
                                                                : undefined, onSelect: () => void toggleSkill(selectedSkill), children: t(selectedSkill.status === 'disabled'
                                                            ? 'skills.enable'
                                                            : 'skills.disable') }), canManageSkills &&
                                                        (selectedSkill.level === 'project' ||
                                                            selectedSkill.level === 'user') ? (_jsx(DropdownMenuItem, { variant: "destructive", disabled: busySkill !== null, onSelect: () => setDeleteOpen(true), children: t('skills.delete.action') })) : null] }) })] })] }), notice?.skillName === selectedSkill.name ? (_jsx(ManagementNotice, { tone: notice.error ? 'error' : 'success', noticeKey: notice.text, closeLabel: t('common.close'), onDismiss: () => setNotice(null), children: notice.text })) : null, message || selectedSkill.error ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircleIcon, {}), _jsx(AlertDescription, { children: selectedSkill.error || message })] })) : null, _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-sm", children: t('skills.details') }), _jsx(CardDescription, { children: selectedSkill.description || t('skills.noDescription') })] }), _jsxs(CardContent, { className: "grid gap-6 sm:grid-cols-2", children: [_jsx(DetailField, { label: t('skills.invocation'), value: invocation }), _jsx(DetailField, { label: t('skills.level'), value: skillLevelLabel(selectedSkill, t) }), _jsx(DetailField, { label: t('skills.modelAccess'), value: selectedSkill.modelInvocable
                                                ? t('skills.modelAccess.enabled')
                                                : t('skills.modelAccess.disabled') }), _jsx(DetailField, { label: t('skills.model'), value: selectedSkill.model || '-' }), _jsx(DetailField, { label: t('skills.extension'), value: selectedSkill.extensionName || '-' }), selectedSkill.hint ? (_jsx("div", { className: "sm:col-span-2", children: _jsx(DetailField, { label: t('skills.hint'), value: selectedSkill.hint }) })) : null] })] }), _jsx(AlertDialog, { open: deleteOpen, onOpenChange: (open) => {
                                if (!open && busySkill !== null)
                                    return;
                                setDeleteOpen(open);
                            }, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t('skills.delete.title') }), _jsx(AlertDialogDescription, { children: t('skills.delete.description', {
                                                    name: selectedSkill.name,
                                                }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: busySkill !== null, children: t('common.cancel') }), _jsxs(AlertDialogAction, { variant: "destructive", disabled: busySkill !== null, onClick: (event) => {
                                                    event.preventDefault();
                                                    void deleteSkill();
                                                }, children: [busySkill ? _jsx(Spinner, { "data-icon": "inline-start" }) : null, t('skills.delete.action')] })] })] }) })] })] }));
    }
    return (_jsxs("div", { className: "flex w-full flex-col gap-6 pb-8", children: [navigation, _jsxs("div", { className: "flex w-full flex-col gap-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-balance", children: t('skills.title') }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground tabular-nums", children: t('skills.count', {
                                            count: skills.length,
                                            enabled: skills.length - disabledCount,
                                            disabled: disabledCount,
                                        }) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", disabled: loading, onClick: () => void reload(), children: [loading ? (_jsx(Spinner, { "data-icon": "inline-start" })) : (_jsx(RefreshCwIcon, { "data-icon": "inline-start" })), t('common.refresh')] }), canManageSkills ? (_jsxs(Button, { onClick: () => setInstallOpen(true), children: [_jsx(PlusIcon, { "data-icon": "inline-start" }), t('skills.install.action')] })) : null] })] }), message ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircleIcon, {}), _jsx(AlertDescription, { children: message })] })) : null, listNotice ? (_jsx(ManagementNotice, { tone: "success", noticeKey: listNotice, closeLabel: t('common.close'), onDismiss: () => setListNotice(null), children: listNotice })) : null, _jsxs("div", { className: "relative", children: [_jsx(SearchIcon, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { name: "skill-search", "aria-label": t('skills.search'), autoComplete: "off", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t('skills.search'), className: "pl-9" })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx(ToggleGroup, { type: "single", value: levelFilter, onValueChange: (value) => {
                                    if (value)
                                        setLevelFilter(value);
                                }, variant: "outline", size: "sm", "aria-label": t('skills.filter.label'), children: levelOptions.map((option) => (_jsx(ToggleGroupItem, { value: option.value, children: option.label }, option.value))) }), _jsxs(Select, { value: statusFilter, onValueChange: (value) => setStatusFilter(value), children: [_jsx(SelectTrigger, { className: "w-32", "aria-label": t('skills.filter.status.label'), children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: t('skills.filter.status.all') }), _jsx(SelectItem, { value: "enabled", children: t('skills.filter.status.enabled') }), _jsx(SelectItem, { value: "disabled", children: t('skills.filter.status.disabled') })] })] })] }), filteredSkills.length ? (_jsx("div", { className: styles.skillGrid, "data-column-count": Math.min(filteredSkills.length, 4), children: filteredSkills.map((skill) => (_jsx(Card, { size: "sm", role: "button", tabIndex: 0, "aria-label": skill.name, className: "cursor-pointer transition-colors hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", onClick: () => setSelectedName(skill.name), onKeyDown: (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedName(skill.name);
                                }
                            }, children: _jsx(CardHeader, { className: "block", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted", children: _jsx(SparklesIcon, { className: "size-5" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex min-w-0 items-start justify-between gap-2", children: [_jsx(CardTitle, { className: "min-w-0 flex-1 truncate", children: skill.name }), _jsxs("div", { className: "flex shrink-0 gap-1", children: [_jsx(Badge, { variant: "secondary", className: `${skillStatusBadgeClass(skill)} text-[10px]`, children: skillStatusLabel(skill, t) }), !skill.modelInvocable ? (_jsx(ManualReferenceBadge, { compact: true })) : null] })] }), _jsx(CardDescription, { className: "mt-1 min-w-0 text-xs", children: _jsx(TooltipProvider, { delayDuration: 300, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { className: "block truncate", children: skill.description || t('skills.noDescription') }) }), _jsx(TooltipContent, { children: skill.description || t('skills.noDescription') })] }) }) })] })] }) }) }, skill.name))) })) : (_jsx(Empty, { className: "border", children: _jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: query || levelFilter !== 'all' || statusFilter !== 'all' ? (_jsx(SearchIcon, {})) : (_jsx(SparklesIcon, {})) }), _jsx(EmptyTitle, { children: query || levelFilter !== 'all' || statusFilter !== 'all'
                                        ? t('skills.noMatches')
                                        : t('skills.empty') })] }) }))] }), _jsx(SkillInstallDialog, { open: installOpen, onOpenChange: setInstallOpen, onInstall: installSkill })] }));
}
//# sourceMappingURL=SkillsManagerPage.js.map