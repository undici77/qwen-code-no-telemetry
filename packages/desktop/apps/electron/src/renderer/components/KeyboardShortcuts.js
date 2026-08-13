import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { actionsByCategory, useActionLabel } from '@/actions';
export function KeyboardShortcuts() {
    return (_jsx("div", { className: "space-y-6", children: Object.entries(actionsByCategory).map(([category, actions]) => (_jsxs("section", { children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-2", children: category }), _jsx("div", { className: "space-y-1", children: actions.map(action => (_jsx(ShortcutRow, { actionId: action.id }, action.id))) })] }, category))) }));
}
function ShortcutRow({ actionId }) {
    const { label, description, hotkey } = useActionLabel(actionId);
    return (_jsxs("div", { className: "flex items-center justify-between py-1.5", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm", children: label }), description && (_jsx("div", { className: "text-xs text-muted-foreground", children: description }))] }), hotkey && (_jsx("kbd", { className: "px-2 py-1 text-xs bg-muted rounded", children: hotkey }))] }));
}
//# sourceMappingURL=KeyboardShortcuts.js.map