import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Download, ExternalLink, Loader2, RefreshCw, Store, } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MarketplaceSkillIcon } from './MarketplaceSkillIcon';
function sourceHost(sourceUrl) {
    try {
        return new URL(sourceUrl).host;
    }
    catch {
        return sourceUrl;
    }
}
export function SkillMarketplacePanel({ workspaceId, workingDirectory, activeSessionId, selectedSkillId, onSkillSelect, onInstalled, installingSkillIds, onInstallStart, onInstallFinish, className, }) {
    const { t } = useTranslation();
    const [skills, setSkills] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const loadSkills = React.useCallback(async () => {
        if (!workspaceId) {
            setSkills([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const items = await window.electronAPI.listSkillMarketplace(workspaceId, workingDirectory, activeSessionId ?? undefined);
            setSkills(items);
        }
        catch (loadError) {
            console.error('[SkillMarketplacePanel] Failed to load skill marketplace:', loadError);
            setError(t('skillMarketplace.loadFailed', 'Could not load the skill market.'));
        }
        finally {
            setLoading(false);
        }
    }, [activeSessionId, t, workingDirectory, workspaceId]);
    React.useEffect(() => {
        void loadSkills();
    }, [loadSkills]);
    React.useEffect(() => {
        if (!workspaceId)
            return;
        const cleanup = window.electronAPI.onSkillsChanged((changedWorkspaceId) => {
            if (changedWorkspaceId === workspaceId) {
                void loadSkills();
            }
        });
        return cleanup;
    }, [loadSkills, workspaceId]);
    const handleInstall = React.useCallback(async (skill) => {
        if (!workspaceId)
            return;
        if (installingSkillIds?.has(skill.id))
            return;
        onInstallStart?.(skill.id);
        try {
            await window.electronAPI.installSkillFromMarketplace(workspaceId, skill.id, workingDirectory, activeSessionId ?? undefined);
            setSkills((items) => items.map((item) => item.id === skill.id ? { ...item, installed: true } : item));
            await onInstalled?.({ force: true });
            await loadSkills();
            toast.success(t('skillMarketplace.installedToast', {
                name: skill.name,
                defaultValue: '{{name}} installed',
            }));
        }
        catch (installError) {
            console.error('[SkillMarketplacePanel] Failed to install marketplace skill:', installError);
            toast.error(t('skillMarketplace.installFailed', {
                name: skill.name,
                defaultValue: 'Failed to install {{name}}',
            }));
        }
        finally {
            onInstallFinish?.(skill.id);
        }
    }, [
        activeSessionId,
        installingSkillIds,
        loadSkills,
        onInstalled,
        onInstallFinish,
        onInstallStart,
        t,
        workingDirectory,
        workspaceId,
    ]);
    return (_jsxs("div", { className: cn('flex min-h-0 flex-1 flex-col', className), children: [_jsxs("div", { className: "flex items-center justify-between border-b border-foreground/10 px-3 py-2", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2 text-sm font-medium", children: [_jsx(Store, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsx("span", { className: "truncate", children: t('skillMarketplace.title', 'Skill Market') })] }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", disabled: loading || !workspaceId, onClick: () => void loadSkills(), title: t('common.refresh', 'Refresh'), children: _jsx(RefreshCw, { className: cn('h-3.5 w-3.5', loading && 'animate-spin') }) })] }), _jsxs(ScrollArea, { className: "min-h-0 flex-1", children: [error && (_jsx("div", { className: "mx-3 mt-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive", children: error })), loading && !error && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), t('skillMarketplace.loading', 'Loading skills...')] })), !loading && !error && skills.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted-foreground", children: [_jsx(Store, { className: "h-5 w-5" }), _jsx("p", { className: "text-sm", children: t('skillMarketplace.empty', 'No skills are available yet.') })] })), !error &&
                        skills.map((skill) => {
                            const isInstalling = installingSkillIds?.has(skill.id) ?? false;
                            const isSelected = selectedSkillId === skill.id;
                            return (_jsxs("div", { role: "button", tabIndex: 0, className: cn('group flex min-h-[88px] cursor-default items-center gap-3 border-b border-foreground/10 px-3 py-3 outline-none transition-colors', isSelected
                                    ? 'bg-foreground/[0.045]'
                                    : 'hover:bg-foreground/[0.025]'), onClick: () => onSkillSelect?.(skill.id), onKeyDown: (event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onSkillSelect?.(skill.id);
                                    }
                                }, children: [_jsx(MarketplaceSkillIcon, { iconKey: skill.iconKey }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("div", { className: "truncate text-sm font-medium", children: skill.name }), _jsx("button", { type: "button", className: "shrink-0 text-muted-foreground hover:text-foreground", onClick: (event) => {
                                                            event.stopPropagation();
                                                            void window.electronAPI.openUrl(skill.websiteUrl ?? skill.sourceUrl);
                                                        }, title: sourceHost(skill.websiteUrl ?? skill.sourceUrl), children: _jsx(ExternalLink, { className: "h-3.5 w-3.5" }) })] }), _jsx("div", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: skill.tagline }), _jsx("div", { className: "mt-1 truncate text-[11px] text-muted-foreground/70", children: sourceHost(skill.sourceUrl) })] }), _jsxs(Button, { size: "sm", className: "w-[104px] shrink-0", variant: skill.installed ? 'secondary' : 'default', disabled: skill.installed || isInstalling, onClick: (event) => {
                                            event.stopPropagation();
                                            void handleInstall(skill);
                                        }, children: [isInstalling ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : skill.installed ? (_jsx(Check, { className: "h-3.5 w-3.5" })) : (_jsx(Download, { className: "h-3.5 w-3.5" })), skill.installed
                                                ? t('skillMarketplace.installed', 'Installed')
                                                : t('skillMarketplace.install', 'Install')] })] }, skill.id));
                        })] })] }));
}
//# sourceMappingURL=SkillMarketplacePanel.js.map