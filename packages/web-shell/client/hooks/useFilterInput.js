import { useCallback, useRef, useState, } from 'react';
/**
 * Search-field state for filterable list dialogs, hardened against IME
 * composition jitter: the field reflects every keystroke while the committed
 * `filterValue` (used to filter) updates only on non-composition input and on
 * `compositionend`.
 *
 * `onFilterChange` fires with the committed value whenever it changes — dialogs
 * use it to reset their own selection/cursor state.
 */
export function useFilterInput(onFilterChange) {
    const [inputValue, setInputValue] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const composingRef = useRef(false);
    const committedRef = useRef('');
    const onFilterChangeRef = useRef(onFilterChange);
    onFilterChangeRef.current = onFilterChange;
    const commit = useCallback((value) => {
        // `compositionend` fires even when the composition was cancelled and the
        // text is back to what it was. A no-op commit must not signal a filter
        // change — dialogs reset their selection/cursor state on that signal, so
        // a cancelled composition would wipe e.g. the delete dialog's checkmarks.
        if (value === committedRef.current)
            return;
        committedRef.current = value;
        setFilterValue(value);
        onFilterChangeRef.current?.(value);
    }, []);
    const onChange = useCallback((event) => {
        const value = event.target.value;
        setInputValue(value);
        // Skip filtering while an IME composition is in flight; compositionend
        // commits the final value.
        if (!composingRef.current)
            commit(value);
    }, [commit]);
    const onCompositionStart = useCallback(() => {
        composingRef.current = true;
    }, []);
    const onCompositionEnd = useCallback((event) => {
        composingRef.current = false;
        const value = event.currentTarget.value;
        // Most browsers follow compositionend with an `input` event that syncs
        // the controlled value, but that's not guaranteed — sync it here too so
        // the field can never display a stale preedit while the list already
        // filters by the committed text.
        setInputValue(value);
        commit(value);
    }, [commit]);
    return {
        filterValue,
        inputProps: {
            value: inputValue,
            onChange,
            onCompositionStart,
            onCompositionEnd,
        },
    };
}
//# sourceMappingURL=useFilterInput.js.map