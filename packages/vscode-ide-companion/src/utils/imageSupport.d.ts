/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ImageAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string;
    timestamp: number;
}
export interface SavedImageAttachment {
    path: string;
    name: string;
    mimeType: string;
}
export declare const MAX_IMAGE_SIZE: number;
export declare const MAX_TOTAL_IMAGE_SIZE: number;
export declare const SHELL_SPECIAL_CHARS: RegExp;
export declare function escapePath(filePath: string): string;
export declare function unescapePath(filePath: string): string;
export declare const SUPPORTED_PASTED_IMAGE_MIME_TYPES: Set<string>;
export declare function isSupportedPastedImageMimeType(mimeType: string): boolean;
export declare function getImageExtensionForMimeType(mimeType: string): string;
export declare function getDisplayableImageMimeType(filePath: string): string | undefined;
export declare function isDisplayableImagePath(filePath: string): boolean;
export declare function normalizeImageAttachment(attachment: ImageAttachment, options?: {
    maxBytes?: number;
}): ImageAttachment | null;
