/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChannelFactory } from './channel.js';
import {
  type NdJsonStreamHooks,
  type NdJsonStreamLimits,
} from './ndJsonStream.js';
import { ProcessRegistry } from './process-registry.js';
import type { ChildHeapPolicy } from './child-heap-policy.js';
export declare const DAEMON_ACP_NDJSON_LIMITS: Readonly<NdJsonStreamLimits>;
export declare function getAcpMemoryArgs(): string[];
export interface StderrForwarderOptions {
  prefix: string;
  onDiagnosticLine?: (line: string, level?: 'info' | 'warn' | 'error') => void;
}
/**
 * Creates a stateful forwarder that buffers incoming chunks, splits on
 * newlines, writes each complete line to `process.stderr` with a prefix,
 * and optionally invokes `onDiagnosticLine` for external consumers (e.g.
 * the daemon log file writer).
 *
 * Cap behavior: if the unterminated buffer exceeds 64 KiB the excess is
 * force-flushed with a `[truncated]` marker — same memory-bounding
 * behavior as before the extraction.
 */
export declare function createStderrForwarder(opts: StderrForwarderOptions): {
  onData: (chunk: string) => void;
  onEnd: () => void;
};
export interface SpawnChannelFactoryOptions {
  onDiagnosticLine?: (line: string, level?: 'info' | 'warn' | 'error') => void;
  extraArgs?: string[];
  pipeHooks?: NdJsonStreamHooks;
  pipeLimits?: NdJsonStreamLimits;
  sourceEnv?: Readonly<NodeJS.ProcessEnv>;
  processRegistry?: ProcessRegistry;
  /**
   * Daemon child-heap policy. Only meaningful together with a **shared**
   * `processRegistry`: the factory otherwise builds its own, every spawn sees
   * a concurrent count of 1, and each child is handed the whole pool — the
   * current overcommit, now with a policy object attesting to it. All three
   * daemon factories pass the same registry.
   *
   * Omitted by every single-child caller (interactive CLI, IDE companion,
   * direct-embed), which keeps the host-derived ceiling.
   */
  childHeapPolicy?: ChildHeapPolicy;
}
/**
 * Creates a `ChannelFactory` that spawns `qwen --acp` child processes.
 * Accepts an optional `onDiagnosticLine` callback that receives every
 * child-stderr line (already prefixed) so callers can tee to a log file
 * or structured logger without intercepting process.stderr globally.
 *
 * `defaultSpawnChannelFactory` below is `createSpawnChannelFactory()` —
 * no options, same behavior as before this refactor.
 */
export declare function createSpawnChannelFactory(
  options?: SpawnChannelFactoryOptions,
): ChannelFactory;
/**
 * Default channel factory: spawn the current Node executable running this
 * CLI's entry script in `--acp` mode. `process.argv[1]` resolves to the qwen
 * entry script when launched via the `qwen` bin shim.
 *
 * Note on `cwd`: CodeQL flags the `workspaceCwd` flow into `spawn({cwd})`
 * as an "uncontrolled data used in path expression" finding. That's the
 * Stage 1 trust model speaking — the caller (a token-authenticated HTTP
 * client) is treated as an extension of the operator. The agent already
 * runs as the same UID with shell-tool access, so restricting the spawn
 * cwd to a sandbox here would be theatre. Stage 4+ remote-sandbox swaps
 * this factory for a sandbox-aware variant; see the remote-sandbox plan.
 *
 * Lifted from `cli/src/serve/httpAcpBridge.ts` to `@qwen-code/acp-bridge`
 * so `channels/base/AcpBridge.ts` and the VSCode IDE
 * companion can share one spawn implementation instead of each
 * reimplementing the child lifecycle (the current divergence noted in
 * `channel.ts`'s top-of-file comment).
 *
 * Preserved as `createSpawnChannelFactory()` (no options) for backward
 * compat. Use `createSpawnChannelFactory({ onDiagnosticLine })` to also
 * tee child stderr lines through an external callback.
 */
export declare const defaultSpawnChannelFactory: ChannelFactory;
/**
 * Build the env passed to the `qwen --acp` child. Pure function, exported
 * for unit-test access (the surrounding `defaultSpawnChannelFactory` is
 * unit-test-hostile because it actually spawns Node). Behavior:
 *
 *   1. Start from a shallow clone of `source` (no aliasing into the
 *      daemon's `process.env`).
 *   2. Delete every key listed in `scrubbed` (the daemon-internal
 *      child-env denylist; see the rationale on the constant).
 *   3. Apply `overrides` per-handle. `undefined` value deletes the key
 *      (lets an embedded caller scrub a stale inherited var without
 *      mutating the daemon's global `process.env`). Anything else
 *      assigns. **`overrides` CANNOT re-introduce a scrubbed key** —
 *      defense-in-depth so an operator passing
 *      `{ QWEN_SERVER_TOKEN: 'x' }` in overrides can't smuggle the
 *      daemon's bearer token back into the child.
 *
 * Used by `defaultSpawnChannelFactory` above. The split mirrors the
 * "scrub" comment block's structure 1:1; behavior is byte-identical to
 * the pre-extraction inline implementation.
 */
export declare function scrubChildEnv(
  source: NodeJS.ProcessEnv,
  scrubbed: ReadonlySet<string>,
  overrides?: Readonly<Record<string, string | undefined>>,
): NodeJS.ProcessEnv;
