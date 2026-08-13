import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import ReactMarkdown, {} from 'react-markdown';
import { useTranslation } from 'react-i18next';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { cn } from '../../lib/utils';
import { CodeBlock, InlineCode } from './CodeBlock';
import { MarkdownDiffBlock } from './MarkdownDiffBlock';
import { MarkdownJsonBlock } from './MarkdownJsonBlock';
import { MarkdownMermaidBlock } from './MarkdownMermaidBlock';
import { MarkdownDatatableBlock } from './MarkdownDatatableBlock';
import { MarkdownSpreadsheetBlock } from './MarkdownSpreadsheetBlock';
import { MarkdownHtmlBlock } from './MarkdownHtmlBlock';
import { MarkdownImageBlock } from './MarkdownImageBlock';
import { MarkdownLatexBlock } from './MarkdownLatexBlock';
import { MarkdownPdfBlock } from './MarkdownPdfBlock';
import { preprocessLinks } from './linkify';
import { resolveMarkdownLinkTarget } from './link-target';
import remarkCollapsibleSections from './remarkCollapsibleSections';
import { CollapsibleSection } from './CollapsibleSection';
import { useCollapsibleMarkdown } from './CollapsibleMarkdownContext';
import { usePlatform } from '../../context/PlatformContext';
import { wrapWithSafeProxy } from './safe-components';
import { MARKDOWN_MATH_OPTIONS } from './math-options';
/**
 * Create custom components based on render mode.
 *
 * @param firstMermaidCodeRef - Ref holding the code of the first mermaid block
 *   when the markdown message starts with a mermaid fence. Used to hide the
 *   inline expand button on that block (TurnCard's own fullscreen button
 *   occupies the same top-right position). A ref is used so the closure can
 *   read the latest value without adding content to the memo deps — that would
 *   cause component re-mounting on every streaming update.
 * @param hideFirstMermaidExpand - Whether to hide the expand button on the first
 *   mermaid block when the message starts with a mermaid fence. Defaults to true.
 */
