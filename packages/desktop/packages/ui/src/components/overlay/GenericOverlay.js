import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * GenericOverlay - Fallback overlay for unknown tool content
 *
 * Uses PreviewOverlay for presentation and CodeBlock for syntax highlighting.
 * Auto-detects language from content patterns or file path.
 * Supports optional diff mode for side-by-side comparison.
 */
import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCode } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { ContentFrame } from './ContentFrame';
import { CodeBlock } from '../markdown/CodeBlock';
/**
 * Auto-detect language from content patterns.
 * Checks for JSON, code blocks, then defaults to markdown.
 */
export function detectLanguage(content) {
    const trimmed = content.trim();
    // Check for JSON - starts with { or [ and looks like valid JSON structure
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return 'json';
    }
    // Check for code block markers at the start
    const codeBlockMatch = content.match(/^```(\w+)/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        return codeBlockMatch[1];
    }
    // Default to markdown for GenericOverlay content (commentary, thinking, etc.)
    return 'markdown';
}
/**
 * Detect language from file path extension.
 */
export function detectLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        mjs: 'javascript',
        cjs: 'javascript',
        py: 'python',
        json: 'json',
        md: 'markdown',
        css: 'css',
        scss: 'scss',
        less: 'less',
        html: 'html',
        htm: 'html',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yaml',
        sh: 'bash',
        bash: 'bash',
        zsh: 'bash',
        fish: 'bash',
        rs: 'rust',
        go: 'go',
        rb: 'ruby',
        php: 'php',
        java: 'java',
        kt: 'kotlin',
        swift: 'swift',
        c: 'c',
        cpp: 'cpp',
        h: 'c',
        hpp: 'cpp',
        cs: 'csharp',
        sql: 'sql',
        graphql: 'graphql',
        gql: 'graphql',
        toml: 'toml',
        ini: 'ini',
        dockerfile: 'dockerfile',
        makefile: 'makefile',
    };
    return langMap[ext || ''] || 'text';
}
export function GenericOverlay({ content, language, isOpen, onClose, title, theme, diffMode = false, originalContent = '', modifiedContent = '', embedded, error, }) {
    const { t } = useTranslation();
    const resolvedTitle = title ?? t('overlay.preview');
    // Auto-detect language if not provided
    const detectedLanguage = useMemo(() => {
        if (language)
            return language;
        // Try to detect from title (file path)
        if (resolvedTitle.includes('/') || resolvedTitle.includes('.')) {
            const pathLang = detectLanguageFromPath(resolvedTitle);
            if (pathLang !== 'text')
                return pathLang;
        }
        return detectLanguage(diffMode ? modifiedContent : content);
    }, [language, resolvedTitle, diffMode, modifiedContent, content]);
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: FileCode,
            label: detectedLanguage,
            variant: 'gray',
        }, title: resolvedTitle, embedded: embedded, error: error ? { label: 'Tool Failed', message: error } : undefined, className: "bg-foreground-3", children: _jsx(ContentFrame, { title: t('overlay.preview'), children: _jsx("div", { className: "flex-1 overflow-y-auto min-h-0", children: diffMode ? (
                // Side-by-side diff view
                _jsxs("div", { className: "flex gap-4 h-full p-4", children: [_jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx("div", { className: "text-xs text-muted-foreground mb-2 font-medium", children: "Original" }), _jsx("div", { className: "flex-1 overflow-auto p-4", children: _jsx(CodeBlock, { code: originalContent, language: detectedLanguage, mode: "minimal", forcedTheme: theme }) })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx("div", { className: "text-xs text-muted-foreground mb-2 font-medium", children: "Modified" }), _jsx("div", { className: "flex-1 overflow-auto p-4", children: _jsx(CodeBlock, { code: modifiedContent, language: detectedLanguage, mode: "minimal", forcedTheme: theme }) })] })] })) : (
                // Single content view
                _jsx("div", { className: "p-4", children: _jsx(CodeBlock, { code: content, language: detectedLanguage, mode: "minimal", forcedTheme: theme }) })) }) }) }));
}
//# sourceMappingURL=GenericOverlay.js.map