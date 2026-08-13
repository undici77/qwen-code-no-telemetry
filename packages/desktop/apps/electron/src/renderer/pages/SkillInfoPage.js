import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SkillInfoPage
 *
 * Displays comprehensive skill details including metadata,
 * permission modes, and instructions.
 * Uses the Info_ component system for consistent styling with SourceInfoPage.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { EditPopover, EditButton, getEditConfig, } from '@/components/ui/EditPopover';
import { toast } from 'sonner';
import { SkillMenu } from '@/components/app-shell/SkillMenu';
import { SkillAvatar } from '@/components/ui/skill-avatar';
import { routes, navigate } from '@/lib/navigate';
import { useActiveWorkspace } from '@/context/AppShellContext';
import { Info_Page, Info_Section, Info_Table, Info_Markdown, } from '@/components/info';
function getSkillSourceLabel(skill, t) {
    if (skill.source === 'provider') {
        if (skill.providerLevel === 'bundled') {
            return t('skillInfo.sourceBuiltIn', 'Built-in');
        }
        if (skill.providerLevel === 'user')
            return t('skillInfo.sourceGlobal');
        if (skill.providerLevel === 'project')
            return t('skillInfo.sourceProject');
        return 'Qwen Code';
    }
    if (skill.source === 'project')
        return t('skillInfo.sourceProject');
    if (skill.source === 'global')
        return t('skillInfo.sourceGlobal');
    return t('skillInfo.sourceWorkspace');
}
function getSkillLocationLabel(skill, t) {
    if (skill.source === 'provider' && skill.providerLevel === 'bundled') {
        return t('skillInfo.locationBuiltIn', 'Built-in');
    }
    if (!skill.path)
        return '';
    const skillFile = `${skill.path.replace(/[\\/]+$/, '')}/SKILL.md`;
    if (skill.source === 'global' ||
        (skill.source === 'provider' && skill.providerLevel === 'user')) {
        return formatGlobalSkillPath(skillFile);
    }
    return skillFile;
}
function formatGlobalSkillPath(path) {
    for (const marker of ['/.qwen/skills/', '/.agents/skills/']) {
        const index = path.indexOf(marker);
        if (index >= 0)
            return `~${path.slice(index)}`;
    }
    return path;
}
export default function SkillInfoPage({ skillSlug, workspaceId, workingDirectory, activeSessionId, }) {
    const { t } = useTranslation();
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const activeWorkspace = useActiveWorkspace();
    const canRevealLocally = !activeWorkspace?.remoteServer;
    // Load skill data
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        const loadSkill = async () => {
            try {
                const skills = await window.electronAPI.getSkills(workspaceId, workingDirectory, activeSessionId ?? undefined);
                if (!isMounted)
                    return;
                // Find the skill by slug
                const found = skills.find((s) => s.slug === skillSlug);
                if (found) {
                    setSkill(found);
                }
                else {
                    setError(t('skillInfo.notFound'));
                }
            }
            catch (err) {
                if (!isMounted)
                    return;
                setError(err instanceof Error ? err.message : t('skillInfo.failedToLoad'));
            }
            finally {
                if (isMounted)
                    setLoading(false);
            }
        };
        loadSkill();
        // Subscribe to skill changes
        const unsubscribe = window.electronAPI.onSkillsChanged?.((changedWorkspaceId, skills) => {
            if (changedWorkspaceId !== workspaceId)
                return;
            const updated = skills.find((s) => s.slug === skillSlug);
            if (updated) {
                setSkill(updated);
            }
        });
        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, [workspaceId, skillSlug, workingDirectory, activeSessionId, t]);
    // Handle open in finder
    const handleOpenInFinder = useCallback(async () => {
        if (!skill)
            return;
        try {
            if (!canRevealLocally || !skill.path)
                return;
            await window.electronAPI.showInFolder(`${skill.path}/SKILL.md`);
        }
        catch (err) {
            console.error('Failed to open skill in finder:', err);
        }
    }, [canRevealLocally, skill]);
    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!skill)
            return;
        try {
            if (skill.source !== 'workspace')
                return;
            await window.electronAPI.deleteSkill(workspaceId, skillSlug, workingDirectory, activeSessionId ?? undefined);
            toast.success(t('skillInfo.deletedSkill', { name: skill.metadata.name }));
            navigate(routes.view.skills());
        }
        catch (err) {
            toast.error(t('skillInfo.failedToDelete'), {
                description: err instanceof Error ? err.message : undefined,
            });
        }
    }, [activeSessionId, skill, skillSlug, t, workingDirectory, workspaceId]);
    // Handle opening in new window
    const handleOpenInNewWindow = useCallback(() => {
        window.electronAPI.openUrl(`craftagents://skills/skill/${skillSlug}?window=focused`);
    }, [skillSlug]);
    // Get skill name for header
    const skillName = skill?.metadata.name || skillSlug;
    const canDeleteSkill = skill?.source === 'workspace';
    const canEditSkill = Boolean(skill?.path) && skill?.source !== 'provider';
    const sourceLabel = skill ? getSkillSourceLabel(skill, t) : '';
    const locationLabel = skill ? getSkillLocationLabel(skill, t) : '';
    const canOpenLocation = Boolean(skill?.path) &&
        canRevealLocally &&
        skill?.providerLevel !== 'bundled';
    // Open the skill folder in Finder with SKILL.md selected
    const handleLocationClick = () => {
        if (!skill)
            return;
        if (!canOpenLocation || !skill.path)
            return;
        window.electronAPI.showInFolder(`${skill.path}/SKILL.md`);
    };
    return (_jsxs(Info_Page, { loading: loading, error: error ?? undefined, empty: !skill && !loading && !error ? t('skillInfo.notFound') : undefined, children: [_jsx(Info_Page.Header, { title: skillName, titleMenu: _jsx(SkillMenu, { skillSlug: skillSlug, skillName: skillName, onOpenInNewWindow: handleOpenInNewWindow, onShowInFinder: handleOpenInFinder, canShowInFinder: canRevealLocally && Boolean(skill?.path), onDelete: canDeleteSkill ? handleDelete : undefined, canDelete: canDeleteSkill, deleteLabel: t('skillInfo.deleteSkill') }) }), skill && (_jsxs(Info_Page.Content, { children: [_jsx(Info_Page.Hero, { avatar: _jsx(SkillAvatar, { skill: skill, fluid: true, workspaceId: workspaceId }), title: skill.metadata.name, tagline: skill.metadata.description }), _jsx(Info_Section, { title: t('skillInfo.metadata'), actions: canEditSkill ? (
                        // EditPopover for AI-assisted metadata editing (name, description in frontmatter)
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('skill-metadata', skill.path), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${skill.path}/SKILL.md`,
                            } })) : undefined, children: _jsxs(Info_Table, { children: [_jsx(Info_Table.Row, { label: t('common.slug'), value: skill.slug }), _jsx(Info_Table.Row, { label: t('common.name'), children: skill.metadata.name }), _jsx(Info_Table.Row, { label: t('common.description'), children: skill.metadata.description }), _jsx(Info_Table.Row, { label: t('common.source'), children: sourceLabel }), locationLabel && (_jsx(Info_Table.Row, { label: t('common.location'), children: canOpenLocation ? (_jsx("button", { onClick: handleLocationClick, className: "hover:underline cursor-pointer text-left", children: locationLabel })) : (locationLabel) })), skill.metadata.requiredSources &&
                                    skill.metadata.requiredSources.length > 0 && (_jsx(Info_Table.Row, { label: t('skillInfo.requiredSources'), children: skill.metadata.requiredSources.join(', ') }))] }) }), skill.metadata.alwaysAllow &&
                        skill.metadata.alwaysAllow.length > 0 && (_jsx(Info_Section, { title: t('skillInfo.permissionModes'), children: _jsxs("div", { className: "space-y-2 px-4 py-3", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-3", children: t('skillInfo.permissionModesDesc') }), _jsx("div", { className: "rounded-[8px] border border-border/50 overflow-hidden", children: _jsx("table", { className: "w-full text-sm", children: _jsxs("tbody", { children: [_jsxs("tr", { className: "border-b border-border/30", children: [_jsx("td", { className: "px-3 py-2 font-medium text-muted-foreground w-[140px]", children: t('skillInfo.explore') }), _jsxs("td", { className: "px-3 py-2 flex items-center gap-2", children: [_jsx(X, { className: "h-3.5 w-3.5 text-destructive shrink-0" }), _jsx("span", { className: "text-foreground/80", children: t('skillInfo.exploreDesc') })] })] }), _jsxs("tr", { className: "border-b border-border/30", children: [_jsx("td", { className: "px-3 py-2 font-medium text-muted-foreground", children: t('skillInfo.askToEdit') }), _jsxs("td", { className: "px-3 py-2 flex items-center gap-2", children: [_jsx(Check, { className: "h-3.5 w-3.5 text-success shrink-0" }), _jsx("span", { className: "text-foreground/80", children: t('skillInfo.askToEditDesc') })] })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-3 py-2 font-medium text-muted-foreground", children: t('skillInfo.auto') }), _jsxs("td", { className: "px-3 py-2 flex items-center gap-2", children: [_jsx(Minus, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }), _jsx("span", { className: "text-foreground/80", children: t('skillInfo.autoDesc') })] })] })] }) }) })] }) })), _jsx(Info_Section, { title: t('skillInfo.instructions'), actions: canEditSkill ? (
                        // EditPopover for AI-assisted editing with "Edit File" as secondary action
                        _jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('skill-instructions', skill.path), secondaryAction: {
                                label: t('common.editFile'),
                                filePath: `${skill.path}/SKILL.md`,
                            } })) : undefined, children: _jsx(Info_Markdown, { maxHeight: 540, fullscreen: true, children: skill.content || t('skillInfo.noInstructions') }) })] }))] }));
}
//# sourceMappingURL=SkillInfoPage.js.map