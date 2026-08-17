/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Daemon discovery: probe `GET /health` to decide whether a local `qwen serve`
 * daemon is reachable before the side panel opens a session — so the UI can show
 * a "start `qwen serve`" hint instead of a broken chat.
 */
import type { DaemonConfig } from './config.js';
export type DaemonHealth =
  | {
      reachable: true;
      status: string;
    }
  | {
      reachable: false;
      error: string;
    };
/** Probe the daemon's `/health` endpoint with a short timeout. */
export declare function checkDaemonHealth(
  config: DaemonConfig,
  timeoutMs?: number,
): Promise<DaemonHealth>;
