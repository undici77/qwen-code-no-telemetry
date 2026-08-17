/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Reusable helpers for `qwen serve` daemon tests:
 *
 *   - `spawnDaemon` lifts the inline `beforeAll` boot pattern from
 *     `qwen-serve-routes.test.ts` / `qwen-serve-streaming.test.ts` into one
 *     place so test files don't reimplement port-0 wait + token + workspace
 *     pinning + SIGTERM teardown.
 *   - `getRssMB` / `startRssPolling` sample the daemon process's RSS via
 *     `ps -o rss=`. POSIX-only (no Windows). Used to capture the RSS curve
 *     across session counts.
 *   - `countDescendants` walks the daemon's process tree via `pgrep -P`
 *     (matches the existing inline pattern at
 *     `qwen-serve-streaming.test.ts:144`, with optional filtered subtree
 *     matching). Used to surface the P1 "MCP child × session"
 *     amplification before the M2 shared-pool fix.
 *   - `percentiles` is a dependency-free p50/p90/p99 calculator for the
 *     prompt-latency suite.
 *   - `consumeSseEvents` drives the daemon's SSE stream at a configurable
 *     rate so the SSE backpressure tests can observe `client_evicted`.
 *
 * Skip-on-Windows is the caller's responsibility: at the top of every test
 * file that imports this harness, gate with
 * `if (process.platform === 'win32') describe.skip(...)`. The harness
 * functions assume `ps` and `pgrep` are present.
 */
import { type ChildProcess } from 'node:child_process';
import { DaemonClient, type SubscribeOptions } from '@qwen-code/sdk';
import { type MCPServerConfig } from '@qwen-code/qwen-code-core';
/**
 * Default workspace and CLI binary resolution mirrors the existing
 * `qwen-serve-routes.test.ts` constants so callers that copy/paste between
 * test files don't see drift.
 */
export declare const DEFAULT_REPO_ROOT: string;
export declare const DEFAULT_TOKEN = 'integration-test-token';
export declare const DEFAULT_CLI_BIN: string;
export interface SpawnDaemonOptions {
  /**
   * Workspace path the daemon binds to (`--workspace`). Defaults to repo
   * root. Tests measuring MCP amplification or wanting their own settings
   * file should pass a temp dir created via `prepareWorkspace`.
   */
  workspaceCwd?: string;
  /** Bearer token. Defaults to the same string the existing tests use. */
  token?: string;
  /** CLI binary path. Defaults to `TEST_CLI_PATH` env or `dist/cli.js`. */
  cliBin?: string;
  /** Boot deadline for the listening-on regex parse. Default 10s. */
  bootTimeoutMs?: number;
  /** Extra args appended after the standard ones. */
  extraArgs?: string[];
  /** Optional env additions for the spawned daemon. */
  env?: Record<string, string>;
}
export interface SpawnedDaemon {
  client: DaemonClient;
  daemon: ChildProcess;
  port: number;
  base: string;
  workspaceCwd: string;
  token: string;
  /** Drain stdout into this buffer for post-mortem if a test fails. */
  stdoutBuf: {
    value: string;
  };
  /** Drain stderr similarly — surface on dispose if exit code != 0. */
  stderrBuf: {
    value: string;
  };
  /** Idempotent. Sends SIGTERM, awaits exit (up to 5s). */
  dispose: () => Promise<void>;
}
export declare const LISTENING_LINE_RE: RegExp;
export declare function spawnDaemon(
  opts?: SpawnDaemonOptions,
): Promise<SpawnedDaemon>;
/**
 * Write a `.qwen/settings.json` into `workspaceCwd` so the daemon picks up
 * `mcpServers` (and any other settings) at boot. Caller is responsible for
 * cleaning up the temp dir if they created one. Returns the absolute
 * settings file path for visibility in test output.
 */
