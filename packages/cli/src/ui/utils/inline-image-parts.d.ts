/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part } from '@google/genai';
import type { InlineImageData } from '../types.js';
export declare const MAX_INLINE_IMAGES_PER_ITEM = 4;
export declare const MAX_INLINE_IMAGE_ENCODED_LENGTH: number;
export type InlineContentRun = {
    kind: 'text';
    text: string;
} | {
    kind: 'image';
    image: InlineImageData;
} | {
    kind: 'omitted_images';
    count: number;
};
export interface InlineImageCollection {
    images: InlineImageData[];
    omittedImageCount: number;
}
export declare function formatInlineImageOverflow(count: number): string;
export declare function getInlineImageData(part: Part): InlineImageData | null;
export declare function collectInlineImages(parts: Part[] | undefined): InlineImageCollection;
export declare function extractInlineContentRuns(parts: Part[] | undefined, textSeparator?: string): InlineContentRun[];
