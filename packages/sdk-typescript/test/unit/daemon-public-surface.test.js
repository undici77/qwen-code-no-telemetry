/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, expectTypeOf } from 'vitest';
import * as Public from '../../src/index.js';
import {
  DAEMON_KNOWN_EVENT_TYPE_VALUES,
  PENDING_PROMPT_ADDED_EVENT,
  PENDING_PROMPT_STARTED_EVENT,
  PENDING_PROMPT_COMPLETED_EVENT,
  asKnownDaemonEvent,
} from '../../src/daemon/events.js';
import { DAEMON_UI_DEBUG_REASONS } from '../../src/daemon/index.js';
describe('public SDK entry — typed daemon event surface (#4217)', () => {
  it('exports the runtime narrow + reducer surface', () => {
    expect(typeof Public.asKnownDaemonEvent).toBe('function');
    expect(typeof Public.isKnownDaemonEvent).toBe('function');
    expect(typeof Public.isDaemonEventType).toBe('function');
    expect(typeof Public.reduceDaemonSessionEvent).toBe('function');
    expect(typeof Public.reduceDaemonSessionEvents).toBe('function');
    expect(typeof Public.createDaemonSessionViewState).toBe('function');
    expect(Public.PENDING_PROMPT_ADDED_EVENT).toBe(PENDING_PROMPT_ADDED_EVENT);
    expect(Public.PENDING_PROMPT_STARTED_EVENT).toBe(
      PENDING_PROMPT_STARTED_EVENT,
    );
    expect(Public.PENDING_PROMPT_COMPLETED_EVENT).toBe(
      PENDING_PROMPT_COMPLETED_EVENT,
    );
    // F2 (#4175 commit 6 review fix — claude-opus-4-7 W121): pin
    // `isWorkspaceScopedBudgetEvent` to the SDK public surface. PR
    // description + event JSDoc tell consumers to use this helper to
    // branch on `scope === 'workspace'`; without this pinning the
    // export could silently drop on a future barrel reshuffle (same
    // failure mode caught for PR-21 auth surface).
    expect(typeof Public.isWorkspaceScopedBudgetEvent).toBe('function');
    expect('projectChatRecordsToDaemonTranscript' in Public).toBe(false);
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
    } else {
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
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
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
    expectTypeOf().toEqualTypeOf();
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
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    // #4175 follow-up: the recap result type lives under the daemon
    // sub-barrel and is re-exported at the top-level. Without this
    // assertion a future barrel reshuffle could silently drop the
    // result type SDK consumers need to type `client.recapSession`.
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    // Batch Skill toggle surface: type-only imports are erased at vitest
    // runtime, so the prototype check is the fence that actually executes
    // here; the shape assertions pin the contract for any tsc pass.
    expect(typeof Public.DaemonClient.prototype.setWorkspaceSkillsEnabled).toBe(
      'function',
    );
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    // `GET /daemon/status` report surface (PR 5174 client coverage): the
    // envelope plus the sub-shapes UI dashboards need to type against.
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().not.toBeNever();
    expectTypeOf().toMatchTypeOf();
    expectTypeOf().toMatchTypeOf();
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
  it('mirrors the T2.9 errorKind additions in DAEMON_ERROR_KINDS (issue #4514)', () => {
    // The SDK-side `DAEMON_ERROR_KINDS` is hand-mirrored from the
    // serve-side `SERVE_ERROR_KINDS` in `acp-bridge/src/status.ts`.
    // T2.9 added two kinds (`prompt_deadline_exceeded` for the
    // POST /session/:id/prompt 504, `writer_idle_timeout` for the
    // terminal SSE client_evicted frame). Lock them so a future PR
    // that bumps the serve list without touching the SDK list fails
    // here instead of shipping a typed-on-server-but-unknown-on-SDK
    // mismatch.
    expect(Public.DAEMON_ERROR_KINDS).toContain('prompt_deadline_exceeded');
    expect(Public.DAEMON_ERROR_KINDS).toContain('writer_idle_timeout');
    expect(Public.DAEMON_ERROR_KINDS).toContain('restore_timeout');
  });
});
describe('mcp_server_added event drift insurance', () => {
  it('is exported in DAEMON_KNOWN_EVENT_TYPE_VALUES', () => {
    expect(DAEMON_KNOWN_EVENT_TYPE_VALUES).toContain('mcp_server_added');
  });
  it('asKnownDaemonEvent returns the right discriminator', () => {
    const evt = {
      v: 1,
      type: 'mcp_server_added',
      data: {
        name: 'echo',
        transport: 'stdio',
        replaced: false,
        shadowedSettings: false,
        toolCount: 3,
        originatorClientId: 'client-1',
      },
    };
    const known = asKnownDaemonEvent(evt);
    expect(known?.type).toBe('mcp_server_added');
    if (known?.type === 'mcp_server_added') {
      expect(known.data.name).toBe('echo');
      expect(known.data.transport).toBe('stdio');
      expect(known.data.replaced).toBe(false);
      expect(known.data.shadowedSettings).toBe(false);
      expect(known.data.toolCount).toBe(3);
      expect(known.data.originatorClientId).toBe('client-1');
    }
  });
});
describe('mcp_server_removed event drift insurance', () => {
  it('is exported in DAEMON_KNOWN_EVENT_TYPE_VALUES', () => {
    expect(DAEMON_KNOWN_EVENT_TYPE_VALUES).toContain('mcp_server_removed');
  });
  it('asKnownDaemonEvent returns the right discriminator', () => {
    const evt = {
      v: 1,
      type: 'mcp_server_removed',
      data: {
        name: 'echo',
        wasShadowingSettings: true,
        originatorClientId: 'client-2',
      },
    };
    const known = asKnownDaemonEvent(evt);
    expect(known?.type).toBe('mcp_server_removed');
    if (known?.type === 'mcp_server_removed') {
      expect(known.data.name).toBe('echo');
      expect(known.data.wasShadowingSettings).toBe(true);
      expect(known.data.originatorClientId).toBe('client-2');
    }
  });
});
describe('runtime MCP add/remove SDK types', () => {
  it('request type compiles', () => {
    const req = {
      name: 'echo',
      config: { command: 'node', args: ['echo.js'], type: 'stdio' },
      displayName: 'Echo Server',
    };
    expect(req.name).toBe('echo');
  });
  it('add result has right shape', () => {
    const res = {
      name: 'echo',
      transport: 'stdio',
      replaced: false,
      shadowedSettings: false,
      toolCount: 0,
      originatorClientId: 'client-x',
    };
    expect(res.replaced).toBe(false);
  });
  it('add soft-refuse has right shape', () => {
    const res = {
      name: 'echo',
      skipped: true,
      reason: 'budget_warning_only',
    };
    expect(res.skipped).toBe(true);
  });
  it('remove result has right shape', () => {
    const res = {
      name: 'echo',
      removed: true,
      wasShadowingSettings: false,
      originatorClientId: 'client-x',
    };
    expect(res.removed).toBe(true);
  });
});
describe('daemon UI debug-reason public surface', () => {
  it('pins the union shipped by @qwen-code/sdk/daemon', () => {
    // A type-only guard would not hold here: vitest transpiles through
    // esbuild, which erases `export type` without checking it, and this
    // package's tsconfig excludes `test/`, so nothing type-checks this file.
    // The union therefore ships as a closed enum value — matching
    // DAEMON_ERROR_KINDS and friends — and the runtime assertion below is
    // what actually fails if the re-export is dropped or the members drift.
    expect(DAEMON_UI_DEBUG_REASONS).toEqual([
      'unrecognized_event',
      'unrecognized_session_update',
      'malformed_payload',
    ]);
    expectTypeOf().toEqualTypeOf();
  });
});
//# sourceMappingURL=daemon-public-surface.test.js.map
