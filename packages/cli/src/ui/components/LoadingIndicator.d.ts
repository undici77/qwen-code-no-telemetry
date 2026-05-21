/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ThoughtSummary } from '@qwen-code/qwen-code-core';
import type React from 'react';
interface LoadingIndicatorProps {
    currentLoadingPhrase?: string;
    elapsedTime: number;
    rightContent?: React.ReactNode;
    thought?: ThoughtSummary | null;
    candidatesTokens?: number;
    /**
     * Live-updating character counter for the streaming response. When provided
     * together with `isStreaming`, the indicator animates a token estimate
     * (chars / 4) internally, so the animation never re-renders `Composer` or
     * the input prompt.
     */
    streamingCharsRef?: React.RefObject<number>;
    /** Whether to poll `streamingCharsRef` (true during Responding/WaitingForConfirmation). */
    isStreaming?: boolean;
    /**
     * True when receiving content (shows ↓ arrow), false when waiting for API
     * response (shows ↑ arrow).
     * @default true
     */
    isReceivingContent?: boolean;
}
export declare const LoadingIndicator: React.FC<LoadingIndicatorProps>;
export {};
