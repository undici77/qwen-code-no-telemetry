export function getAnnotationInteractionSourceKey(state, messageId) {
    const messageScope = messageId ?? 'no-message';
    if (state.pendingSelection) {
        return `selection:${messageScope}:${state.pendingSelection.start}:${state.pendingSelection.end}`;
    }
    if (state.activeAnnotationDetail) {
        return `annotation:${messageScope}:${state.activeAnnotationDetail.annotationId}`;
    }
    return `none:${messageScope}`;
}
export function getAnnotationInteractionAnchor(state) {
    return state.selectionMenuAnchor;
}
export function hasAnnotationInteraction(state) {
    return Boolean(state.pendingSelection || state.activeAnnotationDetail);
}
//# sourceMappingURL=interaction-selectors.js.map