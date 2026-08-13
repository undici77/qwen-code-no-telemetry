/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
describe('mock ACP agent type compliance', () => {
    it('satisfies required Agent interface methods', () => {
        const _typeCheck = {
            initialize: async () => ({
                protocolVersion: '',
                agentInfo: { name: '', version: '' },
                authMethods: [],
                agentCapabilities: {},
            }),
            authenticate: async () => ({}),
            newSession: async () => ({ sessionId: '' }),
            prompt: async () => ({ stopReason: 'end_turn' }),
            cancel: async () => { },
        };
        expect(_typeCheck).toBeDefined();
    });
});
//# sourceMappingURL=mock-acp-typecheck.test.js.map