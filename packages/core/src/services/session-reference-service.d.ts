/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/** Default token budget for an injected slimmed session reference. */
export declare const SESSION_REF_TOKEN_BUDGET = 8000;
export interface SlimmedSessionReference {
    /** Labeled, budget-trimmed block ready to inject as a text part. */
    text: string;
    meta: {
        sessionId: string;
        title: string;
        messageCount: number;
        approxTokens: number;
    };
    /** True when older turns were dropped to fit the budget. */
    truncated: boolean;
}
/**
 * Loads a prior chat session and turns it into a deterministically slimmed,
 * read-only text block suitable for injecting into the current context as
 * reference material. No model/LLM call is made — slimming is purely
 * mechanical.
 *
 * Slimming rules:
 * - user / assistant visible text is kept (thoughts dropped), including the
 *   preamble on an assistant turn that also calls a tool;
 * - each tool call collapses to a single line `[tool: <name> — <status>]`
 *   (never the tool result body), derived from the response side;
 * - the joined transcript is tail-retained to a fixed token budget, dropping
 *   the oldest turns first but always keeping at least the newest line.
 */
export declare class SessionReferenceService {
    private readonly sessionService;
    constructor(cwd: string);
    protected loadSession(sessionId: string): Promise<import("./sessionService.js").ResumedSessionData | undefined>;
    resolve(sessionId: string, opts?: {
        budgetTokens?: number;
        title?: string;
    }): Promise<SlimmedSessionReference | {
        notFound: true;
    }>;
    private estimate;
    private recordsToLines;
    private visibleText;
    private visibleUserText;
    private visibleTextParts;
    private static readonly TITLE_MAX_LENGTH;
    private deriveTitle;
    /** Names of every `functionResponse` part in a record (parallel tool calls
     * each yield their own line; a single tool call yields one). */
    private functionResponseNames;
}
