/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * When `index` sits inside an open fenced code block, returns that block's
 * language and gutter start line; otherwise null. Lets the streaming commit
 * loop tell a tall code block (safe to hard-split via splitFencedMarkdown) apart
 * from other tall blocks like tables/lists (which must stay whole), and from
 * whole-source blocks like mermaid (which must not be split mid-diagram).
 */
export declare const getEnclosingFenceInfo: (content: string, index: number) => {
    lang: string | null;
    startLine: number;
} | null;
export declare const findLastSafeSplitPoint: (content: string, idealMaxLength?: number) => number;
/**
 * Parses a fenced code block's info string into its language (first token, with
 * the internal start-line directive removed) and the gutter start line (1 when
 * no directive is present). Shared by MarkdownDisplay so the directive never
 * leaks into language detection.
 */
export declare const parseCodeFenceInfo: (info: string | undefined | null) => {
    lang: string | null;
    startLine: number;
};
/**
 * Splits `content` at `splitPoint` into a head (committed to <Static>) and a
 * tail (kept pending) for streaming render.
 *
 * `findLastSafeSplitPoint` prefers block boundaries, but with a length cap it
 * may deliberately hard-split INSIDE a fenced code block to bound an oversized
 * leading block (so the live pending frame stays within the viewport). A naive
 * substring split there breaks rendering: the head becomes an unterminated
 * fence and the tail, now missing its opening fence, renders as plain prose —
 * losing syntax highlighting and line numbers.
 *
 * This helper makes both halves valid standalone markdown: when the split lands
 * strictly inside a fence, it closes the fence at the end of the head and
 * re-opens an identical fence (same delimiter run and info string) at the start
 * of the tail. When the split is not inside a fence it is a plain substring
 * split, identical to the previous behavior.
 */
export declare const splitFencedMarkdown: (content: string, splitPoint: number) => {
    before: string;
    after: string;
};
