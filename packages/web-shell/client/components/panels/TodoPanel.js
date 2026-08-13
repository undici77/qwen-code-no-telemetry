import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo } from 'react';
import { getTodoStatusIcon } from '../../utils/todos';
import { useI18n } from '../../i18n';
import styles from './TodoPanel.module.css';
function getStatusClass(status) {
    switch (status) {
        case 'completed':
            return styles.completed;
        case 'in_progress':
            return styles.inProgress;
        case 'pending':
            return styles.pending;
    }
}
export const TodoPanel = memo(function TodoPanel({ todos, title, statusItems = [], onOpen, }) {
    const { t } = useI18n();
    if (todos.length === 0 && statusItems.length === 0)
        return null;
    const total = todos.length;
    const hasTodos = total > 0;
    const inProgressIdx = todos.findIndex((td) => td.status === 'in_progress');
    const currentIdx = inProgressIdx >= 0
        ? inProgressIdx
        : todos.findIndex((td) => td.status === 'pending');
    const stepIndex = hasTodos ? (currentIdx >= 0 ? currentIdx + 1 : total) : 0;
    const progress = hasTodos ? stepIndex / total : 0;
    const statusOnlyLabel = statusItems
        .map((item) => item.ariaLabel ??
        item.title ??
        (typeof item.label === 'string' ? item.label : undefined))
        .filter(Boolean)
        .join(', ') || undefined;
    const summaryAriaLabel = hasTodos
        ? t('todo.stepProgress', {
            current: stepIndex,
            total,
        })
        : statusOnlyLabel;
    return (_jsxs("section", { className: styles.panel, "aria-label": title ?? (hasTodos ? t('todo.title') : statusOnlyLabel), tabIndex: 0, children: [_jsxs("div", { className: styles.summary, "aria-label": summaryAriaLabel, children: [hasTodos && onOpen ? (_jsxs("button", { type: "button", className: styles.progressButton, "aria-label": summaryAriaLabel, onClick: onOpen, children: [_jsx("span", { className: styles.progressRing, style: { '--todo-progress': String(progress) }, "aria-hidden": "true" }), _jsxs("span", { className: styles.stepText, children: [_jsx("span", { className: styles.fullText, children: t('todo.stepProgress', { current: stepIndex, total }) }), _jsx("span", { className: styles.compactText, children: t('todo.stepFraction', { current: stepIndex, total }) })] })] })) : hasTodos ? (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.progressRing, style: { '--todo-progress': String(progress) }, "aria-hidden": "true" }), _jsxs("span", { className: styles.stepText, children: [_jsx("span", { className: styles.fullText, children: t('todo.stepProgress', { current: stepIndex, total }) }), _jsx("span", { className: styles.compactText, children: t('todo.stepFraction', { current: stepIndex, total }) })] })] })) : null, statusItems.map((item, index) => (_jsxs("span", { className: styles.statusSegmentWrap, children: [(total > 0 || index > 0) && (_jsx("span", { className: styles.separator, "aria-hidden": "true", children: "\u00B7" })), item.onClick ? (_jsx("button", { type: "button", className: styles.statusSegmentButton, title: item.title, "aria-label": item.ariaLabel, onClick: item.onClick, children: item.label })) : (_jsx("span", { className: styles.statusSegment, title: item.title, children: item.label }))] }, item.id)))] }), total > 0 && (_jsx("div", { className: styles.detail, role: "tooltip", children: todos.map((todo, index) => (_jsxs("div", { className: `${styles.item} ${getStatusClass(todo.status)}`, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: todo.status === 'in_progress' ? (_jsx("span", { className: styles.loadingIcon })) : (getTodoStatusIcon(todo.status)) }), _jsx("span", { className: styles.content, title: todo.content, children: todo.content })] }, `${todo.id || index}:${todo.content}`))) }))] }));
});
//# sourceMappingURL=TodoPanel.js.map