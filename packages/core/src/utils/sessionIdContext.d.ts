/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * Per-async-context session ID, mirroring {@link promptIdContext}.
 *
 * `QWEN_CODE_SESSION_ID` historically lived only in `process.env`, which is
 * a single process-global slot. That is fine for the interactive CLI (one
 * session per process, switched via `Config.startNewSession()`), but breaks
 * in daemon mode where one process hosts many concurrent sessions: only the
 * first `Config` ever claims the env slot (see `sessionEnvClaimed` in
 * config.ts), so shells spawned by every later session would read a stale
 * session ID.
 *
 * Daemon-style hosts should wrap each session's execution entry points in
 * `sessionIdContext.run(sessionId, ...)`. `getShellContextEnvVars()` prefers
 * this context over `process.env`, falling back to the env var so the
 * single-session CLI behavior is unchanged.
 */
export declare const sessionIdContext: AsyncLocalStorage<string>;
export declare function registerSessionProjectDir(
  sessionId: string,
  projectDir: string,
): void;
export declare function getSessionProjectDir(
  sessionId: string,
): string | undefined;
/**
 * Drop a session's entry when it ends.
 *
 * The map would otherwise grow one entry per session for the life of a daemon
 * process. A session's own dispose path calls this; a single-session CLI never
 * needs to, since the process is the session.
 */
export declare function unregisterSessionProjectDir(sessionId: string): void;
export declare function registerSessionModel(
  sessionId: string,
  model: string,
): void;
export declare function getSessionModel(sessionId: string): string | undefined;
/**
 * Drop a session's entry when it ends, for the same reason as
 * {@link unregisterSessionProjectDir}: the map would otherwise grow one entry
 * per session for the life of a daemon process.
 */
export declare function unregisterSessionModel(sessionId: string): void;
