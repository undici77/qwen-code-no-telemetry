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
/** Outbound `cdp_*` frame types (daemon -> extension). */
export const CDP_FRAME_TYPES = {
    /** Ask the extension to `chrome.debugger.attach` the active tab. */
    attach: 'cdp_attach',
    /** Ack from the extension that the tab is attached. */
    attached: 'cdp_attached',
    /** A page-domain CDP command to run on the real tab. */
    command: 'cdp_command',
    /** The result (or error) of a `cdp_command`, correlated by `id`. */
    result: 'cdp_result',
    /** A CDP event emitted by the real tab. */
    event: 'cdp_event',
    /** The tab/debugger detached (user opened DevTools, page crashed, …). */
    detach: 'cdp_detach',
    /**
     * Tell the extension to release its `chrome.debugger` attachment because the
     * `/cdp` puppeteer client went away (the extension is still connected).
     */
    release: 'cdp_release',
};
/** Default per-command timeout (ms). Puppeteer's protocolTimeout is 180s. */
const DEFAULT_COMMAND_TIMEOUT_MS = 170_000;
const COMMAND_PROGRESS_LOG_MS = 30_000;
/** Whether a frame's `type` is one the reverse link consumes (extension -> daemon). */
export function isCdpInboundFrameType(type) {
    return (type === CDP_FRAME_TYPES.result ||
        type === CDP_FRAME_TYPES.event ||
        type === CDP_FRAME_TYPES.attached ||
        type === CDP_FRAME_TYPES.detach);
}
function isCdpInboundFrame(frame) {
    return isCdpInboundFrameType(frame.type);
}
/**
 * Bridges a single emulator to a single extension `/acp` connection. Created by
 * the `/cdp` endpoint glue, fed inbound frames by the `/acp` WS layer.
 */
