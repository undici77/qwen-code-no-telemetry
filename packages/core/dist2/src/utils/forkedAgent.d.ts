/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Unified forked-agent execution primitive.
 *
 * The two execution paths are selected by whether cacheSafeParams is supplied:
 *
 *   WITH cacheSafeParams  → GeminiChat single-turn, NO tools, shares parent
 *                            prompt cache (systemInstruction + history).
 *                            Use for: /btw, suggestions, pipelined suggestions.
 *
 *   WITHOUT cacheSafeParams → AgentHeadless multi-turn, full tool access,
 *                              isolated session (no shared history).
 *                              Use for: memory extract, dream consolidation.
 *
 * Tool-deny for forked queries is enforced at the per-request level (NO_TOOLS).
 *
 * Callers (extractScheduler, dreamScheduler) own concurrency control.
 * runSideQuery() remains a separate primitive for structured-JSON calls that
 * need no conversation history at all (recall, forget, governance).
 */
import type { Content, GenerateContentConfig } from '@google/genai';
import { type Config } from '../config/config.js';
import { GeminiChat } from '../core/geminiChat.js';
/**
 * Snapshot of the main conversation's cache-critical parameters.
 * Captured after each successful main turn so forked queries share the same
 * prompt prefix (systemInstruction + history) for cache hits.
 */
export interface CacheSafeParams {
    /** Full generation config including systemInstruction and tools */
    generationConfig: GenerateContentConfig;
    /** Curated conversation history (shallow copy; consumers must not mutate) */
    history: Content[];
    /** Model identifier */
    model: string;
    /** Version number — increments when systemInstruction or tools change */
    version: number;
}
/**
 * Save cache-safe params after a successful main conversation turn.
 * Called from GeminiClient.sendMessageStream() on successful completion.
 */
export declare function saveCacheSafeParams(generationConfig: GenerateContentConfig, history: Content[], model: string): void;
/**
 * Get the current cache-safe params, or null if not yet captured.
 */
export declare function getCacheSafeParams(): CacheSafeParams | null;
/**
 * Clear cache-safe params (e.g., on session reset).
 */
export declare function clearCacheSafeParams(): void;
/**
 * Create an isolated GeminiChat that shares the main conversation's
 * generationConfig (including systemInstruction, tools, and history).
 *
 * Used by runForkedAgent (cache path) and directly by speculation.ts which
 * needs its own multi-turn tool-execution loop with OverlayFs interception.
 */
export declare function createForkedChat(config: Config, params: CacheSafeParams): GeminiChat;
/**
 * Run a direct forked-chat loop under the runtime view required by the
 * selected model. This is used by speculation, which owns its own multi-turn
 * loop instead of going through runForkedAgent().
 */
export declare function runWithForkedChatModel<T>(config: Config, modelSelector: string, fn: (model: string) => Promise<T>): Promise<T>;
/**
 * Result from a cache-path runForkedAgent (with cacheSafeParams).
 * Single-turn, text-only — tools are denied.
 */
export interface ForkedQueryResult {
    /** Extracted text response, or null if no text */
    text: string | null;
    /** Parsed JSON result if jsonSchema was provided */
    jsonResult?: Record<string, unknown>;
    /** Token usage metrics */
    usage: {
        inputTokens: number;
        outputTokens: number;
        cacheHitTokens: number;
    };
}
/**
 * Overloaded params for runForkedAgent.
 *
 * Supply `cacheSafeParams` to run the cache path (single-turn, no tools,
 * shares parent prompt cache). Omit it to run the AgentHeadless path
 * (multi-turn, full tool access, isolated session).
 */
export type ForkedAgentParams = CachePathParams | AgentPathParams;
/** Cache path: single-turn, tool-free, shares parent prompt cache. */
export interface CachePathParams {
    /** Runtime config. */
    config: Config;
    /** The user message to send to the forked chat. */
    userMessage: string;
    /** CacheSafeParams snapshot from the main session (required). */
    cacheSafeParams: CacheSafeParams;
    /** Optional JSON schema for structured output. */
    jsonSchema?: Record<string, unknown>;
    /** Model override (defaults to cacheSafeParams.model). */
    model?: string;
    /** External cancellation signal. */
    abortSignal?: AbortSignal;
}
/** AgentHeadless path: multi-turn, full tool access, isolated session. */
export interface AgentPathParams {
    /** Unique name for this agent run (for logging and telemetry). */
    name: string;
    /** Runtime config. ApprovalMode is forced to YOLO internally. */
    config: Config;
    /** Task prompt sent as the initial user message. */
    taskPrompt: string;
    /** System prompt defining the agent's persona and constraints. */
    systemPrompt: string;
    /** Model override (defaults to fast model selector, then current model). */
    model?: string;
    /** Maximum number of agent turns (default: unlimited). */
    maxTurns?: number;
    /** Maximum execution time in minutes (default: unlimited). */
    maxTimeMinutes?: number;
    /**
     * Allowed tools. Pass a string array to restrict access.
     * Omit (undefined) to allow all available tools.
     * Pass an empty array to deny all tools (single-turn text output only).
     */
    tools?: string[];
    /**
     * Optional parent conversation history to inject for richer context.
     * Ensures the agent sees the conversation without re-serializing it.
     * Must end with a `model` role entry; call buildAgentHistory() to enforce this.
     */
    extraHistory?: Content[];
    /** External cancellation signal. */
    abortSignal?: AbortSignal;
}
export interface ForkedAgentResult {
    status: 'completed' | 'failed' | 'cancelled';
    /** Final text output from the agent's last response. */
    finalText?: string;
    /** AgentTerminateMode string explaining why the agent stopped. */
    terminateReason?: string;
    /** File paths observed in Write/Edit tool calls during execution. */
    filesTouched: string[];
}
/**
 * Unified forked-agent execution primitive.
 *
 * Two overloads selected by the shape of `params`:
 *
 *   params.cacheSafeParams present  → cache path (ForkedQueryResult)
 *     Single-turn, NO tools, shares parent prompt cache.
 *     Use for: /btw, suggestions, pipelined suggestions.
 *
 *   params.taskPrompt present        → agent path (ForkedAgentResult)
 *     Multi-turn AgentHeadless, full tool access, isolated session.
 *     Use for: memory extract, dream consolidation.
 */
export declare function runForkedAgent(params: CachePathParams): Promise<ForkedQueryResult>;
export declare function runForkedAgent(params: AgentPathParams): Promise<ForkedAgentResult>;
