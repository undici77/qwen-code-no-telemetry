import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Download, ExternalLink, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rendererLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useNavigation, routes } from '@/contexts/NavigationContext';
import { dispatchFocusInputEvent } from './input/focus-input-events';
import skillMarketHero from '@/assets/skill-market-hero.webp';
import { MarketplaceSkillIcon } from './MarketplaceSkillIcon';
function sourceHost(sourceUrl) {
    try {
        return new URL(sourceUrl).host;
    }
    catch {
        return sourceUrl;
    }
}
function buildExamplePrompt(skill, example) {
    return `[skill:${skill.slug}] ${example.prompt}`.trim();
}
export function SkillMarketplaceDetailPanel({ workspaceId, workingDirectory, activeSessionId, selectedSkillId, onInstalled, installingSkillIds, onInstallStart, onInstallFinish, className, }) {
    const { t } = useTranslation();
    const { navigate } = useNavigation();
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
            rendererLog.error('[SkillMarketplaceDetailPanel] Failed to load skill marketplace:', loadError);
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
    const selectedSkill = selectedSkillId
        ? (skills.find((skill) => skill.id === selectedSkillId) ?? null)
        : null;
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
            rendererLog.error('[SkillMarketplaceDetailPanel] Failed to install marketplace skill:', installError);
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
    const handleUseExample = React.useCallback((skill, example) => {
        if (!skill.installed) {
            toast.message(t('skillMarketplace.installBeforeExample', {
                name: skill.name,
                defaultValue: 'Install {{name}} to use examples',
            }));
            return;
        }
        void navigate(routes.action.newSession({
            input: buildExamplePrompt(skill, example),
        }));
        window.setTimeout(() => dispatchFocusInputEvent(), 120);
    }, [navigate, t]);
    if (loading && !selectedSkill && !error) {
        return (_jsx("div", { className: "flex h-full items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), t('skillMarketplace.loading', 'Loading skills...')] }) }));
    }
    if (error || !selectedSkill) {
        const emptyMessage = error ??
            (skills.length === 0
                ? t('skillMarketplace.empty', 'No skills are available yet.')
                : t('skillMarketplace.title', 'Skill Market'));
        return (_jsx("div", { className: "flex h-full items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [_jsx(Store, { className: "h-5 w-5" }), _jsx("p", { className: "max-w-xs text-sm", children: emptyMessage })] }) }));
    }
    const heroImage = selectedSkill.heroImage ?? skillMarketHero;
    const isInstalling = installingSkillIds?.has(selectedSkill.id) ?? false;
    return (_jsx(ScrollArea, { className: cn('h-full', className), children: _jsxs("div", { className: "mx-auto flex w-full max-w-[1120px] flex-col px-8 py-9", children: [_jsxs("div", { className: "flex items-start justify-between gap-5", children: [_jsxs("div", { className: "flex min-w-0 items-start gap-4", children: [_jsx(MarketplaceSkillIcon, { iconKey: selectedSkill.iconKey, className: "h-16 w-16" }), _jsxs("div", { className: "min-w-0 pt-1", children: [_jsx("h1", { className: "truncate text-3xl font-semibold tracking-normal", children: selectedSkill.name }), _jsx("p", { className: "mt-2 max-w-2xl text-base leading-6 text-muted-foreground", children: selectedSkill.tagline })] })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-2 pt-1", children: [_jsx(Button, { size: "icon", variant: "ghost", className: "h-9 w-9", onClick: () => void window.electronAPI.openUrl(selectedSkill.websiteUrl ?? selectedSkill.sourceUrl), title: sourceHost(selectedSkill.websiteUrl ?? selectedSkill.sourceUrl), children: _jsx(ExternalLink, { className: "h-4 w-4" }) }), _jsxs(Button, { size: "sm", className: "min-w-[108px]", variant: selectedSkill.installed ? 'secondary' : 'default', disabled: selectedSkill.installed || isInstalling, onClick: () => void handleInstall(selectedSkill), children: [isInstalling ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : selectedSkill.installed ? (_jsx(Check, { className: "h-3.5 w-3.5" })) : (_jsx(Download, { className: "h-3.5 w-3.5" })), selectedSkill.installed
                                            ? t('skillMarketplace.installed', 'Installed')
                                            : t('skillMarketplace.install', 'Install')] })] })] }), _jsxs("div", { className: "relative mt-10 min-h-[260px] overflow-hidden rounded-[8px] border border-white/10 bg-cover bg-center px-6 py-10 shadow-strong", style: {
                        backgroundImage: `linear-gradient(90deg, rgba(5,10,18,0.42), rgba(5,10,18,0.16)), url(${heroImage})`,
                    }, children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent_42%)]" }), _jsx("div", { className: "relative flex min-h-[180px] flex-col items-center justify-center gap-4", children: selectedSkill.examples.map((example, index) => (_jsxs("button", { type: "button", "aria-disabled": !selectedSkill.installed, className: cn('flex max-w-full items-center gap-2 rounded-[8px] border border-white/14 bg-black/46 px-4 py-2.5 text-left text-white shadow-middle backdrop-blur-md transition', selectedSkill.installed
                                    ? 'hover:-translate-y-0.5 hover:bg-black/56'
                                    : 'cursor-default opacity-55', index === 0 && 'sm:translate-x-[-6%]', index === 1 && 'sm:translate-x-[7%]', index === 2 && 'sm:translate-x-[-1%]'), onClick: () => handleUseExample(selectedSkill, example), children: [_jsx(MarketplaceSkillIcon, { iconKey: selectedSkill.iconKey, className: "h-5 w-5 rounded-[6px]" }), _jsx("span", { className: "shrink-0 text-sm font-medium text-white/55", children: selectedSkill.name }), _jsx("span", { className: "min-w-0 truncate text-sm", children: example.prompt })] }, example.title))) })] }), _jsx("div", { className: "mt-10 max-w-5xl", children: _jsx("p", { className: "text-[15px] leading-7 text-foreground/86", children: selectedSkill.description }) })] }) }));
}
//# sourceMappingURL=SkillMarketplaceDetailPanel.js.map