import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer/MarkdownRenderer.js';
const MessageContentBase = ({ content, onFileClick, enableFileLinks, }) => (_jsx(MarkdownRenderer, { content: content, onFileClick: onFileClick, enableFileLinks: enableFileLinks }));
MessageContentBase.displayName = 'MessageContent';
export const MessageContent = memo(MessageContentBase);
//# sourceMappingURL=MessageContent.js.map