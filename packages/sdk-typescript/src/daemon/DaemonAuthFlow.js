/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { DaemonHttpError } from './DaemonClient.js';
/**
 * Grace period added past the daemon-stated `expiresAt` before
 * `awaitCompletion` gives up. Covers (a) clock skew between SDK and
 * daemon, (b) the daemon's own sweep interval (so we don't bail one
 * tick before the daemon would surface a synthetic `expired`
 * terminal), and (c) per-poll network latency.
 *
 * **Why 30 s, and which daemon constant it relates to.** The relevant
 * daemon-side constant is `DEVICE_FLOW_SWEEP_INTERVAL_MS` (the
 * interval at which the registry's sweeper RUNS — currently 30 s),
 * NOT `DEVICE_FLOW_TERMINAL_GRACE_MS` (the 5-minute window during
 * which terminal entries remain GET-able before eviction). One sweep
 * cycle past `expiresAt` is enough to flip the entry to a synthetic
 * `expired`/`expired_token` terminal state; once that happens the
 * SDK's GET poll will return it immediately. Waiting any longer
 * client-side just delays the inevitable. PR #4255 fold-in 6 review
 * thread #3.
 *
 * **Not** to be confused with `TERMINAL_GRACE_MS` — terminal entries
 * remain queryable for 5 minutes after they go terminal, but that's
 * a reconnect-affordance for SDK clients that want to *re-read* a
 * settled state, not a window `awaitCompletion` needs to wait
 * through. Keep this aligned with `SWEEP_INTERVAL_MS`; if the daemon
 * ever raises its sweep cadence, raise this in lockstep.
 */
export const DEVICE_FLOW_EXPIRY_GRACE_MS = 30_000;
const TERMINAL_STATUSES = new Set(['authorized', 'expired', 'error', 'cancelled']);
export class DaemonAuthFlow {
    client;
    constructor(client) {
        this.client = client;
    }
    async start(opts) {
        const initial = await this.client.startDeviceFlow(opts);
        const handleClient = this.client;
        const handle = {
            deviceFlowId: initial.deviceFlowId,
            providerId: initial.providerId,
            userCode: initial.userCode,
            verificationUri: initial.verificationUri,
            verificationUriComplete: initial.verificationUriComplete,
            expiresAt: initial.expiresAt,
            intervalMs: initial.intervalMs,
            attached: initial.attached,
            cancel: () => handleClient.cancelDeviceFlow(initial.deviceFlowId, {
                clientId: opts.clientId,
            }),
            awaitCompletion: async (waitOpts = {}) => {
                const finalState = await awaitCompletion(handleClient, initial, opts.clientId, waitOpts);
                return finalState;
            },
        };
        return handle;
    }
    status(deviceFlowId, opts) {
        return this.client.getDeviceFlow(deviceFlowId, opts);
    }
    cancel(deviceFlowId, opts) {
        return this.client.cancelDeviceFlow(deviceFlowId, opts);
    }
}
async function awaitCompletion(client, start, clientId, opts) {
    // Workspace-scoped events fan out through whatever session buses
    // happen to be live, but `awaitCompletion` is workspace-level (no
    // session id) — so attaching to a single SSE stream isn't a stable
    // contract here. GET polling against the daemon's authoritative
    // device-flow state is the universal path; `auth_device_flow_*`
    // events remain a real-time hint for clients that ARE already
    // subscribed to a session stream.
    return await pollUntilTerminal(client, start, clientId, opts);
}
/**
 * Read the daemon's view of a device flow, mapping a 404 from the
 * GET endpoint to a synthetic terminal `error`/`not_found_or_evicted`
 * state instead of letting `DaemonHttpError(404)` escape. PR #4255
 * fold-in 7 review thread #4: extracted from the inline catch in
 * `pollUntilTerminal` so the timeout-ceiling final read uses the same
 * logic — without this, the ceiling read would reject with a raw
 * `DaemonHttpError` if the daemon evicted the entry exactly at the
 * boundary, breaking `awaitCompletion`'s "always returns a settled
 * `DaemonDeviceFlowState`" contract.
 */
