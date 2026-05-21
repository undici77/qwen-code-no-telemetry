/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse, Content, GenerateContentConfig, SendMessageParameters, Part, Tool } from '@google/genai';
import { type RetryInfo } from '../utils/rateLimit.js';
import type { Config } from '../config/config.js';
import type { StructuredError } from './turn.js';
import { type ChatRecordingService } from '../services/chatRecordingService.js';
import { type CompactTrigger } from '../services/chatCompressionService.js';
import type { UiTelemetryService } from '../telemetry/uiTelemetry.js';
import { type ChatCompressionInfo } from './turn.js';
import type { SessionStartSource } from '../hooks/types.js';
/**
 * Replaces the args on a `structured_output` `functionCall` with the
 * same `__redacted` placeholder used by `ToolCallEvent` telemetry
 * (`packages/core/src/telemetry/types.ts`).
 *
 * The chat-recording JSONL (`<projectDir>/chats/<sessionId>.jsonl`)
 * persists assistant turns to disk and re-feeds them on
 * `--continue` / `--resume`. For `--json-schema` runs the tool args
 * ARE the user's structured payload — already emitted on stdout via
 * `result` / `structured_result`. Recording them verbatim here would
 * mean the same payload (and every validation-failure retry along the
 * way) sits on disk indefinitely, contradicting the privacy contract
 * documented next to the telemetry redaction. Mirror the placeholder
 * here so the chat-recording surface matches.
 *
 * Non-`structured_output` `functionCall`s pass through untouched.
 *
 * Exported for tests; callers should prefer the inline use inside
 * `recordAssistantTurn` invocation below.
 */
export declare function redactStructuredOutputArgsForRecording(part: Part): {
    functionCall: NonNullable<Part['functionCall']>;
} | null;
export declare enum StreamEventType {
    /** A regular content chunk from the API. */
    CHUNK = "chunk",
    /** A signal that a retry is about to happen. The UI should discard any partial
     * content from the attempt that just failed. */
    RETRY = "retry",
    /** Emitted once at the start of the stream when an automatic compression
     * pass succeeded. Carries the compression result so callers (the main
     * agent UI, subagent loop) can surface it without each call site running
     * its own compaction step. */
    COMPRESSED = "compressed"
}
export type StreamEvent = {
    type: StreamEventType.CHUNK;
    value: GenerateContentResponse;
} | {
    type: StreamEventType.RETRY;
    retryInfo?: RetryInfo;
    /** When true, the retry is a continuation (recovery) rather than a
     *  fresh restart (escalation). The UI should keep the accumulated text
     *  buffer so the continuation appends to it. */
    isContinuation?: boolean;
} | {
    type: StreamEventType.COMPRESSED;
    info: ChatCompressionInfo;
};
interface TryCompressOptions {
    originalTokenCountOverride?: number;
    trigger?: CompactTrigger;
}
export declare function isValidNonThoughtTextPart(part: Part): boolean;
/**
 * Custom error to signal that a stream completed with invalid content,
 * which should trigger a retry.
 */
