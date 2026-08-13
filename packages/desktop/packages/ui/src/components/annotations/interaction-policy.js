import { getAnnotationFollowUpState } from './follow-up-state';
/**
 * Unified annotation chip behavior:
 * - sent follow-up chips are tooltip-only (no island open on click)
 * - pending/unsent chips open annotation detail in view mode
 */
export function getAnnotationChipInteraction(annotation) {
    const state = annotation ? getAnnotationFollowUpState(annotation) : 'none';
    const isSent = state === 'sent';
    return {
        state,
        clickable: !isSent,
        tooltipOnly: isSent,
        openMode: 'view',
    };
}
export function isAnnotationChipClickable(annotation) {
    return getAnnotationChipInteraction(annotation).clickable;
}
export function getAnnotationChipOpenMode() {
    return 'view';
}
/**
 * Mouse-up events that originate from annotation index badges must not trigger
 * text-selection follow-up flows. This keeps chip clicks and text selection
 * behavior consistent across inline and fullscreen renderers.
 */
export function shouldIgnoreSelectionMouseUpTarget(target) {
    const targetElement = target instanceof Element ? target : null;
    return Boolean(targetElement?.closest('[data-ca-annotation-index]'));
}
//# sourceMappingURL=interaction-policy.js.map