async function getDeviceFlowOrSynthetic404(client, start, clientId, signal) {
    try {
        return await client.getDeviceFlow(start.deviceFlowId, {
            clientId,
            signal,
        });
    }
    catch (err) {
        if (err instanceof DaemonHttpError && err.status === 404) {
            // PR #4255 fold-in 3 (#4): a 404 here can mean (a) the entry
            // expired and the sweeper reaped it past the terminal grace
            // window, (b) the daemon was restarted and lost the registry,
            // (c) the deviceFlowId was wrong / spoofed. The earlier
            // synthetic `'expired'` status conflated all three. Surface
            // `status: 'error'` + `errorKind: 'not_found_or_evicted'` so
            // SDK consumers can distinguish "your flow expired during your
            // disconnect" from "this id was never valid on this daemon."
            return {
                deviceFlowId: start.deviceFlowId,
                providerId: start.providerId,
                status: 'error',
                errorKind: 'not_found_or_evicted',
                hint: 'device-flow not found on daemon (evicted past terminal grace, daemon restart, or unknown deviceFlowId)',
                createdAt: Date.now(),
            };
        }
        throw err;
    }
}
/**
 * Validate an `AwaitCompletionOptions` numeric field. PR #4255
 * fold-in 7 review thread #5: `NaN` / `Infinity` from a misbehaving
 * caller would otherwise produce a `ceiling` of `NaN` (so `now >=
 * ceiling` is always `false` — the loop runs forever) or a
 * `setTimeout(NaN)` (Node clamps to a 1 ms delay — tight polling
 * loop). Reject non-finite-positive values; when the caller's intent
 * was sloppy ("a long timeout") they fall back to the documented
 * default rather than getting a pathological loop.
 */
function sanitizePositiveMs(raw, opts = {}) {
    if (raw === undefined)
        return undefined;
    if (!Number.isFinite(raw))
        return undefined;
    // PR #4255 fold-in 9 review thread #6: `timeoutMs: 0` is the
    // documented "settle immediately, return current daemon view"
    // contract — must be honored, not collapsed to falsy. Opt-in via
    // `allowZero` so `pollOverrideMs: 0` still falls back to the
    // default (a 0 ms poll interval is a tight loop, not a useful
    // contract).
    if (opts.allowZero ? raw < 0 : raw <= 0)
        return undefined;
    return raw;
}
async function pollUntilTerminal(client, start, clientId, opts) {
    const signal = opts.signal;
    // PR #4255 fold-in 7 review thread #5: validate caller-supplied
    // numeric inputs BEFORE composing the ceiling / interval. NaN /
    // Infinity slip past the original `?? default` form (they're
    // truthy-ish) and break the loop's wall-clock guard.
    const sanitizedTimeoutMs = sanitizePositiveMs(opts.timeoutMs, {
        allowZero: true,
    });
    const sanitizedPollOverrideMs = sanitizePositiveMs(opts.pollOverrideMs);
    // PR #4255 fold-in 9 review thread #6: use `!== undefined` (not
    // truthy check) so `timeoutMs: 0` produces a `ceiling = Date.now()`
    // — which the loop's `now >= ceiling` guard will satisfy on the
    // very first iteration, returning the daemon's current snapshot
    // immediately. The earlier `?` form treated 0 as falsy and
    // silently fell back to the default.
    const ceiling = sanitizedTimeoutMs !== undefined
        ? Date.now() + sanitizedTimeoutMs
        : start.expiresAt + DEVICE_FLOW_EXPIRY_GRACE_MS;
    let interval = Math.max(1_000, sanitizedPollOverrideMs ?? start.intervalMs ?? 5_000);
    let lastIntervalMs = interval;
    while (true) {
        if (signal?.aborted) {
            throw signalAbortError(signal);
        }
        const now = Date.now();
        if (now >= ceiling) {
            // PR #4255 fold-in 7 #4: route the ceiling read through the
            // same 404-aware helper as the loop body. A 404 at the
            // boundary is a settled state, not a throw.
            return await getDeviceFlowOrSynthetic404(client, start, clientId, signal);
        }
        const snapshot = await getDeviceFlowOrSynthetic404(client, start, clientId, signal);
        if (snapshot.intervalMs && snapshot.intervalMs !== lastIntervalMs) {
            lastIntervalMs = snapshot.intervalMs;
            interval = snapshot.intervalMs;
            opts.onThrottled?.(snapshot.intervalMs);
        }
        if (TERMINAL_STATUSES.has(snapshot.status))
            return snapshot;
        await waitFor(interval, signal);
    }
}
async function waitFor(ms, signal) {
    if (signal?.aborted)
        throw signalAbortError(signal);
    await new Promise((resolve, reject) => {
        // PR #4255 review C5: do NOT `unref()` this timer. The earlier
        // version did, which on a standalone Node CLI/script that does
        // `await client.auth.start().awaitCompletion()` and nothing else
        // could leave Node with no remaining ref'd handles between polls
        // and exit the process before the user finishes authorization.
        // This sleep is foreground work the caller explicitly awaits;
        // unref'ing it broke the contract.
        const handle = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);
        const onAbort = () => {
            cleanup();
            reject(signalAbortError(signal));
        };
        function cleanup() {
            clearTimeout(handle);
            signal?.removeEventListener('abort', onAbort);
        }
        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
}
function signalAbortError(signal) {
    const reason = signal?.reason;
    if (reason instanceof Error)
        return reason;
    if (typeof reason === 'string')
        return new Error(reason);
    return new Error('aborted');
}
//# sourceMappingURL=DaemonAuthFlow.js.map