export declare class InvalidStreamError extends Error {
    readonly type: 'NO_FINISH_REASON' | 'NO_RESPONSE_TEXT';
    constructor(message: string, type: 'NO_FINISH_REASON' | 'NO_RESPONSE_TEXT');
}
export declare class GeminiChat {
    private readonly config;
    private readonly generationConfig;
    private history;
    private readonly chatRecordingService?;
    private readonly telemetryService?;
    private sendPromise;
    /**
     * Per-chat last-prompt-token-count, populated from `usageMetadata` on each
     * model response. Used by the compaction threshold check so that subagents
     * (which intentionally don't write to the global telemetry singleton) can
     * still make compaction decisions based on their *own* context size.
     */
    private lastPromptTokenCount;
    /**
     * Per-chat sticky flag. After an unforced compression attempt fails (empty
     * summary or inflated token count), automatic compaction is suppressed
     * for the remainder of this chat to avoid burning compression API calls
     * in a loop. Manual `/compress` still works (it passes `force=true`).
     */
    private hasFailedCompressionAttempt;
    /**
     * Creates a new GeminiChat instance.
     *
     * @param config - The configuration object.
     * @param generationConfig - Optional generation configuration.
     * @param history - Optional initial conversation history.
     * @param chatRecordingService - Optional recording service. If provided, chat
     *   messages will be recorded.
     * @param telemetryService - Optional UI telemetry service. When provided,
     *   prompt token counts are reported on each API response. Pass `undefined`
     *   for sub-agent chats to avoid overwriting the main agent's context usage.
     */
    constructor(config: Config, generationConfig?: GenerateContentConfig, history?: Content[], chatRecordingService?: ChatRecordingService | undefined, telemetryService?: UiTelemetryService | undefined);
    /**
     * Most recent prompt-token count reported by the model for *this* chat,
     * mirroring the value in {@link UiTelemetryService} for the main session.
     * Subagent chats have no telemetry service wired but still need a per-chat
     * count for compaction decisions, so this is always populated regardless
     * of whether the global telemetry is updated.
     */
    getLastPromptTokenCount(): number;
    /**
     * Builds request contents for the content generator without deep-cloning the
     * whole chat history. This is an internal hot path: long sessions can make a
     * full `structuredClone` larger than the remaining V8 heap headroom.
     *
     * Public history readers still use {@link getHistory}, which returns a
     * defensive deep copy for caller mutation safety.
     */
    private getRequestHistory;
    /**
     * Seed the last-prompt-token-count for chats created with inherited
     * history (forks, subagents, speculation). Without this, the auto-compress
     * threshold check sees `0` and refuses to compress — so the first API call
     * can 400 from oversized history. Callers pass the parent chat's
     * `getLastPromptTokenCount()` here.
     */
    setLastPromptTokenCount(count: number): void;
    /**
     * Attempt to compress this chat's history.
     *
     * Returns the compression info regardless of outcome. On a successful
     * compaction (`COMPRESSED`), this method has already mutated the chat's
     * history, recorded the event to `chatRecordingService` (if wired), and
     * updated both the per-chat token count and (when wired) the global
     * telemetry singleton.
     */
    tryCompress(promptId: string, model: string, force?: boolean, signal?: AbortSignal, options?: TryCompressOptions): Promise<ChatCompressionInfo>;
    setSystemInstruction(sysInstr: string): void;
    setSessionStartContext(extraInstruction: string): void;
    applySessionStartContext(extraInstruction: string, _source: SessionStartSource): void;
    /**
     * Sends a message to the model and returns the response in chunks.
     *
     * @remarks
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessage} for non-streaming method.
     * @param params - parameters for sending the message.
     * @return The model's response.
     *
     * @example
     * ```ts
     * const chat = ai.chats.create({model: 'gemini-2.0-flash'});
     * const response = await chat.sendMessageStream({
     * message: 'Why is the sky blue?'
     * });
     * for await (const chunk of response) {
     * console.log(chunk.text);
     * }
     * ```
     */
    sendMessageStream(model: string, params: SendMessageParameters, prompt_id: string): Promise<AsyncGenerator<StreamEvent>>;
    private makeApiCallAndProcessStream;
    /**
     * Returns the chat history.
     *
     * @remarks
     * The history is a list of contents alternating between user and model.
     *
     * There are two types of history:
     * - The `curated history` contains only the valid turns between user and
     * model, which will be included in the subsequent requests sent to the model.
     * - The `comprehensive history` contains all turns, including invalid or
     * empty model outputs, providing a complete record of the history.
     *
     * The history is updated after receiving the response from the model,
     * for streaming response, it means receiving the last chunk of the response.
     *
     * The `comprehensive history` is returned by default. To get the `curated
     * history`, set the `curated` parameter to `true`.
     *
     * @param curated - whether to return the curated history or the comprehensive
     * history.
     * @return History contents alternating between user and model for the entire
     * chat session.
     */
    getHistory(curated?: boolean): Content[];
    /**
     * Returns a deep-copied tail of the chat history. This avoids cloning the
     * entire session when callers only need recent context.
     */
    getHistoryTail(count: number, curated?: boolean): Content[];
    /**
     * Returns a shallow copy of the history and each entry's parts array without
     * cloning large part payloads. Use only for read-only consumers or consumers
     * that replace touched entries before mutating them.
     */
    getHistoryShallow(curated?: boolean): Content[];
    /**
     * Shallow tail variant for hot paths that only need recent history.
     */
    getHistoryTailShallow(count: number, curated?: boolean): Content[];
    /**
     * Returns a defensive copy of the last raw history entry without cloning the
     * full conversation. This avoids O(history) cloning, though cloning the last
     * entry is still proportional to that entry's own size.
     */
    getLastHistoryEntry(): Content | undefined;
    /**
     * Returns the last raw history entry for read-only checks. Callers must not
     * mutate the returned object.
     */
    peekLastHistoryEntry(): Content | undefined;
    /**
     * Returns concatenated text from the last model entry without cloning the
     * full history. Used by stop hooks, where only the latest assistant text is
     * needed.
     */
    getLastModelMessageText(): string | undefined;
    /**
     * Returns the number of entries in the raw chat history. O(1) and
     * does not clone — use this when you only need the count and would
     * otherwise pay the {@link getHistory} `structuredClone` cost.
     */
    getHistoryLength(): number;
    /**
     * Clears the chat history.
     */
    clearHistory(): void;
    /**
     * Adds a new entry to the chat history.
     */
    addHistory(content: Content): void;
    setHistory(history: Content[]): void;
    truncateHistory(keepCount: number): void;
    stripThoughtsFromHistory(): void;
    /**
     * Pop all orphaned trailing user entries from chat history.
     * In a valid conversation the last entry is always a model response;
     * any trailing user entries are leftovers from a request that failed.
     */
    stripOrphanedUserEntriesFromHistory(): void;
    setTools(tools: Tool[]): void;
    /** Returns a shallow copy of the current generation config (for cache param snapshots). */
    getGenerationConfig(): GenerateContentConfig;
    maybeIncludeSchemaDepthContext(error: StructuredError): Promise<void>;
    private processStreamResponse;
    /**
     * Merge `pairCount` trailing (user_recovery, model_continuation) pairs back
     * into the model turn that precedes them. Used after the output-token
     * recovery loop so the internal OUTPUT_RECOVERY_MESSAGE control prompt
     * does not persist in durable history as if the user sent it.
     *
     * Expected tail shape per iteration (walking from the back):
     *   [..., precedingModel, userRecovery, modelContinuation]
     *
     * If any pair doesn't match that shape the method bails defensively
     * rather than corrupting history.
     */
    private coalesceRecoveryPairs;
}
/** Visible for Testing */
export declare function isSchemaDepthError(errorMessage: string): boolean;
export declare function isInvalidArgumentError(errorMessage: string): boolean;
export {};
