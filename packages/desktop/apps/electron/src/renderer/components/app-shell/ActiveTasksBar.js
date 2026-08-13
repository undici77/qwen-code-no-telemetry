import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ActiveTasksBar - Compact horizontal display of running background tasks
 *
 * Shows above/below the ChatInput when background tasks are active.
 * Each task shows: type icon, ID (shortened), elapsed time, kill button
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@craft-agent/ui';
import { TaskActionMenu } from './TaskActionMenu';
/** Format elapsed time in a compact way */
function formatElapsed(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
/** Shorten task ID for compact display (show first 8 chars) */
function shortenId(id) {
    return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}
/**
 * ActiveTasksBar - Badge-style display of running background tasks
 * Styled to match ActiveOptionBadges for visual consistency
 * Only renders when there are active tasks
 */
export function ActiveTasksBar({ tasks, sessionId, onKillTask, onInsertMessage, onShowTerminalOverlay, className }) {
    // Don't render if no tasks
    if (tasks.length === 0)
        return null;
    return (_jsx(_Fragment, { children: tasks.map((task) => (_jsx(TaskActionMenu, { task: task, sessionId: sessionId, onKillTask: onKillTask || (() => { }), onInsertMessage: onInsertMessage, onShowTerminalOverlay: onShowTerminalOverlay, className: className }, task.id))) }));
}
//# sourceMappingURL=ActiveTasksBar.js.map