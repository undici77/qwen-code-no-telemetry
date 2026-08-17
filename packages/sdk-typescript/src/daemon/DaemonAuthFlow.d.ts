/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type DaemonClient } from './DaemonClient.js';
import type { DaemonAuthProviderId, DaemonDeviceFlowState } from './types.js';
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
export declare const DEVICE_FLOW_EXPIRY_GRACE_MS = 30000;
/**
 * High-level convenience wrapper around the four `client.*DeviceFlow*` HTTP
 * helpers. SDK users should normally write:
 *
 *   const flow = await client.auth.start({ providerId: 'qwen-oauth' });
 *   console.log(`Open ${flow.verificationUri}\nCode: ${flow.userCode}`);
 *   const result = await flow.awaitCompletion({ signal });
 *
 * `awaitCompletion` polls `client.getDeviceFlow(...)` at the daemon-
 * supplied `intervalMs`, honors `slow_down`-driven interval bumps via
 * `getDeviceFlow`'s response, and terminates when the daemon's view
 * reaches a terminal status (`authorized`, `expired`, `error`,
 * `cancelled`). The same `auth_device_flow_*` SSE events are emitted
 * by the daemon for clients that ARE already subscribed to a session
 * stream — those provide a real-time hint, but `awaitCompletion`
 * itself does not require an SSE subscription and works against any
 * client that can hit the GET endpoint.
 *
 * Issue #4175 PR 21.
 */
export interface DaemonAuthFlowHandle {
  deviceFlowId: string;
  providerId: DaemonAuthProviderId;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  expiresAt: number;
  intervalMs: number;
  /** True iff the daemon returned an existing pending entry rather than
   *  starting a fresh IdP request. */
  attached: boolean;
  /** Block until the daemon settles the flow into a terminal state, then
   *  return the final state. The promise rejects on `signal.abort()`. */
  awaitCompletion(
    opts?: AwaitCompletionOptions,
  ): Promise<DaemonDeviceFlowState>;
  /** Cancel the in-flight device flow on the daemon. Idempotent. */
  cancel(): Promise<void>;
}
export interface AwaitCompletionOptions {
  /** Aborts both SSE consumption and GET-fallback polling. */
  signal?: AbortSignal;
  /** Called whenever the daemon reports an upstream `slow_down` (mirroring
   *  the `auth_device_flow_throttled` event). The new effective interval
   *  is the value the SDK will use for the next GET poll. */
  onThrottled?: (intervalMs: number) => void;
  /** Optional override of the GET-fallback interval. Defaults to the
   *  daemon-supplied `intervalMs` from `start(...)` and respects bumps
   *  from `slow_down`. */
  pollOverrideMs?: number;
  /** Hard ceiling on `awaitCompletion`'s wall-clock duration, in ms.
   *  When omitted, `awaitCompletion` runs until the daemon-stated
   *  `expiresAt` plus `DEVICE_FLOW_EXPIRY_GRACE_MS` (default 30s),
   *  which lets the daemon's own sweeper surface the authoritative
   *  terminal state instead of timing out client-side. Set explicitly
   *  to clamp the wait shorter; values past `expiresAt` will still see
   *  the daemon return `expired` once its sweeper fires. */
  timeoutMs?: number;
}
export declare class DaemonAuthFlow {
  private readonly client;
  constructor(client: DaemonClient);
  start(opts: {
    providerId: DaemonAuthProviderId;
    clientId?: string;
  }): Promise<DaemonAuthFlowHandle>;
  status(
    deviceFlowId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<DaemonDeviceFlowState>;
  cancel(
    deviceFlowId: string,
    opts?: {
      clientId?: string;
    },
  ): Promise<void>;
}
