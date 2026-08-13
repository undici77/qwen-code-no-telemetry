/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const DEFAULT_COMPACTED_REPLAY_MAX_BYTES: number;
export declare const MAX_COMPACTED_REPLAY_MAX_BYTES: number;
export declare const DEFAULT_MAX_JOURNAL_EVENTS = 10000;
export declare const DEFAULT_MAX_JOURNAL_BYTES: number;
export declare function normalizeCompactedReplayMaxBytes(value: number | undefined): number;
export declare function normalizeMaxJournalEvents(value: number | undefined): number;
export declare function normalizeMaxJournalBytes(value: number | undefined): number;