export declare function writeWorkspaceSettings(
  workspaceCwd: string,
  settings: Record<string, unknown>,
): string;
/**
 * Pre-approve gated (workspace / project scope, #4615) MCP servers for
 * `workspaceCwd` so the daemon's `qwen --acp` child connects them instead of
 * skipping them as pending-approval. Servers declared in `.qwen/settings.json`
 * are workspace-scoped and therefore gated: absent a stored approval, discovery
 * skips them BEFORE any spawn, which makes the MCP-amplification suite time out
 * waiting for grandchildren that never appear.
 *
 * Writes a standalone approvals file (NOT the developer's global
 * `~/.qwen/mcpApprovals.json`) under the workspace and returns the env that
 * points the daemon — and, by inheritance, its acp child — at it. Pass the
 * returned env to `spawnDaemon({ env })`. The approval hash binds to the same
 * behavioral fields the child hashes (`scope` is provenance-only and excluded),
 * so the plain settings config is sufficient. Mirrors the pre-approval pattern
 * in `simple-mcp-server.test.ts`.
 */
export declare function approveWorkspaceMcpServers(
  workspaceCwd: string,
  servers: Record<string, MCPServerConfig>,
): Record<string, string>;
/**
 * One-shot RSS read via `ps -o rss= -p <pid>`. Returns megabytes (rounded
 * to 1 decimal). Returns NaN if the process is gone or `ps` errored — call
 * sites should treat NaN as "skip this sample" rather than fail loudly.
 */
export declare function getRssMB(pid: number): number;
export interface RssSample {
  tMs: number;
  rssMB: number;
}
export interface RssPoller {
  samples: RssSample[];
  droppedSamples: number;
  stop(): void;
}
export declare function startRssPolling(
  pid: number,
  intervalMs?: number,
): RssPoller;
/**
 * Walk daemon → ACP child → MCP descendants via `pgrep -P` calls.
 * Pattern starts with the existing inline approach at
 * `qwen-serve-streaming.test.ts:144`. When `pgrepOpts.mcpFilter` is
 * supplied, matching MCP processes are searched recursively within each
 * ACP child subtree because the ACP transport can introduce an extra
 * `qwen --acp` process between the daemon-facing ACP child and stdio MCP
 * servers.
 *
 * `pgrepOpts.acpFilter` defaults to `'qwen.*--acp'` (matches the spawned
 * `qwen --acp` child); pass an override only if a future bridge changes
 * the ACP child invocation shape.
 *
 * Returns explicit PID arrays so callers can cross-check (e.g., assert
 * the ACP child PID matches what the test setup observed). `total` is
 * the sum.
 */
export interface DescendantCount {
  acpChildren: number[];
  mcpGrandchildren: number[];
  total: number;
}
export declare function countDescendants(
  daemonPid: number,
  pgrepOpts?: {
    acpFilter?: string;
    mcpFilter?: string;
  },
): DescendantCount;
/**
 * Compute p50 / p90 / p99 / mean / min / max from a numeric array. Uses
 * nearest-rank percentile (no interpolation) to keep behavior predictable
 * across small sample sizes. Returns all-NaN for an empty input rather
 * than throwing — callers handle the "no samples" case downstream.
 */
export interface Percentiles {
  count: number;
  p50: number;
  p90: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
}
export declare function percentiles(values: number[]): Percentiles;
/**
 * Drive an SSE subscription at a configurable consumption rate. Returns
 * total events received, whether `client_evicted` fired (and the event
 * id when it did), plus elapsed time. `consumerDelayMs` introduces a
 * sleep between each consumed event so the test can simulate a slow
 * client and observe ring-buffer / per-subscriber-queue eviction.
 *
 * Callers that only want the live event stream should pass
 * `consumerDelayMs: 0`. Callers that want a fixed-window probe (e.g. to
 * verify the heartbeat fires on idle) can set `timeoutMs` and a small
 * `maxEvents` cap.
 */
export interface ConsumeSseResult {
  received: number;
  /** The last non-undefined `ev.id` observed (for `Last-Event-ID` reconnect). */
  lastSeenId?: number;
  evictedAt?: number;
  evictionReason?: string;
  elapsedMs: number;
}
export declare function consumeSseEvents(
  client: DaemonClient,
  sessionId: string,
  opts?: {
    maxEvents?: number;
    consumerDelayMs?: number;
    timeoutMs?: number;
    subscribe?: SubscribeOptions;
  },
): Promise<ConsumeSseResult>;
export declare function sleep(ms: number): Promise<void>;
export declare function gitHead(timeoutMs?: number): string | null;
export declare function makeTempWorkspace(
  label: string,
  prefix?: string,
): string;
export interface ScenarioResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
  metrics?: Record<string, unknown>;
}
