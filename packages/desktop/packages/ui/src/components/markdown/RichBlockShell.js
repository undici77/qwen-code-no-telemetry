import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TiptapHoverActionsHost, TiptapHoverActions, TiptapHoverActionButton } from './TiptapHoverActions';
export function RichBlockShell({ children, onEdit, editTitle = 'Edit block', className }) {
    return (_jsxs(TiptapHoverActionsHost, { className: cn('group', className), children: [onEdit && (_jsx(TiptapHoverActions, { children: _jsx(TiptapHoverActionButton, { onMouseDown: (event) => {
                        // Keep focus/selection in ProseMirror so BubbleMenu anchor is stable on first open.
                        event.preventDefault();
                        event.stopPropagation();
                    }, onClick: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onEdit();
                    }, className: "rich-block-edit-button", title: editTitle, "aria-label": editTitle, children: _jsx(Pencil, { className: "w-3.5 h-3.5" }) }) })), children] }));
}
//# sourceMappingURL=RichBlockShell.js.map