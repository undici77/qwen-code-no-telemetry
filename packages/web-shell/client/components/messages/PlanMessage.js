import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useContext, useState } from 'react';
import { TodoTimelineContext } from '../../App';
import { TodoEventSummary, TodoFullList } from './TodoView';
import { useI18n } from '../../i18n';
import flashStyles from '../MessageLocateFlash.module.css';
import styles from './PlanMessage.module.css';
// Isolating the context read here (mirroring ToolGroup's TodoToolBody) keeps the
// memo-shielded PlanMessage from re-rendering when the timeline Map reference
// changes — only this small summary does.
function PlanEventSummary({ id, todos }) {
    const timeline = useContext(TodoTimelineContext);
    const events = timeline.get(id)?.events ?? [];
    return _jsx(TodoEventSummary, { todos: todos, events: events });
}
export const PlanMessage = memo(function PlanMessage({ id, todos, isLocateFlashing = false, }) {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState(false);
    if (todos.length === 0)
        return null;
    const total = todos.length;
    const completed = todos.filter((td) => td.status === 'completed').length;
    return (_jsxs("div", { className: `${styles.message}${isLocateFlashing ? ` ${flashStyles.flash}` : ''}`, children: [_jsxs("button", { type: "button", className: styles.header, onClick: () => setExpanded((value) => !value), "aria-expanded": expanded, title: expanded ? t('todo.collapse') : t('todo.expand'), children: [_jsx("span", { className: styles.chevron, "aria-hidden": "true", children: expanded ? '▾' : '▸' }), _jsx("span", { className: styles.title, children: t('plan.title') }), _jsxs("span", { className: styles.progress, children: [completed, "/", total] })] }), expanded ? (_jsx(TodoFullList, { todos: todos, numbered: true })) : (_jsx(PlanEventSummary, { id: id, todos: todos }))] }));
});
//# sourceMappingURL=PlanMessage.js.map