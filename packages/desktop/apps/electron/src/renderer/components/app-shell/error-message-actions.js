import { navigate, routes } from '@/lib/navigate';
import { dispatchFocusInputEvent } from '@/components/app-shell/input/focus-input-events';
/**
 * Execute an error-message action using the app's canonical handlers.
 *
 * Retry intentionally routes through the session-scoped focus event system
 * instead of querying the DOM, which is fragile in multi-panel mode and
 * no longer matches the RichTextInput implementation.
 */
export function handleErrorMessageAction(action, { sessionId, onOpenUrl, onOpenSettings = () => navigate(routes.view.settings()), onRetryFocus = dispatchFocusInputEvent, onRetry, } = {}) {
    if (action.action === 'open_url') {
        if (action.url && onOpenUrl) {
            onOpenUrl(action.url);
        }
        return;
    }
    if (action.action === 'settings') {
        onOpenSettings();
        return;
    }
    if (action.action === 'retry') {
        if (onRetry) {
            onRetry();
        }
        else {
            onRetryFocus({ sessionId });
        }
    }
}
//# sourceMappingURL=error-message-actions.js.map