/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface SelectionListItem<T> {
  key: string;
  value: T;
  disabled?: boolean;
}
export interface UseSelectionListOptions<T> {
  items: Array<SelectionListItem<T>>;
  initialIndex?: number;
  onSelect: (value: T) => void;
  onHighlight?: (value: T) => void;
  isFocused?: boolean;
  showNumbers?: boolean;
  /**
   * When true, suppresses vim-style navigation keys (j/k) while keeping
   * arrow keys, Enter, and all other handlers active. Used by dialogs
   * that combine a MultiSelect with an inline text filter where j/k are
   * valid search characters (e.g. "json", "kotlin").
   */
  disableVimNav?: boolean;
}
export interface UseSelectionListResult {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  /** Move the active index to `index` and select it (click-to-choose). */
  selectIndex: (index: number) => void;
}
/**
 * A headless hook that provides keyboard navigation and selection logic
 * for list-based selection components like radio buttons and menus.
 *
 * Features:
 * - Keyboard navigation with j/k and arrow keys
 * - Selection with Enter key
 * - Numeric quick selection (when showNumbers is true)
 * - Handles disabled items (skips them during navigation)
 * - Wrapping navigation (last to first, first to last)
 */
export declare function useSelectionList<T>({
  items,
  initialIndex,
  onSelect,
  onHighlight,
  isFocused,
  showNumbers,
  disableVimNav,
}: UseSelectionListOptions<T>): UseSelectionListResult;
