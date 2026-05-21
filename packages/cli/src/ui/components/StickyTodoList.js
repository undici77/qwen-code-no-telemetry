import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';
import { Colors } from '../colors.js';
import { theme } from '../semantic-colors.js';
import { getOrderedStickyTodos, getStickyTodosRenderKey, STICKY_TODO_MAX_VISIBLE_ITEMS, } from '../utils/todoSnapshot.js';
const STATUS_ICONS = {
    pending: '○',
    in_progress: '◐',
    completed: '●',
};
function clampVisibleTodoCount(value) {
    if (!Number.isFinite(value)) {
        return STICKY_TODO_MAX_VISIBLE_ITEMS;
    }
    return Math.max(1, Math.min(STICKY_TODO_MAX_VISIBLE_ITEMS, Math.floor(value)));
}
const StickyTodoListComponent = ({ todos, width, maxVisibleItems = STICKY_TODO_MAX_VISIBLE_ITEMS, }) => {
    const orderedTodos = useMemo(() => getOrderedStickyTodos(todos), [todos]);
    const todoNumberById = useMemo(() => new Map(todos.map((todo, index) => [todo.id, `${index + 1}.`])), [todos]);
    if (todos.length === 0) {
        return null;
    }
    const visibleTodoCount = clampVisibleTodoCount(maxVisibleItems);
    const visibleTodos = orderedTodos.slice(0, visibleTodoCount);
    const hiddenTodoCount = orderedTodos.length - visibleTodos.length;
    const numberColumnWidth = Math.max(...visibleTodos.map((todo, index) => (todoNumberById.get(todo.id) ?? `${index + 1}.`).length)) + 1;
    // 6 = 2 (status icon column) + 2 (border columns) + 2 (paddingX columns).
    const contentColumnWidth = Math.max(1, width - numberColumnWidth - 6);
    return (_jsxs(Box, { marginX: 2, width: width, flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, paddingX: 1, children: [_jsx(Text, { color: theme.text.secondary, bold: true, children: t('Current tasks') }), visibleTodos.map((todo, index) => {
                const todoNumber = todoNumberById.get(todo.id) ?? `${index + 1}.`;
                const itemColor = todo.status === 'in_progress'
                    ? Colors.AccentGreen
                    : Colors.Foreground;
                return (_jsxs(Box, { flexDirection: "row", height: 1, children: [_jsx(Box, { width: numberColumnWidth, children: _jsx(Text, { color: theme.text.secondary, children: todoNumber }) }), _jsx(Box, { width: 2, children: _jsx(Text, { color: itemColor, children: STATUS_ICONS[todo.status] }) }), _jsx(Box, { width: contentColumnWidth, children: _jsx(Text, { color: itemColor, strikethrough: todo.status === 'completed', wrap: "truncate-end", children: todo.content }) })] }, todo.id));
            }), hiddenTodoCount > 0 && (_jsxs(Box, { flexDirection: "row", height: 1, children: [_jsx(Box, { width: numberColumnWidth }), _jsx(Box, { width: 2 }), _jsx(Box, { width: contentColumnWidth, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate-end", children: t('... and {{count}} more', {
                                count: String(hiddenTodoCount),
                            }) }) })] }))] }));
};
export const StickyTodoList = memo(StickyTodoListComponent, (previousProps, nextProps) => previousProps.width === nextProps.width &&
    previousProps.maxVisibleItems === nextProps.maxVisibleItems &&
    getStickyTodosRenderKey(previousProps.todos) ===
        getStickyTodosRenderKey(nextProps.todos));
//# sourceMappingURL=StickyTodoList.js.map