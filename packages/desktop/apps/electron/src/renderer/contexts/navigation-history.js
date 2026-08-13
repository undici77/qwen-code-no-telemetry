/**
 * Builds a semantic history key used to dedupe pushState entries.
 *
 * Includes focused panel index so states with duplicate routes remain distinct
 * when focus moves between panels.
 */
export function buildSemanticHistoryKey({ workspaceSlug, panelRoutes, focusedPanelIndex, sidebarParam, }) {
    return [
        workspaceSlug ?? '',
        panelRoutes.join('|'),
        String(focusedPanelIndex),
        sidebarParam,
    ].join('::');
}
/**
 * Returns whether initial route restoration is allowed to run.
 */
export function canRunInitialRestore({ isReady, isSessionsReady, workspaceId, initialRouteRestored, }) {
    return isReady && isSessionsReady && !!workspaceId && !initialRouteRestored;
}
//# sourceMappingURL=navigation-history.js.map