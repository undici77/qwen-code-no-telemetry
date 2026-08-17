/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChatRecord } from '@qwen-code/qwen-code-core';
import type { ExportConfig, ExportSessionData } from './types.js';
/**
 * Normalizes export session data by merging tool call information from tool_result records.
 * This ensures the SSOT contains complete tool call metadata.
 */
export declare function normalizeSessionData(
  sessionData: ExportSessionData,
  originalRecords: ChatRecord[],
  config: ExportConfig,
): ExportSessionData;
