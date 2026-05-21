import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
const STATUS_ICONS = {
    pending: '○',
    in_progress: '◐',
    completed: '●',
};
export const TodoDisplay = ({ todos }) => {
    if (!todos || todos.length === 0) {
        return null;
    }
    return (_jsx(Box, { flexDirection: "column", children: todos.map((todo) => (_jsx(TodoItemRow, { todo: todo }, todo.id))) }));
};
const TodoItemRow = ({ todo }) => {
    const statusIcon = STATUS_ICONS[todo.status];
    const isCompleted = todo.status === 'completed';
    const isInProgress = todo.status === 'in_progress';
    // Use the same color for both status icon and text, like RadioButtonSelect
    const itemColor = isCompleted
        ? Colors.Foreground
        : isInProgress
            ? Colors.AccentGreen
            : Colors.Foreground;
    return (_jsxs(Box, { flexDirection: "row", minHeight: 1, children: [_jsx(Box, { width: 3, children: _jsx(Text, { color: itemColor, children: statusIcon }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: itemColor, strikethrough: isCompleted, wrap: "wrap", children: todo.content }) })] }));
};
//# sourceMappingURL=TodoDisplay.js.map