/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function getString(value: unknown, key: string): string | undefined;
export declare function getFirstString(value: unknown, keys: readonly string[]): string | undefined;
export declare function stringifyJson(value: unknown): string;
export declare function stringifyRedactedJson(value: unknown): string;
export declare function redactSensitiveFields(value: unknown, depth?: number): unknown;
export declare function isSensitiveKey(key: string): boolean;
export declare function getTextContent(value: unknown): string;
/**
 * PR-C: discriminated content part extracted from a daemon `content` field.
 *
 * Existing `getTextContent` returns only the `text` field, silently dropping
 * multimodal content (`image` / `audio` / `resource`). `extractContentPart`
 * returns the typed shape so renderers can decide how to project each kind:
 * a chat bubble for `text`, a thumbnail for `image`, a play button for
 * `audio`, an attachment link for `resource`.
 *
 * Returns `undefined` for unrecognized payloads — callers should treat that
 * as "skip this content" rather than synthesizing a placeholder.
 */
export type DaemonUiContentPart = {
    kind: 'text';
    text: string;
} | {
    kind: 'image';
    mediaType: string;
    source: {
        url?: string;
        data?: string;
    };
} | {
    kind: 'audio';
    mediaType: string;
    source: {
        url?: string;
        data?: string;
    };
} | {
    kind: 'resource';
    uri: string;
    mediaType?: string;
    description?: string;
};
export declare function extractContentPart(value: unknown): DaemonUiContentPart | undefined;
export declare function getOutputText(value: unknown, depth?: number): string;
export declare function sanitizeTerminalText(text: string): string;
export declare function stripOscSequences(text: string): string;
