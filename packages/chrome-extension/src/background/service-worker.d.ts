/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Daemon CDP client — the entire extension service worker (Plan C, issue #5626).
 *
 * A dumb CDP-tunnel pipe: connects to the local `qwen serve` daemon's `/acp`
 * WebSocket and bridges `cdp_*` frames into `chrome.debugger` via
 * {@link handleCdpFrame}. No chat UI — chat lives in the daemon web UI.
 *
 * On open we send an ACP `initialize`: the daemon closes the socket on a 30s
 * timeout otherwise, and registers this connection as the CDP bridge at that
 * moment.
 */
export {};
