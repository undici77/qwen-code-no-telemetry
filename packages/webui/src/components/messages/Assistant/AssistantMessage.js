import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { memo } from 'react';
import { MessageContent } from '../MessageContent.js';
import { MessageMeta } from '../MessageMeta.js';
import './AssistantMessage.css';
/**
 * AssistantMessage component - renders AI responses with styling
 * Supports different states: default, success, error, warning, loading
 */
const AssistantMessageBase = ({ content, timestamp, onFileClick, status = 'default', hideStatusIcon = false, isFirst = false, isLast = false, }) => {
    if (!content || content.trim().length === 0) {
        return null;
    }
    const getStatusClass = () => {
        if (hideStatusIcon) {
            return '';
        }
        switch (status) {
            case 'success':
                return 'assistant-message-success';
            case 'error':
                return 'assistant-message-error';
            case 'warning':
                return 'assistant-message-warning';
            case 'loading':
                return 'assistant-message-loading';
            default:
                return 'assistant-message-default';
        }
    };
    return (_jsx("div", { className: `qwen-message message-item assistant-message-container group ${getStatusClass()}`, "data-first": isFirst, "data-last": isLast, style: {
            width: '100%',
            alignItems: 'flex-start',
            paddingLeft: '30px',
            userSelect: 'text',
            position: 'relative',
        }, children: _jsxs("span", { style: { width: '100%' }, children: [_jsx("div", { style: {
                        margin: 0,
                        width: '100%',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                    }, children: _jsx(MessageContent, { content: content, onFileClick: onFileClick, enableFileLinks: false }) }), _jsx(MessageMeta, { timestamp: timestamp, copyText: content })] }) }));
};
AssistantMessageBase.displayName = 'AssistantMessage';
export const AssistantMessage = memo(AssistantMessageBase);
//# sourceMappingURL=AssistantMessage.js.map