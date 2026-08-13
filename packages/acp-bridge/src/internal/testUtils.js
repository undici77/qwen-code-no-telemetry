/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @internal
 *
 * Shared bridge test fixtures used by `bridge.test.ts` (acp-bridge
 * package) and `daemon-status-provider.test.ts` (cli package). Extracted
 * so both suites can exercise the same
 * `FakeAgent` / `makeChannel` / `makeBridge` helpers without
 * cross-package duplication.
 *
 * Cross-package resolution uses two channels because TypeScript's
 * `nodenext` moduleResolution will not fall back to tsconfig `paths`
 * once a package's `exports` rejects a subpath. So:
 *
 *   1. `package.json` lists `./internal/testUtils` in `exports` so
 *      TypeScript can resolve types at compile time (and the cli's
 *      vitest run can resolve it at runtime even without an alias).
 *   2. `packages/cli/vitest.config.ts` adds a `resolve.alias` for
 *      the same specifier that points at `src/` instead of `dist/`,
 *      so the cli test reads source directly — editing
 *      `testUtils.ts` doesn't require rebuilding acp-bridge.
 *
 * External consumers of `@qwen-code/acp-bridge` should NOT depend on
 * these helpers — the `internal/` directory matches the neighboring
 * `internal/stderrLine.ts` convention; the `@internal` JSDoc tag is
 * an additional package-private signal (stderrLine.ts uses prose
 * rather than the tag, but the intent is the same). The compiled
 * file is excluded from npm publish via the package's `.npmignore`,
 * so external consumers can't `import` it even though the source
 * remains in the build for in-repo cli vitest resolution.
 */
import * as path from 'node:path';
import { AgentSideConnection, PROTOCOL_VERSION, RequestError, ndJsonStream, } from '@agentclientprotocol/sdk';
import { createAcpSessionBridge } from '../bridge.js';
import { isNotCurrentlyGeneratingCancelError } from '../bridgeErrors.js';
import { PROMPT_CANCEL_METHOD } from '../bridgeTypes.js';
// Workspace fixtures must round-trip through `path.resolve` so the
// expected values match what the bridge canonicalizes internally on
// every platform — a literal `/work/a` resolves to `D:\work\a` on
// Windows and the assertion drifts. Same for the FakeAgent's
// `sess:<cwd>` synthetic id, since the cwd it sees is the post-resolve
// value the bridge passes through `connection.newSession`.
export const WS_A = path.resolve(path.sep, 'work', 'a');
export const WS_B = path.resolve(path.sep, 'work', 'b');
export const SESS_A = `sess:${WS_A}`;
/**
 * Convenience wrapper: `createAcpSessionBridge` requires the workspace owned
 * by this bridge. Tests that only ever talk
 * to `WS_A` would otherwise repeat `boundWorkspace: WS_A` everywhere;
 * this helper defaults it. Tests that need a different bind path (e.g.
 * the mismatch test) pass `boundWorkspace` explicitly.
 *
 * Unlike the pre-split cli-side helper, this version does NOT default
 * `statusProvider` — that's a daemon-host-specific seam and
 * the acp-bridge tests exercise the no-provider fallback paths. The
 * cli-side `daemon-status-provider.test.ts` defines its own wrapper that
 * wires `createDaemonStatusProvider()` for the 4 daemon-host
 * integration tests.
 */
