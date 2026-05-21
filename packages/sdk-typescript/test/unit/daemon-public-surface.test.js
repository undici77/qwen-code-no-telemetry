/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, expectTypeOf } from 'vitest';
import * as Public from '../../src/index.js';
describe('public SDK entry — typed daemon event surface (#4217)', () => {
    it('exports the runtime narrow + reducer surface', () => {
        expect(typeof Public.asKnownDaemonEvent).toBe('function');
        expect(typeof Public.isKnownDaemonEvent).toBe('function');
        expect(typeof Public.isDaemonEventType).toBe('function');
        expect(typeof Public.reduceDaemonSessionEvent).toBe('function');
        expect(typeof Public.reduceDaemonSessionEvents).toBe('function');
        expect(typeof Public.createDaemonSessionViewState).toBe('function');
    });
    it('round-trips a raw DaemonEvent through the public narrow helper', () => {
        // Pin the user-facing contract: `import { asKnownDaemonEvent }
        // from '@qwen-code/sdk'` must work end-to-end via the published
        // entry, not just exist as a re-export inside src/daemon/index.ts.
        const evt = {
            id: 1,
            v: 1,
            type: 'model_switched',
            data: { sessionId: 'sess-1', modelId: 'qwen-plus' },
        };
        const narrowed = Public.asKnownDaemonEvent(evt);
        if (narrowed?.type === 'model_switched') {
            expect(narrowed.data.modelId).toBe('qwen-plus');
        }
        else {
            expect.fail('expected typed model_switched');
        }
    });
    it('exposes the typed event schema types at the public entry (compile-time)', () => {
        // The type-only imports at the top of this file would fail to
        // compile if any of these names were absent from src/index.ts.
        // The runtime expectations below document the surface set the
        // SDK promises to ship and give tooling that ignores type-only
        // imports a runtime assertion trail.
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
        expectTypeOf().not.toBeNever();
    });
    it('exposes the PR 21 auth device-flow surface at the public entry', () => {
        // PR #4255 fold-in 9 review thread #11: the auth surface had
        // been re-exported from `src/daemon/index.ts` but never from
        // the published `src/index.ts`, so SDK consumers got
        // `undefined` for everything except `client.auth.start()`
        // (which traveled through the already-exported `DaemonClient`).
        expect(typeof Public.DaemonAuthFlow).toBe('function');
        expect(typeof Public.reduceDaemonAuthEvent).toBe('function');
        expect(typeof Public.reduceDaemonAuthEvents).toBe('function');
        expect(typeof Public.createDaemonAuthState).toBe('function');
        expect(typeof Public.DEVICE_FLOW_EXPIRY_GRACE_MS).toBe('number');
    });
});
//# sourceMappingURL=daemon-public-surface.test.js.map