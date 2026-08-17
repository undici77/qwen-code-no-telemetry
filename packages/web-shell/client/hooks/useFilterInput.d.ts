import { type ChangeEvent, type CompositionEvent } from 'react';
export interface FilterInputProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
}
export interface UseFilterInputResult {
  /**
   * Committed value to filter by. Only changes once a keystroke is committed,
   * never while an IME composition is in flight, so filtering a list by this
   * value does not refilter/relayout on every intermediate pinyin character.
   */
  filterValue: string;
  /** Spread onto the search `<input>` (carries the raw value + IME handlers). */
  inputProps: FilterInputProps;
}
/**
 * Search-field state for filterable list dialogs, hardened against IME
 * composition jitter: the field reflects every keystroke while the committed
 * `filterValue` (used to filter) updates only on non-composition input and on
 * `compositionend`.
 *
 * `onFilterChange` fires with the committed value whenever it changes — dialogs
 * use it to reset their own selection/cursor state.
 */
export declare function useFilterInput(
  onFilterChange?: (value: string) => void,
): UseFilterInputResult;
