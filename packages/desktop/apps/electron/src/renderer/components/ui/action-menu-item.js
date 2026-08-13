import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionLabel } from '@/actions';
import { StyledDropdownMenuItem } from './styled-dropdown';
export function ActionMenuItem({ action, onClick, children }) {
    const { label, hotkey } = useActionLabel(action);
    return (_jsxs(StyledDropdownMenuItem, { onClick: onClick, children: [_jsx("span", { children: children || label }), hotkey && (_jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: hotkey }))] }));
}
//# sourceMappingURL=action-menu-item.js.map