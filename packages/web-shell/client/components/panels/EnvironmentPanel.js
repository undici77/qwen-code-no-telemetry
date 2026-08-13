import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { BotIcon, ChevronRightIcon, CircleCheckIcon, CircleStopIcon, CircleXIcon, FileDiffIcon, FolderClosedIcon, GitBranchIcon, LoaderCircleIcon, SquareActivityIcon, SquareTerminalIcon, } from 'lucide-react';
import { useI18n } from '../../i18n';
import { BranchPickerPopover } from '../BranchPickerPopover';
import styles from './EnvironmentPanel.module.css';
const DEFAULT_ENVIRONMENT_PANEL_ITEMS = ['environment', 'subagents', 'backgroundTasks'];
const AGENT_COLORS = {
    red: '#e5484d',
    blue: 'var(--agent-blue-500)',
    green: 'var(--success-color)',
    yellow: '#d6a900',
    purple: 'var(--agent-purple-600)',
    orange: 'var(--accent-orange)',
    pink: '#d6409f',
    cyan: '#0e9888',
};
function taskLabel(task) {
    switch (task.kind) {
        case 'agent':
            return task.label;
        case 'shell':
            return task.command;
        case 'monitor':
            return task.description;
    }
}
function taskIcon(task) {
    switch (task.kind) {
        case 'agent':
            return _jsx(BotIcon, {});
        case 'shell':
            return _jsx(SquareTerminalIcon, {});
        case 'monitor':
            return _jsx(SquareActivityIcon, {});
    }
}
function taskStatusKey(status) {
    return `tasks.${status}`;
}
function taskStatusIcon(status) {
    if (status === 'completed')
        return _jsx(CircleCheckIcon, {});
    if (status === 'running') {
        return _jsx(LoaderCircleIcon, { className: styles.statusRunning });
    }
    if (status === 'failed')
        return _jsx(CircleXIcon, {});
    if (status === 'cancelled')
        return _jsx(CircleStopIcon, {});
    return null;
}
function isForkAgent(task) {
    return task.subagentType?.toLowerCase() === 'fork';
}
function agentDisplayName(task) {
    if (!isForkAgent(task))
        return task.label;
    return task.label.replace(/^fork:\s*/i, '').trim();
}
function agentColorValue(color) {
    return (color && AGENT_COLORS[color]) || 'var(--muted-foreground)';
}
export function EnvironmentPanel({ floating = false, hidden = false, workspaceCwd, gitWorkspaceCwd, gitCwd, branch, gitStatus, tasks, agentTasks, items = DEFAULT_ENVIRONMENT_PANEL_ITEMS, onOpenGitDiff, onOpenGitCommit, onOpenAgent, onOpenTask, onDismiss, }) {
    const { t } = useI18n();
    const panelRef = useRef(null);
    const agents = agentTasks ??
        tasks.filter((task) => task.kind === 'agent');
    const backgroundTasks = tasks.filter((task) => task.kind !== 'agent');
    const [environmentExpanded, setEnvironmentExpanded] = useState(true);
    const [agentsExpanded, setAgentsExpanded] = useState(false);
    const [tasksExpanded, setTasksExpanded] = useState(false);
    const [branchPickerOpen, setBranchPickerOpen] = useState(false);
    const activeBranch = branch ?? gitStatus?.branch;
    useEffect(() => {
        if (hidden || !environmentExpanded || !gitWorkspaceCwd || !activeBranch) {
            setBranchPickerOpen(false);
        }
    }, [activeBranch, environmentExpanded, gitWorkspaceCwd, hidden]);
    useEffect(() => {
        if (!floating || hidden || !onDismiss || branchPickerOpen)
            return;
        const dismissOnOutsidePointerDown = (event) => {
            if (event
                .composedPath()
                .some((target) => target instanceof Element &&
                target.hasAttribute('data-web-shell-environment-toggle'))) {
                return;
            }
            if (event.target instanceof Node &&
                !panelRef.current?.contains(event.target)) {
                onDismiss();
            }
        };
        document.addEventListener('pointerdown', dismissOnOutsidePointerDown);
        return () => document.removeEventListener('pointerdown', dismissOnOutsidePointerDown);
    }, [branchPickerOpen, floating, hidden, onDismiss]);
    const gitDetails = [
        gitStatus?.operation
            ? t(`git.operation.${gitStatus.operation}`)
            : undefined,
        gitStatus?.detached ? t('git.detached') : undefined,
        gitStatus?.staged
            ? t('git.staged', { count: gitStatus.staged })
            : undefined,
        gitStatus?.unstaged
            ? t('git.unstaged', { count: gitStatus.unstaged })
            : undefined,
        gitStatus?.untracked
            ? t('git.untracked', { count: gitStatus.untracked })
            : undefined,
        gitStatus?.conflicted
            ? t('git.conflicted', { count: gitStatus.conflicted })
            : undefined,
        gitStatus?.ahead ? t('git.ahead', { count: gitStatus.ahead }) : undefined,
        gitStatus?.behind
            ? t('git.behind', { count: gitStatus.behind })
            : undefined,
        gitStatus?.stashCount
            ? t('git.stash', { count: gitStatus.stashCount })
            : undefined,
    ].filter((detail) => Boolean(detail));
    return (_jsxs("aside", { ref: panelRef, className: `${styles.panel} ${floating ? styles.floating : ''}`, "aria-label": t('environment.title'), "data-testid": "environment-panel", "data-floating": floating, hidden: hidden, children: [items.includes('environment') && (_jsxs("section", { className: styles.section, children: [_jsxs("button", { type: "button", className: styles.sectionHeader, "aria-expanded": environmentExpanded, onClick: () => setEnvironmentExpanded((expanded) => !expanded), children: [_jsx("span", { children: t('environment.title') }), !environmentExpanded && _jsx(ChevronRightIcon, {})] }), environmentExpanded && (_jsxs("div", { className: styles.sectionContent, children: [_jsxs("button", { type: "button", className: styles.row, disabled: !onOpenGitDiff, onClick: onOpenGitDiff, children: [_jsx(FileDiffIcon, {}), _jsx("span", { children: t('environment.changes') }), _jsx("span", { className: styles.value, children: gitStatus === undefined
                                            ? t('environment.unavailable')
                                            : gitDetails.length > 0
                                                ? gitDetails.join(' · ')
                                                : t('environment.clean') })] }), _jsxs("div", { className: styles.row, title: workspaceCwd, children: [_jsx(FolderClosedIcon, { className: styles.workspaceIcon }), _jsx("span", { children: t('environment.workspace') }), _jsx("span", { className: styles.value, children: workspaceCwd?.split(/[/\\]/).filter(Boolean).at(-1) ??
                                            t('environment.unavailable') })] }), gitWorkspaceCwd && activeBranch ? (_jsx(BranchPickerPopover, { open: branchPickerOpen, onOpenChange: setBranchPickerOpen, workspaceCwd: gitWorkspaceCwd, gitCwd: gitCwd, side: "left", onOpenDiff: onOpenGitDiff, onOpenCommit: onOpenGitCommit, children: _jsxs("button", { type: "button", className: styles.row, title: activeBranch, children: [_jsx(GitBranchIcon, {}), _jsx("span", { className: styles.branchName, children: activeBranch }), _jsx(ChevronRightIcon, { className: styles.rowActionIcon })] }) })) : (_jsxs("div", { className: styles.row, title: activeBranch ?? undefined, children: [_jsx(GitBranchIcon, {}), _jsx("span", { className: styles.branchName, children: activeBranch ?? t('environment.unavailable') })] }))] }))] })), items.includes('subagents') && agents.length > 0 && (_jsxs("section", { className: styles.section, children: [_jsxs("button", { type: "button", className: styles.sectionHeader, "aria-expanded": agentsExpanded, onClick: () => setAgentsExpanded((expanded) => !expanded), children: [_jsx("span", { children: t('environment.agents') }), !agentsExpanded && _jsx(ChevronRightIcon, {})] }), agentsExpanded && (_jsx("ul", { className: styles.tasks, children: agents.map((task, index) => (_jsx("li", { children: _jsxs("button", { type: "button", className: styles.task, disabled: !onOpenAgent, onClick: () => onOpenAgent?.(task), children: [_jsxs("span", { className: styles.taskLabel, children: [!isForkAgent(task) && (_jsx("span", { className: styles.agentColor, "data-agent-color": task.color ?? 'default', style: {
                                                    backgroundColor: agentColorValue(task.color),
                                                }, "aria-hidden": "true" })), isForkAgent(task) && (_jsx("span", { className: styles.agentTag, children: "fork" })), _jsx("span", { className: styles.agentName, children: (() => {
                                                    const name = agentDisplayName(task).trim();
                                                    return name && name.toLowerCase() !== 'agent'
                                                        ? name
                                                        : t('environment.unnamedAgent', {
                                                            index: index + 1,
                                                        });
                                                })() })] }), _jsxs("span", { className: styles.taskStatus, "data-status": task.status, children: [taskStatusIcon(task.status), t(taskStatusKey(task.status))] })] }) }, task.id))) }))] })), items.includes('backgroundTasks') && backgroundTasks.length > 0 && (_jsxs("section", { className: styles.section, children: [_jsxs("button", { type: "button", className: styles.sectionHeader, "aria-expanded": tasksExpanded, onClick: () => setTasksExpanded((expanded) => !expanded), children: [_jsx("span", { children: t('tasks.title') }), !tasksExpanded && _jsx(ChevronRightIcon, {})] }), tasksExpanded && (_jsx("ul", { className: styles.tasks, children: backgroundTasks.map((task) => (_jsx("li", { children: _jsxs("button", { type: "button", className: styles.task, onClick: () => onOpenTask(task), children: [_jsx("span", { className: styles.taskIcon, children: taskIcon(task) }), _jsx("span", { className: styles.taskLabel, children: _jsx("span", { className: styles.taskName, title: taskLabel(task), children: taskLabel(task) }) }), _jsxs("span", { className: styles.taskStatus, "data-status": task.status, children: [taskStatusIcon(task.status), t(taskStatusKey(task.status))] })] }) }, `${task.kind}:${task.id}`))) }))] }))] }));
}
//# sourceMappingURL=EnvironmentPanel.js.map