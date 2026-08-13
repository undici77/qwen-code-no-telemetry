/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * `/cdp` endpoint glue for the Plan C "CDP tunnel" (issue #5626).
 *
 * Per CDP client connection this wires:
 *
 *   puppeteer  --raw CDP-->  CdpBrowserEmulator  --forwardToTab-->  CdpReverseLink
 *                                                                        |
 *                                            extension `/acp` socket  <--+
 *
 * The emulator answers browser-level CDP locally and forwards page-domain
 * commands to the real tab over the reverse link; tab events flow back. One
 * `/cdp` connection binds to the (single) active extension bridge in the
 * {@link CdpTunnelRegistry}; if no extension is connected the socket is closed
 * immediately with a clear reason.
 *
 * See `packages/chrome-extension/docs/06-plan-c-cdp-tunnel.md`.
 */
import type { WebSocket } from 'ws';
import type { CdpTunnelRegistry } from './cdp-tunnel-registry.js';
/**
 * Attach a single puppeteer `/cdp` WebSocket to the active extension bridge.
 * Closes the socket immediately if no extension is connected.
 *
 * @param ws the upgraded puppeteer WebSocket
 * @param registry the process-scoped tunnel registry
 * @param log structured stderr logger (e.g. `writeStderrLine`)
 */
export declare function attachCdpClient(ws: WebSocket, registry: CdpTunnelRegistry, log: (line: string) => void): void;
