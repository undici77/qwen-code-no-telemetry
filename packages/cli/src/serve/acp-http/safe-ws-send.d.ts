/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WebSocket } from 'ws';
/**
 * Send `payload` on `ws` only if the socket is still open. Post-async sends —
 * client-MCP acks/requests that await a provider round-trip, and CDP frames
 * pushed in from the `/cdp` glue — can race the extension disconnecting: a bare
 * `ws.send()` on a CLOSED/CLOSING socket throws, and (unguarded, outside the
 * message handler's try/catch) that rejection can take the daemon down. Match
 * `WsStream`'s instance-level `OPEN` check so a late send is a silent no-op.
 *
 * `context` labels the dropped frame's surface (e.g. `CDP`, `client-MCP`) so a
 * tunnel that's been quietly cut shows up in the logs under `QWEN_SERVE_DEBUG`
 * instead of disappearing without a trace.
 */
export declare function safeWsSend(
  ws: WebSocket,
  payload: string,
  context?: string,
): void;
