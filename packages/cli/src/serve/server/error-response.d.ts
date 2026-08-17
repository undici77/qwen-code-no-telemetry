/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Response } from 'express';
import type { DaemonLogger } from '../daemon-logger.js';
export type BridgeErrorContext = {
  route?: string;
  sessionId?: string;
  [key: string]: string | number | boolean | undefined;
};
export type SendBridgeError = (
  res: Response,
  err: unknown,
  ctx?: BridgeErrorContext,
) => void;
export declare function sendPermissionVoteError(
  res: Response,
  err: unknown,
  ctx: {
    route: string;
    sessionId?: string;
  },
  daemonLog?: DaemonLogger,
): void;
/**
 * Map a thrown bridge error to an HTTP response.
 *
 * `ctx` is operator-facing: route + sessionId folded into the stderr
 * log line so a bare `ECONNRESET` / `ENOMEM` stack trace is
 * attributable to a specific session and request without having to
 * timestamp-correlate against client logs. Pass via the route handlers
 * — see how they call `sendBridgeError(res, err, { route: 'POST
 * /session/:id/prompt', sessionId })`. Optional so test/dev call
 * sites that don't care about the log can omit it.
 */
export declare function sendBridgeError(
  res: Response,
  err: unknown,
  ctx?: BridgeErrorContext,
  daemonLog?: DaemonLogger,
): void;
/**
 * Coerce an arbitrary thrown value to a useful string. Plain `String(err)`
 * yields `[object Object]` for JSON-RPC-shaped errors (`{code, message,
 * data}`) which are exactly what the ACP SDK forwards from the agent. Try
 * the `message` field first, fall back to JSON-stringify, then `String`.
 */
export declare function errorMessage(err: unknown): string;
