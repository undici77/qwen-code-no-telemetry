/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ThoughtExpandedValue {
  /**
   * Ctrl+O / Alt+T global toggle. Despite the name this is the app-wide
   * full-detail switch: it force-expands every thinking block AND every tool
   * group (untruncating tool results), not thinking alone. `MainContent` reads
   * it and forwards it to each `HistoryItemDisplay` as `fullDetail`.
   */
  allExpanded: boolean;
  /**
   * Head ids of thoughts the user expanded individually (by clicking the
   * collapsed line in VP mode). A "thought" is one `gemini_thought` head item
   * plus its trailing `gemini_thought_content` continuations; all of them key
   * off the head id so a single click expands the whole group.
   */
  expandedHeadIds: ReadonlySet<number>;
  /** Toggle the per-thought expansion for a head id. */
  toggle: (headId: number) => void;
}
export declare const useThoughtExpanded: () => ThoughtExpandedValue;
export declare const ThoughtExpandedProvider: import('react').Provider<ThoughtExpandedValue>;
