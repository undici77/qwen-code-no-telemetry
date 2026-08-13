import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { CircleCheckIcon, CircleMinusIcon, CircleXIcon, InfoIcon, } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ContextUsageMessage, parseContextUsageMessage, } from './ContextUsageMessage';
import { StatsMessage, parseStatsMessage } from './StatsMessage';
import { StatusMessage, parseStatusMessage } from './StatusMessage';
import { McpStatusMessage, parseMcpStatusMessage } from './McpStatusMessage';
import { TasksStatusMessage, parseTasksStatusMessage, } from './TasksStatusMessage';
import { GoalStatusMessage, parseGoalStatusMessage } from './GoalStatusMessage';
import { Markdown } from './Markdown';
import styles from './SystemMessage.module.css';
export const SystemMessage = memo(function SystemMessage({ content, variant, source, data, onShowContextDetail, isLatest = false, showRetryHint = false, onRetryClick, }) {
    const { t } = useI18n();
    // The user ESC-cancelled a live stream. Render it right-aligned and subtle —
    // a user-initiated stop reads as belonging to the user side of the transcript.
    if (source === 'prompt_cancelled') {
        return (_jsx("div", { className: styles.cancelled, role: "status", children: _jsx("span", { children: t('turn.stopped') }) }));
    }
    const contextUsage = variant === 'info' ? parseContextUsageMessage(content) : null;
    if (contextUsage) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(ContextUsageMessage, { status: contextUsage, onShowDetail: onShowContextDetail }) }));
    }
    const statsData = variant === 'info' ? parseStatsMessage(content) : null;
    if (statsData) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(StatsMessage, { view: statsData.view, status: statsData.status }) }));
    }
    const statusInfo = variant === 'info' ? parseStatusMessage(content) : null;
    if (statusInfo) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(StatusMessage, { info: statusInfo }) }));
    }
    const mcpStatus = variant === 'info' ? parseMcpStatusMessage(content) : null;
    if (mcpStatus) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(McpStatusMessage, { message: mcpStatus }) }));
    }
    const tasksStatus = variant === 'info' ? parseTasksStatusMessage(content) : null;
    if (tasksStatus) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(TasksStatusMessage, { message: tasksStatus }) }));
    }
    const goalStatus = variant === 'info'
        ? source === 'goal'
            ? parseGoalStatusMessage(data)
            : parseGoalStatusMessage(content)
        : null;
    if (goalStatus) {
        return (_jsx("div", { className: styles.flushMessage, children: _jsx(GoalStatusMessage, { status: goalStatus, activateFooter: isLatest }) }));
    }
    const preserveWhitespace = variant === 'info' && source === 'model_switch_summary';
    const isRecap = variant === 'info' && source === 'recap';
    const isTaskNotification = variant === 'info' && source === 'background_notification';
    const notificationData = isTaskNotification && typeof data === 'object' && data !== null
        ? data
        : undefined;
    const stringField = (key) => {
        const value = notificationData?.[key];
        return typeof value === 'string' ? value : undefined;
    };
    const numberField = (key) => {
        const value = notificationData?.[key];
        return typeof value === 'number' ? value : undefined;
    };
    const taskStatus = stringField('status');
    const taskNotificationLabel = taskStatus === 'completed'
        ? t('system.taskCompleted')
        : taskStatus === 'failed'
            ? t('system.taskFailed')
            : taskStatus === 'cancelled'
                ? t('system.taskCancelled')
                : t('system.taskNotification');
    const taskNotificationTone = taskStatus === 'completed'
        ? 'success'
        : taskStatus === 'failed'
            ? 'error'
            : 'neutral';
    const TaskNotificationIcon = taskStatus === 'completed'
        ? CircleCheckIcon
        : taskStatus === 'failed'
            ? CircleXIcon
            : taskStatus === 'cancelled'
                ? CircleMinusIcon
                : InfoIcon;
    const taskKind = stringField('kind');
    const taskCommandLabel = stringField('commandLabel');
    const taskDescription = stringField('description');
    const taskEventCount = numberField('eventCount');
    const taskDroppedLines = numberField('droppedLines');
    const taskI18nText = (() => {
        if (!taskKind || !taskStatus)
            return undefined;
        if (taskStatus !== 'completed' &&
            taskStatus !== 'failed' &&
            taskStatus !== 'cancelled') {
            return undefined;
        }
        const key = `notification.${taskKind}.${taskStatus}`;
        if (taskKind === 'shell') {
            return taskCommandLabel
                ? t(key, { command: taskCommandLabel })
                : undefined;
        }
        if (taskKind === 'monitor' || taskKind === 'agent') {
            return taskDescription
                ? t(key, {
                    description: taskDescription,
                    events: taskEventCount ?? 0,
                    droppedLines: taskDroppedLines ?? 0,
                })
                : undefined;
        }
        return undefined;
    })();
    const renderedContent = preserveWhitespace ? (_jsx("pre", { children: content })) : variant === 'info' ? (_jsx(Markdown, { content: content })) : (_jsx("pre", { children: content }));
    if (isTaskNotification) {
        return (_jsx("div", { className: styles.notificationBubbleRow, children: _jsx("div", { className: styles.notificationBubbleColumn, children: _jsxs("div", { className: styles.notificationBubble, children: [_jsx("span", { className: styles.notificationIcon, "data-tone": taskNotificationTone, role: "img", "aria-label": taskNotificationLabel, title: taskNotificationLabel, children: _jsx(TaskNotificationIcon, { "aria-hidden": "true" }) }), _jsx("div", { className: styles.notificationText, children: taskI18nText ?? _jsx(Markdown, { content: content }) })] }) }) }));
    }
    return (_jsx("div", { className: `${styles.message} ${styles[variant]} ${preserveWhitespace ? styles.modelSwitch : ''} ${isRecap ? styles.recap : ''}`, children: _jsxs("div", { className: styles.content, children: [renderedContent, showRetryHint && onRetryClick && (_jsx("div", { className: styles.retryHint, children: _jsx("button", { type: "button", className: styles.retryButton, onClick: onRetryClick, children: t('retry.hint') }) }))] }) }));
});
//# sourceMappingURL=SystemMessage.js.map