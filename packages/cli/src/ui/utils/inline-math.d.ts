/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const INLINE_MATH_MAX_CHARS = 1024;
export declare const INLINE_CODE_SPAN_PATTERN_SOURCE: string;
export interface InlineMathSpan {
    content: string;
    index: number;
    raw: string;
}
export type InlineToken = {
    kind: 'markup';
    match: RegExpMatchArray;
} | {
    kind: 'math';
    span: InlineMathSpan;
};
export declare function unescapeMarkdownDollars(text: string): string;
export declare function unescapeMarkdownBeforeMath(text: string): string;
export declare function findNextInlineMath(text: string, fromIndex?: number): InlineMathSpan | null;
export declare function mergeInlineMathMatches(text: string, markupRegex: RegExp, enableInlineMath?: boolean): Generator<InlineToken>;
export declare function findInlineMathExpressions(text: string): string[];
export declare function readInlineMathSpanAt(text: string, index: number): string | null;
