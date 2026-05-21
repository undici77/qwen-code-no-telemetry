/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface TipHistoryEntry {
    totalShown: number;
    lastSessionTimestamp: number;
}
interface TipHistoryData {
    sessionCount: number;
    tips: Record<string, TipHistoryEntry>;
}
export declare class TipHistory {
    /** In-session tracking: tipId → prompt count when last shown */
    private sessionShown;
    private data;
    private filePath;
    constructor(data: TipHistoryData, filePath: string);
    get sessionCount(): number;
    /**
     * Check if a tip has cooled down enough to be shown again.
     */
    isCooledDown(tipId: string, cooldownPrompts: number, currentPromptCount: number): boolean;
    /**
     * Get a recency score for LRU sorting. Lower = shown longer ago (or never).
     * Tips shown in this session get a high score (shown recently).
     * Tips never shown in this session fall back to cross-session
     * lastSessionTimestamp for true recency-based rotation.
     */
    getLastShown(tipId: string): number;
    /**
     * Normalize a persisted tip entry so corrupted values cannot crash mutations.
     */
    private normalizeEntry;
    /**
     * Record that a tip was shown at the given prompt count.
     */
    recordShown(tipId: string, currentPromptCount: number): void;
    /**
     * Persist history to disk.
     */
    private persist;
    /**
     * Load history from disk, incrementing session count.
     */
    static load(): TipHistory;
}
export {};
