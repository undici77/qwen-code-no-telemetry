import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ShikiCodeViewer - Read-only code viewer using Shiki syntax highlighting
 *
 * Platform-agnostic component for displaying code with:
 * - Line numbers
 * - Syntax highlighting via Shiki
 * - Light/dark theme support
 * - Scrollable with custom scrollbar styling
 */
import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { codeToHtml, bundledLanguages } from 'shiki';
import { cn } from '../../lib/utils';
import { LANGUAGE_MAP } from './language-map';
// Map common extensions to Shiki language names
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
function isValidLanguage(lang) {
    const normalized = LANGUAGE_ALIASES[lang] || lang;
    return normalized in bundledLanguages;
}
function getLanguageFromPath(filePath, explicit) {
    if (explicit)
        return explicit;
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    return LANGUAGE_MAP[ext] || 'text';
}
/**
 * ShikiCodeViewer - Syntax highlighted code viewer with line numbers
 */
export function ShikiCodeViewer({ code, language, filePath, startLine = 1, theme = 'light', shikiTheme, onReady, className, }) {
    const [highlighted, setHighlighted] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasCalledReady = useRef(false);
    // Resolve language from props or file path
    const resolvedLang = useMemo(() => {
        const lang = language || (filePath ? getLanguageFromPath(filePath) : 'text');
        const lowered = lang.toLowerCase();
        return LANGUAGE_ALIASES[lowered] || lowered;
    }, [language, filePath]);
    // Split code into lines for line numbers
    const lines = useMemo(() => code.split('\n'), [code]);
    // Highlight code with Shiki
    useEffect(() => {
        let cancelled = false;
        async function highlight() {
            // Use provided shikiTheme or fall back to github theme based on mode
            const resolvedShikiTheme = shikiTheme || (theme === 'dark' ? 'github-dark' : 'github-light');
            const lang = isValidLanguage(resolvedLang) ? resolvedLang : 'text';
            try {
                const html = await codeToHtml(code, {
                    lang,
                    theme: resolvedShikiTheme,
                });
                if (!cancelled) {
                    setHighlighted(html);
                    setIsLoading(false);
                    // Call onReady once
                    if (!hasCalledReady.current && onReady) {
                        hasCalledReady.current = true;
                        requestAnimationFrame(() => onReady());
                    }
                }
            }
            catch (error) {
                console.warn(`Shiki highlighting failed for language "${resolvedLang}":`, error);
                if (!cancelled) {
                    setHighlighted(null);
                    setIsLoading(false);
                    if (!hasCalledReady.current && onReady) {
                        hasCalledReady.current = true;
                        requestAnimationFrame(() => onReady());
                    }
                }
            }
        }
        highlight();
        return () => {
            cancelled = true;
        };
    }, [code, resolvedLang, theme, shikiTheme, onReady]);
    // Use CSS variables so custom themes are respected
    const backgroundColor = 'var(--background)';
    const lineNumberColor = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    return (_jsx("div", { className: cn('h-full w-full overflow-auto', className), style: { backgroundColor }, children: _jsxs("div", { className: "min-h-full flex", children: [_jsx("div", { className: "sticky left-0 shrink-0 select-none text-right pr-4 pt-4 pb-4", style: {
                        backgroundColor,
                        borderRight: `1px solid ${borderColor}`,
                        minWidth: '60px',
                    }, children: lines.map((_, index) => (_jsx("div", { className: "font-mono text-[13px] leading-[1.6] px-2", style: { color: lineNumberColor }, children: startLine + index }, index))) }), _jsx("div", { className: "flex-1 min-w-0 p-4 overflow-x-auto", children: isLoading || !highlighted ? (_jsx("pre", { className: "font-mono text-[13px] leading-[1.6] whitespace-pre", children: _jsx("code", { children: code }) })) : (_jsx("div", { className: cn('font-mono text-[13px] leading-[1.6]', '[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:whitespace-pre', '[&_code]:!bg-transparent'), style: { fontFamily: '"JetBrains Mono", monospace' }, dangerouslySetInnerHTML: { __html: highlighted } })) })] }) }));
}
//# sourceMappingURL=ShikiCodeViewer.js.map