/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExportSessionData } from '../types.js';
/**
 * Converts ExportSessionData to JSONL (JSON Lines) format.
 * Each message is output as a separate JSON object on its own line.
 */
export declare function toJsonl(sessionData: ExportSessionData): string;
