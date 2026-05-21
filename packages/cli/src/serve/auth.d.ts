/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { RequestHandler } from 'express';
/**
 * Reject any request that carries an `Origin` header. CLI/SDK clients never
 * set Origin; only browsers do. Returning a deterministic 403 JSON keeps
 * the daemon from CSRF-ing itself (and is more useful to clients than the
 * 500 HTML default that the `cors` package's error-callback path produces
 * when no Express error middleware is registered).
 */
export declare const denyBrowserOriginCors: RequestHandler;
/**
 * Reject requests whose Host header isn't one of the bound interfaces.
 * Defense against DNS rebinding when the daemon is on loopback.
 *
 * `bind` is the hostname the listener was started with. `getPort` is read
 * lazily on each request because callers commonly request port 0 (ephemeral)
 * and only learn the actual port once `listen()` has resolved.
 */
export declare function hostAllowlist(bind: string, getPort: () => number): RequestHandler;
/**
 * Bearer token middleware. When `token` is undefined the gate is open — used
 * for the loopback-only developer default. `runQwenServe` enforces that any
 * non-loopback bind has a token, and that `--require-auth` boots only with a
 * token configured, so this no-token branch is reachable only on loopback
 * developer setups that opted out of `--require-auth`.
 */
export declare function bearerAuth(token: string | undefined): RequestHandler;
/**
 * Per-route mutation gate (issue #4175 PR 15).
 *
 * Wave 4 (PR 16-21) will add broadly state-changing routes — memory
 * CRUD, agent CRUD, tool enable/disable, MCP restart, file write/edit,
 * device-flow auth, etc. The roadmap calls for "a single mutation-gating
 * helper rather than open-code auth checks per route" so all those
 * routes share one choke point. This factory is that choke point;
 * Wave 1-2 routes apply it as a centralization marker (no behavior
 * change today), and Wave 4 routes opt into `strict: true` to enforce
 * "token required even on loopback" without depending on the operator
 * also passing `--require-auth`.
 *
 * Behavior matrix:
 *
 * | daemon config              | route opts        | result          |
 * | -------------------------- | ----------------- | --------------- |
 * | requireAuth=true           | any               | passthrough (1) |
 * | token configured           | any               | passthrough (2) |
 * | no token (loopback dev)    | strict=false      | passthrough     |
 * | no token (loopback dev)    | strict=true       | 401 + code      |
 *
 * (1) `--require-auth` boots only with a token, so the global
 *     `bearerAuth` middleware already 401'd unauthenticated requests
 *     before they reached this gate.
 * (2) Any token configuration makes the global `bearerAuth` enforce
 *     bearer-required-everywhere; the gate is redundant but harmless.
 *
 * The 401 body uses `code: 'token_required'` (distinct from
 * `bearerAuth`'s plain `Unauthorized` shape) so SDK clients can branch
 * on it: surface a "this route needs the daemon to be configured with
 * a token; restart with --require-auth or --token" hint rather than a
 * generic auth failure. Pre-flight via `/capabilities.features.require_auth`
 * still requires a successful unauthenticated `/capabilities` call,
 * which is only possible when the daemon has not enforced auth — so
 * the gate's own 401 is the discovery surface for routes that opt in
 * to strict mode on otherwise-open daemons.
 */
export interface MutationGateOptions {
    /**
     * When true, this route refuses to serve unauthenticated callers
     * even on loopback no-token defaults. Used by Wave 4 mutation routes
     * (memory, file edit, tool enable, MCP restart, device-flow auth)
     * that should never be reachable without explicit operator opt-in.
     * Defaults to false so Wave 1-2 routes that already exist can adopt
     * the helper without behavior change.
     */
    strict?: boolean;
}
export interface CreateMutationGateDeps {
    /** Was the daemon configured with a bearer token? */
    tokenConfigured: boolean;
    /** Was `--require-auth` passed at boot? */
    requireAuth: boolean;
}
/**
 * Build a route-scoped mutation gate factory. Returns a function that
 * — given `MutationGateOptions` — yields an Express `RequestHandler`.
 *
 * Callers cache the factory at app construction time and invoke it per
 * route, e.g.:
 *
 *   const mutate = createMutationGate({ tokenConfigured, requireAuth });
 *   app.post('/workspace/memory', mutate({ strict: true }), handler);
 *   app.post('/session', mutate(), handler);
 *
 * The factory is hot-path-friendly: the strict-passthrough decision is
 * made once at construction and the returned handler is a cheap closure.
 */
export declare function createMutationGate(deps: CreateMutationGateDeps): (opts?: MutationGateOptions) => RequestHandler;
