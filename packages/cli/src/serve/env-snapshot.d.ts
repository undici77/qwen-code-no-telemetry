/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ServeWorkspaceEnvStatus } from '@qwen-code/acp-bridge/status';
export declare function snapshotProcessEnv(): Record<string, string | undefined>;
/**
 * Resolve a proxy env var, preferring the uppercase canonical form and
 * falling back to the lowercase variant only when the uppercase is
 * **absent** (`undefined`). Exported solely so tests can verify the
 * `??`-vs-`||` semantics with an injected env object — `process.env`
 * itself is case-insensitive on Windows, so the production caller passes
 * a snapshot of `process.env` while the unit test passes a plain JS
 * object with both keys distinct.
 */
export declare function readProxyVar(env: NodeJS.ProcessEnv, name: string): string | undefined;
/**
 * Build the daemon's environment snapshot from `process.*` state. Pure
 * function — no I/O, no ACP roundtrip, no globals beyond `process.env`.
 *
 * The daemon owns runtime locality: all checks reflect the daemon
 * process, not a client-side environment.
 */
export declare function buildEnvStatusFromProcess(workspaceCwd: string, acpChannelLive: boolean): ServeWorkspaceEnvStatus;
export declare function buildEnvStatusFromEnv(workspaceCwd: string, acpChannelLive: boolean, sourceEnv: Readonly<NodeJS.ProcessEnv>): ServeWorkspaceEnvStatus;
/** Exposed for tests and protocol docs. */
export declare const ENV_SECRET_VARS: readonly string[];
export declare const ENV_NONSECRET_VARS: readonly string[];
export declare const ENV_PROXY_VARS: readonly string[];
