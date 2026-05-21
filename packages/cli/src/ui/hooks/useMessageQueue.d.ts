/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface UseMessageQueueReturn {
    messageQueue: string[];
    addMessage: (message: string) => void;
    clearQueue: () => void;
    getQueuedMessagesText: () => string;
    /** Drain the entire queue joined with `\n\n`. For Ctrl+C / ESC / Up edit-restore. */
    popAllMessages: () => string | null;
    /** Drain plain-text prompts; leave slash commands queued. Safe from non-React callbacks. */
    drainQueue: () => string[];
    /** Pop the first item from the queue. */
    popNextSegment: () => string | null;
}
export declare function useMessageQueue(): UseMessageQueueReturn;
