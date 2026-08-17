/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { MAX_WIDTH } from './PrepareLabel.js';
import {
  type Suggestion,
  type SuggestionCategory,
} from '../utils/suggestions.js';
export { MAX_SUGGESTIONS_TO_SHOW } from '../utils/suggestions.js';
export type { Suggestion, SuggestionCategory } from '../utils/suggestions.js';
interface SuggestionsDisplayProps {
  suggestions: Suggestion[];
  activeIndex: number;
  isLoading: boolean;
  width: number;
  scrollOffset: number;
  userInput: string;
  mode: 'reverse' | 'slash';
  expandedIndex?: number;
  /** Highlight a suggestion on hover (mouse). */
  onHoverIndex?: (index: number) => void;
  /** Accept a suggestion on click (mouse). */
  onSelectIndex?: (index: number) => void;
  /** Whether mouse interactions are enabled (alternate-screen mode + setting). */
  mouseEnabled?: boolean;
  /**
   * Active category tab for the `@` completion UI. When set and not 'all',
   * only suggestions of this category are rendered. Defaults to 'all'.
   * The parent (useCompletion) filters the array it manages scroll/active
   * state against; this prop drives the tab bar rendering + a defensive
   * in-component filter.
   */
  activeCategory?: SuggestionCategory | 'all';
  /** Ordered list of tabs to show. The tab bar renders only when >2 entries. */
  availableCategories?: Array<SuggestionCategory | 'all'>;
}
export { MAX_WIDTH };
/**
 * Collapse all runs of whitespace (including newlines from multi-line
 * SKILL.md/command descriptions) into single spaces so a description renders
 * as a single logical line. Without this, frontmatter line breaks are
 * preserved verbatim and a single long description can fill the whole terminal.
 */
export declare function normalizeDescription(description: string): string;
export declare function SuggestionsDisplay({
  suggestions,
  activeIndex,
  isLoading,
  width,
  scrollOffset,
  userInput,
  mode,
  expandedIndex,
  onHoverIndex,
  onSelectIndex,
  mouseEnabled,
  activeCategory,
  availableCategories,
}: SuggestionsDisplayProps): import('react/jsx-runtime').JSX.Element | null;