export class CdpReverseLink {
    sendToExtension;
    commandTimeoutMs;
    log;
    emulator;
    nextId = 1;
    pending = new Map();
    disposed = false;
    attached = false;
    attachPromise;
    /** Resolver for the in-flight `cdp_attach` (if any). */
    pendingAttach;
    /** Called when the extension reports the tab detached. */
    onDetach;
    /** Called when lazy `cdp_attach` fails before any page command can run. */
    onAttachFailure;
    constructor(sendToExtension, commandTimeoutMs = DEFAULT_COMMAND_TIMEOUT_MS, 
    /** Optional diagnostic sink for dropped/unexpected inbound frames. */
    log) {
        this.sendToExtension = sendToExtension;
        this.commandTimeoutMs = commandTimeoutMs;
        this.log = log;
    }
    /** Wire the emulator whose `forwardToTab` this link backs. */
    bindEmulator(emulator) {
        this.emulator = emulator;
    }
    /**
     * The {@link CdpEmulatorCallbacks.forwardToTab} implementation: send a
     * `cdp_command` to the extension and await the correlated `cdp_result`.
     */
    forwardToTab = async (method, params) => {
        if (this.disposed) {
            throw { code: -32000, message: 'CDP tunnel closed' };
        }
        await this.attach();
        return new Promise((resolve, reject) => {
            if (this.disposed) {
                reject({ code: -32000, message: 'CDP tunnel closed' });
                return;
            }
            const id = this.nextId++;
            const timer = this.armTimeout(id, `CDP command id=${id} method=${method} timed out after ${this.commandTimeoutMs}ms`);
            const progressTimer = this.armProgressLog(id, method);
            this.pending.set(id, { resolve, reject, timer, progressTimer });
            try {
                this.log?.(`qwen serve: /cdp forwarded command id=${id} method=${method} to extension`);
                this.sendToExtension({
                    type: CDP_FRAME_TYPES.command,
                    id,
                    method,
                    params,
                });
            }
            catch (err) {
                this.settleReject(id, {
                    code: -32000,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        });
    };
    /**
     * Ask the extension to attach `chrome.debugger` to the active tab. Resolves
     * once the extension acks `cdp_attached` (or rejects on error/timeout).
     */
    attach() {
        if (this.attached)
            return Promise.resolve({});
        if (this.attachPromise)
            return this.attachPromise;
        this.attachPromise = new Promise((resolve, reject) => {
            if (this.disposed) {
                reject({ code: -32000, message: 'CDP tunnel closed' });
                return;
            }
            const id = this.nextId++;
            const timer = this.armTimeout(id, 'cdp_attach timed out');
            // Reuse the PendingCommand shape; result carries the tab metadata.
            this.pendingAttach = {
                id,
                pending: {
                    resolve: (result) => resolve((result ?? {})),
                    reject,
                    timer,
                },
            };
            try {
                this.sendToExtension({ type: CDP_FRAME_TYPES.attach, id });
            }
            catch (err) {
                clearTimeout(timer);
                this.pendingAttach = undefined;
                reject({
                    code: -32000,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }).then((info) => {
            this.emulator?.setTabInfo(info);
            return info;
        }, (err) => {
            this.attached = false;
            this.onAttachFailure?.(err instanceof Error
                ? err.message
                : (err?.message ??
                    String(err)));
            throw err;
        });
        void this.attachPromise
            .finally(() => {
            this.attachPromise = undefined;
        })
            .catch(() => { });
        return this.attachPromise;
    }
    /**
     * Feed one inbound frame from the extension `/acp` socket. Returns true if
     * the frame was consumed by this link (so the WS layer can skip it).
     */
    handleInbound(frame) {
        if (!isCdpInboundFrame(frame))
            return false;
        switch (frame.type) {
            case CDP_FRAME_TYPES.result:
                this.handleResult(frame);
                return true;
            case CDP_FRAME_TYPES.event:
                this.handleEvent(frame);
                return true;
            case CDP_FRAME_TYPES.attached:
                this.handleAttached(frame);
                return true;
            case CDP_FRAME_TYPES.detach:
                this.handleDetach(frame);
                return true;
            default:
                return false;
        }
    }
    handleResult(frame) {
        const id = typeof frame.id === 'number' ? frame.id : undefined;
        if (id === undefined) {
            this.log?.('qwen serve: /cdp dropped cdp_result with non-numeric id');
            return;
        }
        if (frame.error) {
            this.settleReject(id, frame.error);
        }
        else {
            this.settleResolve(id, frame.result);
        }
    }
    handleEvent(frame) {
        // No emulator = the link is being torn down; that's a benign race, not a
        // malformed frame, so don't log it.
        if (!this.emulator)
            return;
        if (typeof frame.method !== 'string') {
            this.log?.('qwen serve: /cdp dropped cdp_event with non-string method');
            return;
        }
        this.emulator.emitTabEvent(frame.method, frame.params);
    }
    handleAttached(frame) {
        const attach = this.pendingAttach;
        if (!attach || attach.id !== frame.id) {
            this.log?.(`qwen serve: /cdp dropped unexpected cdp_attached (id=${String(frame.id)})`);
            return;
        }
        this.pendingAttach = undefined;
        clearTimeout(attach.pending.timer);
        if (frame.error) {
            this.attached = false;
            attach.pending.reject({
                code: -32000,
                message: frame.error.message ?? 'cdp_attach failed',
            });
            return;
        }
        this.attached = true;
        attach.pending.resolve({ url: frame.url, title: frame.title });
    }
    handleDetach(frame) {
        const reason = typeof frame.reason === 'string' ? frame.reason : 'tab detached';
        this.attached = false;
        if (this.pendingAttach) {
            clearTimeout(this.pendingAttach.pending.timer);
            this.pendingAttach.pending.reject({ code: -32000, message: reason });
            this.pendingAttach = undefined;
        }
        this.onDetach?.(reason);
    }
    armTimeout(id, message) {
        const timer = setTimeout(() => {
            this.settleReject(id, { code: -32000, message });
            if (this.pendingAttach?.id === id) {
                this.pendingAttach.pending.reject({ code: -32000, message });
                this.pendingAttach = undefined;
            }
        }, this.commandTimeoutMs);
        timer.unref?.();
        return timer;
    }
    armProgressLog(id, method) {
        if (!this.log)
            return undefined;
        const delay = Math.min(COMMAND_PROGRESS_LOG_MS, this.commandTimeoutMs);
        if (delay >= this.commandTimeoutMs)
            return undefined;
        const timer = setTimeout(() => {
            this.log?.(`qwen serve: /cdp still waiting for command id=${id} method=${method} after ${delay}ms`);
        }, delay);
        timer.unref?.();
        return timer;
    }
    settleResolve(id, result) {
        const p = this.pending.get(id);
        if (!p)
            return;
        clearTimeout(p.timer);
        if (p.progressTimer)
            clearTimeout(p.progressTimer);
        this.pending.delete(id);
        p.resolve(result);
    }
    settleReject(id, err) {
        const p = this.pending.get(id);
        if (!p)
            return;
        clearTimeout(p.timer);
        if (p.progressTimer)
            clearTimeout(p.progressTimer);
        this.pending.delete(id);
        p.reject(err);
    }
    /** In-flight forwarded-command count (for tests / accounting). */
    pendingCount() {
        return this.pending.size;
    }
    /** Reject all pending commands and stop accepting new ones. Idempotent. */
    dispose(reason = 'CDP reverse link closed') {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const [, p] of this.pending) {
            clearTimeout(p.timer);
            if (p.progressTimer)
                clearTimeout(p.progressTimer);
            p.reject({ code: -32000, message: reason });
        }
        this.pending.clear();
        if (this.pendingAttach) {
            clearTimeout(this.pendingAttach.pending.timer);
            this.pendingAttach.pending.reject({ code: -32000, message: reason });
            this.pendingAttach = undefined;
        }
        this.attached = false;
        this.attachPromise = undefined;
        this.emulator = undefined;
    }
}
//# sourceMappingURL=cdp-reverse-link.js.map