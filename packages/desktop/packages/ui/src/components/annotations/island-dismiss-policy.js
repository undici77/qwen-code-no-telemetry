export function resolveIslandOutsideDismissAction({ isCompactView, behavior, }) {
    if (behavior === 'close-only') {
        return 'close';
    }
    return isCompactView ? 'close' : 'back';
}
//# sourceMappingURL=island-dismiss-policy.js.map