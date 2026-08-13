/**
 * Navigation Utilities
 *
 * Provides a unified `navigate()` function for internal navigation.
 * Works by dispatching a custom event that the NavigationContext listens for.
 *
 * Usage:
 *   import { navigate, routes } from '@/lib/navigate'
 *
 *   navigate(routes.tab.settings())
 *   navigate(routes.action.newChat({ agentId: 'qwen' }))
 *   navigate(routes.view.allSessions())
 */
import { routes } from '../../shared/routes';
// Re-export routes for convenience
export { routes };
// Event name for internal navigation
export const NAVIGATE_EVENT = 'craft-agent-navigate';
/**
 * Navigate to a route
 *
 * This dispatches a custom event that the NavigationContext listens for.
 * Can be called from anywhere in the app.
 */
export function navigate(route, options) {
    const event = new CustomEvent(NAVIGATE_EVENT, {
        detail: { route, ...options },
        bubbles: true,
    });
    window.dispatchEvent(event);
}
//# sourceMappingURL=navigate.js.map