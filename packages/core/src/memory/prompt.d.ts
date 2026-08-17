/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare const MAX_MANAGED_AUTO_MEMORY_INDEX_LINES = 200;
export declare const MEMORY_FRONTMATTER_EXAMPLE: readonly string[];
/** Verbose memory-type guidance. See also: {@link CONDENSED_TYPES_SECTION} for the condensed version used in the empty-index prompt path. */
export declare const TYPES_SECTION_INDIVIDUAL: readonly string[];
/** Verbose exclusion rules (source of truth). See also: {@link CONDENSED_DO_NOT_SAVE_SECTION} for the condensed version. */
export declare const WHAT_NOT_TO_SAVE_SECTION: readonly string[];
export declare const MEMORY_DRIFT_CAVEAT =
  '- Memory records can become stale over time. Use memory as context for what was true at a given point in time. Before answering the user or building assumptions based solely on information in memory records, verify that the memory is still correct and up-to-date by reading the current state of the files or resources. If a recalled memory conflicts with current information, trust what you observe now \u2014 and update or remove the stale memory rather than acting on it.';
/** Verbose access-timing rules. See also: {@link CONDENSED_WHEN_TO_ACCESS_SECTION} for the condensed version. */
export declare const WHEN_TO_ACCESS_SECTION: readonly string[];
/**
 * Condensed version of {@link WHEN_TO_ACCESS_SECTION}.
 * Includes the same key behavioral directives in a shorter form
 * suitable for the empty-index prompt path.
 */
export declare const CONDENSED_WHEN_TO_ACCESS_SECTION: readonly string[];
/**
 * Condensed version of {@link WHAT_NOT_TO_SAVE_SECTION}.
 * Source of truth for exclusion rules is WHAT_NOT_TO_SAVE_SECTION;
 * this constant provides the same guidance in shorter form for the
 * empty-index (condensed) prompt path.
 */
export declare const CONDENSED_DO_NOT_SAVE_SECTION: readonly string[];
/**
 * Condensed version of {@link TYPES_SECTION_INDIVIDUAL}.
 * Enumerates the same four types with scope-to-directory mapping
 * and key behavioral notes, in shorter form for the empty-index prompt path.
 */
export declare const CONDENSED_TYPES_SECTION: readonly string[];
export declare const TRUSTING_RECALL_SECTION: readonly string[];
/**
 * Optional user-level (cross-project) memory dir + index. When provided to
 * {@link buildManagedAutoMemoryPrompt}, the prompt teaches the assistant
 * to route saves between this dir and the project dir using the per-type
 * `<scope>` guidance in TYPES_SECTION_INDIVIDUAL.
 */
export interface UserAutoMemorySection {
  memoryDir: string;
  indexContent?: string | null;
}
/**
 * Optional team-level (in-repo, git-tracked) memory dir + index. When provided
 * to {@link buildManagedAutoMemoryPrompt}, the prompt adds a third shared tier
 * and teaches the assistant when to route saves there instead of the private
 * dirs. Enabled via the `memory.enableTeamMemory` setting (see
 * `Config.getTeamMemoryEnabled`).
 */
export interface TeamAutoMemorySection {
  memoryDir: string;
  indexContent?: string | null;
}
/**
 * Condensed version of the team-scope guidance from {@link buildTeamScopeSection}.
 * Used in the empty-index (condensed) prompt path for multi-tier setups
 * that include a team directory.
 */
export declare const CONDENSED_TEAM_GUIDANCE: readonly string[];
export interface BuildMemoryPromptOptions {
  forceFullProtocol?: boolean;
}
export declare function buildManagedAutoMemoryPrompt(
  memoryDir: string,
  indexContent?: string | null,
  userSection?: UserAutoMemorySection,
  teamSection?: TeamAutoMemorySection,
  options?: BuildMemoryPromptOptions,
): string;
export { MAX_MANAGED_AUTO_MEMORY_INDEX_LINES };
