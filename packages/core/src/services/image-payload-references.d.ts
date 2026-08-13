/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Part } from '@google/genai';
export interface StoredImagePayload {
    id: string;
    mimeType: string;
    data: string;
    bytes: number;
    displayName?: string;
}
export interface ImagePayloadStore {
    put(part: Part): StoredImagePayload;
    get(id: string): StoredImagePayload | undefined;
}
export declare class InMemoryImagePayloadStore implements ImagePayloadStore {
    private readonly images;
    put(part: Part): StoredImagePayload;
    get(id: string): StoredImagePayload | undefined;
}
export declare function countAllInlineImages(contents: Content[]): number;
/**
 * Replace image payloads in-place with text references, storing the
 * originals in the provided store. This mutates the history so that
 * subsequent `countAllInlineImages` returns a lower count.
 *
 * Returns the stored payloads in order of appearance for downstream
 * reattach decisions.
 */
export declare function replaceImagePayloadsInPlace(contents: Content[], store: ImagePayloadStore, skipContent?: Content): StoredImagePayload[];
/**
 * Build the reattach parts for the most recent unique images from a
 * replacement pass. Used after `replaceImagePayloadsInPlace` to append
 * recent image bytes to the outgoing request.
 */
export declare function buildReattachParts(replaced: StoredImagePayload[], maxRecentImages: number): Part[];
export declare function prepareImagePayloadsForRequest(contents: Content[], options: {
    maxRecentImages: number;
    preserveImagePartsForContentIndex?: number;
    preserveLastUserImagePartCount?: number;
    store: ImagePayloadStore;
}): Content[];
