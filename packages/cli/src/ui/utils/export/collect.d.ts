/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ChatRecord } from '@qwen-code/qwen-code-core';
import type { ExportSessionData } from './types.js';
/**
 * Collects session data from ChatRecord[] using HistoryReplayer.
 * Returns the raw ExportSessionData (SSOT) without normalization.
 */
export declare function collectSessionData(conversation: {
    sessionId: string;
    startTime: string;
    messages: ChatRecord[];
}, config: Config): Promise<ExportSessionData>;
