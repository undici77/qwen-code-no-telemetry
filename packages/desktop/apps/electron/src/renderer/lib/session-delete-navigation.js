import { routes } from './navigate';
export function getSessionDeleteNavigationRoute({ deleted, deletedSessionId, selectedSessionId, }) {
    if (!deleted || selectedSessionId !== deletedSessionId) {
        return null;
    }
    return routes.action.newSession();
}
//# sourceMappingURL=session-delete-navigation.js.map