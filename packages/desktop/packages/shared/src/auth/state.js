/**
 * Unified Auth State Management
 *
 * Qwen Code is the only built-in backend and does not require app-managed LLM
 * credentials. Source and workspace OAuth still use their dedicated auth flows.
 */
import { getActiveWorkspace } from '../config/storage.ts';
export async function getAuthState() {
    const activeWorkspace = getActiveWorkspace();
    return {
        billing: {
            type: null,
            hasCredentials: true,
            apiKey: null,
        },
        workspace: {
            hasWorkspace: !!activeWorkspace,
            active: activeWorkspace,
        },
    };
}
export function getSetupNeeds(_state, _setupDeferred) {
    return {
        needsBillingConfig: false,
        needsCredentials: false,
        isFullyConfigured: true,
    };
}
export function _resetRefreshMutex() {
    // Kept for test compatibility.
}
//# sourceMappingURL=state.js.map