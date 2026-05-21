/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { type AutoMemoryType } from './types.js';
export interface AutoMemoryDreamResult {
    touchedTopics: AutoMemoryType[];
    dedupedEntries: number;
    systemMessage?: string;
}
export declare function runManagedAutoMemoryDream(projectRoot: string, now?: Date, config?: Config, abortSignal?: AbortSignal): Promise<AutoMemoryDreamResult>;
/**
 * Record that the user manually ran /dream. Called from the CLI command's
 * onComplete callback after the main agent turn finishes writing memory files.
 * Writes lastDreamAt, lastDreamSessionId, and resets recentSessionIdsSinceDream
 * so that the scheduler's same-session dedupe check prevents a redundant
 * auto-dream from firing in the same session.
 */
export declare function writeDreamManualRunToMetadata(projectRoot: string, sessionId: string, now?: Date): Promise<void>;
