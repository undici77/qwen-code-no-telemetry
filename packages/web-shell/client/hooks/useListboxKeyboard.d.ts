export interface ListboxKeyboardOptions {
    /** Number of selectable items in the list. */
    itemCount: number;
    /** Currently highlighted index, or -1 when no row is highlighted. */
    activeIndex: number;
    /** Called with the next index when the user moves the highlight. */
    onActiveIndexChange: (index: number) => void;
    /** Called with an index when the user confirms it (Enter). */
    onConfirm: (index: number) => void;
    /** Disable the listener without unmounting the host component. */
    enabled?: boolean;
}
export interface ListboxKeyboardResult {
    /**
     * True while the user is navigating by keyboard. Dialogs use this to suppress
     * the CSS `:hover` highlight so a cursor that happens to rest over a row —
     * e.g. when the dialog opens under the pointer — does not fight the keyboard
     * highlight. It flips back to false on a real `mousemove` (which never fires
     * from a dialog merely appearing under a stationary cursor).
     */
    keyboardMode: boolean;
}
/**
 * Keyboard navigation for listbox-style dialogs (model/theme/approval/resume/…).
 *
 * Selection is driven by `activeIndex` state rather than DOM focus, so it works
 * whether focus sits on the dialog panel/listbox or on a search input. The
 * visual highlight + `scrollIntoView` already implemented by each dialog
 * reflects the active index; this hook only moves that index and confirms it.
 *
 * Enter confirms the active row, unless focus is on a control that owns Enter
 * (see {@link focusOwnsEnter}) — so, e.g., Enter on a focused "Delete" button
 * activates the button — or no row is highlighted (`activeIndex < 0`).
 * Searchable dialogs rely on the latter: they open with no highlight and reset
 * to none whenever the filter text changes, so a reflexive Enter in the search
 * box never confirms a row the user didn't visibly pick first; the first
 * ArrowDown lands on the first row. Space mirrors Enter (per the ARIA listbox
 * pattern) but additionally yields to text fields, where it types a space.
 * Escape is intentionally NOT handled here — {@link DialogShell} owns dialog
 * dismissal.
 */
export declare function useListboxKeyboard({ itemCount, activeIndex, onActiveIndexChange, onConfirm, enabled, }: ListboxKeyboardOptions): ListboxKeyboardResult;
