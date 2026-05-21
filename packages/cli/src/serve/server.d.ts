/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import { DeviceFlowRegistry, type DeviceFlowProvider } from './auth/deviceFlow.js';
import { type HttpAcpBridge } from './httpAcpBridge.js';
import { type BridgeEvent } from './eventBus.js';
import { type ServeOptions } from './types.js';
import { type WorkspaceFileSystemFactory } from './fs/index.js';
/**
 * Build a no-op fs-audit emitter that logs a warning every
 * `WARN_EVERY` dropped events with as much context as the audit
 * payload exposes. The default factory uses this so a regression
 * that silently strips audit events shows up in operator logs
 * instead of disappearing — the earlier one-shot warn was a
 * permanent silent no-op after the first event, which made a PR
 * 19/20 regression where `runQwenServe` forgets to inject the real
 * factory completely invisible (every write 403s; nothing in
 * audit; one stale stderr line easy to miss for background
 * daemons). Periodic warning + dropped-event count + first-event
 * `errorKind` + `pathHash` make the regression actionable.
 *
 * PR 19/20's `runQwenServe` injection replaces this with a real
 * per-session emit, so legitimate production traffic never hits
 * the warning.
 */
export declare function createDefaultFsAuditEmit(): (event: BridgeEvent) => void;
export interface ServeAppDeps {
    /** Bridge instance; tests inject a fake. Defaults to a fresh real one. */
    bridge?: HttpAcpBridge;
    /**
     * Pre-canonicalized workspace path. When supplied, `createServeApp`
     * skips its own `canonicalizeWorkspace` call (which would issue a
     * redundant `realpathSync.native` syscall — idempotent, but a hot
     * boot-time stat we can avoid). `runQwenServe` passes this after
     * its own boot-time canonicalize so the value used by
     * `/capabilities`, the `POST /session` cwd fallback, and the
     * bridge are all the SAME canonical form. Callers that haven't
     * canonicalized yet (tests, direct embeds) omit this and
     * `createServeApp` falls back to canonicalizing `opts.workspace ??
     * process.cwd()` itself.
     */
    boundWorkspace?: string;
    /**
     * Workspace filesystem boundary factory (#4175 PR 18). When
     * supplied, PR 19/20 routes will pull a per-request
     * `WorkspaceFileSystem` off it; when omitted, `createServeApp`
     * builds a strict default (`trusted: false`, warn-once no-op
     * `emit`) so an upstream refactor that forgets to inject
     * `fsFactory` never silently allows writes against an untrusted
     * workspace. No PR 18 routes consume the factory yet — the slot
     * is wired so PR 19 read-only file routes can drop in without
     * re-shaping `ServeAppDeps`. Once PR 19 lands, `runQwenServe`
     * will inject a factory whose `trusted` flag mirrors
     * `Config.isTrustedFolder()` and whose `emit` plumbs into the
     * per-session EventBus.
     */
    fsFactory?: WorkspaceFileSystemFactory;
    /**
     * Issue #4175 PR 21 — device-flow auth registry. Tests inject a fake
     * (`now` / `schedule` overrides for deterministic timer control,
     * stubbed providers, captured event sink). Production callers omit
     * this and `createServeApp` constructs a default wired to the
     * shipped Qwen provider, the bridge's `publishWorkspaceEvent`,
     * and a stderr audit sink.
     */
    deviceFlowRegistry?: DeviceFlowRegistry;
    /**
     * Issue #4175 PR 21 — extra device-flow providers for tests / future
     * extensions. Production builds register only `QwenOAuthDeviceFlowProvider`;
     * passing extra entries here registers them in addition to the default
     * Qwen provider. Used by tests that stub the OAuth flow.
     */
    deviceFlowProviders?: DeviceFlowProvider[];
}
/**
 * Build the Express app for `qwen serve`. Pure function — no side effects on
 * the network or process; `runQwenServe` does the listen/signal handling.
 *
 * `getPort` is invoked lazily by the host-allowlist middleware so callers
 * binding to port 0 (ephemeral) can supply the actual port after `listen()`
 * resolves. Defaults to `opts.port` for callers (e.g. tests) that pin a port
 * up front.
 *
 * Stage 1 routes shipped (matches §04 of issue #3803):
 *   - `GET  /health`
 *   - `GET  /capabilities`
 *   - `GET  /workspace/mcp`
 *   - `GET  /workspace/skills`
 *   - `GET  /workspace/providers`
 *   - `GET  /workspace/env`
 *   - `GET  /workspace/preflight`
 *   - `POST /session`
 *   - `POST /session/:id/load`
 *   - `POST /session/:id/resume`
 *   - `GET  /workspace/:id/sessions`
 *   - `GET  /session/:id/context`
 *   - `GET  /session/:id/supported-commands`
 *   - `POST /session/:id/prompt`
 *   - `POST /session/:id/cancel`
 *   - `POST /session/:id/heartbeat`
 *   - `POST /session/:id/model`
 *   - `GET  /session/:id/events` (SSE)
 *   - `POST /session/:id/permission/:requestId`
 *   - `POST /permission/:requestId`
 *
 * **Workspace validation contract.** `createServeApp` itself does NOT
 * verify that `opts.workspace` exists or is a directory — it
 * canonicalizes via `canonicalizeWorkspace`, which falls back to
 * `path.resolve` on ENOENT so the app boots even against a missing
 * path. `runQwenServe` is the production entry point and DOES
 * perform the `fs.statSync` + `isDirectory()` boot-loud check before
 * calling this function. Tests inject synthetic paths (`/work/bound`
 * etc.) on purpose: they want to exercise the route layer's
 * canonicalization and `workspace_mismatch` translation without
 * needing a real directory on disk. If a future entry point binds
 * `createServeApp` directly to user input, it MUST replicate the
 * `runQwenServe` validation (or call into a shared helper if one is
 * extracted) — otherwise a non-existent `--workspace` would boot
 * a "healthy"-looking daemon whose every spawn fails with cryptic
 * child-process ENOENT.
 */
export declare function createServeApp(opts: ServeOptions, getPort?: () => number, deps?: ServeAppDeps): Application;
