/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function toDaemonPromptContent(text, images = []) {
    const prompt = [{ type: 'text', text }];
    for (const image of images) {
        const mimeType = image.mimeType ?? image.mediaType ?? image.media_type;
        // Omit 'image/*' (unknown type) to preserve legacy behavior where
        // untyped images are sent without mimeType to the daemon.
        if (mimeType && mimeType !== 'image/*') {
            prompt.push({
                type: 'image',
                data: image.data,
                mimeType,
            });
        }
        else {
            prompt.push({
                type: 'image',
                data: image.data,
            });
        }
    }
    return prompt;
}
//# sourceMappingURL=promptContent.js.map