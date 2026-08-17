/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonTransport } from './DaemonTransport.js';
/** Options for {@link negotiateTransport}. */
export interface NegotiateTransportOptions {
  /** Timeout for the capabilities probe and WS handshake. Default 5000ms. */
  probeTimeoutMs?: number;
  /**
   * `fetch` implementation used for the capabilities probe and threaded
   * into the constructed REST / ACP-HTTP transport. Defaults to the
   * global `fetch`. Supply this to inject auth headers, a proxy agent, or
   * a test double in environments where the global isn't what you want.
   */
  fetchFn?: typeof globalThis.fetch;
}
/**
 * Auto-detect the best available transport by probing the daemon's
 * `GET /capabilities` endpoint and inspecting the `transports` array.
 *
 * Preference order: `acp-ws` > `acp-http` > `rest`.
 *
 * For `acp-ws`, a WebSocket probe with timeout is performed. If the
 * probe fails (timeout, connection refused, etc.), the next-best
 * transport is tried.
 *
 * When the daemon's `/capabilities` response does not include a
 * `transports` field, the factory falls back to REST (the universal
 * baseline).
 *
 * Usage:
 * ```ts
 * const transport = await negotiateTransport(baseUrl, token);
 * const client = new DaemonClient({ baseUrl, token, transport });
 * ```
 */
export declare function negotiateTransport(
  baseUrl: string,
  token?: string,
  opts?: NegotiateTransportOptions,
): Promise<DaemonTransport>;
