import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { codeToHtml, bundledLanguages } from 'shiki';
import { cn } from '../../lib/utils';
import { useShikiTheme } from '../../context/ShikiThemeContext';
// Languages to pre-load (most common in chat contexts)
const PRELOADED_LANGUAGES = [
    'javascript', 'typescript', 'python', 'json', 'bash', 'shell',
    'markdown', 'html', 'css', 'sql', 'yaml', 'go', 'rust', 'java',
    'c', 'cpp', 'tsx', 'jsx', 'swift', 'kotlin', 'ruby', 'php'
];
// Map common aliases to Shiki language names
const LANGUAGE_ALIASES = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'rb': 'ruby',
    'rs': 'rust',
    'kt': 'kotlin',
    'objective-c': 'objc',
    'objc': 'objc',
};
// Simple LRU cache for highlighted code
const highlightCache = new Map();
const CACHE_MAX_SIZE = 200;
function getCacheKey(code, lang, theme) {
    return `${theme}:${lang}:${code}`;
}
function isValidLanguage(lang) {
    const normalized = LANGUAGE_ALIASES[lang] || lang;
    return normalized in bundledLanguages;
}
/**
 * CodeBlock - Syntax highlighted code block using Shiki
 *
 * Uses VS Code's syntax highlighting engine for accurate highlighting.
 * Lazy-loads highlighting and caches results for performance.
 */
export function CodeBlock({ code, language = 'text', className, mode = 'full', forcedTheme }) {
    const [highlighted, setHighlighted] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [copied, setCopied] = React.useState(false);
    // Get shiki theme from context (set by ShikiThemeProvider in the app).
    // This correctly handles edge cases like dark-only themes in light system mode.
    const contextShikiTheme = useShikiTheme();
    // Resolve language alias - keep as string to allow 'text' fallback
    const langLower = language.toLowerCase();
    const resolvedLang = LANGUAGE_ALIASES[langLower] || langLower;
    React.useEffect(() => {
        let cancelled = false;
        async function highlight() {
            // Theme priority:
            // 1. Context theme (from ShikiThemeProvider) - handles supportedModes correctly
            // 2. forcedTheme prop - explicit override for specific use cases
            // 3. DOM detection fallback - backwards compatible default
            let theme;
            if (contextShikiTheme) {
                theme = contextShikiTheme;
            }
            else if (forcedTheme) {
                theme = forcedTheme === 'dark' ? 'github-dark' : 'github-light';
            }
            else {
                const isDark = document.documentElement.classList.contains('dark');
                theme = isDark ? 'github-dark' : 'github-light';
            }
            const cacheKey = getCacheKey(code, resolvedLang, theme);
            const cached = highlightCache.get(cacheKey);
            if (cached) {
                if (!cancelled) {
                    setHighlighted(cached);
                    setIsLoading(false);
                }
                return;
            }
            try {
                // Use valid language or fallback to plaintext
                const lang = isValidLanguage(resolvedLang) ? resolvedLang : 'text';
                const html = await codeToHtml(code, {
                    lang,
                    theme,
                });
                // Cache the result
                if (highlightCache.size >= CACHE_MAX_SIZE) {
                    const firstKey = highlightCache.keys().next().value;
                    if (firstKey)
                        highlightCache.delete(firstKey);
                }
                highlightCache.set(cacheKey, html);
                if (!cancelled) {
                    setHighlighted(html);
                    setIsLoading(false);
                }
            }
            catch (error) {
                // Fallback to plain text on error
                console.warn(`Shiki highlighting failed for language "${resolvedLang}":`, error);
                if (!cancelled) {
                    setHighlighted(null);
                    setIsLoading(false);
                }
            }
        }
        highlight();
        return () => {
            cancelled = true;
        };
    }, [code, resolvedLang, forcedTheme, contextShikiTheme]);
    const handleCopy = React.useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            console.error('Failed to copy code:', err);
        }
    }, [code]);
    // Terminal mode: raw monospace with minimal styling
    if (mode === 'terminal') {
        return (_jsx("pre", { className: cn('font-mono text-sm whitespace-pre-wrap', className), children: _jsx("code", { children: code }) }));
    }
    // Minimal mode: just syntax highlighting, no chrome
    if (mode === 'minimal') {
        if (isLoading || !highlighted) {
            return (_jsx("pre", { className: cn('font-mono text-sm whitespace-pre-wrap', className), children: _jsx("code", { children: code }) }));
        }
        return (_jsx("div", { className: cn('font-mono text-sm [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_code]:!bg-transparent', className), dangerouslySetInnerHTML: { __html: highlighted } }));
    }
    // Full mode: rich styling with header and copy button
    return (_jsxs("div", { className: cn('relative group rounded-[8px] overflow-hidden border bg-muted/30', className), children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b text-xs", children: [_jsx("span", { className: "text-muted-foreground font-medium uppercase tracking-wide", children: resolvedLang !== 'text' ? resolvedLang : 'plain text' }), _jsx("button", { onClick: handleCopy, className: "opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground", "aria-label": "Copy code", children: copied ? (_jsx("svg", { className: "w-4 h-4 text-success", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) })) : (_jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) })) })] }), _jsx("div", { className: "p-3 overflow-x-auto", children: isLoading || !highlighted ? (_jsx("pre", { className: "font-mono text-sm whitespace-pre-wrap break-all", children: _jsx("code", { children: code }) })) : (_jsx("div", { className: "font-mono text-sm [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_code]:!bg-transparent", dangerouslySetInnerHTML: { __html: highlighted } })) })] }));
}
/**
 * InlineCode - Styled inline code span
 * Features: subtle background (3%), no border, 75% opacity text
 */
export function InlineCode({ children, className }) {
    return (_jsx("code", { className: cn('pl-1 pr-1 py-0 rounded bg-foreground/[0.04] font-mono text-[13px]', className), children: children }));
}
//# sourceMappingURL=CodeBlock.js.map