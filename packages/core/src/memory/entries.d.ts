/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ManagedAutoMemoryEntry {
    summary: string;
    why?: string;
    howToApply?: string;
}
/**
 * Returns the `# Heading` line from a body, or a default.
 * Used when reading old-format multi-entry topic files.
 */
export declare function getAutoMemoryBodyHeading(body: string): string;
/**
 * Parses memory entries from a body string.
 *
 * Supports two formats:
 *
 * **New (per-entry file) format** — the body starts with the plain-text summary,
 * followed by optional top-level `Why:` / `How to apply:` lines:
 * ```
 * Use short responses when debugging
 *
 * Why: The user prefers brevity in debug sessions.
 * How to apply: Keep replies to 3 sentences max.
 * ```
 *
 * **Legacy (multi-entry topic file) format** — each entry begins with a `- bullet`
 * prefix; nested fields use 2-space indent:
 * ```
 * # Feedback Memory
 *
 * - Use short responses when debugging
 *   - Why: The user prefers brevity in debug sessions.
 * - Always use TypeScript strict mode
 *   - Why: Catches bugs early.
 * ```
 */
export declare function parseAutoMemoryEntries(body: string): ManagedAutoMemoryEntry[];
export declare function renderAutoMemoryBody(_heading: string, entries: ManagedAutoMemoryEntry[]): string;
export declare function mergeAutoMemoryEntry(current: ManagedAutoMemoryEntry, incoming: ManagedAutoMemoryEntry): ManagedAutoMemoryEntry;
export declare function buildAutoMemoryEntrySearchText(entry: ManagedAutoMemoryEntry): string;
