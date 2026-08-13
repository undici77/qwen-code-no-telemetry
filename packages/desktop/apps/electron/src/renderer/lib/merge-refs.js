import {} from 'react';
/**
 * Merges multiple refs into a single ref callback.
 * Useful when an element needs to satisfy multiple ref requirements
 * (e.g., focus zone ref + hotkey scope ref).
 */
export function mergeRefs(...refs) {
    return (value) => {
        refs.forEach(ref => {
            if (typeof ref === 'function') {
                ref(value);
            }
            else if (ref != null) {
                ref.current = value;
            }
        });
    };
}
//# sourceMappingURL=merge-refs.js.map