/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, EditorType, GeminiClient, Logger, ThoughtSummary, StopFailureErrorType } from '@qwen-code/qwen-code-core';
import { SendMessageType, ApprovalMode } from '@qwen-code/qwen-code-core';
import { type PartListUnion } from '@google/genai';
import type { HistoryItem, HistoryItemWithoutId, SlashCommandProcessorResult } from '../types.js';
import { StreamingState } from '../types.js';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
import { type TrackedToolCall } from './useReactToolScheduler.js';
import type { LoadedSettings } from '../../config/settings.js';
/**
 * Classify API error to StopFailureErrorType
 * @internal Exported for testing purposes
 */
export declare function classifyApiError(error: {
    message: string;
    status?: number;
}): StopFailureErrorType;
/**
 * Synchronous snapshot passed to `onCancelSubmit` so the cancel handler can
 * decide whether the model produced meaningful in-flight content WITHOUT
 * waiting for React state to flush. Closes the race where
 * `pendingHistoryItem` was just set from a stream chunk but the consumer's
 * React-state copy still reads as empty.
 */
export interface CancelSubmitInfo {
    /** `pendingHistoryItemRef.current` captured before any cancel mutation. */
    pendingItem: HistoryItemWithoutId | null;
    /**
     * The USER history item that this turn added, if any. `null` when the
     * turn took a path that does NOT push a user history item (Cron,
     * Notification, slash `submit_prompt`, Retry, etc.). The `id` lets
     * consumers verify identity even when `addItem` skipped a
     * consecutive-duplicate user message (text alone would wrongly match
     * the older row).
     */
    lastTurnUserItem: {
        id: number;
        text: string;
    } | null;
    /**
     * True if a content event landed during this turn, including during
     * the pre-cancel flush of throttle-buffered events. Lets the
     * auto-restore guard reject a turn that produced meaningful text even
     * when the consumer's React history snapshot is still stale.
     */
    turnProducedMeaningfulContent: boolean;
}
/**
 * Manages the Gemini stream, including user input, command processing,
 * API interaction, and tool call lifecycle.
 */
export declare const useGeminiStream: (geminiClient: GeminiClient, history: HistoryItem[], addItem: UseHistoryManagerReturn["addItem"], config: Config, settings: LoadedSettings, onDebugMessage: (message: string) => void, handleSlashCommand: (cmd: PartListUnion) => Promise<SlashCommandProcessorResult | false>, shellModeActive: boolean, getPreferredEditor: () => EditorType | undefined, onAuthError: (error: string) => void, performMemoryRefresh: () => Promise<void>, modelSwitchedFromQuotaError: boolean, setModelSwitchedFromQuotaError: React.Dispatch<React.SetStateAction<boolean>>, onEditorClose: () => void, onCancelSubmit: (info?: CancelSubmitInfo) => void, setShellInputFocused: (value: boolean) => void, terminalWidth: number, terminalHeight: number, midTurnDrainRef?: React.RefObject<(() => string[]) | null>, logger?: Logger | null) => {
    streamingState: StreamingState;
    submitQuery: (query: PartListUnion, submitType?: SendMessageType, prompt_id?: string, metadata?: {
        notificationDisplayText?: string;
    }) => Promise<void>;
    initError: string | null;
    pendingHistoryItems: HistoryItemWithoutId[];
    thought: ThoughtSummary | null;
    cancelOngoingRequest: () => void;
    retryLastPrompt: () => Promise<void>;
    pendingToolCalls: TrackedToolCall[];
    handleApprovalModeChange: (newApprovalMode: ApprovalMode) => Promise<void>;
    activePtyId: number | undefined;
    loopDetectionConfirmationRequest: {
        onComplete: (result: {
            userSelection: "disable" | "keep";
        }) => void;
    } | null;
    streamingResponseLengthRef: import("react").RefObject<number>;
    isReceivingContent: boolean;
};
