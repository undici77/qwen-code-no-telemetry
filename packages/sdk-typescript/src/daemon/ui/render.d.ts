/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * PR-D — Render contract.
 *
 * Three helpers that project a `DaemonTranscriptBlock` (or a single
 * `DaemonToolPreview`) into a renderable string:
 *
 * - `daemonBlockToMarkdown` — GFM-compatible markdown for web / docs
 * - `daemonBlockToHtml` — sanitized HTML for SSR / webview surfaces
 * - `daemonBlockToPlainText` — plain text for copy-paste / logs
 * - `daemonToolPreviewToMarkdown` — preview-to-markdown helper used by all
 *   higher-level renderers (consumers can compose freely)
 *
 * The render contract is the missing piece behind "any adapter (TUI / web
 * / IDE / channel) renders the same transcript identically." TUI uses
 * `terminal.ts`'s ANSI projection; this module is the equivalent for the
 * other surfaces.
 */
import type { DaemonToolPreview, DaemonTranscriptBlock } from './types.js';
export interface DaemonRenderOptions {
    /**
     * When true, image / file URLs are stripped of authentication tokens
     * before rendering. Default: false (caller responsibility).
     */
    sanitizeUrls?: boolean;
    /**
     * Locale for date formatting in any embedded timestamps. Default:
     * runtime default.
     */
    locale?: string;
    /**
     * Max length of any single rendered text field. Strings longer than this
     * are truncated with an ellipsis. Default: 8192. Set to `Infinity` to
     * disable.
     */
    maxFieldLength?: number;
}
/**
 * Render a single transcript block as GFM-compatible markdown.
 *
 * Producers should call this per block and join with `\n\n` between blocks
 * to produce a full transcript document.
 */
export declare function daemonBlockToMarkdown(block: DaemonTranscriptBlock, opts?: DaemonRenderOptions): string;
/**
 * Project a `DaemonToolPreview` into markdown. Each kind gets a dedicated
 * shape — diffs become fenced unified-diff blocks, file reads become
 * `path:line-range` lines, etc.
 */
export declare function daemonToolPreviewToMarkdown(preview: DaemonToolPreview, opts?: DaemonRenderOptions): string;
/**
 * Render a transcript block as plain text (no markdown formatting, no
 * ANSI). Use for copy-paste, log lines, accessibility-friendly output.
 */
export declare function daemonBlockToPlainText(block: DaemonTranscriptBlock, opts?: DaemonRenderOptions): string;
export interface DaemonHtmlRenderOptions extends DaemonRenderOptions {
    /**
     * Custom HTML sanitizer. If omitted, the default escapes `<`, `>`, `&`,
     * `'`, `"` and rejects `javascript:` URLs. Consumers wanting markdown→
     * HTML should pre-render via `daemonBlockToMarkdown` and pass a real
     * markdown→HTML pipeline (e.g., markdown-it + DOMPurify).
     */
    sanitizer?: (raw: string) => string;
}
/**
 * Render a transcript block as conservatively escaped HTML. The default
 * implementation does NOT parse markdown — it only escapes special chars
 * and wraps content in semantic tags. For markdown→HTML, use
 * `daemonBlockToMarkdown` + a markdown pipeline of your choice.
 *
 * Renderers that want richer HTML (collapsible code blocks, syntax
 * highlighting, image rendering) should layer those on top — this is the
 * safe baseline shared across SSR / webview / dashboard surfaces.
 */
export declare function daemonBlockToHtml(block: DaemonTranscriptBlock, opts?: DaemonHtmlRenderOptions): string;
