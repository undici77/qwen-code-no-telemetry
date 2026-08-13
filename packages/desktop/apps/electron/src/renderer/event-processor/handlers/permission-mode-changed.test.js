import { describe, expect, it } from 'bun:test';
import { handlePermissionModeChanged } from './session';
describe('handlePermissionModeChanged', () => {
    it('propagates transition metadata in effect payload', () => {
        const state = {
            session: { id: 's1' },
            streaming: null,
        };
        const event = {
            type: 'permission_mode_changed',
            sessionId: 's1',
            permissionMode: 'allow-all',
            previousPermissionMode: 'safe',
            transitionDisplay: 'Plan mode -> YOLO',
            modeVersion: 12,
            changedAt: '2026-03-02T10:00:00.000Z',
            changedBy: 'user',
        };
        const result = handlePermissionModeChanged(state, event);
        expect(result.effects).toHaveLength(1);
        expect(result.effects[0]).toEqual({
            type: 'permission_mode_changed',
            sessionId: 's1',
            permissionMode: 'allow-all',
            previousPermissionMode: 'safe',
            transitionDisplay: 'Plan mode -> YOLO',
            modeVersion: 12,
            changedAt: '2026-03-02T10:00:00.000Z',
            changedBy: 'user',
        });
    });
});
//# sourceMappingURL=permission-mode-changed.test.js.map