function stableHash(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}
function getFallbackLinkText(children) {
    return React.Children.toArray(children)
        .map((child) => (typeof child === 'string' ? child : ''))
        .join('')
        .trim();
}
function MarkdownLink({ href, children, onUrlClick, onFileClick, }) {
    const { t } = useTranslation();
    const { onOpenUrlExternal } = usePlatform();
    const hasClickHandler = !!onUrlClick || !!onFileClick;
    const [menu, setMenu] = React.useState(null);
    const resolveTarget = React.useCallback(() => {
        const target = href?.trim() || getFallbackLinkText(children);
        if (!target)
            return null;
        return resolveMarkdownLinkTarget(target);
    }, [href, children]);
    const openResolvedTarget = React.useCallback((preferExternal = false) => {
        const resolvedTarget = resolveTarget();
        if (!resolvedTarget)
            return;
        if (resolvedTarget.kind === 'file') {
            onFileClick?.(resolvedTarget.path);
            return;
        }
        if (preferExternal && onOpenUrlExternal) {
            onOpenUrlExternal(resolvedTarget.url);
            return;
        }
        onUrlClick?.(resolvedTarget.url);
    }, [onFileClick, onOpenUrlExternal, onUrlClick, resolveTarget]);
    React.useEffect(() => {
        if (!menu)
            return;
        const close = () => setMenu(null);
        const handleKeyDown = (event) => {
            if (event.key === 'Escape')
                close();
        };
        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', close);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', close);
        };
    }, [menu]);
    const handleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        openResolvedTarget(false);
    };
    const handleContextMenu = (event) => {
        const resolvedTarget = resolveTarget();
        if (resolvedTarget?.kind !== 'url' || !onUrlClick || !onOpenUrlExternal) {
            return;
        }
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
    };
    const openBuiltIn = () => {
        setMenu(null);
        openResolvedTarget(false);
    };
    const openExternal = () => {
        setMenu(null);
        openResolvedTarget(true);
    };
    return (_jsxs(_Fragment, { children: [_jsx("a", { href: hasClickHandler ? undefined : href, onClick: handleClick, onContextMenu: handleContextMenu, onKeyDown: (event) => {
                    if (!hasClickHandler)
                        return;
                    if (event.key !== 'Enter' && event.key !== ' ')
                        return;
                    event.preventDefault();
                    openResolvedTarget(false);
                }, role: hasClickHandler ? 'link' : undefined, tabIndex: hasClickHandler ? 0 : undefined, className: "text-accent hover:underline cursor-pointer", children: children }), menu && (_jsxs("div", { role: "menu", className: cn('fixed min-w-48 rounded-[8px] bg-background p-1 text-xs', 'text-foreground shadow-minimal'), style: {
                    left: menu.x,
                    top: menu.y,
                    zIndex: 'var(--z-dropdown)',
                }, onPointerDown: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", className: cn('flex w-full items-center rounded-[4px] px-2 py-1.5', 'text-left hover:bg-foreground/[0.03]'), onClick: openBuiltIn, children: t('link.openInBuiltInBrowser') }), _jsx("button", { type: "button", role: "menuitem", className: cn('flex w-full items-center rounded-[4px] px-2 py-1.5', 'text-left hover:bg-foreground/[0.03]'), onClick: openExternal, children: t('link.openInDefaultBrowser') })] }))] }));
}
function createComponents(mode, onUrlClick, onFileClick, collapsibleContext, firstMermaidCodeRef, hideFirstMermaidExpand = true) {
    let blockIndex = 0;
    const wrapBlock = (blockType, content, child, nodePosition) => {
        blockIndex += 1;
        const startLine = nodePosition?.start?.line;
        const endLine = nodePosition?.end?.line;
        const path = startLine && endLine
            ? `line:${startLine}-${endLine}`
            : `idx:${blockIndex}`;
        const blockId = `blk-${stableHash(`${blockType}|${path}|${content.slice(0, 240)}`)}`;
        return (_jsx("div", { "data-ca-block-type": blockType, "data-ca-block-path": path, "data-ca-block-id": blockId, children: child }));
    };
    const baseComponents = {
        // Section wrapper for collapsible headings
        div: ({ node, children, ...props }) => {
            const sectionId = props['data-section-id'];
            const headingLevel = props['data-heading-level'];
            // If this is a collapsible section div and we have context
            if (sectionId && headingLevel && collapsibleContext) {
                return (_jsx(CollapsibleSection, { sectionId: sectionId, headingLevel: headingLevel, isCollapsed: collapsibleContext.collapsedSections.has(sectionId), onToggle: collapsibleContext.toggleSection, children: children }));
            }
            // Regular div
            return _jsx("div", { ...props, children: children });
        },
        // Links: Make clickable with callbacks
        a: ({ href, children }) => {
            return (_jsx(MarkdownLink, { href: href, onUrlClick: onUrlClick, onFileClick: onFileClick, children: children }));
        },
    };
    // Terminal mode: minimal formatting
    if (mode === 'terminal') {
        return {
            ...baseComponents,
            // No special code handling - just monospace
            code: ({ children }) => (_jsx("code", { className: "font-mono", children: children })),
            pre: ({ children }) => (_jsx("pre", { className: "font-mono whitespace-pre-wrap my-2", children: children })),
            // Minimal paragraph spacing
            p: ({ children }) => _jsx("p", { className: "my-1", children: children }),
            // Simple lists
            ul: ({ children }) => _jsx("ul", { className: "list-disc list-inside my-1", children: children }),
            ol: ({ children }) => _jsx("ol", { className: "list-decimal list-inside my-1", children: children }),
            li: ({ children }) => _jsx("li", { className: "my-0.5", children: children }),
            // Plain tables
            table: ({ children }) => (_jsx("table", { className: "my-2 font-mono text-sm", children: children })),
            th: ({ children }) => _jsx("th", { className: "text-left pr-4", children: children }),
            td: ({ children }) => _jsx("td", { className: "pr-4", children: children }),
        };
    }
    // Minimal mode: clean with syntax highlighting
    if (mode === 'minimal') {
        return {
            ...baseComponents,
            // Inline code
            code: ({ className, children, ...props }) => {
                const match = /language-([\w-]+)/.exec(className || '');
                const isBlock = 'node' in props && props.node?.position?.start.line !== props.node?.position?.end.line;
                // Block code
                if (match || isBlock) {
                    const code = String(children).replace(/\n$/, '');
                    // Diff code blocks → pierre/diffs for a proper diff viewer
                    if (match?.[1] === 'diff') {
                        return wrapBlock('code', code, _jsx(MarkdownDiffBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // JSON code blocks → interactive tree viewer
                    if (match?.[1] === 'json') {
                        return wrapBlock('code', code, _jsx(MarkdownJsonBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // Datatable code blocks → sortable/filterable data table
                    if (match?.[1] === 'datatable') {
                        return wrapBlock('datatable', code, _jsx(MarkdownDatatableBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // Spreadsheet code blocks → Excel-style grid
                    if (match?.[1] === 'spreadsheet') {
                        return wrapBlock('spreadsheet', code, _jsx(MarkdownSpreadsheetBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // HTML preview blocks → sandboxed iframe
                    if (match?.[1] === 'html-preview') {
                        return wrapBlock('html-preview', code, _jsx(MarkdownHtmlBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // PDF preview blocks → inline first page with expand to full viewer
                    if (match?.[1] === 'pdf-preview') {
                        return wrapBlock('pdf-preview', code, _jsx(MarkdownPdfBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // Image preview blocks → inline image with expand to full viewer
                    if (match?.[1] === 'image-preview') {
                        return wrapBlock('image-preview', code, _jsx(MarkdownImageBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // LaTeX/math code blocks → KaTeX rendered display math
                    if (match?.[1] === 'latex' || match?.[1] === 'math') {
                        return wrapBlock('latex', code, _jsx(MarkdownLatexBlock, { code: code, className: "my-2" }), props.node?.position);
                    }
                    // Mermaid code blocks → zinc-styled SVG diagram.
                    // Hide the inline expand button when the mermaid block is the first
                    // content in the message — TurnCard's own fullscreen button occupies
                    // the same top-right spot. Detection uses firstMermaidCodeRef (content
                    // match) rather than AST line positions which are unreliable after
                    // preprocessLinks transforms the markdown.
                    if (match?.[1] === 'mermaid') {
                        const isFirstBlock = hideFirstMermaidExpand &&
                            firstMermaidCodeRef?.current != null &&
                            code === firstMermaidCodeRef.current;
                        return wrapBlock('mermaid', code, _jsx(MarkdownMermaidBlock, { code: code, className: "my-2", showExpandButton: !isFirstBlock }), props.node?.position);
                    }
                    return wrapBlock('code', code, _jsx(CodeBlock, { code: code, language: match?.[1], mode: "full", className: "my-2" }), props.node?.position);
                }
                // Inline code
                return _jsx(InlineCode, { children: children });
            },
            pre: ({ children }) => _jsx(_Fragment, { children: children }),
            // Comfortable paragraph spacing
            p: ({ children }) => _jsx("p", { className: "my-2 leading-relaxed", children: children }),
            // Styled lists - ul uses tighter spacing, ol uses standard for number alignment
            ul: ({ children, className }) => (_jsx("ul", { className: cn('my-2 space-y-1 ps-[16px] pe-2 list-disc marker:text-[var(--md-bullets)]', className?.includes('contains-task-list') && 'list-none ps-0 marker:content-none'), children: children })),
            ol: ({ children, className }) => (_jsx("ol", { className: cn('my-2 space-y-1 pl-6 list-decimal', className), children: children })),
            li: ({ children, className }) => (_jsx("li", { className: cn(className?.includes('task-list-item') && 'list-none'), children: children })),
            input: ({ type, checked }) => {
                if (type === 'checkbox') {
                    return (_jsx("input", { type: "checkbox", checked: checked, readOnly: true, className: "mr-2 rounded border-muted-foreground align-middle" }));
                }
                return _jsx("input", { type: type });
            },
            // Clean tables
            table: ({ children }) => (_jsx("div", { className: "my-3 overflow-x-auto", children: _jsx("table", { className: "min-w-full text-sm", children: children }) })),
            thead: ({ children }) => _jsx("thead", { className: "border-b", children: children }),
            th: ({ children }) => (_jsx("th", { className: "text-left py-2 px-3 font-semibold text-muted-foreground", children: children })),
            td: ({ children }) => (_jsx("td", { className: "py-2 px-3 border-b border-border/50", children: children })),
            // Headings - H1/H2 same size, differentiated by weight
            h1: ({ children }) => _jsx("h1", { className: "font-sans text-[16px] font-bold mt-5 mb-3", children: children }),
            h2: ({ children }) => _jsx("h2", { className: "font-sans text-[16px] font-semibold mt-4 mb-3", children: children }),
            h3: ({ children }) => _jsx("h3", { className: "font-sans text-[15px] font-semibold mt-4 mb-2", children: children }),
            // Blockquotes
            blockquote: ({ children }) => (_jsx("blockquote", { className: "border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground italic", children: children })),
            // Horizontal rules
            hr: () => _jsx("hr", { className: "my-4 border-border" }),
            // Strong/emphasis
            strong: ({ children }) => _jsx("strong", { className: "font-semibold", children: children }),
            em: ({ children }) => _jsx("em", { className: "italic", children: children }),
        };
    }
    // Full mode: rich styling
    return {
        ...baseComponents,
        // Full code blocks with copy button
        code: ({ className, children, ...props }) => {
            const match = /language-([\w-]+)/.exec(className || '');
            const isBlock = 'node' in props && props.node?.position?.start.line !== props.node?.position?.end.line;
            if (match || isBlock) {
                const code = String(children).replace(/\n$/, '');
                // Diff code blocks → pierre/diffs for a proper diff viewer
                if (match?.[1] === 'diff') {
                    return wrapBlock('code', code, _jsx(MarkdownDiffBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // JSON code blocks → interactive tree viewer
                if (match?.[1] === 'json') {
                    return wrapBlock('code', code, _jsx(MarkdownJsonBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // Datatable code blocks → sortable/filterable data table
                if (match?.[1] === 'datatable') {
                    return wrapBlock('datatable', code, _jsx(MarkdownDatatableBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // Spreadsheet code blocks → Excel-style grid
                if (match?.[1] === 'spreadsheet') {
                    return wrapBlock('spreadsheet', code, _jsx(MarkdownSpreadsheetBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // HTML preview blocks → sandboxed iframe
                if (match?.[1] === 'html-preview') {
                    return wrapBlock('html-preview', code, _jsx(MarkdownHtmlBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // PDF preview blocks → inline first page with expand to full viewer
                if (match?.[1] === 'pdf-preview') {
                    return wrapBlock('pdf-preview', code, _jsx(MarkdownPdfBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // Image preview blocks → inline image with expand to full viewer
                if (match?.[1] === 'image-preview') {
                    return wrapBlock('image-preview', code, _jsx(MarkdownImageBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // LaTeX/math code blocks → KaTeX rendered display math
                if (match?.[1] === 'latex' || match?.[1] === 'math') {
                    return wrapBlock('latex', code, _jsx(MarkdownLatexBlock, { code: code, className: "my-2" }), props.node?.position);
                }
                // Mermaid code blocks → zinc-styled SVG diagram.
                // (Same first-block detection as minimal mode — see comment above.)
                if (match?.[1] === 'mermaid') {
                    const isFirstBlock = hideFirstMermaidExpand &&
                        firstMermaidCodeRef?.current != null &&
                        code === firstMermaidCodeRef.current;
                    return wrapBlock('mermaid', code, _jsx(MarkdownMermaidBlock, { code: code, className: "my-2", showExpandButton: !isFirstBlock }), props.node?.position);
                }
                return wrapBlock('code', code, _jsx(CodeBlock, { code: code, language: match?.[1], mode: "full", className: "my-2" }), props.node?.position);
            }
            return _jsx(InlineCode, { children: children });
        },
        pre: ({ children }) => _jsx(_Fragment, { children: children }),
        // Rich paragraph spacing
        p: ({ children }) => _jsx("p", { className: "my-3 leading-relaxed", children: children }),
        // Styled lists - ul uses tighter spacing, ol uses standard for number alignment
        ul: ({ children, className }) => (_jsx("ul", { className: cn('my-3 space-y-1.5 ps-[16px] pe-2 list-disc marker:text-[var(--md-bullets)]', className?.includes('contains-task-list') && 'list-none ps-0 marker:content-none'), children: children })),
        ol: ({ children, className }) => (_jsx("ol", { className: cn('my-3 space-y-1.5 pl-6 list-decimal', className), children: children })),
        li: ({ children, className }) => (_jsx("li", { className: cn('leading-relaxed', className?.includes('task-list-item') && 'list-none'), children: children })),
        // Beautiful tables
        table: ({ children }) => (_jsx("div", { className: "my-4 overflow-x-auto rounded-md border", children: _jsx("table", { className: "min-w-full divide-y divide-border", children: children }) })),
        thead: ({ children }) => _jsx("thead", { className: "bg-muted/50", children: children }),
        tbody: ({ children }) => _jsx("tbody", { className: "divide-y divide-border", children: children }),
        th: ({ children }) => (_jsx("th", { className: "text-left py-3 px-4 font-semibold text-sm", children: children })),
        td: ({ children }) => (_jsx("td", { className: "py-3 px-4 text-sm", children: children })),
        tr: ({ children }) => (_jsx("tr", { className: "hover:bg-muted/30 transition-colors", children: children })),
        // Rich headings - H1/H2 same size, differentiated by weight
        h1: ({ children }) => (_jsx("h1", { className: "font-sans text-[16px] font-bold mt-7 mb-4", children: children })),
        h2: ({ children }) => (_jsx("h2", { className: "font-sans text-[16px] font-semibold mt-6 mb-3", children: children })),
        h3: ({ children }) => (_jsx("h3", { className: "font-sans text-[15px] font-semibold mt-5 mb-3", children: children })),
        h4: ({ children }) => (_jsx("h4", { className: "text-[14px] font-semibold mt-3 mb-1", children: children })),
        // Styled blockquotes
        blockquote: ({ children }) => (_jsx("blockquote", { className: "border-l-4 border-foreground/30 bg-muted/30 pl-4 pr-3 py-2 my-3 rounded-r-md", children: children })),
        // Task lists (GFM)
        input: ({ type, checked }) => {
            if (type === 'checkbox') {
                return (_jsx("input", { type: "checkbox", checked: checked, readOnly: true, className: "mr-2 rounded border-muted-foreground" }));
            }
            return _jsx("input", { type: type });
        },
        // Horizontal rules
        hr: () => _jsx("hr", { className: "my-6 border-border" }),
        // Strong/emphasis
        strong: ({ children }) => _jsx("strong", { className: "font-semibold", children: children }),
        em: ({ children }) => _jsx("em", { className: "italic", children: children }),
        del: ({ children }) => _jsx("del", { className: "line-through text-muted-foreground", children: children }),
        // Handle unknown <markdown> tags that may come through rehype-raw
        // Type assertion needed because 'markdown' is not a standard HTML element
        markdown: ({ children }) => _jsx(_Fragment, { children: children }),
    };
}
/**
 * Markdown - Customizable markdown renderer with multiple render modes
 *
 * Features:
 * - Three render modes: terminal, minimal, full
 * - Syntax highlighting via Shiki
 * - GFM support (tables, task lists, strikethrough)
 * - Clickable links and file paths
 * - Memoization for streaming performance
 */
export function Markdown({ children, mode = 'minimal', className, id, onUrlClick, onFileClick, collapsible = false, hideFirstMermaidExpand = true, }) {
    // Get collapsible context if enabled
    const collapsibleContext = useCollapsibleMarkdown();
    // Extract the first mermaid code block's content when the message starts
    // with a mermaid fence. Stored in a ref so createComponents can read it
    // without adding `children` to the memo deps (which would remount all
    // components on every streaming update, breaking internal state).
    const firstMermaidCodeRef = React.useRef(null);
    const trimmed = children.trimStart();
    if (trimmed.startsWith('```mermaid')) {
        const m = trimmed.match(/^```mermaid\n([\s\S]*?)```/);
        firstMermaidCodeRef.current = m?.[1] ? m[1].replace(/\n$/, '') : null;
    }
    else {
        firstMermaidCodeRef.current = null;
    }
    const components = React.useMemo(() => wrapWithSafeProxy(createComponents(mode, onUrlClick, onFileClick, collapsible ? collapsibleContext : null, firstMermaidCodeRef, hideFirstMermaidExpand)), [mode, onUrlClick, onFileClick, collapsible, collapsibleContext, hideFirstMermaidExpand]);
    // Preprocess to convert raw URLs and file paths to markdown links
    const processedContent = React.useMemo(() => preprocessLinks(children), [children]);
    // Conditionally include the collapsible sections plugin.
    // IMPORTANT: Disable single-dollar inline math so currency like $2M–$4M
    // stays plain text. Math should use $$...$$ delimiters.
    const remarkPlugins = React.useMemo(() => {
        const mathPlugin = [
            remarkMath,
            MARKDOWN_MATH_OPTIONS
        ];
        return collapsible
            ? [remarkGfm, mathPlugin, remarkCollapsibleSections]
            : [remarkGfm, mathPlugin];
    }, [collapsible]);
    return (_jsx("div", { className: cn('markdown-content', className), children: _jsx(ReactMarkdown, { remarkPlugins: remarkPlugins, rehypePlugins: [rehypeKatex, rehypeRaw], components: components, children: processedContent }) }));
}
/**
 * MemoizedMarkdown - Optimized for streaming scenarios
 *
 * Splits content into blocks and memoizes each block separately,
 * so only new/changed blocks re-render during streaming.
 */
export const MemoizedMarkdown = React.memo(Markdown, (prevProps, nextProps) => {
    // If id is provided, use it for memoization
    if (prevProps.id && nextProps.id) {
        return (prevProps.id === nextProps.id &&
            prevProps.children === nextProps.children &&
            prevProps.mode === nextProps.mode);
    }
    // Otherwise compare content and mode
    return (prevProps.children === nextProps.children &&
        prevProps.mode === nextProps.mode);
});
MemoizedMarkdown.displayName = 'MemoizedMarkdown';
// Re-export for convenience
export { CodeBlock, InlineCode } from './CodeBlock';
export { CollapsibleMarkdownProvider } from './CollapsibleMarkdownContext';
//# sourceMappingURL=Markdown.js.map