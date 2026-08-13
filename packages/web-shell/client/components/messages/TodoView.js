import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext, useState } from 'react';
import { getTodoStatusIcon, todoStateKey, } from '../../utils/todos';
import { TodoDetailContext } from '../../App';
import { formatTimestamp } from '../MessageTimestamp';
import { formatDuration } from './StatsMessage';
import { useI18n } from '../../i18n';
import styles from './TodoView.module.css';
function statusClass(status) {
    switch (status) {
        case 'completed':
            return styles.completed;
        case 'in_progress':
            return styles.inProgress;
        case 'pending':
            return '';
    }
}
/**
 * Collapsed view: the change a single snapshot introduced — items that just
 * completed and items that just started. With no tracked change (an unchanged
 * re-emit, or a snapshot rendered without a timeline) it falls back to the
 * current focus item so the row is never empty.
 */
export function TodoEventSummary({ todos, events, }) {
    const { t } = useI18n();
    if (events.length === 0) {
        const allCompleted = todos.length > 0 && todos.every((td) => td.status === 'completed');
        if (allCompleted) {
            return (_jsx("div", { className: styles.summary, children: _jsxs("div", { className: `${styles.row} ${styles.completed}`, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: "\u2713" }), _jsx("span", { className: styles.text, children: t('todo.allDone') })] }) }));
        }
        const current = todos.find((td) => td.status === 'in_progress') ??
            todos.find((td) => td.status === 'pending');
        if (!current)
            return null;
        return (_jsx("div", { className: styles.summary, children: _jsxs("div", { className: `${styles.row} ${statusClass(current.status)}`, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: getTodoStatusIcon(current.status) }), _jsx("span", { className: styles.text, children: current.content })] }) }));
    }
    return (_jsx("div", { className: styles.summary, children: events.map((event) => (_jsxs("div", { className: `${styles.row} ${event.kind === 'completed' ? styles.completed : styles.inProgress}`, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: getTodoStatusIcon(event.kind === 'completed' ? 'completed' : 'in_progress') }), _jsx("span", { className: styles.text, children: event.content })] }, `${event.kind}-${event.id}`))) }));
}
function DetailRow({ label, value, suffix, }) {
    // Two bare grid cells so every row's labels and values align in shared
    // columns within a section (see .detailRows).
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.detailLabel, children: label }), _jsxs("span", { className: styles.detailValue, children: [value, suffix] })] }));
}
function DetailSection({ title, children, }) {
    return (_jsxs("div", { className: styles.detailSection, children: [_jsx("div", { className: styles.detailSectionTitle, children: title }), _jsx("div", { className: styles.detailRows, children: children })] }));
}
/**
 * Timing and resource breakdown for one finished task, grouped into Time /
 * Tokens / Time-spent sections. Start/end come from the transcript so they show
 * even on a restored session. Token and time-spent rows render only for the
 * fields that were measured (tokens absent without stamped snapshots, API time
 * absent on resume, tool time absent when no tools ran); when nothing was
 * measured a short hint explains the absence.
 */
function TodoDetailBlock({ detail }) {
    const { t } = useI18n();
    const { startTs, endTs, resources } = detail;
    const hasTime = startTs !== undefined || endTs !== undefined;
    const hasTokens = resources?.inputTokens !== undefined;
    const hasSpent = resources?.apiTimeMs !== undefined || resources?.toolTimeMs !== undefined;
    return (_jsxs("div", { className: styles.detail, children: [hasTime && (_jsxs(DetailSection, { title: t('todo.detail.sectionTime'), children: [startTs !== undefined && (_jsx(DetailRow, { label: t('todo.detail.start'), value: formatTimestamp(startTs) })), endTs !== undefined && (_jsx(DetailRow, { label: t('todo.detail.end'), value: formatTimestamp(endTs), suffix: startTs !== undefined ? (_jsxs("span", { className: styles.detailDuration, children: [' ', "(", formatDuration(endTs - startTs), ")"] })) : undefined }))] })), hasTokens && (_jsxs(DetailSection, { title: t('todo.detail.sectionTokens'), children: [_jsx(DetailRow, { label: t('todo.detail.input'), value: (resources?.inputTokens ?? 0).toLocaleString() }), _jsx(DetailRow, { label: t('todo.detail.output'), value: (resources?.outputTokens ?? 0).toLocaleString() }), _jsx(DetailRow, { label: t('todo.detail.cached'), value: (resources?.cachedTokens ?? 0).toLocaleString() })] })), hasSpent && (_jsxs(DetailSection, { title: t('todo.detail.sectionSpent'), children: [resources?.apiTimeMs !== undefined && (_jsx(DetailRow, { label: t('todo.detail.api'), value: formatDuration(resources.apiTimeMs) })), resources?.toolTimeMs !== undefined && (_jsx(DetailRow, { label: t('todo.detail.tool'), value: formatDuration(resources.toolTimeMs) }))] })), !resources && (_jsx("div", { className: styles.detailHint, children: t('todo.detail.noResources') }))] }));
}
/**
 * Only finished tasks are expandable — `endTs` and `resources` are both set on
 * the completed transition, so either marks completion. An in_progress item
 * (which carries just `startTs`) stays a plain row, matching the feature's
 * focus on completed tasks and avoiding a half-empty detail panel mid-run.
 */
function hasTodoDetail(detail) {
    return (!!detail && (detail.endTs !== undefined || detail.resources !== undefined));
}
/** Expanded view: the full list. `numbered` adds the 1. 2. 3. index column. */
export function TodoFullList({ todos, numbered = false, }) {
    const { t } = useI18n();
    const details = useContext(TodoDetailContext);
    const [expanded, setExpanded] = useState(() => new Set());
    // Size the number column to the widest index so the markers stay aligned once
    // the list grows past 9 items.
    const numColumnWidth = `${String(todos.length).length + 1}ch`;
    const toggle = (rowKey) => setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(rowKey))
            next.delete(rowKey);
        else
            next.add(rowKey);
        return next;
    });
    return (_jsx("div", { className: styles.list, children: todos.map((todo, index) => {
            const rowKey = todo.id || String(index);
            const detail = details.get(todoStateKey(todo));
            const expandable = hasTodoDetail(detail);
            const isOpen = expandable && expanded.has(rowKey);
            const rowInner = (_jsxs(_Fragment, { children: [numbered && (_jsxs("span", { className: styles.num, style: { minWidth: numColumnWidth }, children: [index + 1, "."] })), _jsx("span", { className: styles.icon, "aria-hidden": "true", children: getTodoStatusIcon(todo.status) }), _jsx("span", { className: styles.text, children: todo.content }), expandable && (_jsx("span", { className: styles.detailChevron, "aria-hidden": "true", children: isOpen ? '▾' : '▸' }))] }));
            return (_jsxs("div", { className: styles.item, children: [expandable ? (_jsx("button", { type: "button", className: `${styles.row} ${styles.rowButton} ${statusClass(todo.status)}`, onClick: (e) => {
                            // This row toggles its own detail only — never bubble to a
                            // surrounding expandable container (e.g. the todo_write tool
                            // row, whose header would otherwise collapse the whole list).
                            e.stopPropagation();
                            toggle(rowKey);
                        }, "aria-expanded": isOpen, title: isOpen ? t('todo.detail.hide') : t('todo.detail.show'), children: rowInner })) : (_jsx("div", { className: `${styles.row} ${statusClass(todo.status)}`, children: rowInner })), isOpen && detail && _jsx(TodoDetailBlock, { detail: detail })] }, rowKey));
        }) }));
}
//# sourceMappingURL=TodoView.js.map