export function makeBridge(opts = {}) {
    return createAcpSessionBridge({
        boundWorkspace: WS_A,
        ...opts,
    });
}
export class FakeAgent {
    opts;
    initializeCalls = [];
    newSessionCalls = [];
    loadSessionCalls = [];
    resumeSessionCalls = [];
    promptCalls = [];
    cancelCalls = [];
    extMethodCalls = [];
    constructor(opts = {}) {
        this.opts = opts;
    }
    async initialize(p) {
        this.initializeCalls.push(p);
        if (this.opts.initializeThrows)
            throw this.opts.initializeThrows;
        if (this.opts.initializeDelayMs) {
            await new Promise((r) => setTimeout(r, this.opts.initializeDelayMs));
        }
        if (this.opts.initializeImpl) {
            return await this.opts.initializeImpl(p, this);
        }
        return {
            protocolVersion: PROTOCOL_VERSION,
            agentInfo: { name: 'fake-agent', version: '0' },
            authMethods: [],
            agentCapabilities: {},
        };
    }
    async newSession(p) {
        this.newSessionCalls.push(p);
        if (this.opts.newSessionImpl) {
            return this.opts.newSessionImpl(p, this);
        }
        const prefix = this.opts.sessionIdPrefix ?? 'sess';
        // Stage 1.5 multi-session: one FakeAgent can host multiple
        // sessions (same as the real ACP agent), so each newSession call
        // returns a fresh id. Suffix by call-count so tests that issue
        // multiple newSession on the same channel get distinct ids.
        const count = this.newSessionCalls.length;
        const suffix = count === 1 ? '' : `#${count}`;
        return { sessionId: `${prefix}:${p.cwd}${suffix}` };
    }
    async loadSession(p) {
        this.loadSessionCalls.push(p);
        if (this.opts.loadSessionImpl) {
            return this.opts.loadSessionImpl(p, this);
        }
        return {};
    }
    async unstable_resumeSession(p) {
        this.resumeSessionCalls.push(p);
        if (this.opts.resumeSessionImpl) {
            return this.opts.resumeSessionImpl(p, this);
        }
        return {};
    }
    async authenticate(_p) {
        throw new Error('not implemented in test fake');
    }
    async prompt(p) {
        this.promptCalls.push(p);
        if (this.opts.promptImpl) {
            return this.opts.promptImpl(p, this);
        }
        return { stopReason: 'end_turn' };
    }
    async cancel(p) {
        this.cancelCalls.push(p);
        if (this.opts.cancelImpl) {
            await this.opts.cancelImpl(p, this);
        }
    }
    async setSessionMode(_p) {
        throw new Error('not implemented in test fake');
    }
    async setSessionConfigOption(_p) {
        throw new Error('not implemented in test fake');
    }
    async extMethod(method, params) {
        this.extMethodCalls.push({ method, params });
        if (method === PROMPT_CANCEL_METHOD) {
            if (this.opts.promptCancelExtension === false) {
                throw RequestError.methodNotFound(method);
            }
            const sessionId = params['sessionId'];
            if (typeof sessionId !== 'string') {
                throw new Error('Invalid or missing sessionId');
            }
            let delayMs = 1;
            while (true) {
                try {
                    await this.cancel({ sessionId });
                    return { cancelled: true };
                }
                catch (error) {
                    if (!isNotCurrentlyGeneratingCancelError(error))
                        throw error;
                }
                await new Promise((resolve) => {
                    const timer = setTimeout(resolve, delayMs);
                    timer.unref();
                });
                delayMs = Math.min(delayMs * 2, 100);
            }
        }
        if (this.opts.extMethodImpl) {
            return this.opts.extMethodImpl(method, params, this);
        }
        return {};
    }
}
/**
 * Create a paired in-memory NDJSON channel: bridge sees `clientChannel`,
 * fake agent sees `agentStream`. Each `TransformStream` carries one
 * direction.
 *
 * Not migrated to `createInMemoryChannel()` (used by the other
 * `createInMemoryChannel` sites in `bridge.test.ts`): `kill()` below
 * needs the underlying `ab` / `ba` writables to simulate
 * child-process termination, which the bare helper deliberately does
 * not expose. See `inMemoryChannel.ts` JSDoc for the rationale.
 */
export function makeChannel(opts = {}) {
    const ab = new TransformStream();
    const ba = new TransformStream();
    const clientStream = ndJsonStream(ab.writable, ba.readable);
    const agentStream = ndJsonStream(ba.writable, ab.readable);
    let resolveExited;
    const exited = new Promise((res) => {
        resolveExited = res;
    });
    const handle = {
        channel: undefined,
        agent: new FakeAgent(opts),
        agentConnection: undefined,
        killed: false,
        /** Test hook: simulate an unexpected child crash. */
        crash: (info) => resolveExited(info),
    };
    // Spin up the fake agent on the agent side; keep the connection so tests can
    // drive client-bound ext-methods (e.g. the mid-turn drain).
    handle.agentConnection = new AgentSideConnection(() => handle.agent, agentStream);
    handle.channel = {
        stream: clientStream,
        exited,
        kill: async () => {
            handle.killed = true;
            try {
                await ab.writable.close();
            }
            catch {
                /* ignore */
            }
            try {
                await ba.writable.close();
            }
            catch {
                /* ignore */
            }
            resolveExited();
        },
        killSync: () => {
            // Test fake: just mark killed; the async streams will close
            // naturally on test cleanup. Mirrors the real spawn factory's
            // SIGKILL semantics (fire-and-forget).
            handle.killed = true;
            resolveExited();
        },
    };
    return handle;
}
//# sourceMappingURL=testUtils.js.map