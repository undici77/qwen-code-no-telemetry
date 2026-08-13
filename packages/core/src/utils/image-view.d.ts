/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export type SharpConstructor = any;
export declare const IMAGE_MAX_SOURCE_BYTES: number;
export interface NormalizedRegion {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export interface ImageView {
    bytes: Buffer;
    mimeType: 'image/jpeg';
    sourceWidth: number;
    sourceHeight: number;
    selectedWidth: number;
    selectedHeight: number;
    outputWidth: number;
    outputHeight: number;
}
export type ImageViewErrorCode = 'renderer_unavailable' | 'file_not_found' | 'target_is_directory' | 'target_not_regular_file' | 'source_too_large' | 'unsupported_image' | 'animated_image' | 'decode_failed' | 'output_too_large';
export declare class ImageViewError extends Error {
    readonly code: ImageViewErrorCode;
    constructor(code: ImageViewErrorCode, message: string);
}
export declare function renderImageOverview(filePath: string, signal: AbortSignal): Promise<ImageView>;
export declare function renderNormalizedImageCrop(filePath: string, region: NormalizedRegion, signal: AbortSignal): Promise<ImageView>;
