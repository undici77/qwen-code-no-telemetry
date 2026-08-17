/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * CDP browser-level emulation layer for the Plan C "CDP tunnel" (issue #5626).
 *
 * A CDP client connects to the daemon's `/cdp`
 * WebSocket expecting a browser-level CDP endpoint, but behind the tunnel is a
 * single real tab driven via `chrome.debugger` (page-level only). This class
 * synthesizes the missing browser-level topology so puppeteer connects and gets
 * one page:
 *
 *   - a two-level `tab` -> `page` target tree, and
 *   - the recursive `Target.setAutoAttach` handshake puppeteer's
 *     `ExtensionTransport` relies on.
 *
 * Browser-domain commands are answered locally; page-domain commands (tagged
 * with the page session id) are forwarded to the real tab via
 * {@link CdpEmulatorCallbacks.forwardToTab}, and tab events are re-tagged with
 * the page session id on the way back via {@link CdpBrowserEmulator.emitTabEvent}.
 *
 * See `packages/chrome-extension/docs/06-plan-c-cdp-tunnel.md`.
 */
/** A CDP JSON-RPC frame on the wire (either direction). */
export interface CdpFrame {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
/** Hooks the tunnel wires into the emulator. */
export interface CdpEmulatorCallbacks {
  /** Send a CDP reply or event back to the puppeteer client. */
  reply(frame: CdpFrame): void;
  /** Optional diagnostic sink (e.g. unhandled browser-level CDP commands). */
  log?(line: string): void;
  /**
   * Run a page-domain command on the real tab (reverse WS -> extension
   * `chrome.debugger.sendCommand`). Resolves with the CDP `result`, or rejects
   * with a `{ code, message }`-shaped error.
   */
  forwardToTab(
    method: string,
    params: Record<string, unknown> | undefined,
  ): Promise<unknown>;
}
export interface CdpTabInfo {
  /** Current URL of the real tab (best-effort; refined once the page loads). */
  url?: string;
  /** Current title of the real tab. */
  title?: string;
}
export declare class CdpBrowserEmulator {
  private readonly cb;
  private tab;
  private readonly attachedPageSessions;
  private nextPageSessionId;
  private autoAttachActive;
  private pageSessionDetached;
  private droppedTabEvents;
  constructor(cb: CdpEmulatorCallbacks, tab?: CdpTabInfo);
  /**
   * Refresh the synthetic tab/page targetInfo (url/title) once the extension
   * acks `cdp_attach`, so puppeteer's `page.url()`/`page.title()` reflect the
   * real page rather than the `about:blank` placeholder used before attach.
   */
  setTabInfo(info: CdpTabInfo): void;
  private tabTargetInfo;
  private pageTargetInfo;
  /**
   * Handle one frame from the puppeteer client. Browser/tab-domain frames are
   * answered locally; page-session frames are forwarded to the real tab.
   */
  handleFromClient(frame: CdpFrame): Promise<void>;
  /**
   * Re-emit a CDP event that arrived from the real tab (via the extension) on
   * every page session this tunnel has minted: the auto-attach `PAGE_SESSION_ID`
   * plus each session created by an explicit `Target.attachToTarget`.
   *
   * This mirrors Chrome's per-session delivery — each attachment is an
   * independent subscription that gets its own copy of the page's events. The
   * auto-attach session only receives events after the `Target.setAutoAttach`
   * handshake on the tab session, so a client that uses only explicit
   * `Target.attachToTarget` does not pay for a duplicate stream it never
   * listens to. A client that deliberately attached twice would see an event
   * twice, exactly as it would against a real browser.
   */
  emitTabEvent(
    method: string,
    params: Record<string, unknown> | undefined,
  ): void;
}
