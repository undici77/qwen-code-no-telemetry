/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part, PartListUnion, FunctionDeclaration, GenerateContentResponseUsageMetadata } from '@google/genai';
import { FinishReason } from './genai-compat.js';
import type { ToolCallConfirmationDetails, ToolArtifact, ToolResult, ToolResultDisplay } from '../tools/tools.js';
import { ToolErrorType } from '../tools/tool-error.js';
import type { GeminiChat } from './geminiChat.js';
import type { RetryInfo } from '../utils/rateLimit.js';
import { type ThoughtSummary } from '../utils/thoughtUtils.js';
import type { LoopType } from '../telemetry/types.js';
import type { ActiveGoal } from '../goals/activeGoalStore.js';
import type { GoalSnapshotV2, GoalStateCause, GoalTurnPermit } from '../goals/goal-protocol.js';
export interface ServerTool {
    name: string;
    schema: FunctionDeclaration;
    execute(params: Record<string, unknown>, signal?: AbortSignal): Promise<ToolResult>;
}
export declare enum GeminiEventType {
    Content = "content",
    ToolCallRequest = "tool_call_request",
    ToolCallResponse = "tool_call_response",
    ToolCallConfirmation = "tool_call_confirmation",
    UserCancelled = "user_cancelled",
    Error = "error",
    ChatCompressed = "chat_compressed",
    Thought = "thought",
    MaxSessionTurns = "max_session_turns",
    SessionTokenLimitExceeded = "session_token_limit_exceeded",
    Finished = "finished",
    LoopDetected = "loop_detected",
    Citation = "citation",
    Retry = "retry",
    HookSystemMessage = "hook_system_message",
    UserPromptSubmitBlocked = "user_prompt_submit_blocked",
    StopHookLoop = "stop_hook_loop",
    GoalState = "goal_state",
    ActiveGoal = "active_goal",
    /** The system switched to a fallback model after the primary (or prior
     *  fallback) exhausted retries on a capacity/availability error. */
    ModelFallback = "model_fallback"
}
export type ServerGeminiRetryEvent = {
    type: GeminiEventType.Retry;
    retryInfo?: RetryInfo;
    /** When true, the retry is a continuation (recovery) rather than a fresh
     *  restart. The UI should keep accumulated text so the continuation appends. */
    isContinuation?: boolean;
};
export type ServerGeminiModelFallbackEvent = {
    type: GeminiEventType.ModelFallback;
    /** The model that exhausted its retry budget. */
    fromModel: string;
    /** The model the system is switching to. */
    toModel: string;
    /** HTTP status code that triggered the fallback (e.g. 429, 503, 529). */
    statusCode?: number;
    /** 1-based index of the fallback in the configured chain. */
    fallbackIndex: number;
};
export interface StructuredError {
    message: string;
    status?: number;
}
export interface GeminiErrorEventValue {
    error: StructuredError;
}
export interface SessionTokenLimitExceededValue {
    currentTokens: number;
    limit: number;
    message: string;
}
export interface GeminiFinishedEventValue {
    reason: FinishReason | undefined;
    usageMetadata: GenerateContentResponseUsageMetadata | undefined;
}
export interface ToolCallRequestInfo {
    callId: string;
    /**
     * Original tool-call id emitted by the provider/model. When present, this is
     * the idempotency key for suppressing duplicate provider tool calls.
     */
    providerCallId?: string;
    name: string;
    args: Record<string, unknown>;
    isClientInitiated: boolean;
    prompt_id: string;
    response_id?: string;
    /** Set to true when the LLM response was truncated due to max_tokens. */
    wasOutputTruncated?: boolean;
    goalContext?: GoalTurnPermit;
}
export type ToolExecutionStatus = 'not_started' | 'success' | 'error' | 'cancelled';
export interface ToolCallResponseInfo {
    callId: string;
    responseParts: Part[];
    resultDisplay: ToolResultDisplay | undefined;
    error: Error | undefined;
    errorType: ToolErrorType | undefined;
    executionStatus?: ToolExecutionStatus;
    contentLength?: number;
    persistedOutputFiles?: string[];
    modelOverride?: string;
    terminateTurn?: boolean;
    visionBridgeNotice?: string;
    artifacts?: ToolArtifact[];
}
export declare function createDuplicateProviderToolCallResponse(request: ToolCallRequestInfo): ToolCallResponseInfo;
export declare function markDuplicateProviderToolCallResponseSent(providerCallId: string, duplicateProviderToolCallResponseIds: Set<string>): void;
export declare function findRepeatedDuplicateProviderToolCall<T>(items: readonly T[], getProviderCallId: (item: T) => string | undefined, handledProviderToolCallIds: ReadonlySet<string>, duplicateProviderToolCallResponseIds: ReadonlySet<string>): T | undefined;
export interface ServerToolCallConfirmationDetails {
    request: ToolCallRequestInfo;
    details: ToolCallConfirmationDetails;
}
export type ServerGeminiContentPart = {
    text: string;
} | {
    inlineData: {
        data: string;
        mimeType: string;
        displayName?: string;
    };
};
export type ServerGeminiContentEvent = {
    type: GeminiEventType.Content;
    value: string;
    /** Ordered display parts, present only when the chunk contains an image. */
    parts?: ServerGeminiContentPart[];
};
export type ServerGeminiThoughtEvent = {
    type: GeminiEventType.Thought;
    value: ThoughtSummary;
};
export type ServerGeminiToolCallRequestEvent = {
    type: GeminiEventType.ToolCallRequest;
    value: ToolCallRequestInfo;
};
export type ServerGeminiToolCallResponseEvent = {
    type: GeminiEventType.ToolCallResponse;
    value: ToolCallResponseInfo;
};
export type ServerGeminiToolCallConfirmationEvent = {
    type: GeminiEventType.ToolCallConfirmation;
    value: ServerToolCallConfirmationDetails;
};
export type ServerGeminiUserCancelledEvent = {
    type: GeminiEventType.UserCancelled;
};
export type ServerGeminiErrorEvent = {
    type: GeminiEventType.Error;
    value: GeminiErrorEventValue;
};
export declare enum CompressionStatus {
    /** The compression was successful */
    COMPRESSED = 1,
    /** The compression failed due to the compression inflating the token count */
    COMPRESSION_FAILED_INFLATED_TOKEN_COUNT = 2,
    /** The compression failed due to an error counting tokens */
    COMPRESSION_FAILED_TOKEN_COUNT_ERROR = 3,
    /** The compression failed due to receiving an empty or null summary */
    COMPRESSION_FAILED_EMPTY_SUMMARY = 4,
    /** The compression was not necessary and no action was taken */
    NOOP = 5,
    /**
     * The compression call produced a summary, but the output hit
     * COMPACT_MAX_OUTPUT_TOKENS, indicating likely truncation. The summary
     * is dropped (newHistory=null) and the attempt is treated as a failure:
     * `isCompressionFailureStatus` returns true so it counts toward the
     * per-chat circuit breaker. Kept distinct from
     * `COMPRESSION_FAILED_EMPTY_SUMMARY` so telemetry can separate
     * prompt-quality failures (empty / nonsensical summary) from capacity
     * failures (output cap hit, may need a higher cap or finer-grained
     * splitter). (R5.2)
     */
    COMPRESSION_FAILED_OUTPUT_TRUNCATED = 6
}
/**
 * Why an auto-compaction fired. Drives the user-facing notice so a
 * screenshot-overflow trigger isn't mislabeled as "approached the token
 * limit". Undefined on NOOP / failure paths and for callers that don't set it.
 */
