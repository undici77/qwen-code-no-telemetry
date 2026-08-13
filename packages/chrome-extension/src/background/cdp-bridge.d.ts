/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * CDP bridge — the extension side of the Plan C "CDP tunnel" (issue #5626).
 *
 * The daemon's `/cdp` endpoint forwards page-domain CDP commands to this module
 * over the reverse `/acp` WebSocket as `cdp_*` frames; here we drive the active
 * tab with `chrome.debugger`:
 *
 *   - `cdp_attach`  → attach the active tab; ack `cdp_attached`
 *   - `cdp_command` → `chrome.debugger.sendCommand`; reply `cdp_result`
 *   - debugger events  → `cdp_event`
 *   - debugger detach  → `cdp_detach`
 *
 * Single tab, single debugger.
 *
 * See `packages/chrome-extension/docs/06-plan-c-cdp-tunnel.md`.
 */
/** Any outbound `cdp_*` frame (extension → daemon). */
type CdpOutbound = {
    type: 'cdp_result';
    id: number;
    result?: unknown;
    error?: {
        code?: number;
        message?: string;
    };
} | {
    type: 'cdp_event';
    method: string;
    params?: Record<string, unknown>;
} | {
    type: 'cdp_attached';
    id: number;
    url?: string;
    title?: string;
    error?: {
        message: string;
    };
} | {
    type: 'cdp_detach';
    reason: string;
};
/** Sink that pushes one outbound frame down the daemon `/acp` socket. */
type CdpSend = (frame: CdpOutbound) => void;
/** Whether a frame `type` is one this bridge owns (daemon → extension). */
export declare function isCdpBridgeFrame(type: unknown): boolean;
/**
 * Route one inbound `cdp_*` frame from the daemon. The caller filters with
 * {@link isCdpBridgeFrame} first. `send` pushes outbound frames down the same
 * socket; it is recorded as the active sink so events/detach reach the daemon.
 */
export declare function handleCdpFrame(frame: {
    type?: unknown;
}, send: CdpSend): void;
/**
 * Tear down the bridge: detach the debugger and stop forwarding. Called when
 * the daemon socket closes so a stale attachment doesn't linger. Idempotent.
 */
export declare function shutdownCdpBridge(): void;
export {};
