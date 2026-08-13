import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import katex from 'katex';
import { cn } from '../../lib/utils';
/**
 * MarkdownLatexBlock - Renders fenced ```latex / ```math code blocks as display math.
 *
 * Uses KaTeX to render LaTeX source into styled HTML.
 * On parse errors, shows the raw source with an error message.
 */
export function MarkdownLatexBlock({ code, className }) {
    const html = React.useMemo(() => {
        try {
            return katex.renderToString(code.trim(), {
                displayMode: true,
                throwOnError: false,
                strict: false,
            });
        }
        catch {
            return null;
        }
    }, [code]);
    if (!html) {
        return (_jsx("pre", { className: cn('font-mono text-sm whitespace-pre-wrap text-destructive', className), children: _jsx("code", { children: code }) }));
    }
    return (_jsx("div", { className: cn('overflow-x-auto py-2', className), dangerouslySetInnerHTML: { __html: html } }));
}
//# sourceMappingURL=MarkdownLatexBlock.js.map