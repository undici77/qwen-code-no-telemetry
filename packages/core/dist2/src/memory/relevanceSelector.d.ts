/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ScannedAutoMemoryDocument } from './scan.js';
export declare function selectRelevantAutoMemoryDocumentsByModel(config: Config, query: string, docs: ScannedAutoMemoryDocument[], limit: number, recentTools?: readonly string[], callerAbortSignal?: AbortSignal): Promise<ScannedAutoMemoryDocument[]>;
