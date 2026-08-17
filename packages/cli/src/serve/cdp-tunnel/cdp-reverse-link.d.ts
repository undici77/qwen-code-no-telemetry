/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reverse link for the Plan C "CDP tunnel" (issue #5626).
 *
 * Bridges a {@link CdpBrowserEmulator} (browser-level CDP to a puppeteer client
 * over `/cdp`) to the Chrome extension's reverse `/acp` WebSocket. Page-domain
 * commands the emulator can't answer are forwarded to the real tab as
 * `cdp_command` frames; the extension runs them and replies with `cdp_result`,
 * and tab `cdp_event`s are re-tagged onto the page session by the emulator.
 *
 * One link is bound to ONE extension `/acp` connection (single daemon = single
 * extension = single browser). The `/acp` WS layer owns the socket and feeds
 * inbound `cdp_*` frames back into the link.
 *
 * See `packages/chrome-extension/docs/06-plan-c-cdp-tunnel.md`.
 */
import type { CdpBrowserEmulator } from './cdp-browser-emulator.js';
/** Outbound `cdp_*` frame types (daemon -> extension). */
export declare const CDP_FRAME_TYPES: {
  /** Ask the extension to `chrome.debugger.attach` the active tab. */
  readonly attach: 'cdp_attach';
  /** Ack from the extension that the tab is attached. */
  readonly attached: 'cdp_attached';
  /** A page-domain CDP command to run on the real tab. */
  readonly command: 'cdp_command';
  /** The result (or error) of a `cdp_command`, correlated by `id`. */
  readonly result: 'cdp_result';
  /** A CDP event emitted by the real tab. */
  readonly event: 'cdp_event';
  /** The tab/debugger detached (user opened DevTools, page crashed, …). */
  readonly detach: 'cdp_detach';
  /**
   * Tell the extension to release its `chrome.debugger` attachment because the
   * `/cdp` puppeteer client went away (the extension is still connected).
   */
  readonly release: 'cdp_release';
};
/** A `cdp_command` frame the daemon sends to the extension. */
export interface CdpCommandFrame {
  type: 'cdp_command';
  /** Correlation id for the matching `cdp_result`. */
  id: number;
  method: string;
  params?: Record<string, unknown>;
}
/** A `cdp_attach` frame the daemon sends to the extension. */
export interface CdpAttachFrame {
  type: 'cdp_attach';
  /** Correlation id for the matching `cdp_attached` ack. */
  id: number;
}
/**
 * A `cdp_release` frame the daemon sends when the bound `/cdp` puppeteer client
 * disconnects while the extension is still connected. The extension responds by
 * detaching `chrome.debugger` so the tab doesn't keep Chrome's debugging banner.
 */
export interface CdpReleaseFrame {
  type: 'cdp_release';
}
/** Any outbound frame this link pushes to the extension socket. */
export type CdpOutboundFrame =
  | CdpCommandFrame
  | CdpAttachFrame
  | CdpReleaseFrame;
/** A `cdp_result` frame the extension sends back for a `cdp_command`. */
export interface CdpResultFrame {
  type: 'cdp_result';
  id: number;
  result?: unknown;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
}
/** A `cdp_event` frame the extension forwards from the real tab. */
export interface CdpEventFrame {
  type: 'cdp_event';
  method: string;
  params?: Record<string, unknown>;
}
/** A `cdp_attached` ack frame from the extension. */
export interface CdpAttachedFrame {
  type: 'cdp_attached';
  id: number;
  /** Best-effort tab metadata for the emulator's synthetic targetInfo. */
  url?: string;
  title?: string;
  error?: {
    message?: string;
  };
}
/** A `cdp_detach` frame the extension sends when the debugger goes away. */
export interface CdpDetachFrame {
  type: 'cdp_detach';
  reason?: string;
}
/** Sink for pushing one outbound frame down the extension `/acp` socket. */
export type CdpSendToExtension = (frame: CdpOutboundFrame) => void;
/** Whether a frame's `type` is one the reverse link consumes (extension -> daemon). */
export declare function isCdpInboundFrameType(type: unknown): boolean;
/**
 * Bridges a single emulator to a single extension `/acp` connection. Created by
 * the `/cdp` endpoint glue, fed inbound frames by the `/acp` WS layer.
 */
export declare class CdpReverseLink {
  private readonly sendToExtension;
  private readonly commandTimeoutMs;
  /** Optional diagnostic sink for dropped/unexpected inbound frames. */
  private readonly log?;
  private emulator;
  private nextId;
  private readonly pending;
  private disposed;
  private attached;
  private attachPromise;
  /** Resolver for the in-flight `cdp_attach` (if any). */
  private pendingAttach;
  /** Called when the extension reports the tab detached. */
  onDetach: ((reason: string) => void) | undefined;
  /** Called when lazy `cdp_attach` fails before any page command can run. */
  onAttachFailure: ((reason: string) => void) | undefined;
  constructor(
    sendToExtension: CdpSendToExtension,
    commandTimeoutMs?: number,
    /** Optional diagnostic sink for dropped/unexpected inbound frames. */
    log?: ((line: string) => void) | undefined,
  );
  /** Wire the emulator whose `forwardToTab` this link backs. */
  bindEmulator(emulator: CdpBrowserEmulator): void;
  /**
   * The {@link CdpEmulatorCallbacks.forwardToTab} implementation: send a
   * `cdp_command` to the extension and await the correlated `cdp_result`.
   */
  readonly forwardToTab: (
    method: string,
    params: Record<string, unknown> | undefined,
  ) => Promise<unknown>;
  /**
   * Ask the extension to attach `chrome.debugger` to the active tab. Resolves
   * once the extension acks `cdp_attached` (or rejects on error/timeout).
   */
  attach(): Promise<{
    url?: string;
    title?: string;
  }>;
  /**
   * Feed one inbound frame from the extension `/acp` socket. Returns true if
   * the frame was consumed by this link (so the WS layer can skip it).
   */
  handleInbound(frame: Record<string, unknown>): boolean;
  private handleResult;
  private handleEvent;
  private handleAttached;
  private handleDetach;
  private armTimeout;
  private armProgressLog;
  private settleResolve;
  private settleReject;
  /** In-flight forwarded-command count (for tests / accounting). */
  pendingCount(): number;
  /** Reject all pending commands and stop accepting new ones. Idempotent. */
  dispose(reason?: string): void;
}
