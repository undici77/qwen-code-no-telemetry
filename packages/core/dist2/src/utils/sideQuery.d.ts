/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, GenerateContentConfig, GenerateContentResponseUsageMetadata, Part } from '@google/genai';
import type { Config } from '../config/config.js';
export interface SideQueryJsonOptions<TResponse> {
    contents: Content[];
    schema: Record<string, unknown>;
    abortSignal: AbortSignal;
    /**
     * Override the model used for this query. Defaults to
     * `config.getFastModel?.() ?? config.getModel() ?? DEFAULT_QWEN_MODEL`
     * — side queries run on the fast model when one is configured, including
     * fast models registered under a different authType than the main session.
     * Pass an explicit value to pin to the main model (e.g. long-form
     * summarization in web-fetch).
     */
    model?: string;
    systemInstruction?: string | Part | Part[] | Content;
    promptId?: string;
    purpose?: string;
    /**
     * Caller-supplied generation config. `thinkingConfig.includeThoughts`
     * defaults to `false` for all side queries; pass
     * `thinkingConfig: { includeThoughts: true }` here if reasoning output is
     * required.
     */
    config?: Omit<GenerateContentConfig, 'systemInstruction' | 'responseJsonSchema' | 'responseMimeType' | 'tools' | 'abortSignal'>;
    /**
     * Cap the retry loop. Best-effort cosmetic queries (e.g. session title)
     * pass `1` to avoid burning attempts on failures the user will never see.
     */
    maxAttempts?: number;
    validate?: (response: TResponse) => string | null;
}
export interface SideQueryTextOptions {
    contents: Content[];
    /**
     * Marker that disambiguates this overload from the JSON-mode options.
     * Callers never set this — the type forces TS to pick the JSON overload
     * when an actual schema is present.
     */
    schema?: never;
    abortSignal: AbortSignal;
    /**
     * Override the model used for this query. Defaults to
     * `config.getFastModel?.() ?? config.getModel() ?? DEFAULT_QWEN_MODEL`
     * — side queries run on the fast model when one is configured, including
     * fast models registered under a different authType than the main session.
     * Pass an explicit value to pin to the main model (e.g. long-form
     * summarization in web-fetch).
     */
    model?: string;
    systemInstruction?: string | Part | Part[] | Content;
    promptId?: string;
    purpose?: string;
    /**
     * Caller-supplied generation config. `thinkingConfig.includeThoughts`
     * defaults to `false` for all side queries; pass
     * `thinkingConfig: { includeThoughts: true }` here if reasoning output is
     * required.
     */
    config?: Omit<GenerateContentConfig, 'systemInstruction' | 'tools' | 'abortSignal'>;
    /**
     * Cap the retry loop. Best-effort cosmetic queries pass `1` to avoid
     * burning attempts on failures the user will never see.
     */
    maxAttempts?: number;
    validate?: (text: string) => string | null;
}
export interface SideQueryTextResult {
    text: string;
    usage: GenerateContentResponseUsageMetadata | undefined;
}
export type SideQueryOptions<TResponse> = SideQueryJsonOptions<TResponse>;
export declare function runSideQuery(config: Config, options: SideQueryTextOptions): Promise<SideQueryTextResult>;
export declare function runSideQuery<TResponse>(config: Config, options: SideQueryJsonOptions<TResponse>): Promise<TResponse>;
