import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { memo } from 'react';
import { CollapsibleFileContent } from './CollapsibleFileContent.js';
import { EditPencilIcon } from '../icons/EditIcons.js';
import { MessageMeta } from './MessageMeta.js';
const UserMessageBase = ({ content, timestamp, onFileClick, fileContext, onEdit, editDisabled = false, }) => {
    const getFileContextDisplay = () => {
        if (!fileContext) {
            return null;
        }
        const { fileName, startLine, endLine } = fileContext;
        if (startLine != null) {
            if (endLine != null && endLine !== startLine) {
                return `${fileName}#${startLine}-${endLine}`;
            }
            return `${fileName}#${startLine}`;
        }
        return fileName;
    };
    const fileContextDisplay = getFileContextDisplay();
    return (_jsxs("div", { className: "qwen-message user-message-container group flex gap-0 my-1 items-start text-left flex-col relative", style: { position: 'relative' }, children: [_jsx("div", { className: "inline-block relative whitespace-pre-wrap rounded-md max-w-full overflow-x-auto overflow-y-hidden select-text leading-[1.5]", style: {
                    border: '1px solid var(--app-input-border)',
                    borderRadius: 'var(--corner-radius-medium)',
                    backgroundColor: 'var(--app-input-background)',
                    padding: '4px 6px',
                    color: 'var(--app-primary-foreground)',
                }, children: _jsx(CollapsibleFileContent, { content: content, onFileClick: onFileClick, enableFileLinks: false }) }), _jsx(MessageMeta, { timestamp: timestamp, copyText: content, onEdit: onEdit, editDisabled: editDisabled, editIcon: _jsx(EditPencilIcon, { size: 14 }) }), fileContextDisplay && (_jsx("div", { className: "mt-1", children: _jsx("button", { type: "button", className: "inline-flex items-center py-0 pr-2 gap-1 rounded-sm cursor-pointer relative opacity-50 bg-transparent border-none", onClick: () => fileContext && onFileClick?.(fileContext.filePath), disabled: !onFileClick, children: _jsx("span", { title: fileContextDisplay, style: {
                            fontSize: '12px',
                            color: 'var(--app-secondary-foreground)',
                        }, children: fileContextDisplay }) }) }))] }));
};
UserMessageBase.displayName = 'UserMessage';
export const UserMessage = memo(UserMessageBase);
//# sourceMappingURL=UserMessage.js.map