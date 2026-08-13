/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ImageGenerationRequest {
    baseUrl: string;
    apiKey: string;
    model: string;
    prompt: string;
    size?: string;
    signal: AbortSignal;
    fetchFn?: typeof fetch;
}
export interface GeneratedImage {
    bytes: Buffer;
    mimeType: 'image/png';
    requestId?: string;
}
export type GenerateImage = (request: ImageGenerationRequest) => Promise<GeneratedImage>;
export declare function normalizeImageGenerationBaseUrl(value: string | undefined): string | undefined;
export declare function generateImage(request: ImageGenerationRequest): Promise<GeneratedImage>;
