import { resolveRangeFromOffsets } from './annotation-core';
export function restoreDomSelectionFromOffsets(root, start, end) {
    const range = resolveRangeFromOffsets(root, start, end);
    if (!range)
        return false;
    const selection = window.getSelection();
    if (!selection)
        return false;
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
}
export function restoreDomSelection(root, selection) {
    if (!selection)
        return false;
    return restoreDomSelectionFromOffsets(root, selection.start, selection.end);
}
export function clearDomSelection() {
    if (typeof window === 'undefined')
        return;
    window.getSelection()?.removeAllRanges();
}
export function scheduleDomSelectionRestore(rootRef, selection) {
    if (!selection || typeof window === 'undefined') {
        return;
    }
    window.requestAnimationFrame(() => {
        const root = rootRef.current;
        if (!root)
            return;
        restoreDomSelection(root, selection);
    });
}
//# sourceMappingURL=selection-restore.js.map