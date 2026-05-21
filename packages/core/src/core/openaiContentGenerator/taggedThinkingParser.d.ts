/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part } from '@google/genai';
export declare class TaggedThinkingParser {
    private mode;
    private buffer;
    parse(chunk: string, final?: boolean): Part[];
}
export declare function parseTaggedThinkingText(text: string): Part[];
