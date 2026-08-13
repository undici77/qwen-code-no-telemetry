import { buildRouteFromNavigationState, parseRouteToNavigationState } from '../../shared/route-parser';
/**
 * Normalize a panel route during URL reconciliation.
 *
 * Ensures filter-only routes (e.g. `allSessions`) can be upgraded to
 * canonical detail routes (e.g. `allSessions/session/{id}`) via the same
 * auto-selection policy used by normal navigation.
 */
export function normalizePanelRouteForReconcile(route, resolveAutoSelection) {
    const navState = parseRouteToNavigationState(route);
    if (!navState)
        return route;
    // Preserve explicit detail routes exactly as encoded in URL.
    // Reconciliation should only auto-select for filter/list routes.
    if ('details' in navState && navState.details) {
        return route;
    }
    const resolved = resolveAutoSelection(navState);
    return buildRouteFromNavigationState(resolved);
}
//# sourceMappingURL=navigation-reconcile.js.map