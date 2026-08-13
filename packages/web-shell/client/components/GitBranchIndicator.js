import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CircleDotIcon, GitForkIcon, LayersIcon, TriangleAlertIcon, } from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './ChatEditor.module.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from './ui/tooltip';
function GitBranchIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "5", r: "2.5", stroke: "currentColor", strokeWidth: "1.8" }), _jsx("circle", { cx: "18", cy: "6", r: "2.5", stroke: "currentColor", strokeWidth: "1.8" }), _jsx("circle", { cx: "6", cy: "19", r: "2.5", stroke: "currentColor", strokeWidth: "1.8" }), _jsx("path", { d: "M6 7.5v9M8.5 12h3.25A6.25 6.25 0 0 0 18 5.75", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
}
function deriveStatus(status) {
    const staged = status?.staged ?? 0;
    const unstaged = status?.unstaged ?? 0;
    const untracked = status?.untracked ?? 0;
    const conflicted = status?.conflicted ?? 0;
    return {
        detached: status?.detached ?? false,
        staged,
        unstaged,
        untracked,
        conflicted,
        ahead: status?.ahead ?? 0,
        behind: status?.behind ?? 0,
        stashCount: status?.stashCount ?? 0,
        operation: status?.operation,
        // Conflicted entries are uncommitted changes too — a merge where every
        // changed file is conflicted (staged=unstaged=untracked=0) is still dirty.
        dirty: staged + unstaged + untracked + conflicted > 0,
    };
}
/** Compact badge tone for the icon-only (compact) chip; null when clean. */
function badgeTone(s) {
    if (s.conflicted > 0)
        return 'error';
    if (s.operation)
        return 'warning';
    if (s.detached)
        return 'warning';
    if (s.dirty)
        return 'accent';
    return null;
}
function statusPhrases(s, t) {
    const phrases = [];
    if (s.operation)
        phrases.push(t(`git.operation.${s.operation}`));
    if (s.detached)
        phrases.push(t('git.detached'));
    if (s.conflicted > 0)
        phrases.push(t('git.conflicted', { count: s.conflicted }));
    if (s.staged > 0)
        phrases.push(t('git.staged', { count: s.staged }));
    if (s.unstaged > 0)
        phrases.push(t('git.unstaged', { count: s.unstaged }));
    if (s.untracked > 0)
        phrases.push(t('git.untracked', { count: s.untracked }));
    if (s.ahead > 0)
        phrases.push(t('git.ahead', { count: s.ahead }));
    if (s.behind > 0)
        phrases.push(t('git.behind', { count: s.behind }));
    if (s.stashCount > 0)
        phrases.push(t('git.stash', { count: s.stashCount }));
    return phrases;
}
/**
 * Composed accessible label for a git branch chip, e.g.
 * "Current branch: main — 3 staged, 2 ahead". Shared by the indicator and any
 * wrapper button so the accessible name never drifts from the tooltip phrases.
 */
export function gitBranchAriaLabel(branch, status, t) {
    const phrases = statusPhrases(deriveStatus(status), t);
    if (phrases.length > 0) {
        return `${t('git.currentBranch', { branch })} — ${phrases.join(', ')}`;
    }
    return status?.computedAt !== undefined
        ? `${t('git.currentBranch', { branch })} — ${t('git.clean')}`
        : t('git.currentBranch', { branch });
}
/**
 * The chip's inner content (icon + branch + status indicators), shared by the
 * interactive {@link GitBranchIndicator} and the toolbar's hidden measurement
 * replica. The replica must render the same indicators or it under-measures the
 * expanded chip, which makes the responsive compact/expanded toggle oscillate.
 */
export function GitBranchChipContent({ branch, status, compact, worktree = false, }) {
    const { t } = useI18n();
    const s = deriveStatus(status);
    const tone = badgeTone(s);
    return (_jsxs(_Fragment, { children: [_jsxs("span", { className: styles.gitBranchIconWrap, children: [_jsx("span", { className: styles.gitBranchIcon, children: worktree ? (_jsx(GitForkIcon, { size: 14, strokeWidth: 1.5 })) : s.detached ? (_jsx(CircleDotIcon, {})) : (_jsx(GitBranchIcon, {})) }), compact && tone && (_jsx("span", { className: styles.gitBranchBadgeDot, "data-tone": tone, "aria-hidden": "true" }))] }), _jsx("span", { className: styles.gitBranchText, children: branch }), !compact && (_jsxs("span", { className: styles.gitBranchIndicators, "aria-hidden": "true", children: [s.operation && (_jsx("span", { className: styles.gitBranchOperation, children: t(`git.operation.${s.operation}`) })), s.conflicted > 0 && (_jsxs("span", { className: styles.gitBranchConflicted, children: [_jsx(TriangleAlertIcon, {}), s.conflicted] })), s.dirty && _jsx("span", { className: styles.gitBranchDirtyDot }), s.ahead > 0 && (_jsxs("span", { className: styles.gitBranchAheadBehind, children: ["\u2191", s.ahead] })), s.behind > 0 && (_jsxs("span", { className: styles.gitBranchAheadBehind, children: ["\u2193", s.behind] })), s.stashCount > 0 && (_jsxs("span", { className: styles.gitBranchStash, children: [_jsx(LayersIcon, {}), s.stashCount] }))] }))] }));
}
export function GitBranchIndicator({ branch, status, compact = false, onOpenDiff, worktree = false, }) {
    const { t } = useI18n();
    const s = deriveStatus(status);
    // Localized state phrases drive both the accessible label and the tooltip,
    // so the two never drift apart.
    const phrases = statusPhrases(s, t);
    const ariaLabel = gitBranchAriaLabel(branch, status, t);
    const chipClassName = `${styles.gitBranchChip} ${compact ? styles.gitBranchChipCompact : ''} ${onOpenDiff ? styles.gitBranchChipButton : ''}`;
    const chipDataAttrs = {
        'data-web-shell-git-branch': true,
        'data-detached': s.detached ? 'true' : undefined,
        'data-dirty': s.dirty ? 'true' : undefined,
        'data-operation': s.operation ?? undefined,
        'data-clickable': onOpenDiff ? 'true' : undefined,
        'data-worktree': worktree ? 'true' : undefined,
    };
    const chipInner = (_jsx(GitBranchChipContent, { branch: branch, status: status, compact: compact, worktree: worktree }));
    return (_jsx(TooltipProvider, { delayDuration: 300, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: onOpenDiff ? (_jsx("button", { type: "button", className: chipClassName, "aria-label": ariaLabel, onClick: onOpenDiff, ...chipDataAttrs, children: chipInner })) : (_jsx("output", { className: chipClassName, "aria-label": ariaLabel, ...chipDataAttrs, children: chipInner })) }), _jsx(TooltipContent, { side: "top", children: _jsxs("div", { className: styles.gitBranchTooltip, children: [_jsx("div", { className: styles.gitBranchTooltipTitle, children: s.detached ? `${t('git.detached')} (${branch})` : branch }), phrases.length > 0 ? (phrases.map((phrase) => (_jsx("div", { className: styles.gitBranchTooltipRow, children: phrase }, phrase)))) : status?.computedAt !== undefined ? (_jsx("div", { className: styles.gitBranchTooltipRow, children: t('git.clean') })) : null] }) })] }) }));
}
//# sourceMappingURL=GitBranchIndicator.js.map