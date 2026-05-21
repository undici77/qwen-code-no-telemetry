/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config } from '../config/config.js';
import type { GeminiChat } from '../core/geminiChat.js';
import { type ChatCompressionInfo } from '../core/turn.js';
/**
 * Threshold for compression token count as a fraction of the model's token limit.
 * If the chat history exceeds this threshold, it will be compressed.
 */
export declare const COMPRESSION_TOKEN_THRESHOLD = 0.7;
/**
 * The fraction of the latest chat history to keep. A value of 0.3
 * means that only the last 30% of the chat history will be kept after compression.
 */
export declare const COMPRESSION_PRESERVE_THRESHOLD = 0.3;
/**
 * Minimum fraction of history (by character count) that must be compressible
 * to proceed with a compression API call. Prevents futile calls where the
 * model receives almost no context and generates a useless summary.
 */
export declare const MIN_COMPRESSION_FRACTION = 0.05;
/**
 * When the trailing entry is an in-flight `model+functionCall` and the regular
 * scan finds no clean split past the target fraction, the splitter falls back
 * to compressing everything except the last few entries. This constant sets
 * how many most-recent complete `(model+functionCall, user+functionResponse)`
 * tool rounds are retained as working context (the trailing in-flight call is
 * always retained on top of these).
 */
export declare const TOOL_ROUND_RETAIN_COUNT = 2;
export type CompactTrigger = 'manual' | 'auto';
/**
 * Returns the index of the oldest item to keep when compressing. May return
 * contents.length which indicates that everything should be compressed.
 */
export declare function findCompressSplitPoint(contents: Content[], fraction: number, retainCount?: number, precomputedCharCounts?: number[]): number;
export interface CompressOptions {
    promptId: string;
    force: boolean;
    model: string;
    config: Config;
    /**
     * Whether a previous unforced compression attempt failed for this chat.
     * Suppresses auto-compaction; manual `/compress` (force=true) overrides.
     */
    hasFailedCompressionAttempt: boolean;
    /**
     * Most recent prompt token count for this chat. Compared against
     * `threshold * contextWindowSize` for the auto-compaction gate.
     */
    originalTokenCount: number;
    /**
     * Hook trigger to report for this compression. `force=true` bypasses the
     * threshold gate but does not always mean the user manually requested
     * compaction; reactive overflow recovery is forced but still automatic.
     */
    trigger?: CompactTrigger;
    signal?: AbortSignal;
}
export declare class ChatCompressionService {
    compress(chat: GeminiChat, opts: CompressOptions): Promise<{
        newHistory: Content[] | null;
        info: ChatCompressionInfo;
        summary?: string;
    }>;
}
