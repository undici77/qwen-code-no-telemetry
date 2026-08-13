/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { MAX_TERMINAL_IMAGE_BYTES } from '@qwen-code/qwen-code-core';
export const MAX_INLINE_IMAGES_PER_ITEM = 4;
export const MAX_INLINE_IMAGE_ENCODED_LENGTH = Math.ceil((MAX_TERMINAL_IMAGE_BYTES * 4) / 3) + 4;
export function formatInlineImageOverflow(count) {
    return `[+${count} more ${count === 1 ? 'image' : 'images'}]`;
}
export function getInlineImageData(part) {
    const inlineData = part.inlineData;
    if (!inlineData?.mimeType?.trim().toLowerCase().startsWith('image/') ||
        typeof inlineData.data !== 'string' ||
        inlineData.data.length === 0 ||
        inlineData.data.length > MAX_INLINE_IMAGE_ENCODED_LENGTH) {
        return null;
    }
    return {
        data: inlineData.data,
        mimeType: inlineData.mimeType,
    };
}
export function collectInlineImages(parts) {
    if (!parts) {
        return { images: [], omittedImageCount: 0 };
    }
    const images = [];
    let omittedImageCount = 0;
    const collectImage = (part) => {
        const image = getInlineImageData(part);
        if (!image) {
            return;
        }
        if (images.length < MAX_INLINE_IMAGES_PER_ITEM) {
            images.push(image);
        }
        else {
            omittedImageCount++;
        }
    };
    for (const part of parts) {
        collectImage(part);
        for (const nested of part.functionResponse?.parts ?? []) {
            collectImage(nested);
        }
    }
    return { images, omittedImageCount };
}
export function extractInlineContentRuns(parts, textSeparator = '') {
    if (!parts) {
        return [];
    }
    const runs = [];
    let textParts = [];
    let displayedImageCount = 0;
    let overflowRun = null;
    const flushText = () => {
        if (textParts.length === 0)
            return;
        runs.push({ kind: 'text', text: textParts.join(textSeparator) });
        textParts = [];
    };
    for (const part of parts) {
        if (part.thought)
            continue;
        if (part.text) {
            textParts.push(part.text);
        }
        const image = getInlineImageData(part);
        if (image) {
            flushText();
            if (displayedImageCount < MAX_INLINE_IMAGES_PER_ITEM) {
                runs.push({ kind: 'image', image });
                displayedImageCount++;
            }
            else if (overflowRun) {
                overflowRun.count++;
            }
            else {
                overflowRun = { kind: 'omitted_images', count: 1 };
                runs.push(overflowRun);
            }
        }
    }
    flushText();
    return runs;
}
//# sourceMappingURL=inline-image-parts.js.map