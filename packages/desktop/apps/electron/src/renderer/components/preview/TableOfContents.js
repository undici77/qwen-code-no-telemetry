import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
/**
 * Strips markdown formatting from text to get plain text
 * Handles: bold, italic, code, links, images, strikethrough
 */
function stripMarkdown(text) {
    return text
        // Remove images ![alt](url)
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        // Remove bold **text** or __text__
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Remove italic *text* or _text_
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Remove inline code `code`
        .replace(/`([^`]+)`/g, '$1')
        // Remove strikethrough ~~text~~
        .replace(/~~([^~]+)~~/g, '$1')
        // Trim whitespace
        .trim();
}
/**
 * TableOfContents - TOC with cursor-based highlighting
 *
 * Features:
 * - Extracts headings from markdown content with line numbers
 * - Highlights heading based on cursor position
 * - Click heading to scroll editor to that line
 */
export function TableOfContents({ content, cursorLine, onHeadingClick, className, }) {
    const { t } = useTranslation();
    // Extract headings with line numbers from markdown content
    const headings = useMemo(() => {
        const lines = content.split('\n');
        const extracted = [];
        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                extracted.push({
                    text: stripMarkdown(match[2]),
                    level: match[1].length,
                    line: index + 1, // Monaco uses 1-based line numbers
                });
            }
        });
        return extracted;
    }, [content]);
    // Find active heading based on cursor position
    const activeHeadingIndex = useMemo(() => {
        if (headings.length === 0)
            return -1;
        // Find the last heading that's at or before the cursor
        let activeIndex = -1;
        for (let i = 0; i < headings.length; i++) {
            if (headings[i].line <= cursorLine) {
                activeIndex = i;
            }
            else {
                break;
            }
        }
        return activeIndex;
    }, [headings, cursorLine]);
    // No headings - show empty state
    if (headings.length === 0) {
        return (_jsx("div", { className: cn('h-full flex items-center justify-center p-4', className), children: _jsx("span", { className: "text-xs text-muted-foreground", children: t("tableOfContents.noHeadings") }) }));
    }
    // Calculate indent based on heading level (relative to minimum level)
    const minLevel = Math.min(...headings.map((h) => h.level));
    return (_jsx(ScrollArea, { className: cn('h-full', className), children: _jsx("div", { className: "py-4 pr-4", children: _jsx("nav", { className: "space-y-0.5", children: headings.map((heading, index) => {
                    const indent = (heading.level - minLevel) * 12;
                    const isActive = index === activeHeadingIndex;
                    return (_jsx("button", { onClick: () => onHeadingClick(heading.line), className: cn('block w-full text-left text-[13px] py-1.5 px-3 rounded-md transition-colors', 'hover:bg-foreground/5', isActive
                            ? 'text-foreground font-medium bg-foreground/5'
                            : 'text-muted-foreground'), style: { paddingLeft: `${12 + indent}px` }, children: _jsx("span", { className: "line-clamp-2", children: heading.text }) }, `${heading.line}-${heading.text}`));
                }) }) }) }));
}
//# sourceMappingURL=TableOfContents.js.map