export type CompactionTriggerReason = 'token_limit' | 'image_overflow' | 'manual';
export interface ChatCompressionInfo {
    originalTokenCount: number;
    newTokenCount: number;
    /** Whether newTokenCount ultimately came from a local estimate. */
    newTokenCountIsEstimated?: boolean;
    compressionStatus: CompressionStatus;
    triggerReason?: CompactionTriggerReason;
    /** Set when the compaction model was swapped for the main model at runtime. */
    warning?: string;
}
export type ServerGeminiChatCompressedEvent = {
    type: GeminiEventType.ChatCompressed;
    value: ChatCompressionInfo | null;
};
export type ServerGeminiMaxSessionTurnsEvent = {
    type: GeminiEventType.MaxSessionTurns;
};
export type ServerGeminiSessionTokenLimitExceededEvent = {
    type: GeminiEventType.SessionTokenLimitExceeded;
    value: SessionTokenLimitExceededValue;
};
export type ServerGeminiFinishedEvent = {
    type: GeminiEventType.Finished;
    value: GeminiFinishedEventValue;
};
export type ServerGeminiLoopDetectedEvent = {
    type: GeminiEventType.LoopDetected;
    value?: {
        loopType: LoopType;
    };
};
export type ServerGeminiCitationEvent = {
    type: GeminiEventType.Citation;
    value: string;
};
export type ServerGeminiHookSystemMessageEvent = {
    type: GeminiEventType.HookSystemMessage;
    value: string;
};
export type ServerGeminiUserPromptSubmitBlockedEvent = {
    type: GeminiEventType.UserPromptSubmitBlocked;
    value: {
        reason: string;
        originalPrompt: string;
    };
};
export type ServerGeminiStopHookLoopEvent = {
    type: GeminiEventType.StopHookLoop;
    value: {
        iterationCount: number;
        reasons: string[];
        stopHookCount: number;
    };
};
export type ServerGeminiActiveGoalEvent = {
    type: GeminiEventType.ActiveGoal;
    value: ActiveGoal | null;
};
export type ServerGeminiGoalStateEvent = {
    type: GeminiEventType.GoalState;
    value: GoalSnapshotV2;
    cause?: GoalStateCause;
};
export type ServerGeminiStreamEvent = ServerGeminiGoalStateEvent | ServerGeminiActiveGoalEvent | ServerGeminiChatCompressedEvent | ServerGeminiCitationEvent | ServerGeminiContentEvent | ServerGeminiErrorEvent | ServerGeminiFinishedEvent | ServerGeminiHookSystemMessageEvent | ServerGeminiUserPromptSubmitBlockedEvent | ServerGeminiStopHookLoopEvent | ServerGeminiLoopDetectedEvent | ServerGeminiMaxSessionTurnsEvent | ServerGeminiModelFallbackEvent | ServerGeminiThoughtEvent | ServerGeminiToolCallConfirmationEvent | ServerGeminiToolCallRequestEvent | ServerGeminiToolCallResponseEvent | ServerGeminiUserCancelledEvent | ServerGeminiSessionTokenLimitExceededEvent | ServerGeminiRetryEvent;
export declare class Turn {
    private readonly chat;
    private readonly prompt_id;
    readonly pendingToolCalls: ToolCallRequestInfo[];
    private pendingCitations;
    finishReason: FinishReason | undefined;
    private currentResponseId?;
    private readonly goalContext?;
    constructor(chat: GeminiChat, prompt_id: string, goalContext?: GoalTurnPermit);
    run(model: string, req: PartListUnion, signal: AbortSignal): AsyncGenerator<ServerGeminiStreamEvent>;
    private handlePendingFunctionCall;
}
