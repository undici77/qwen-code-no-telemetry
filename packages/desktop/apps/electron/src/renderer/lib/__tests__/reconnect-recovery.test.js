import { describe, it, expect } from 'bun:test';
import { getSessionsToRefreshAfterStaleReconnect } from '../reconnect-recovery';
function meta(overrides = {}) {
    return {
        id: overrides.id ?? 'session',
        workspaceId: overrides.workspaceId ?? 'workspace',
        isProcessing: overrides.isProcessing ?? false,
        ...overrides,
    };
}
describe('getSessionsToRefreshAfterStaleReconnect', () => {
    it('includes the active session and all processing sessions', () => {
        const metaMap = new Map([
            ['active', meta({ id: 'active' })],
            ['processing', meta({ id: 'processing', isProcessing: true })],
            ['other', meta({ id: 'other' })],
        ]);
        expect(getSessionsToRefreshAfterStaleReconnect(metaMap, 'active')).toEqual([
            'active',
            'processing',
        ]);
    });
    it('deduplicates the active session when it is already processing', () => {
        const metaMap = new Map([
            ['active', meta({ id: 'active', isProcessing: true })],
        ]);
        expect(getSessionsToRefreshAfterStaleReconnect(metaMap, 'active')).toEqual(['active']);
    });
});
//# sourceMappingURL=reconnect-recovery.test.js.map