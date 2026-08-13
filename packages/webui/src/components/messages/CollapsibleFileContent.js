import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { MessageContent } from './MessageContent.js';
/**
 * Pattern markers for file reference content
 */
const FILE_REFERENCE_START = '--- Content from referenced files ---';
const FILE_REFERENCE_END = '--- End of content ---';
const FILE_CONTENT_PREFIX = /^Content from @([^\n:]+):\n?/m;
/**
 * Parse content to identify file references and regular text
 * @param content - The raw content string
 * @returns Array of content segments
 */
export function parseContentWithFileReferences(content) {
    const segments = [];
    // Find the file reference section
    const startIndex = content.indexOf(FILE_REFERENCE_START);
    const endIndex = content.indexOf(FILE_REFERENCE_END);
    // No file reference section found
    if (startIndex === -1) {
        return [{ type: 'text', content }];
    }
    // Add text before file references
    const textBefore = content.substring(0, startIndex).trim();
    if (textBefore) {
        segments.push({ type: 'text', content: textBefore });
    }
    // Extract file reference section
    const fileRefSection = endIndex !== -1
        ? content.substring(startIndex + FILE_REFERENCE_START.length, endIndex)
        : content.substring(startIndex + FILE_REFERENCE_START.length);
    // Parse individual file references
    // Split by "Content from @" pattern
    const fileRefParts = fileRefSection.split(/(?=\nContent from @)/);
    for (const part of fileRefParts) {
        const trimmedPart = part.trim();
        if (!trimmedPart)
            continue;
        // Try to extract file path
        const match = trimmedPart.match(FILE_CONTENT_PREFIX);
        if (match) {
            const filePath = match[1].trim();
            const fileName = filePath.split('/').pop() || filePath;
            const fileContent = trimmedPart.substring(match[0].length);
            segments.push({
                type: 'file_reference',
                content: fileContent.trim(),
                filePath,
                fileName,
            });
        }
        else if (trimmedPart && !trimmedPart.startsWith('Content from @')) {
            // This might be content without proper prefix, still treat as file reference
            segments.push({
                type: 'file_reference',
                content: trimmedPart,
            });
        }
    }
    // Add text after file references
    if (endIndex !== -1) {
        const textAfter = content
            .substring(endIndex + FILE_REFERENCE_END.length)
            .trim();
        if (textAfter) {
            segments.push({ type: 'text', content: textAfter });
        }
    }
    return segments;
}
/**
 * CollapsibleFileReference - A single collapsible file reference block
 */
const CollapsibleFileReference = ({ segment, onFileClick, defaultExpanded = false, }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const lineCount = useMemo(() => segment.content.split('\n').length, [segment.content]);
    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };
    const handleFileClick = () => {
        if (segment.filePath && onFileClick) {
            onFileClick(segment.filePath);
        }
    };
    return (_jsxs("div", { className: "rounded-md overflow-hidden", style: {
            border: '1px solid var(--app-input-border)',
            backgroundColor: 'var(--app-secondary-background)',
        }, children: [_jsxs("button", { type: "button", className: "flex items-center gap-1.5 w-full py-1.5 px-2.5 bg-transparent border-none cursor-pointer text-left text-xs transition-colors duration-150 hover:bg-black/5", style: { color: 'var(--app-secondary-foreground)' }, onClick: handleToggle, "aria-expanded": isExpanded, children: [_jsx("span", { className: "text-[8px] flex-shrink-0 transition-transform duration-200", style: {
                            color: 'var(--app-secondary-foreground)',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }, children: "\u25B6" }), _jsx("span", { className: "text-sm flex-shrink-0", children: "\uD83D\uDCC4" }), _jsx("span", { className: "font-medium cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 hover:underline", style: { color: 'var(--app-link-color, #0066cc)' }, onClick: (e) => {
                            e.stopPropagation();
                            handleFileClick();
                        }, title: segment.filePath, children: segment.fileName || 'Referenced file' }), _jsxs("span", { className: "text-[11px] flex-shrink-0 ml-auto", style: { color: 'var(--app-tertiary-foreground, #999)' }, children: [lineCount, " ", lineCount === 1 ? 'line' : 'lines'] })] }), isExpanded && (_jsx("div", { className: "py-2 px-2.5 max-h-[300px] overflow-y-auto text-xs leading-normal", style: {
                    borderTop: '1px solid var(--app-input-border)',
                    backgroundColor: 'var(--app-primary-background)',
                }, children: _jsx(MessageContent, { content: segment.content, onFileClick: onFileClick, enableFileLinks: true }) }))] }));
};
/**
 * CollapsibleFileContent - Renders content with collapsible file references
 *
 * Detects file reference patterns in user messages and renders them as
 * collapsible blocks to improve readability.
 */
export const CollapsibleFileContent = ({ content, onFileClick, enableFileLinks = false, }) => {
    const segments = useMemo(() => parseContentWithFileReferences(content), [content]);
    // If no file references found, render as normal content
    if (segments.length === 1 && segments[0].type === 'text') {
        return (_jsx(MessageContent, { content: content, onFileClick: onFileClick, enableFileLinks: enableFileLinks }));
    }
    return (_jsx("div", { className: "flex flex-col gap-2", children: segments.map((segment, index) => {
            if (segment.type === 'text') {
                return (_jsx("div", { children: _jsx(MessageContent, { content: segment.content, onFileClick: onFileClick, enableFileLinks: enableFileLinks }) }, index));
            }
            return (_jsx(CollapsibleFileReference, { segment: segment, onFileClick: onFileClick, defaultExpanded: false }, index));
        }) }));
};
export default CollapsibleFileContent;
//# sourceMappingURL=CollapsibleFileContent.js.map