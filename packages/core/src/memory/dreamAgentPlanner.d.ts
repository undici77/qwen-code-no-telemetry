/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type ForkedAgentResult } from '../utils/forkedAgent.js';
export declare function getTranscriptDir(projectRoot: string): string;
export declare function buildConsolidationTaskPrompt(memoryRoot: string, transcriptDir: string): string;
export declare function planManagedAutoMemoryDreamByAgent(config: Config, projectRoot: string, abortSignal?: AbortSignal, options?: {
    suppressChatRecording?: boolean;
}): Promise<ForkedAgentResult>;
