/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
/**
 * Generate a 1-2 sentence "where did I leave off" summary of the current
 * session. Uses the configured fast model (falls back to main model) with
 * tools disabled and a very small generation budget. Prompt mirrors
 * Claude Code's away-summary prompt for behavioral parity.
 *
 * Returns null on any failure — recap is best-effort and must never break
 * the main flow or surface errors to the user.
 */
export declare function generateSessionRecap(config: Config, abortSignal: AbortSignal): Promise<string | null>;
