export function canAnnotateMessage({ hasAddAnnotationHandler, hasMessageId, isStreaming, }) {
    return hasAddAnnotationHandler && hasMessageId && !isStreaming;
}
/**
 * Portal strategy is centralized so host-specific differences are explicit.
 * Fullscreen keeps in-overlay rendering to avoid stack/clip issues with modal hosts.
 */
export function shouldRenderAnnotationIslandInPortal(host) {
    return host !== 'fullscreen';
}
//# sourceMappingURL=annotation-host-config.js.map