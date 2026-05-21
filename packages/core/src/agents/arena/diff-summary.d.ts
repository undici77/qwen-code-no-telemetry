/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ArenaAgentResult, ArenaDiffSummary } from './types.js';
/**
 * Parse a unified git diff into file-level and aggregate line-change stats.
 */
export declare function summarizeUnifiedDiff(diff: string | undefined): ArenaDiffSummary;
/**
 * Build a deterministic approach summary when semantic LLM summarization is
 * unavailable or returns unusable output.
 */
export declare function buildFallbackApproachSummary(result: ArenaAgentResult): string;
export declare function formatLineStats(additions: number, deletions: number): string;
