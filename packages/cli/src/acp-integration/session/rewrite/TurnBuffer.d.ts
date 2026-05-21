/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TurnContent } from './types.js';
/**
 * Accumulates thought and message chunks for a single model turn.
 * A turn ends when tool calls begin or the model stops generating.
 */
export declare class TurnBuffer {
    private thoughts;
    private messages;
    private _hasToolCalls;
    appendThought(text: string): void;
    appendMessage(text: string): void;
    markToolCall(): void;
    /**
     * Returns accumulated content and resets the buffer.
     * Returns null if buffer is empty.
     */
    flush(): TurnContent | null;
    private reset;
    get isEmpty(): boolean;
}
