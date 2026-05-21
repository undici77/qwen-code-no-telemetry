/**
 * Factory function for creating Query instances.
 */
import type { SDKUserMessage } from '../types/protocol.js';
import { Query } from './Query.js';
import type { QueryOptions } from '../types/types.js';
export type { QueryOptions };
export declare function query({ prompt, options, }: {
    /**
     * The prompt to send to the Qwen Code CLI process.
     * - `string` for single-turn query,
     * - `AsyncIterable<SDKUserMessage>` for multi-turn query.
     *
     * The transport will remain open until the prompt is done.
     */
    prompt: string | AsyncIterable<SDKUserMessage>;
    /**
     * Configuration options for the query.
     */
    options?: QueryOptions;
}): Query;
