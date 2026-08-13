import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MoreHorizontal, Zap } from 'lucide-react';
import { SkillAvatar } from '@/components/ui/skill-avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EntityPanel } from '@/components/ui/entity-panel';
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, } from '@/components/ui/styled-dropdown';
import { DropdownMenuProvider } from '@/components/ui/menu-context';
import { skillSelection } from '@/hooks/useEntitySelection';
import { SkillMenu } from './SkillMenu';
import { SendResourceToWorkspaceDialog } from './SendResourceToWorkspaceDialog';
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover';
import { useActiveWorkspace, useAppShellContext, } from '@/context/AppShellContext';
export function SkillsListPanel({ skills, onDeleteSkill, onSetSkillEnabled, onSkillClick, selectedSkillSlug, workspaceId, workspaceRootPath, isLoading = false, className, }) {
    const { t } = useTranslation();
    const activeWorkspace = useActiveWorkspace();
    const canRevealLocally = !activeWorkspace?.remoteServer;
    const { workspaces, activeWorkspaceId } = useAppShellContext();
    const hasOtherWorkspaces = workspaces.length > 1;
    const [updatingSkillSlug, setUpdatingSkillSlug] = React.useState(null);
    // Send to Workspace dialog state
    const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
    const [sendResourceSlug, setSendResourceSlug] = React.useState(null);
    const [sendResourceLabel, setSendResourceLabel] = React.useState('');
    const groupedSkills = React.useMemo(() => buildSkillGroups(skills, t), [skills, t]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: className
                    ? `flex flex-col flex-1 min-h-0 ${className}`
                    : 'flex flex-col flex-1 min-h-0', children: _jsx(EntityPanel, { items: skills, groups: groupedSkills, getId: (s) => s.slug, selection: skillSelection, selectedId: selectedSkillSlug, onItemClick: onSkillClick, className: "min-h-0", emptyState: isLoading ? (_jsx(EntityListEmptyScreen, { icon: _jsx(Loader2, { className: "animate-spin" }), title: t('common.loading'), description: "" })) : (_jsx(EntityListEmptyScreen, { icon: _jsx(Zap, {}), title: t('skillsList.noSkillsConfigured'), description: t('skillsList.emptyDescription'), docKey: "skills", children: _jsx("div", { className: "flex items-center gap-2", children: workspaceRootPath && (_jsx(EditPopover, { align: "center", trigger: _jsx(Button, { size: "sm", variant: "outline", children: t('skillsList.addSkill') }), ...getEditConfig('add-skill', workspaceRootPath) })) }) })), mapItem: (skill) => {
                        const canDeleteProviderSkill = skill.source === 'provider' && skill.providerLevel === 'user';
                        const canToggleProviderSkill = skill.source === 'provider' &&
                            (skill.providerLevel === 'user' ||
                                skill.providerLevel === 'project');
                        const canDelete = skill.source === 'workspace' || canDeleteProviderSkill;
                        const canToggle = canToggleProviderSkill && Boolean(onSetSkillEnabled);
                        const isUpdating = updatingSkillSlug === skill.slug;
                        const menu = (_jsx(SkillMenu, { skillSlug: skill.slug, skillName: skill.metadata.name, onOpenInNewWindow: () => window.electronAPI.openUrl(`craftagents://skills/skill/${skill.slug}?window=focused`), onShowInFinder: () => {
                                if (canRevealLocally && skill.path) {
                                    void window.electronAPI.showInFolder(`${skill.path}/SKILL.md`);
                                }
                            }, canShowInFinder: canRevealLocally && Boolean(skill.path), onDelete: canDelete ? () => onDeleteSkill(skill.slug) : undefined, canDelete: canDelete, deleteLabel: t('skillsList.deleteSkill'), onSendToWorkspace: hasOtherWorkspaces && skill.source === 'workspace'
                                ? () => {
                                    setSendResourceSlug(skill.slug);
                                    setSendResourceLabel(skill.metadata.name);
                                    setSendDialogOpen(true);
                                }
                                : undefined }));
                        return {
                            icon: (_jsx(SkillAvatar, { skill: skill, size: "sm", workspaceId: workspaceId })),
                            title: skill.metadata.name,
                            badges: (_jsxs("span", { className: "flex items-center gap-1.5 min-w-0", children: [skill.source === 'project' && (_jsx("span", { className: "shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground", children: t('skillsList.projectBadge') })), _jsx("span", { className: "truncate", children: skill.metadata.description })] })),
                            controls: canToggle ? (_jsxs(_Fragment, { children: [_jsxs(DropdownMenu, { modal: true, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": t('common.more', 'More'), className: "flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-foreground/8 data-[state=open]:bg-foreground/8", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsx(StyledDropdownMenuContent, { align: "end", children: _jsx(DropdownMenuProvider, { children: menu }) })] }), _jsx(Switch, { "aria-label": (skill.enabled ?? true)
                                            ? t('skillsList.disableSkill', 'Disable skill')
                                            : t('skillsList.enableSkill', 'Enable skill'), checked: skill.enabled ?? true, disabled: isUpdating, onCheckedChange: (checked) => {
                                            if (!onSetSkillEnabled)
                                                return;
                                            setUpdatingSkillSlug(skill.slug);
                                            void onSetSkillEnabled(skill, checked).finally(() => setUpdatingSkillSlug(null));
                                        } })] })) : undefined,
                            menu,
                            hideMoreButton: canToggle,
                        };
                    } }) }), sendResourceSlug && (_jsx(SendResourceToWorkspaceDialog, { open: sendDialogOpen, onOpenChange: setSendDialogOpen, resourceType: "skill", resourceIds: [sendResourceSlug], resourceLabel: sendResourceLabel, workspaces: workspaces, activeWorkspaceId: activeWorkspaceId }))] }));
}
function skillGroupKey(skill) {
    if (skill.source === 'provider') {
        if (skill.providerLevel === 'project')
            return 'project';
        if (skill.providerLevel === 'user')
            return 'global';
        if (skill.providerLevel === 'bundled')
            return 'builtin';
        return 'other';
    }
    if (skill.source === 'project')
        return 'project';
    if (skill.source === 'global')
        return 'global';
    if (skill.source === 'workspace')
        return 'workspace';
    return 'other';
}
function buildSkillGroups(skills, t) {
    const labels = {
        project: t('skillsList.groupProject', 'Project'),
        global: t('skillsList.groupGlobal', 'Global'),
        builtin: t('skillsList.groupBuiltIn', 'Built-in'),
        workspace: t('skillsList.groupWorkspace', 'Workspace'),
        other: t('skillsList.groupOther', 'Other'),
    };
    const order = ['project', 'global', 'builtin', 'workspace', 'other'];
    return order
        .map((key) => ({
        key,
        label: labels[key],
        items: skills.filter((skill) => skillGroupKey(skill) === key),
    }))
        .filter((group) => group.items.length > 0);
}
//# sourceMappingURL=SkillsListPanel.js.map