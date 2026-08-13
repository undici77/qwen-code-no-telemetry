import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '../../lib/utils';
export function TiptapHoverActionsHost({ children, className, actionsOpen = false }) {
    return (_jsx("div", { className: cn('tiptap-hover-actions-host', className), "data-actions-open": actionsOpen ? 'true' : 'false', children: children }));
}
export function TiptapHoverActions({ children, className, contentEditable = false }) {
    return (_jsx("div", { className: cn('tiptap-hover-actions', className), contentEditable: contentEditable ? undefined : false, children: children }));
}
export function TiptapHoverActionButton({ className, active = false, type = 'button', ...props }) {
    return (_jsx("button", { type: type, className: cn('tiptap-hover-action-btn', active && 'is-active', className), ...props }));
}
//# sourceMappingURL=TiptapHoverActions.js.map