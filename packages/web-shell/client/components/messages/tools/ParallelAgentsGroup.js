import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { hasActiveAgents } from '../../../adapters/toolClassification';
import { useI18n } from '../../../i18n';
import { useSubagentDetails } from '../../../subagentDetailsContext';
import { formatElapsed, formatLiveElapsed, StatusIcon, truncateText, } from './toolDisplay';
import { getTaskExecutionRecord, getAgentType, isDefaultAgentType, getAgentDescription, getAgentCurrentToolHint, formatTokenCount, getAgentCancellationReason, getAgentDisplayStatus, isActiveToolStatus, localizeAgentTypeName, toolContainsCallId, } from '../toolFormatting';
import { SubAgentPanel } from './SubAgentPanel';
import styles from './ParallelAgentsGroup.module.css';
const AUTO_COLLAPSE_DELAY_MS = 1_500;
const AUTO_COLLAPSE_ANIMATION_MS = 180;
function automaticCollapseAnimationMs() {
    return typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 0
        : AUTO_COLLAPSE_ANIMATION_MS;
}
function formatDuration(ms) {
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 60)
        return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
function getAgentStats(agent, now) {
    const taskExec = getTaskExecutionRecord(agent.rawOutput);
    const stats = taskExec?.['executionSummary'];
    const elapsed = stats && typeof stats['totalDurationMs'] === 'number'
        ? formatDuration(stats['totalDurationMs'])
        : formatElapsed(agent.startTime, agent.endTime ?? (agent.status === 'in_progress' ? now : undefined));
    const tokenCount = taskExec &&
        typeof taskExec['tokenCount'] === 'number' &&
        taskExec['tokenCount'] > 0
        ? taskExec['tokenCount']
        : stats &&
            typeof stats['outputTokens'] === 'number' &&
            stats['outputTokens'] > 0
            ? stats['outputTokens']
            : 0;
    return {
        duration: elapsed,
        tokens: tokenCount > 0 ? formatTokenCount(tokenCount) : '',
        cancellationReason: truncateText(getAgentCancellationReason(agent), 80),
    };
}
function ToolGroupIcon() {
    return (_jsx("svg", { className: styles.summaryToolIcon, width: "14", height: "14", viewBox: "0 0 1024 1024", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M770.08 96.32c1.728.64 3.072 1.984 3.712 3.712l38.848 107.584c.64 1.728 1.984 3.104 3.712 3.712l107.584 38.848a6.144 6.144 0 0 1 0 11.584l-107.584 38.848a6.144 6.144 0 0 0-3.712 3.712l-38.848 107.584a6.144 6.144 0 0 1-11.584 0L723.36 304.32a6.144 6.144 0 0 0-3.712-3.712L612.064 261.76a6.144 6.144 0 0 1 0-11.584l107.584-38.848a6.144 6.144 0 0 0 3.712-3.712l38.848-107.584c1.184-3.2 4.704-4.8 7.872-3.68zM576 160H384q-119.296 0-203.648 84.352Q96 328.704 96 448v192q0 119.296 84.352 203.648Q264.704 928 384 928h256q119.296 0 203.648-84.352Q928 759.296 928 640V512h-64v128q0 92.8-65.6 158.4Q732.8 864 640 864H384q-92.8 0-158.4-65.6Q160 732.8 160 640V448q0-92.8 65.6-158.4Q291.2 224 384 224h192v-64zm96 248.224L568.224 512 672 615.776l45.248-45.28L658.752 512l58.496-58.496L672 408.224zM320 608V448h64v160h-64z", stroke: "currentColor", strokeWidth: "28", strokeLinejoin: "round" }) }));
}
export function ParallelAgentsGroup({ agents, autoManageExpansion = false, automaticCollapseDelayMs = AUTO_COLLAPSE_DELAY_MS, deferAutomaticCollapse = false, expandActiveWhenLive = false, onAutomaticExpansionChange, pendingApproval, }) {
    const { t } = useI18n();
    const subagentDetails = useSubagentDetails();
    const [groupExpanded, setGroupExpanded] = useState(false);
    const [automaticCollapseAnimating, setAutomaticCollapseAnimating] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const liveStartedAtRef = useRef(Date.now());
    const expansionOwnerRef = useRef('none');
    const groupExpandedRef = useRef(groupExpanded);
    groupExpandedRef.current = groupExpanded;
    const automaticExpansionChangeRef = useRef(onAutomaticExpansionChange);
    automaticExpansionChangeRef.current = onAutomaticExpansionChange;
    const autoCollapseTimerRef = useRef(undefined);
    const autoCollapseAnimationTimerRef = useRef(undefined);
    const hasActive = hasActiveAgents(agents);
    const activeStartedAt = agents.reduce((earliest, agent) => {
        if (!isActiveToolStatus(agent.status) ||
            typeof agent.startTime !== 'number') {
            return earliest;
        }
        return earliest === undefined
            ? agent.startTime
            : Math.min(earliest, agent.startTime);
    }, undefined);
    const approvalAgent = pendingApproval?.toolCallId
        ? agents.find((agent) => toolContainsCallId(agent, pendingApproval.toolCallId))
        : undefined;
    const hasApprovalAgent = !!approvalAgent;
    const approvalAgentRef = useRef(approvalAgent);
    approvalAgentRef.current = approvalAgent;
    const deferAutomaticCollapseRef = useRef(deferAutomaticCollapse);
    deferAutomaticCollapseRef.current = deferAutomaticCollapse;
    const autoManageExpansionRef = useRef(autoManageExpansion);
    autoManageExpansionRef.current = autoManageExpansion;
    const wrapRef = useRef(null);
    const summaryRef = useRef(null);
    const wasActiveRef = useRef(false);
    const wasAutoManageExpansionRef = useRef(autoManageExpansion);
    const wasExpandActiveWhenLiveRef = useRef(expandActiveWhenLive);
    const previousAutomaticCollapseDelayRef = useRef(automaticCollapseDelayMs);
    const wasDeferringAutomaticCollapseRef = useRef(deferAutomaticCollapse);
    useEffect(() => {
        const wasActive = wasActiveRef.current;
        const wasAutoManaging = wasAutoManageExpansionRef.current;
        const wasExpandActiveWhenLive = wasExpandActiveWhenLiveRef.current;
        const collapseDelayChanged = previousAutomaticCollapseDelayRef.current !== automaticCollapseDelayMs;
        const wasDeferringAutomaticCollapse = wasDeferringAutomaticCollapseRef.current;
        // Latch the anchor on the false->true edge: re-anchoring while agents
        // finish would rewind the header clock to a later start time.
        if (hasActive && !wasActive) {
            liveStartedAtRef.current = activeStartedAt ?? Date.now();
            setNow(Date.now());
        }
        if (hasActive ||
            !autoManageExpansion ||
            deferAutomaticCollapse ||
            collapseDelayChanged) {
            clearTimeout(autoCollapseTimerRef.current);
            autoCollapseTimerRef.current = undefined;
        }
        if (hasActive || !autoManageExpansion || deferAutomaticCollapse) {
            clearTimeout(autoCollapseAnimationTimerRef.current);
            autoCollapseAnimationTimerRef.current = undefined;
            if (automaticCollapseAnimating &&
                expansionOwnerRef.current === 'automatic') {
                setAutomaticCollapseAnimating(false);
                setGroupExpanded(true);
            }
        }
        if (hasApprovalAgent &&
            automaticCollapseAnimating &&
            expansionOwnerRef.current === 'automatic') {
            // The approval takes over visibility and releases automatic expansion;
            // resolving it later removes the panel outright because there is no
            // automatic expansion left to animate out.
            clearTimeout(autoCollapseAnimationTimerRef.current);
            autoCollapseAnimationTimerRef.current = undefined;
            expansionOwnerRef.current = 'none';
            setAutomaticCollapseAnimating(false);
            automaticExpansionChangeRef.current?.(false);
        }
        if (autoManageExpansion && expansionOwnerRef.current !== 'manual') {
            if (hasActive &&
                (!wasActive ||
                    (expandActiveWhenLive &&
                        (!wasAutoManaging || !wasExpandActiveWhenLive)))) {
                expansionOwnerRef.current = 'automatic';
                setGroupExpanded(true);
                automaticExpansionChangeRef.current?.(true);
            }
            else if (!hasActive &&
                !automaticCollapseAnimating &&
                !deferAutomaticCollapse &&
                (wasActive ||
                    !wasAutoManaging ||
                    wasDeferringAutomaticCollapse ||
                    collapseDelayChanged) &&
                expansionOwnerRef.current === 'automatic') {
                autoCollapseTimerRef.current = setTimeout(function attemptCollapse() {
                    // The timer can fire between the parent's commit and the effect
                    // that clears it; only the render-time refs reflect the new props.
                    if (deferAutomaticCollapseRef.current ||
                        !autoManageExpansionRef.current) {
                        return;
                    }
                    if (!wasActiveRef.current &&
                        expansionOwnerRef.current === 'automatic') {
                        if (!groupExpandedRef.current) {
                            // The user collapsed while auto-management was suspended
                            // (which intentionally does not latch 'manual'): finalize
                            // ownership without playing the exit sequence against an
                            // already-collapsed panel.
                            expansionOwnerRef.current = 'none';
                            automaticExpansionChangeRef.current?.(false);
                            return;
                        }
                        if (approvalAgentRef.current) {
                            // The approval keeps the group visible; retry later so its
                            // resolution still gets the normal delayed exit animation.
                            autoCollapseTimerRef.current = setTimeout(attemptCollapse, automaticCollapseDelayMs);
                            return;
                        }
                        const focusedElement = document.activeElement;
                        if (wrapRef.current &&
                            focusedElement instanceof HTMLElement &&
                            wrapRef.current.contains(focusedElement)) {
                            // The exit neutralizes every focusable element in the group;
                            // hand focus to the summary so it is not silently lost.
                            summaryRef.current?.focus();
                        }
                        setGroupExpanded(false);
                        const animationMs = automaticCollapseAnimationMs();
                        if (animationMs === 0) {
                            expansionOwnerRef.current = 'none';
                            automaticExpansionChangeRef.current?.(false);
                            return;
                        }
                        setAutomaticCollapseAnimating(true);
                        autoCollapseAnimationTimerRef.current = setTimeout(() => {
                            autoCollapseAnimationTimerRef.current = undefined;
                            // Same commit-vs-flush race as above: the deferral effect's
                            // rescue only fires while the animation is still pending, so
                            // finalizing on stale state would make it unrecoverable.
                            if (deferAutomaticCollapseRef.current ||
                                !autoManageExpansionRef.current) {
                                return;
                            }
                            if (!wasActiveRef.current &&
                                expansionOwnerRef.current === 'automatic') {
                                expansionOwnerRef.current = 'none';
                                setAutomaticCollapseAnimating(false);
                                automaticExpansionChangeRef.current?.(false);
                            }
                        }, animationMs);
                    }
                }, automaticCollapseDelayMs);
            }
        }
        wasActiveRef.current = hasActive;
        wasAutoManageExpansionRef.current = autoManageExpansion;
        wasExpandActiveWhenLiveRef.current = expandActiveWhenLive;
        previousAutomaticCollapseDelayRef.current = automaticCollapseDelayMs;
        wasDeferringAutomaticCollapseRef.current = deferAutomaticCollapse;
    }, [
        activeStartedAt,
        automaticCollapseAnimating,
        autoManageExpansion,
        automaticCollapseDelayMs,
        deferAutomaticCollapse,
        expandActiveWhenLive,
        hasApprovalAgent,
        hasActive,
    ]);
    useEffect(() => {
        if (expansionOwnerRef.current === 'automatic') {
            automaticExpansionChangeRef.current?.(true);
        }
        return () => {
            clearTimeout(autoCollapseTimerRef.current);
            clearTimeout(autoCollapseAnimationTimerRef.current);
            if (expansionOwnerRef.current === 'automatic') {
                automaticExpansionChangeRef.current?.(false);
            }
        };
    }, []);
    useEffect(() => {
        if (!hasActive)
            return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [hasActive]);
    const runningDuration = hasActive
        ? formatLiveElapsed(now - liveStartedAtRef.current)
        : '';
    const doneCount = agents.filter((a) => a.status === 'completed' || a.status === 'failed').length;
    const total = agents.length;
    const showGroup = groupExpanded || !!approvalAgent;
    const renderGroup = showGroup || automaticCollapseAnimating;
    const automaticCollapseClosing = automaticCollapseAnimating && !hasApprovalAgent;
    const summaryStatus = agents.some((a) => getAgentDisplayStatus(a) === 'failed')
        ? 'failed'
        : hasActive
            ? 'in_progress'
            : 'completed';
    return (_jsxs("div", { className: styles.wrap, ref: wrapRef, children: [_jsxs("button", { type: "button", ref: summaryRef, className: styles.summary, onClick: () => {
                    if (automaticCollapseClosing)
                        return;
                    clearTimeout(autoCollapseTimerRef.current);
                    autoCollapseTimerRef.current = undefined;
                    clearTimeout(autoCollapseAnimationTimerRef.current);
                    autoCollapseAnimationTimerRef.current = undefined;
                    if (expansionOwnerRef.current === 'automatic') {
                        automaticExpansionChangeRef.current?.(false);
                    }
                    if (autoManageExpansion) {
                        expansionOwnerRef.current = 'manual';
                    }
                    setAutomaticCollapseAnimating(false);
                    setGroupExpanded((value) => !value);
                }, "aria-disabled": automaticCollapseClosing || undefined, "aria-expanded": showGroup, title: showGroup ? t('tool.collapseHint') : t('tool.expand'), children: [summaryStatus === 'failed' ? (_jsx("span", { className: styles.summaryStatus, children: _jsx(StatusIcon, { status: summaryStatus }) })) : (_jsx("span", { className: styles.summaryIcon, "aria-hidden": "true", children: _jsx(ToolGroupIcon, {}) })), _jsxs("span", { className: hasActive
                            ? `${styles.summaryText} ${styles.summaryTextActive}`
                            : styles.summaryText, children: [t('parallelAgents.title'), runningDuration && _jsxs(_Fragment, { children: [" ", runningDuration] }), _jsx("span", { className: styles.summaryDot, children: "\u00B7" }), t('parallelAgents.done', { done: doneCount, total })] }), _jsx("span", { className: showGroup ? styles.chevronDown : styles.chevronRight, "aria-hidden": "true" })] }), renderGroup && (_jsx("div", { ref: (element) => {
                    element?.toggleAttribute('inert', automaticCollapseClosing);
                }, className: `${styles.groupViewport} ${automaticCollapseClosing ? styles.groupViewportClosing : ''}`, "data-agent-collapse-exit": automaticCollapseClosing ? 'true' : undefined, "aria-hidden": automaticCollapseClosing || undefined, children: _jsx("div", { className: styles.groupViewportInner, children: _jsx("div", { className: styles.group, children: _jsx("div", { className: styles.list, children: agents.map((agent) => {
                                const agentType = getAgentType(agent);
                                const desc = getAgentDescription(agent);
                                const toolHint = getAgentCurrentToolHint(agent, t);
                                const stats = getAgentStats(agent, now);
                                const activity = toolHint || stats.cancellationReason;
                                const status = getAgentDisplayStatus(agent);
                                const rowStatus = status === 'failed'
                                    ? 'failed'
                                    : isActiveToolStatus(agent.status)
                                        ? 'active'
                                        : 'completed';
                                const rowStatusLabel = rowStatus === 'active'
                                    ? t('subagent.running')
                                    : rowStatus === 'failed'
                                        ? t('subagent.failed')
                                        : t('subagent.completed');
                                const isExpanded = expandedId === agent.callId;
                                const localizedAgentType = localizeAgentTypeName(agentType, t);
                                const showAgentType = !!desc && !isDefaultAgentType(agentType);
                                return (_jsxs("div", { children: [_jsxs("button", { type: "button", className: rowStatus === 'active'
                                                ? `${styles.row} ${styles.rowActive}`
                                                : styles.row, "data-agent-status": rowStatus, "data-detail-mode": subagentDetails ? 'panel' : 'inline', "aria-expanded": subagentDetails ? undefined : isExpanded, title: subagentDetails
                                                ? t('planExecution.openDetails')
                                                : t('subagent.toggleStream'), onClick: () => {
                                                if (subagentDetails)
                                                    subagentDetails.onOpen(agent);
                                                else
                                                    setExpandedId(isExpanded ? null : agent.callId);
                                            }, children: [_jsx("span", { className: styles.rowStatus, 
                                                    // role="img" makes the span nameable; aria-label on a
                                                    // bare <span> (generic role) is not exposed to
                                                    // assistive tech (see ChatPane's workspace tag).
                                                    role: "img", "aria-label": rowStatusLabel, title: rowStatusLabel, children: rowStatus === 'active'
                                                        ? '●'
                                                        : rowStatus === 'failed'
                                                            ? '×'
                                                            : '✓' }), _jsxs("span", { className: styles.rowText, children: [showAgentType && (_jsxs("span", { className: styles.rowType, children: [truncateText(localizedAgentType, 50), ":"] })), _jsx("span", { className: styles.rowTask, children: truncateText(desc || localizedAgentType, 50) }), activity && (_jsxs("span", { className: styles.rowActivity, children: ["(", activity, ")"] }))] }), (stats.duration || stats.tokens) && (_jsxs("span", { className: styles.rowStats, children: [stats.duration && _jsx("span", { children: stats.duration }), stats.duration && stats.tokens && (_jsx("span", { "aria-hidden": "true", children: " \u00B7 " })), stats.tokens && _jsx("span", { children: stats.tokens })] })), _jsx(ChevronRightIcon, { className: styles.rowAction, "aria-hidden": "true" })] }), !subagentDetails && isExpanded && (_jsx("div", { className: styles.detail, children: _jsx(SubAgentPanel, { tool: agent, hideHeader: true }) }))] }, agent.callId));
                            }) }) }) }) }))] }));
}
//# sourceMappingURL=ParallelAgentsGroup.js.map