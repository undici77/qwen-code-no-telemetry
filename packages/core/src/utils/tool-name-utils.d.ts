/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Produces a deterministic name accepted by Gemini and stricter
 * OpenAI-compatible and Anthropic-compatible providers.
 */
export declare function normalizeToolNameForProvider(name: string): string;
/** Character-only normalization for code that needs an MCP server prefix. */
export declare function sanitizeToolNameForProvider(name: string): string;
/** Only legacy MCP names need normalization when converting stored history. */
export declare function normalizeMcpToolName(name: string): string;
/** Recreates the pre-provider-compatibility name for persisted settings. */
export declare function generateLegacyMcpToolName(name: string): string;
