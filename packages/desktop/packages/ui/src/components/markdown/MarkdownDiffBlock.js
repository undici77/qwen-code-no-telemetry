import { jsx as _jsx } from "react/jsx-runtime";
/**
 * MarkdownDiffBlock - Renders diff code blocks using @pierre/diffs
 *
 * When the markdown viewer encounters a ```diff code block, this component
 * renders it with the same pierre/diffs setup (PatchDiff) and styling used
 * in the full-screen diff overlay (ShikiDiffViewer), instead of plain
 * Shiki syntax highlighting.
 *
 * Handles common diff code block formats:
 * 1. Proper unified diffs (with --- / +++ / @@ headers) — passed directly
 * 2. Numbered hunks without file headers — synthetic file headers are prepended
 * 3. Bare diff content or bare @@ markers — synthetic headers are prepended
 *
 * Falls back to the regular CodeBlock if PatchDiff rendering fails.
 */
import * as React from 'react';
import { PatchDiff } from '@pierre/diffs/react';
import { DIFFS_TAG_NAME } from '@pierre/diffs';
import { cn } from '../../lib/utils';
import { CodeBlock } from './CodeBlock';
import { ensureUnifiedDiffFormat } from './diff-normalize';
import { registerCraftShikiThemes } from '../code-viewer/registerShikiThemes';
// ── Custom element + theme registration (same as ShikiDiffViewer) ──────────
// Idempotent: safe to run even if ShikiDiffViewer already registered these.
if (typeof HTMLElement !== 'undefined' && !customElements.get(DIFFS_TAG_NAME)) {
    class FileDiffContainer extends HTMLElement {
        constructor() {
            super();
            if (this.shadowRoot != null)
                return;
            this.attachShadow({ mode: 'open' });
        }
    }
    customElements.define(DIFFS_TAG_NAME, FileDiffContainer);
}
// Register custom themes once per runtime.
registerCraftShikiThemes();
// ── Helpers ────────────────────────────────────────────────────────────────
/**
 * Detect whether we're in dark mode by checking the DOM class list.
 * Mirrors the fallback logic in CodeBlock.
 */
function isDarkMode() {
    if (typeof document === 'undefined')
        return false;
    return document.documentElement.classList.contains('dark');
}
/**
 * Lightweight error boundary so a PatchDiff failure doesn't crash the whole
 * message — we fall back to the regular CodeBlock instead.
 */
class DiffErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.warn('[MarkdownDiffBlock] PatchDiff render failed, falling back to CodeBlock:', error);
    }
    render() {
        if (this.state.hasError)
            return this.props.fallback;
        return this.props.children;
    }
}
export function MarkdownDiffBlock({ code, className }) {
    const dark = isDarkMode();
    const themeName = dark ? 'craft-dark' : 'craft-light';
    // Build the same options used in ShikiDiffViewer for visual consistency
    const options = React.useMemo(() => ({
        theme: themeName,
        diffStyle: 'unified',
        diffIndicators: 'bars',
        disableBackground: false,
        lineDiffType: 'word',
        overflow: 'scroll',
        disableFileHeader: true,
        themeType: dark ? 'dark' : 'light',
    }), [themeName, dark]);
    const patch = React.useMemo(() => ensureUnifiedDiffFormat(code), [code]);
    const fallback = _jsx(CodeBlock, { code: code, language: "diff", mode: "full", className: className });
    return (_jsx(DiffErrorBoundary, { fallback: fallback, children: _jsx("div", { className: cn('relative rounded-[8px] overflow-hidden border bg-muted/30', className), style: {
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                lineHeight: 1.6,
            }, children: _jsx(PatchDiff, { patch: patch, options: options }) }) }));
}
//# sourceMappingURL=MarkdownDiffBlock.js.map